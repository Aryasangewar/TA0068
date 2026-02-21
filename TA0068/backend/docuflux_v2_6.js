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
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Log requests to terminal for debugging
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consent', require('./routes/consent'));
app.use('/api/cases', require('./routes/cases'));

// Definitively use 5055 for this version to avoid phantom processes on 5000
const PORT = process.env.PORT || 5055;

app.get('/', (req, res) => {
    res.send('DocuFlux AI API is running... Version 2.6 (UNIQUE FILE)');
});

app.listen(PORT, () => {
    console.log('>>> 🚀 DOCUFLUX BACKEND (UNIQUE FILE) STARTING <<<');
    console.log('>>> 🛠️ VERSION: 2.6');
    console.log(`>>> 🌐 PORT: ${PORT}`);
    console.log('--- READY FOR AI PROCESSING ---');
});
