const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Consent = require('../models/Consent');
const User = require('../models/User');

// ⚠️ IMPORTANT: Specific string routes MUST be declared BEFORE /:id routes
// otherwise Express matches "/patient" as an ID param.

// @desc    Get all consent requests for logged-in patient
// @route   GET /api/consent/patient
router.get('/patient', protect, authorize('Patient'), async (req, res) => {
    try {
        const consents = await Consent.find({ patientId: req.user._id })
            .populate('doctorId', 'name email specialization city')
            .populate('patientId', 'name email')
            .sort({ createdAt: -1 });
        res.json(consents);
    } catch (error) {
        console.error('Patient consent list error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all consent connections for logged-in doctor
// @route   GET /api/consent/doctor
router.get('/doctor', protect, authorize('Doctor'), async (req, res) => {
    try {
        const consents = await Consent.find({ doctorId: req.user._id })
            .populate('patientId', 'name email gender dateOfBirth bloodGroup phoneNumber allergies chronicConditions emergencyContactName emergencyContactPhone city')
            .sort({ updatedAt: -1 });
        res.json(consents);
    } catch (error) {
        console.error('Doctor consent list error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Patient initiates consultation / consent connection to doctor
// @route   POST /api/consent/patient-request
router.post('/patient-request', protect, authorize('Patient'), async (req, res) => {
    try {
        const { doctorId } = req.body;
        if (!doctorId) {
            return res.status(400).json({ message: 'Doctor ID is required.' });
        }

        const doctor = await User.findOne({ _id: doctorId, role: 'Doctor' });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        let consent = await Consent.findOne({
            patientId: req.user._id,
            doctorId: doctor._id,
        });

        if (consent) {
            consent.status = 'Approved';
            consent.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 1000 * 60);
            consent.allowedFields = ['diagnosis', 'medicines', 'advice', 'prescriptionImage', 'resolutionNotes', 'pastRecords', 'patientProfile'];
            await consent.save();
        } else {
            consent = await Consent.create({
                patientId: req.user._id,
                doctorId: doctor._id,
                status: 'Approved',
                allowedFields: ['diagnosis', 'medicines', 'advice', 'prescriptionImage', 'resolutionNotes', 'pastRecords', 'patientProfile'],
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 1000 * 60),
            });
        }

        const populated = await Consent.findById(consent._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email specialization city');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Patient consent request error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Doctor requests consent from patient
// @route   POST /api/consent/request
router.post('/request', protect, authorize('Doctor'), async (req, res) => {
    try {
        let { patientId } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: 'Patient ID is required.' });
        }

        // Clean patientId if it starts with #
        let cleanId = String(patientId).trim().replace(/^#/, '');

        let actualPatientId;

        // Support short ID (last N chars of ObjectId)
        if (!mongoose.Types.ObjectId.isValid(cleanId)) {
            console.log(`Searching for patient with short ID suffix: "${cleanId}"`);
            const allPatients = await User.find({ role: 'Patient' }).select('_id name email').lean();
            const match = allPatients.find(u =>
                u._id.toString().toLowerCase().endsWith(cleanId.toLowerCase())
            );

            if (!match) {
                return res.status(404).json({
                    message: `No patient found with ID ending in "${cleanId}". Ask the patient to share their #ID from their Clinical Vault.`
                });
            }
            actualPatientId = match._id;
        } else {
            // Verify the patient exists and is a Patient role
            const patient = await User.findOne({ _id: cleanId, role: 'Patient' });
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found with this ID.' });
            }
            actualPatientId = patient._id;
        }

        // Check if there's already an active pending/approved consent
        const existing = await Consent.findOne({
            patientId: actualPatientId,
            doctorId: req.user._id,
            status: { $in: ['Pending', 'Approved'] }
        });

        let consent;
        if (existing) {
            // Reuse existing consent (re-request if denied)
            consent = existing;
            console.log(`Reusing existing consent ${existing._id} with status: ${existing.status}`);
        } else {
            consent = await Consent.create({
                patientId: actualPatientId,
                doctorId: req.user._id,
                status: 'Pending'
            });
            console.log(`Created new consent ${consent._id}`);
        }

        // Return with populated patient + doctor info
        const populated = await Consent.findById(consent._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Consent request error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get a single consent by ID (for status polling by doctor)
// @route   GET /api/consent/:id
// NOTE: This MUST come after /patient to avoid route collision
router.get('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid consent ID format.' });
        }

        const consent = await Consent.findById(req.params.id)
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        if (!consent) {
            return res.status(404).json({ message: 'Consent request not found.' });
        }

        // Only allow the doctor or patient involved
        const userId = req.user._id.toString();
        const patientId = (consent.patientId?._id || consent.patientId)?.toString();
        const doctorId = (consent.doctorId?._id || consent.doctorId)?.toString();

        if (userId !== patientId && userId !== doctorId) {
            return res.status(401).json({ message: 'Not authorized to view this consent.' });
        }

        res.json(consent);
    } catch (error) {
        console.error('Consent get error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Patient approves consent with selected fields
// @route   PUT /api/consent/:id/approve
router.put('/:id/approve', protect, authorize('Patient'), async (req, res) => {
    try {
        const { allowedFields } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid consent ID.' });
        }

        const consent = await Consent.findById(req.params.id);
        if (!consent) {
            return res.status(404).json({ message: 'Consent request not found.' });
        }

        if (consent.patientId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        consent.status = 'Approved';
        if (allowedFields && allowedFields.length > 0) {
            consent.allowedFields = allowedFields;
        }
        // Set expiration to 24 hours from approval
        consent.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await consent.save();

        const populated = await Consent.findById(consent._id)
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        res.json(populated);
    } catch (error) {
        console.error('Consent approve error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Patient denies consent
// @route   PUT /api/consent/:id/deny
router.put('/:id/deny', protect, authorize('Patient'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid consent ID.' });
        }

        const consent = await Consent.findById(req.params.id);
        if (!consent) {
            return res.status(404).json({ message: 'Consent request not found.' });
        }

        if (consent.patientId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        consent.status = 'Expired';
        await consent.save();

        res.json({ success: true, message: 'Access denied.' });
    } catch (error) {
        console.error('Consent deny error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
