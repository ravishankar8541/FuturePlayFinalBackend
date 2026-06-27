// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUserOrders,
    getSingleOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
       updatePaymentStatus,
       deleteOrder
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); // Add this import



// User routes
router.get('/user/orders', authMiddleware, getUserOrders);
router.get('/user/orders/:orderId', authMiddleware, getSingleOrder);
router.post('/orders/create', authMiddleware, createOrder);
router.put('/orders/:orderId/status', authMiddleware, updateOrderStatus);
router.put('/orders/:orderId/cancel', authMiddleware, cancelOrder);

// ✅ Admin route - requires admin authentication
router.get('/admin/orders', adminAuth, getAllOrders);
router.put('/admin/orders/:orderId/payment-status', adminAuth, updatePaymentStatus);
router.delete('/admin/orders/:orderId', adminAuth, deleteOrder);
module.exports = router;