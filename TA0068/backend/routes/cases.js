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
            return res.status(403).json({ message: 'No valid patient consent found or consent has expired. Please request a new clinical handshake.' });
        }

        const newCase = await Case.create({
            patientId,
            doctorId: req.user._id,
            transcript,
            structuredData,
            resolutionNotes: resolutionNotes || '',
            prescriptionImage: prescriptionImage || '',
            status: 'Active' // Start as Active so doctor can finalize
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
            const rawCases = await Case.find({ doctorId: req.user._id })
                .populate('patientId', 'name email gender dateOfBirth bloodGroup phoneNumber allergies chronicConditions emergencyContactName emergencyContactPhone city')
                .sort({ createdAt: -1 });
            
            // Format cases for Doctor visibility
            const filteredCases = await Promise.all(rawCases.map(async (c) => {
                if (!c.patientId) return null;
                const caseObj = c.toObject();

                const consent = await Consent.findOne({
                    patientId: c.patientId._id,
                    doctorId: req.user._id,
                });

                // Apply patient data node settings if consent restricts specific fields
                if (consent && consent.allowedFields && consent.allowedFields.length > 0) {
                    const allowed = consent.allowedFields;
                    if (!allowed.includes('diagnosis') && caseObj.structuredData) caseObj.structuredData.diagnosis = 'RESTRICTED';
                    if (!allowed.includes('medicines') && caseObj.structuredData) caseObj.structuredData.medicines = [];
                    if (!allowed.includes('advice') && caseObj.structuredData) caseObj.structuredData.advice = 'RESTRICTED';
                    if (!allowed.includes('prescriptionImage')) delete caseObj.prescriptionImage;
                    if (!allowed.includes('resolutionNotes')) caseObj.resolutionNotes = 'RESTRICTED';
                    if (!allowed.includes('patientProfile') && caseObj.patientId) {
                        caseObj.patientId.allergies = 'RESTRICTED';
                        caseObj.patientId.chronicConditions = 'RESTRICTED';
                        caseObj.patientId.bloodGroup = 'RESTRICTED';
                        caseObj.patientId.isProfileRestricted = true;
                    }
                }

                return caseObj;
            }));
            
            cases = filteredCases.filter(Boolean);
        } else {
            // Patients see everything for their own cases
            cases = await Case.find({ patientId: req.user._id })
                .populate('doctorId', 'name email specialization city')
                .sort({ createdAt: -1 });
        }
        res.json(cases);
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update case status (Mark as Completed)
// @route   PUT /api/cases/:id/status
router.put('/:id/status', protect, authorize('Doctor'), async (req, res) => {
    try {
        const { status } = req.body;
        const medicalCase = await Case.findById(req.params.id);

        if (!medicalCase) {
            return res.status(404).json({ message: 'Case not found' });
        }

        if (medicalCase.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        medicalCase.status = status || 'Completed';
        await medicalCase.save();

        res.json(medicalCase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
