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

// ✅ SPECIFIC CORS HANDLER - Only Allowed Domains
app.use((req, res, next) => {
    // ✅ Allowed Origins (Sirf yehi domains allow honge)
    const allowedOrigins = [
        'https://www.futureplaytoys.com',
        'https://futureplaytoys.com'
       
    ];
    
    const origin = req.headers.origin;
    
    // ✅ Check if origin is allowed
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || 'https://www.futureplaytoys.com');
    } else {
        console.log('❌ Blocked CORS from:', origin);
    }
    
    // ✅ Allow credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override');
    res.header('Access-Control-Expose-Headers', 'Authorization, Content-Disposition');
    res.header('Access-Control-Max-Age', '86400');
    
    // ✅ Handle preflight OPTIONS
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS from:', origin || 'Unknown');
        return res.sendStatus(200);
    }
    
    console.log(`📝 ${req.method} ${req.url} from ${origin || 'Direct'}`);
    next();
});

// ✅ Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Test Route
app.get('/', (req, res) => {
    res.json({ 
        status: true, 
        message: '🚀 Server is running!',
        timestamp: new Date().toISOString()
    });
});

// ✅ Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: true, 
        message: '✅ API is healthy!'
    });
});

// ✅ Routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api', orderRoutes);
app.use('/api/payments', paymentRoutes);

// ✅ 404 Handler
app.use((req, res) => {
    res.status(404).json({ 
        status: false, 
        message: `❌ Route not found: ${req.originalUrl}` 
    });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        status: false, 
        message: err.message || 'Something went wrong!'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});