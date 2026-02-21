const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consent', require('./routes/consent'));
app.use('/api/cases', require('./routes/cases'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('DocuFlux AI API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
