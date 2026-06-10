require('dotenv').config();
const express = require('express');
const dbConnect = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const path = require('path');
const app = express();
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');

const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dbConnect();

const PORT = process.env.PORT || 8000;

// ✅ CORS Configurations - Checked & Sanitized 
app.use(cors({
    origin: [
        'https://future-play-toysfrontend.vercel.app',
        'https://www.future-play-toysfrontend.vercel.app' // Handles potential subdomain routing issues
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api', orderRoutes);
app.use('/api/payments', paymentRoutes);

// ✅ Robust Global Production Error Interceptor
app.use((err, req, res, next) => {
    console.error("🔥 Deployed Server Error Trace:", err.message);
    console.error(err.stack);
    
    res.status(500).json({ 
        status: false, 
        message: err.message || 'Something went wrong on the server!' 
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});