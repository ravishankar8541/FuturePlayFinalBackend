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

// Payment routes - make sure all handlers are functions
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.get('/:paymentId', getPaymentDetails);
router.post('/refund', refundPayment);

module.exports = router;