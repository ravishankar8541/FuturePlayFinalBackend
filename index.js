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

// ✅ MANUAL CORS HANDLER - 100% Working
app.use((req, res, next) => {
    // ✅ Allow your frontend domains
    const allowedOrigins = [
        'https://www.futureplaytoys.com',
        'https://futureplaytoys.com'
        
    ];
    
    const origin = req.headers.origin;
    
    // ✅ Check if origin is allowed
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    // ✅ Allow credentials (cookies, authorization headers)
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // ✅ Allow all methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    // ✅ Allow all headers
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override');
    
    // ✅ Expose headers to frontend
    res.header('Access-Control-Expose-Headers', 'Authorization, Content-Disposition');
    
    // ✅ Handle preflight OPTIONS request immediately
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS request handled:', req.headers.origin);
        return res.sendStatus(200);
    }
    
    next();
});

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