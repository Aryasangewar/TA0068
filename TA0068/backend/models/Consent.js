const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Expired'], default: 'Pending' },
    expiresAt: { type: Date },
}, { timestamps: true });

consentSchema.index({ patientId: 1 });
consentSchema.index({ doctorId: 1 });
consentSchema.index({ status: 1 });
consentSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Consent', consentSchema);
