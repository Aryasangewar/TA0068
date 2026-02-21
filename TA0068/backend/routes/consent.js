const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Consent = require('../models/Consent');

// @desc    Doctor requests consent from patient
// @route   POST /api/consent/request
router.post('/request', protect, authorize('Doctor'), async (req, res) => {
    try {
        const { patientId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        const consent = await Consent.create({
            patientId,
            doctorId: req.user._id,
            status: 'Pending'
        });

        res.status(201).json(consent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Patient approves consent with selected fields
// @route   PUT /api/consent/:id/approve
router.put('/:id/approve', protect, authorize('Patient'), async (req, res) => {
    try {
        const { allowedFields } = req.body;
        const consent = await Consent.findById(req.params.id);

        if (!consent) {
            return res.status(404).json({ message: 'Consent request not found' });
        }

        if (consent.patientId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        consent.status = 'Approved';
        if (allowedFields) {
            consent.allowedFields = allowedFields;
        }
        
        // Set expiration to 1 hour from now
        consent.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await consent.save();

        res.json(consent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all consent requests for a patient
// @route   GET /api/consent/patient
router.get('/patient', protect, authorize('Patient'), async (req, res) => {
    try {
        const consents = await Consent.find({ patientId: req.user._id }).populate('doctorId', 'name email').sort({ createdAt: -1 });
        res.json(consents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
