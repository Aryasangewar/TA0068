const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // ─── Core (all users) ────────────────────────────────────────────────────
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['Doctor', 'Patient'], required: true },
    city:     { type: String, default: '' },

    // ─── Doctor Fields ───────────────────────────────────────────────────────
    specialization: { type: String, default: '' },
    bio:            { type: String, default: '' },
    qualifications: { type: String, default: '' },  // e.g. MBBS, MD, FCPS, FRCS
    experience:     { type: String, default: '' },  // e.g. 12+ Years Clinical Practice
    hospital:       { type: String, default: '' },  // e.g. St. Jude Memorial Hospital
    license:        { type: String, default: '' },  // e.g. MD-2026-X99
    isAvailable:    { type: Boolean, default: true },

    // ─── Patient Fields ──────────────────────────────────────────────────────
    gender:               { type: String, default: '' },
    dateOfBirth:          { type: Date },
    bloodGroup:           { type: String, default: '' },
    phoneNumber:          { type: String, default: '' },
    allergies:            { type: String, default: '' },   // comma-separated
    chronicConditions:    { type: String, default: '' },   // comma-separated
    emergencyContactName: { type: String, default: '' },
    emergencyContactPhone:{ type: String, default: '' },

}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
