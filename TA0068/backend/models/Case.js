const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transcript: { type: String, required: true },
    structuredData: {
        symptoms: [String],
        diagnosis: String,
        medicines: [{
            name: String,
            dosage: String,
            frequency: String,
            duration: String
        }],
        advice: String
    },
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
}, { timestamps: true });

caseSchema.index({ patientId: 1 });
caseSchema.index({ doctorId: 1 });

module.exports = mongoose.model('Case', caseSchema);
