// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
    getUserOrders,
    getSingleOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getAllOrders  // This function exists in controller
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); // Add this import

// All order routes require authentication
router.use(authMiddleware);

// User routes
router.get('/user/orders', getUserOrders);
router.get('/user/orders/:orderId', getSingleOrder);
router.post('/orders/create', createOrder);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/cancel', cancelOrder);

// ✅ Admin route - requires admin authentication
router.get('/admin/orders', adminAuth, getAllOrders);

module.exports = router;