const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware (Manual CORS & Logging for Hackathon robustness)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Log requests to terminal for debugging
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 prescription images

// Ensure DB connected on each request in serverless
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (e) {
        console.error('DB connection error in request:', e);
    }
    next();
});

// Routes - Mount on both /api/* and /* for full Vercel serverless compatibility
const authRoutes = require('./routes/auth');
const consentRoutes = require('./routes/consent');
const caseRoutes = require('./routes/cases');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/consent', consentRoutes);
app.use('/consent', consentRoutes);

app.use('/api/cases', caseRoutes);
app.use('/cases', caseRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api/records', recordRoutes);
app.use('/records', recordRoutes);

const PORT = process.env.PORT || 5055;

app.get(['/', '/api'], (req, res) => {
    res.json({ message: 'DocuFlux AI API is online', version: '2.8', status: 'operational' });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('>>> 🚀 DOCUFLUX BACKEND STARTING <<<');
        console.log('>>> 🛠️  VERSION: 2.8 (FULL FUNCTIONAL)');
        console.log(`>>> 🌐 PORT: ${PORT}`);
        const hasGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_');
        const hasGroq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_');
        const hasOpenRouter = process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your_');
        
        let activeAi = 'Smart Clinical Fallback Parser (no API key configured)';
        if (hasGemini) activeAi = 'Google Gemini (Google AI Studio - 100% Free)';
        else if (hasGroq) activeAi = 'Groq Cloud (Llama 3.3 70B - Free)';
        else if (hasOpenRouter) activeAi = 'OpenRouter Free Gateway';

        console.log(`>>> 🤖 AI ENGINE: ${activeAi}`);

        const hasCloudinary = Boolean(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET &&
            !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
        );
        const cloudStatus = hasCloudinary
            ? `Cloudinary CDN Active (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`
            : 'Base64 Encrypted Mode (Cloudinary keys pending in .env)';
        console.log(`>>> ☁️  MEDIA CLOUD: ${cloudStatus}`);
        console.log('--- READY FOR OPERATIONS ---');
    });
}

module.exports = app;

