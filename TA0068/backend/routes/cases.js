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
    const { transcript } = req.body;
    try {
        const structuredData = await formatMedicalData(transcript);
        res.json(structuredData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new medical case (Confirm & E-Sign)
// @route   POST /api/cases
router.post('/', protect, authorize('Doctor'), async (req, res) => {
    const { patientId, transcript, structuredData } = req.body;

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
        status: 'Completed'
    });

    res.status(201).json(newCase);
});

// @desc    Get cases for doctor or patient
// @route   GET /api/cases
router.get('/', protect, async (req, res) => {
    let cases;
    if (req.user.role === 'Doctor') {
        cases = await Case.find({ doctorId: req.user._id }).populate('patientId', 'name email');
    } else {
        cases = await Case.find({ patientId: req.user._id }).populate('doctorId', 'name email');
    }
    res.json(cases);
});

module.exports = router;
