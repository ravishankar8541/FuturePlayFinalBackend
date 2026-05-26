const mongoose = require('mongoose');
const express = require('express');
const { 
    register, 
    login, 
    getProfile, 
    updateProfile, 
    getOrders, 
    getOrder,
    createOrder,
    getWishlist, 
    addToWishlist, 
    forgotPassword,
    resetPassword,
    removeFromWishlist,
        getAllUsers 
    
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();

// Public routes
Router.post('/register', register);
Router.post('/login', login);
// Add these routes
Router.post('/forgot-password', forgotPassword);
Router.post('/reset-password', resetPassword);
Router.get('/all', authMiddleware, getAllUsers);
// Protected routes (require authentication)
Router.get('/profile', authMiddleware, getProfile);
Router.put('/profile', authMiddleware, updateProfile);
Router.get('/orders', authMiddleware, getOrders);
Router.get('/orders/:id', authMiddleware, getOrder);
Router.post('/orders', authMiddleware, createOrder);
Router.get('/wishlist', authMiddleware, getWishlist);
Router.post('/wishlist', authMiddleware, addToWishlist);
Router.delete('/wishlist/:productId', authMiddleware, removeFromWishlist);

module.exports = Router;