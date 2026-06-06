const User = require('../models/user');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Product = require('../models/product');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // app password
    }
});
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;
        
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Passwords do not match"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: false,
                message: "User already registered"
            });
        }

        const bcryptPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName,
            email,
            password: bcryptPassword
        });

        user.password = undefined;

        return res.status(200).json({
            status: true,
            message: "User Registered Successfully",
            user
        });

    } catch (error) {
        console.log("Server Register Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

// controllers/userController.js - Update login function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }
          
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    status: false,
                    message: "Invalid Email or Password"
                });
            }

            const userResponse = user.toObject();
            delete userResponse.password;

            // ✅ FIXED: Use consistent property name - change 'id' to 'userId'
            const token = jwt.sign(
                {
                    userId: user._id,  // Changed from 'id' to 'userId'
                    email: user.email  
                },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                status: true,
                message: "User Login Successfully",
                token: token, 
                user: userResponse
            });
        }

        return res.status(400).json({
            status: false,
            message: "Invalid Email or Password"
        });

    } catch (error) {
        console.log("Server Login Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}
// controllers/userController.js - UPDATE forgotPassword function
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Email is required"
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User with this email does not exist"
            });
        }
        
        // Generate reset token (expires in 1 hour)
        const resetToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );
        
        // Save token to user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        
        // Create reset URL
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        
        // ✅ ACTUAL EMAIL SENDING CODE
        const mailOptions = {
            from: `"Toy Store" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #800000;">Reset Your Password</h2>
                    <p>Hello ${user.fullName},</p>
                    <p>You requested to reset your password. Click the button below to reset it:</p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #800000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Reset Password
                    </a>
                    <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">© Toy Store | All Rights Reserved</p>
                </div>
            `
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        console.log(`✅ Password reset email sent to: ${user.email}`);
        
        return res.status(200).json({
            status: true,
            message: "Password reset link has been sent to your email"
        });
        
    } catch (error) {
        console.log("Forgot Password Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};
// RESET PASSWORD - Actually change password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Passwords do not match"
            });
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: "Invalid or expired reset token"
            });
        }
        
        // Find user with valid reset token
        const user = await User.findOne({
            _id: decoded.id,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "Invalid or expired reset token"
            });
        }
        
        // Hash new password
        const bcryptPassword = await bcrypt.hash(newPassword, 10);
        user.password = bcryptPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        return res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
        
    } catch (error) {
        console.log("Reset Password Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// GET USER PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        res.json({ status: true, user });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// UPDATE USER PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, phone, address, city, state, pincode, dateOfBirth } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullName, phone, address, city, state, pincode, dateOfBirth },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        
        res.json({ status: true, user, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// GET USER ORDERS
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .sort('-createdAt')
            .populate('items.product', 'name image');
        
        res.json({ status: true, orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// GET SINGLE ORDER
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        }).populate('items.product', 'name image');
        
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }
        
        res.json({ status: true, order });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// CREATE ORDER (from checkout)
exports.createOrder = async (req, res) => {
    try {
        const { 
            items, customer, shippingAddress, paymentMethod, 
            paymentDetails, subtotal, shipping, discount, total 
        } = req.body;
        
        const orderId = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
        
        const order = await Order.create({
            orderId,
            userId: req.user.id,
            items: items.map(item => ({
                product: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                image: item.img
            })),
            customer,
            shippingAddress,
            paymentMethod,
            paymentDetails,
            subtotal,
            shipping,
            discount,
            total,
            status: 'confirmed',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
        });
        
        res.status(201).json({ 
            status: true, 
            message: "Order created successfully", 
            order 
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// GET WISHLIST
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('wishlist', 'name price originalPrice image category tag status rating');
        
        res.json({ status: true, wishlist: user.wishlist || [] });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// ADD TO WISHLIST
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }
        
        const updatedUser = await User.findById(req.user.id).populate('wishlist');
        
        res.json({ 
            status: true, 
            message: "Added to wishlist", 
            wishlist: updatedUser.wishlist 
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// REMOVE FROM WISHLIST
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const user = await User.findById(req.user.id);
        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();
        
        const updatedUser = await User.findById(req.user.id).populate('wishlist');
        
        res.json({ 
            status: true, 
            message: "Removed from wishlist", 
            wishlist: updatedUser.wishlist 
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// GET ALL USERS (Admin only) - Add this at the end of your file
exports.getAllUsers = async (req, res) => {
    try {
        console.log('📋 Fetching all users...');
        
        // Check if user is admin (you can add role check here)
        // For now, we'll allow access with valid token
        
        // Get all users except passwords
        const users = await User.find().select('-password');
        
        // Get order statistics for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            try {
                // Find orders for this user
                const orders = await Order.find({ userId: user._id });
                
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
                const lastOrderDate = orders[0]?.createdAt || null;
                
                return {
                    _id: user._id,
                    fullName: user.fullName,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone || 'Not provided',
                    address: user.address || '',
                    city: user.city || '',
                    state: user.state || '',
                    pincode: user.pincode || '',
                    totalOrders: totalOrders,
                    totalSpent: totalSpent,
                    lastOrderDate: lastOrderDate,
                    isActive: true,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                };
            } catch (err) {
                console.error(`Error processing user ${user._id}:`, err);
                return {
                    _id: user._id,
                    fullName: user.fullName,
                    name: user.fullName,
                    email: user.email,
                    phone: user.phone || 'Not provided',
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrderDate: null,
                    isActive: true,
                    createdAt: user.createdAt
                };
            }
        }));
        
        // Sort by createdAt (newest first)
        usersWithStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log(`✅ Found ${usersWithStats.length} users`);
        
        res.json({
            status: true,
            users: usersWithStats,
            count: usersWithStats.length
        });
        
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};