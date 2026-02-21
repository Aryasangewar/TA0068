const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Consent = require('../models/Consent');

// @desc    Doctor requests consent from patient
// @route   POST /api/consent/request
router.post('/request', protect, authorize('Doctor'), async (req, res) => {
    const { patientId } = req.body;

    const consent = await Consent.create({
        patientId,
        doctorId: req.user._id,
        status: 'Pending'
    });

    res.status(201).json(consent);
});

// @desc    Patient approves consent
// @route   PUT /api/consent/:id/approve
router.put('/:id/approve', protect, authorize('Patient'), async (req, res) => {
    const consent = await Consent.findById(req.params.id);

    if (!consent) {
        return res.status(404).json({ message: 'Consent request not found' });
    }

    if (consent.patientId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    consent.status = 'Approved';
    // Set expiration to 1 hour from now for simulation
    consent.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await consent.save();

    res.json(consent);
});

// @desc    Get all consent requests for a patient
// @route   GET /api/consent/patient
router.get('/patient', protect, authorize('Patient'), async (req, res) => {
    const consents = await Consent.find({ patientId: req.user._id }).populate('doctorId', 'name email');
    res.json(consents);
});

module.exports = router;
