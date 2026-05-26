const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                message: "Access denied. No token provided." 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        const userId = decoded.userId || decoded._id || decoded.id;
        
        // ✅ Sahi code
        req.user = {
            _id: userId,
            id: userId,           // ← YEH SAHI HAI
            userId: userId,
            ...decoded
        };
        
        console.log('✅ Auth middleware - User ID:', req.user._id);
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ 
            status: false, 
            message: "Invalid or expired token" 
        });
    }
};