const express = require('express');
const router = express.Router();
const {
    createPaymentOrder,
    verifyPayment,
    getPaymentDetails,
    refundPayment
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// All payment routes require authentication
router.use(authMiddleware);

// Payment routes
router.post('/create-order', createPaymentOrder);      // Create payment order
router.post('/verify', verifyPayment);                 // Verify payment after success
router.get('/:paymentId', getPaymentDetails);          // Get payment details
router.post('/refund', refundPayment);                 

module.exports = router;