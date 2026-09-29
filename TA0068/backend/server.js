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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consent', require('./routes/consent'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));

const PORT = process.env.PORT || 5055;

app.get('/', (req, res) => {
    res.send('DocuFlux AI API is running... Version 2.8');
});

app.listen(PORT, () => {
    console.log('>>> 🚀 DOCUFLUX BACKEND STARTING <<<');
    console.log('>>> 🛠️  VERSION: 2.8 (FULL FUNCTIONAL)');
    console.log(`>>> 🌐 PORT: ${PORT}`);
    const hasKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';
    console.log(`>>> 🤖 AI ENGINE: ${hasKey ? 'OpenRouter (Gemini 2.0)' : 'Smart Fallback Parser (no API key)'}`);
    console.log('--- READY FOR OPERATIONS ---');
});
