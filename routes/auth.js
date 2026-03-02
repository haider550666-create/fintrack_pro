const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match');
        return true;
    })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'Email already registered. Please login.' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: { id: user._id, name: user.name, email: user.email, language: user.language }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user._id, name: user.name, email: user.email, language: user.language }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// ─── PATCH /api/auth/language ────────────────────────────────────────────────
router.patch('/language', protect, [
    body('language').isIn(['en', 'es', 'fr', 'ar', 'ur']).withMessage('Invalid language code')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        await User.findByIdAndUpdate(req.user._id, { language: req.body.language });
        res.json({ success: true, message: 'Language preference updated.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to update language.' });
    }
});

// ─── POST /api/auth/logout (client-side, just for convention) ────────────────
router.post('/logout', protect, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
