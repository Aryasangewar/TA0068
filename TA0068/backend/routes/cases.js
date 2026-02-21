const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Case = require('../models/Case');
const Consent = require('../models/Consent');
const { formatMedicalData } = require('../services/gemini');

// @desc    Process transcript with Gemini & return structured data
// @route   POST /api/cases/process
router.post('/process', protect, authorize('Doctor'), async (req, res) => {
    console.log('>>> 🏥 CASES ROUTE V2.7 ACCESSED <<<');
    const { transcript } = req.body;

    if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
    }

    try {
        const structuredData = await formatMedicalData(transcript);
        res.json(structuredData);
    } catch (error) {
        console.error("Processing Route Error:", error);
        res.status(500).json({ 
            message: "AI processing failed", 
            error: error.message
        });
    }
});

// @desc    Create new medical case
// @route   POST /api/cases
router.post('/', protect, authorize('Doctor'), async (req, res) => {
    const { patientId, transcript, structuredData, resolutionNotes, prescriptionImage } = req.body;

    try {
        // Validate Consent
        const consent = await Consent.findOne({
            patientId,
            doctorId: req.user._id,
            status: 'Approved',
            expiresAt: { $gt: new Date() }
        });

        if (!consent) {
            return res.status(403).json({ message: 'No valid patient consent found or consent has expired' });
        }

        const newCase = await Case.create({
            patientId,
            doctorId: req.user._id,
            transcript,
            structuredData,
            resolutionNotes,
            prescriptionImage,
            status: 'Completed'
        });

        res.status(201).json(newCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get cases for doctor or patient
// @route   GET /api/cases
router.get('/', protect, async (req, res) => {
    try {
        let cases;
        if (req.user.role === 'Doctor') {
            const rawCases = await Case.find({ doctorId: req.user._id }).populate('patientId', 'name email').sort({ createdAt: -1 });
            
            // Filter fields based on consent for Doctor visibility
            const filteredCases = await Promise.all(rawCases.map(async (c) => {
                const consent = await Consent.findOne({
                    patientId: c.patientId._id,
                    doctorId: req.user._id,
                    status: 'Approved'
                });

                if (!consent) return c; // Fallback if no specific consent found (legacy)

                const caseObj = c.toObject();
                const allowed = consent.allowedFields || [];

                // Always exclude transcript from doctor history view for privacy if requested, 
                // but here we follow the allowedFields logic
                if (!allowed.includes('diagnosis')) delete caseObj.structuredData.diagnosis;
                if (!allowed.includes('medicines')) delete caseObj.structuredData.medicines;
                if (!allowed.includes('advice')) delete caseObj.structuredData.advice;
                if (!allowed.includes('prescriptionImage')) delete caseObj.prescriptionImage;
                if (!allowed.includes('resolutionNotes')) delete caseObj.resolutionNotes;

                return caseObj;
            }));
            
            cases = filteredCases;
        } else {
            // Patients see everything for their own cases
            cases = await Case.find({ patientId: req.user._id }).populate('doctorId', 'name email').sort({ createdAt: -1 });
        }
        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
