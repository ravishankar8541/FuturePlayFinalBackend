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

// ✅ CORS - Only once, with proper configuration
app.use(cors({
    origin: ['https://future-play-e-commerece-frontend.vercel.app'],
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

// ✅ Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        status: false, 
        message: 'Something went wrong!' 
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});