const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with error handling
let razorpayInstance;
try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized');
} catch (error) {
    console.error('❌ Razorpay initialization failed:', error.message);
}

// Create Payment Order
const createPaymentOrder = async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;
        
        console.log('💰 Creating payment order for amount:', amount);
        
        if (!razorpayInstance) {
            throw new Error('Razorpay not configured. Check your API keys.');
        }
        
        const options = {
            amount: Math.round(amount * 100),
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1
        };
        
        const order = await razorpayInstance.orders.create(options);
        
        console.log('✅ Payment order created:', order.id);
        
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
        
    } catch (error) {
        console.error('❌ Payment order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order',
            error: error.error?.description || error.message
        });
    }
};

// Verify Payment
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;
        
        console.log('🔍 Verifying payment:', razorpay_payment_id);
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        
        const isAuthentic = expectedSignature === razorpay_signature;
        
        if (isAuthentic) {
            console.log('✅ Payment verified successfully');
            
            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                paymentStatus: 'success',
                paymentMethod: 'card',
                cardLast4: '1111',
                upiId: ''
            });
        } else {
            console.error('❌ Invalid payment signature');
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

// Get Payment Details
const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!razorpayInstance) {
            throw new Error('Razorpay not configured');
        }
        
        const payment = await razorpayInstance.payments.fetch(paymentId);
        
        res.json({
            success: true,
            payment: payment
        });
        
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message
        });
    }
};

// Refund Payment
const refundPayment = async (req, res) => {
    try {
        const { paymentId, amount, notes } = req.body;
        
        if (!razorpayInstance) {
            throw new Error('Razorpay not configured');
        }
        
        const refundOptions = {
            payment_id: paymentId,
            amount: amount ? amount * 100 : undefined,
            notes: notes || {}
        };
        
        const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);
        
        res.json({
            success: true,
            message: 'Refund initiated successfully',
            refund: refund
        });
        
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    getPaymentDetails,
    refundPayment
};