const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        console.log('Signup Request Body:', req.body);
        const { name, email, password, role, specialization, city } = req.body;

        if (!name || !email || !password || !role) {
            console.log('Validation Failed: Missing fields');
            return res.status(400).json({ message: `Please provide all fields. Missing: ${!name ? 'name ' : ''}${!email ? 'email ' : ''}${!password ? 'password ' : ''}${!role ? 'role' : ''}` });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            specialization: specialization || '',
            city: city || '',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city || '',
                specialization: user.specialization || '',
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, specialization } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // If doctor specified or updated their specialization on login, persist it
            if (user.role === 'Doctor' && specialization && specialization.trim()) {
                user.specialization = specialization.trim();
                await user.save();
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                city: user.city || '',
                specialization: user.specialization || '',
                bio: user.bio || '',
                qualifications: user.qualifications || '',
                experience: user.experience || '',
                hospital: user.hospital || '',
                license: user.license || '',
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
