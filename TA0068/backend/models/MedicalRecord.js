const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['Lab Report', 'Prescription', 'X-Ray', 'MRI', 'Vaccination', 'Doctor Note', 'Insurance', 'Other'],
        default: 'Other',
    },
    // File stored as base64 (max 5MB enforced on frontend)
    fileData: { type: String },
    fileType: { type: String },   // MIME type e.g. "image/jpeg", "application/pdf"
    fileName: { type: String },   // Original filename

    notes:      { type: String, default: '' },
    recordDate: { type: Date, default: Date.now },  // Date of the medical event

}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
