const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Consent = require('../models/Consent');
const User = require('../models/User');

// @desc    Doctor requests consent from patient
// @route   POST /api/consent/request
router.post('/request', protect, authorize('Doctor'), async (req, res) => {
    try {
        let { patientId } = req.body;
        let actualPatientId = patientId;

        // Clean patientId if it starts with #
        if (typeof patientId === 'string') {
            patientId = patientId.trim().replace(/^#/, '');
        }

        // Support short ID (last 6 chars)
        if (patientId.length === 6) {
            console.log(`Searching for patient with short ID suffix: ${patientId}`);
            const user = await User.findOne({ 
                $expr: {
                    $and: [
                        { $eq: ["$role", "Patient"] },
                        { $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: patientId + "$",
                            options: "i"
                        }}
                    ]
                }
            });
            
            if (!user) {
                return res.status(404).json({ message: "Patient not found with this short ID" });
            }
            actualPatientId = user._id;
        } else {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ message: "Invalid patient ID format" });
            }
        }

        const consent = await Consent.create({
            patientId: actualPatientId,
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
