const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "admin123") {
        const token = jwt.sign(
            { 
                id: "admin001", 
                role: "admin",
                username: "admin" 
            }, 
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        return res.json({
            status: true,
            message: "Login successful",
            token: token,
            user: {
                id: "admin001",
                name: "Admin",
                role: "admin"
            }
        });
    }

    res.status(401).json({ status: false, message: "Invalid credentials" });
};