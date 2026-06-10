// backend/controllers/orderController.js
const Order = require('../models/order');

const getAllOrders = async (req, res) => {
    try {
        console.log('📋 Admin fetching all orders...');
        
        const { search, status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }
        
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Order.countDocuments(query);
        
        console.log(`✅ Found ${total} total orders, returning ${orders.length}`);
        
        res.json({
            status: true,
            orders: orders,
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

const createOrder = async (req, res) => {
    try {
        console.log('📦 Creating order...');
        
        const {
            items,
            customer,
            shippingAddress,
            paymentMethod,
            paymentDetails,
            subtotal,
            shipping,
            discount,
            total
        } = req.body;

        const userId = req.user?._id || req.user?.userId || req.user?.id || null;
        const userEmail = req.user?.email || customer?.email;
        
        const orderId = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
        
        const processedItems = items.map(item => ({
            name: item.name || 'Unknown Product',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.img || item.image || ''
        }));

        const safePaymentDetails = {
            transactionId: paymentDetails?.transactionId || 'TXN-' + Date.now(),
            status: paymentDetails?.status || 'success',
            cardLast4: paymentDetails?.cardLast4 || '',
            upiId: paymentDetails?.upiId || ''
        };

        const newOrder = new Order({
            orderId: orderId,
            userId: userId,
            items: processedItems,
            customer: {
                name: customer?.name || 'Guest',
                email: customer?.email || userEmail || '',
                phone: customer?.phone || ''
            },
            shippingAddress: {
                address: shippingAddress?.address || '',
                city: shippingAddress?.city || '',
                state: shippingAddress?.state || '',
                pincode: shippingAddress?.pincode || '',
                landmark: shippingAddress?.landmark || ''
            },
            paymentMethod: paymentMethod || 'cod',
            paymentDetails: safePaymentDetails,
            subtotal: Number(subtotal) || 0,
            shipping: Number(shipping) || 0,
            discount: Number(discount) || 0,
            total: Number(total) || 0,
            status: 'confirmed',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'  // ✅ CORRECT
        });

        const savedOrder = await newOrder.save();
        console.log('✅ Order saved to DB:', savedOrder.orderId);
        console.log('✅ Payment Status:', savedOrder.paymentStatus);

        res.status(201).json({
            status: true,
            message: 'Order created successfully',
            order: savedOrder
        });
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        
        console.log('📋 Fetching orders for user:', userId);
        
        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${orders.length} orders for user`);
        
        res.json({
            status: true,
            count: orders.length,
            orders: orders
        });
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

const getSingleOrder = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        
        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: userId
        });
        
        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            status: true,
            order: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        res.json({
            status: true,
            message: 'Order status updated successfully',
            order: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id || req.user.userId || req.user.id;
        
        const order = await Order.findOne({
            _id: req.params.orderId,
            userId: userId
        });

        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'pending' && order.status !== 'confirmed') {
            return res.status(400).json({
                status: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({
            status: true,
            message: 'Order cancelled successfully',
            order: order
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to cancel order',
            error: error.message
        });
    }
};

// @desc    Update payment status (for admin - COD to Paid)
// @route   PUT /api/orders/:orderId/payment-status
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const { orderId } = req.params;

        // Validate payment status
        if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid payment status. Use: pending, paid, or failed'
            });
        }

        // Find order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }

        // Update payment status
        order.paymentStatus = paymentStatus;
        
        // Also update paymentDetails.status for consistency
        if (paymentStatus === 'paid') {
            order.paymentDetails.status = 'success';
        } else if (paymentStatus === 'pending') {
            order.paymentDetails.status = 'pending';
        }
        
        await order.save();

        console.log(`✅ Order ${order.orderId}: Payment status updated to ${paymentStatus}`);

        res.json({
            status: true,
            message: `Payment status updated to ${paymentStatus}`,
            order: order
        });
        
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to update payment status',
            error: error.message
        });
    }
};
// @desc    Delete order (Admin only)
// @route   DELETE /api/admin/orders/:orderId
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                status: false,
                message: 'Order not found'
            });
        }
        
        await Order.findByIdAndDelete(orderId);
        
        console.log(`✅ Order ${order.orderId} deleted successfully`);
        
        res.json({
            status: true,
            message: 'Order deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            status: false,
            message: 'Failed to delete order',
            error: error.message
        });
    }
};

module.exports = {
    getUserOrders,
    getSingleOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
     updatePaymentStatus,
     deleteOrder
};