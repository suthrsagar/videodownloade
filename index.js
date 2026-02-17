require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const downloadRoutes = require('./routes/download');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/download', downloadRoutes);

app.get('/', (req, res) => {
    res.send('Video Downloader API is running');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/videodownloader';

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        startServer();
    })
    .catch(err => {
        console.error('Database connection error. Proceeding without MongoDB...');
        startServer();
    });
