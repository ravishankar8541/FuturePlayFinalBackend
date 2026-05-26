const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');
const { getAllOrders } = require('../controllers/orderController');

router.post('/login', adminLogin);
router.get('/orders', getAllOrders);  // ← Yahan se auth hata diya

module.exports = router;