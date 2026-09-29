const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const User = require('../models/User');

// ─── Symptom → Specialty Mapping ─────────────────────────────────────────────
const SYMPTOM_SPECIALTY_MAP = [
    { keywords: ['heart', 'chest', 'palpitation', 'cardiac', 'blood pressure', 'hypertension', 'pulse', 'angina'], specialty: 'Cardiologist' },
    { keywords: ['skin', 'rash', 'acne', 'eczema', 'psoriasis', 'dermat', 'hair', 'nail', 'itch', 'hives', 'pigment'], specialty: 'Dermatologist' },
    { keywords: ['eye', 'vision', 'blind', 'glaucoma', 'cataract', 'optic', 'see', 'sight', 'blur', 'retina'], specialty: 'Ophthalmologist' },
    { keywords: ['ear', 'nose', 'throat', 'ent', 'hearing', 'sinus', 'tonsil', 'snoring', 'nasal', 'smell', 'voice', 'hoarse'], specialty: 'ENT Specialist' },
    { keywords: ['bone', 'joint', 'fracture', 'arthritis', 'ortho', 'spine', 'back pain', 'knee', 'shoulder', 'hip', 'wrist', 'ankle', 'ligament'], specialty: 'Orthopedist' },
    { keywords: ['mental', 'anxiety', 'depression', 'stress', 'psychiatric', 'mood', 'phobia', 'panic', 'ocd', 'bipolar', 'trauma', 'insomnia', 'sleep'], specialty: 'Psychiatrist' },
    { keywords: ['stomach', 'gut', 'digest', 'liver', 'ibs', 'acid', 'ulcer', 'gastro', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloat', 'abdomen', 'heartburn'], specialty: 'Gastroenterologist' },
    { keywords: ['diabetes', 'thyroid', 'hormone', 'endocrin', 'insulin', 'sugar', 'metabolism', 'adrenal', 'pituitary'], specialty: 'Endocrinologist' },
    { keywords: ['kidney', 'nephro', 'renal', 'dialysis', 'urination', 'urine', 'bladder', 'uti', 'urinary tract'], specialty: 'Nephrologist' },
    { keywords: ['lung', 'breathing', 'asthma', 'cough', 'pulmon', 'respiratory', 'oxygen', 'shortness of breath', 'wheeze', 'bronch', 'emphysema', 'pneumonia'], specialty: 'Pulmonologist' },
    { keywords: ['brain', 'neuro', 'headache', 'migraine', 'seizure', 'stroke', 'nerve', 'numbness', 'paralysis', 'memory', 'dizziness', 'vertigo', 'tremor'], specialty: 'Neurologist' },
    { keywords: ['child', 'baby', 'infant', 'pediatr', 'toddler', 'kid', 'children', 'newborn', 'vaccination child', 'growth'], specialty: 'Pediatrician' },
    { keywords: ['pregnancy', 'period', 'menstrual', 'gynec', 'obstetr', 'fertility', 'uterus', 'ovary', 'pcos', 'cervix', 'breast', 'menopause'], specialty: 'Gynecologist' },
    { keywords: ['cancer', 'tumor', 'oncol', 'chemotherapy', 'malignant', 'lymph', 'biopsy', 'metastas'], specialty: 'Oncologist' },
    { keywords: ['teeth', 'dental', 'tooth', 'gum', 'cavity', 'jaw', 'braces', 'mouth', 'wisdom tooth'], specialty: 'Dentist' },
    { keywords: ['prostate', 'impotence', 'urolog', 'erectile', 'kidney stone'], specialty: 'Urologist' },
    // General fallback — matches common symptom words
    { keywords: ['fever', 'sick', 'cold', 'flu', 'tired', 'fatigue', 'weakness', 'general', 'pain', 'ache', 'infection', 'feel', 'unwell', 'malaise', 'checkup', 'body', 'sweat', 'chills', 'weight', 'loss', 'appetite'], specialty: 'General Physician' },
];

/**
 * Given a free-text symptom query, returns an ordered list of matching specialties.
 * Multiple keyword matches = higher score = ranked first.
 */
const matchSymptomsToSpecialties = (query) => {
    const lower = query.toLowerCase();
    const scores = {};

    for (const { keywords, specialty } of SYMPTOM_SPECIALTY_MAP) {
        const score = keywords.filter(kw => lower.includes(kw)).length;
        if (score > 0) {
            scores[specialty] = (scores[specialty] || 0) + score;
        }
    }

    // If no match, default to General Physician
    if (Object.keys(scores).length === 0) {
        scores['General Physician'] = 1;
    }

    return Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([specialty, score]) => ({ specialty, score }));
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// @desc    Search doctors by symptoms (returns ranked list)
// @route   GET /api/users/doctors?symptoms=chest pain&city=Karachi
router.get('/doctors', protect, async (req, res) => {
    try {
        const { symptoms, city } = req.query;

        const specialtyRanking = symptoms ? matchSymptomsToSpecialties(symptoms) : [];
        const specialtyOrder = specialtyRanking.map(s => s.specialty);

        // Get all doctors
        const doctors = await User.find({ role: 'Doctor' })
            .select('-password')
            .lean();

        // Score and rank doctors
        const ranked = doctors.map(doc => {
            let score = 0;

            // Specialty match score (position in ranking = weight)
            if (doc.specialization && specialtyOrder.length > 0) {
                const idx = specialtyOrder.findIndex(s =>
                    doc.specialization.toLowerCase().includes(s.toLowerCase()) ||
                    s.toLowerCase().includes(doc.specialization.toLowerCase())
                );
                if (idx !== -1) {
                    score += (specialtyOrder.length - idx) * 10;
                }
            } else if (!symptoms) {
                // No filter — show all with default score
                score = 5;
            }

            // City proximity bonus
            if (city && doc.city && doc.city.toLowerCase().trim() === city.toLowerCase().trim()) {
                score += 15;
            }

            // Availability bonus
            if (doc.isAvailable) score += 3;

            return { ...doc, _score: score };
        });

        // Filter to only relevant doctors (score > 0) unless no symptoms given
        const filtered = symptoms
            ? ranked.filter(d => d._score > 0).sort((a, b) => b._score - a._score)
            : ranked.sort((a, b) => b._score - a._score);

        // Return top 20, clean up internal score
        const result = filtered.slice(0, 20).map(({ _score, ...d }) => d);
        res.json({ doctors: result, matchedSpecialties: specialtyRanking.slice(0, 3) });
    } catch (error) {
        console.error('Doctor search error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Search patients by short ID suffix, name, or email (for doctors)
// @route   GET /api/users/patients?q=<query>
router.get('/patients', protect, authorize('Doctor'), async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);

        const query = q.trim().toLowerCase().replace(/^#/, '');
        const allPatients = await User.find({ role: 'Patient' }).select('_id name email city').lean();
        const filtered = allPatients.filter(u =>
            u._id.toString().toLowerCase().endsWith(query) ||
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
        res.json(filtered.slice(0, 10));
    } catch (error) {
        console.error('Patient search error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get patient full profile for doctor (if consent or case history exists)
// @route   GET /api/users/patients/:id
router.get('/patients/:id', protect, authorize('Doctor'), async (req, res) => {
    try {
        const { id } = req.params;
        const Consent = require('../models/Consent');
        const Case = require('../models/Case');

        const consent = await Consent.findOne({
            doctorId: req.user._id,
            patientId: id,
            status: 'Approved'
        });
        const hasCase = await Case.findOne({
            doctorId: req.user._id,
            patientId: id
        });

        if (!consent && !hasCase) {
            return res.status(403).json({ message: 'Patient consent or consultation history required to view medical profile.' });
        }

        const patient = await User.findOne({ _id: id, role: 'Patient' }).select('-password');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        const patientObj = patient.toObject();
        // Check if patient restricted medical profile / vitals
        if (consent && consent.allowedFields && consent.allowedFields.length > 0 && !consent.allowedFields.includes('patientProfile')) {
            patientObj.allergies = 'RESTRICTED';
            patientObj.chronicConditions = 'RESTRICTED';
            patientObj.bloodGroup = 'RESTRICTED';
            patientObj.emergencyContactName = 'RESTRICTED';
            patientObj.emergencyContactPhone = 'RESTRICTED';
            patientObj.isProfileRestricted = true;
        }

        res.json(patientObj);
    } catch (error) {
        console.error('Get patient profile error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current user full profile
// @route   GET /api/users/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update current user profile (patient or doctor fields)
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const allowedFields = [
            // Common
            'name', 'city',
            // Doctor
            'specialization', 'bio', 'qualifications', 'experience', 'hospital', 'license', 'isAvailable',
            // Patient
            'gender', 'dateOfBirth', 'bloodGroup', 'phoneNumber',
            'allergies', 'chronicConditions',
            'emergencyContactName', 'emergencyContactPhone',
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
