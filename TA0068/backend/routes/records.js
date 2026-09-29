const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const MedicalRecord = require('../models/MedicalRecord');
const Consent = require('../models/Consent');
const Case = require('../models/Case');

// @desc    Get all records for logged-in patient
// @route   GET /api/records
router.get('/', protect, authorize('Patient'), async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patientId: req.user._id })
            .sort({ recordDate: -1 })
            .select('-fileData'); // Don't send file data in list (too heavy)
        res.json(records);
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all records for a specific patient (doctor with approved consent OR the patient themselves)
// @route   GET /api/records/patient/:patientId
router.get('/patient/:patientId', protect, async (req, res) => {
    try {
        const { patientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid patient ID.' });
        }

        if (req.user.role === 'Patient') {
            if (req.user._id.toString() !== patientId) {
                return res.status(403).json({ message: 'Not authorized to view records of other patients.' });
            }
        } else if (req.user.role === 'Doctor') {
            const consent = await Consent.findOne({
                doctorId: req.user._id,
                patientId: patientId,
                status: 'Approved'
            });
            const hasCase = await Case.findOne({
                doctorId: req.user._id,
                patientId: patientId
            });
            if (!consent && !hasCase) {
                return res.status(403).json({ message: 'Active consent or prior consultation required to access patient past records.' });
            }
            if (consent && consent.allowedFields && consent.allowedFields.length > 0 && !consent.allowedFields.includes('pastRecords')) {
                return res.status(403).json({ message: 'Patient has not granted permission to view past medical records.' });
            }
        }

        const records = await MedicalRecord.find({ patientId })
            .sort({ recordDate: -1 })
            .select('-fileData');

        res.json(records);
    } catch (error) {
        console.error('Get patient records error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single record WITH file data (for viewing/download)
// @route   GET /api/records/:id
router.get('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid record ID.' });
        }
        const record = await MedicalRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found.' });
        }

        // Authorization check
        if (req.user.role === 'Patient' && record.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this record.' });
        }
        if (req.user.role === 'Doctor') {
            const consent = await Consent.findOne({
                doctorId: req.user._id,
                patientId: record.patientId,
                status: 'Approved'
            });
            const hasCase = await Case.findOne({
                doctorId: req.user._id,
                patientId: record.patientId
            });
            if (!consent && !hasCase) {
                return res.status(403).json({ message: 'Active consent required to access this record.' });
            }
            if (consent && consent.allowedFields && consent.allowedFields.length > 0 && !consent.allowedFields.includes('pastRecords')) {
                return res.status(403).json({ message: 'Patient has not granted permission to view past medical records.' });
            }
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload a new medical record
// @route   POST /api/records
router.post('/', protect, authorize('Patient'), async (req, res) => {
    try {
        const { title, category, fileData, fileType, fileName, notes, recordDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Record title is required.' });
        }

        // Rough size guard: base64 of 5MB ≈ 6.8MB string
        if (fileData && fileData.length > 7 * 1024 * 1024) {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }

        const record = await MedicalRecord.create({
            patientId: req.user._id,
            title,
            category: category || 'Other',
            fileData,
            fileType,
            fileName,
            notes: notes || '',
            recordDate: recordDate ? new Date(recordDate) : new Date(),
        });

        // Return without fileData to keep response light
        const { fileData: _fd, ...recordObj } = record.toObject();
        res.status(201).json(recordObj);
    } catch (error) {
        console.error('Upload record error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a record
// @route   DELETE /api/records/:id
router.delete('/:id', protect, authorize('Patient'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid record ID.' });
        }
        const record = await MedicalRecord.findOneAndDelete({
            _id: req.params.id,
            patientId: req.user._id,
        });
        if (!record) {
            return res.status(404).json({ message: 'Record not found or not authorized.' });
        }
        res.json({ success: true, message: 'Record deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
