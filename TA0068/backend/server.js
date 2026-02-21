const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
console.log('>>> ATTACHED DOCUFLUX BACKEND - VERSION 2.2 <<<');
console.log('>>> TARGET PORT: 5002 <<<');

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

const PORT = process.env.PORT || 5002;

app.get('/', (req, res) => {
    res.send('DocuFlux AI API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
