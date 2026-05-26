// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                message: "Access denied. Admin token required." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Check if user has admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin privileges required."
            });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ 
            status: false, 
            message: "Invalid or expired admin token" 
        });
    }
};

module.exports = adminAuth;