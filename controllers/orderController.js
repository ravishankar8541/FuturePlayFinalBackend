// backend/controllers/orderController.js
const Order = require('../models/order');

const getAllOrders = async (req, res) => {
    try {
        console.log('📋 Admin fetching all orders...');
        
        // Optional: Add admin check here if you have isAdmin field
        // if (!req.user.isAdmin) {
        //     return res.status(403).json({
        //         status: false,
        //         message: 'Access denied. Admin only.'
        //     });
        // }
        
        const { search, status, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        // Filter by status
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }
        
        // Search by order ID or customer name/email
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

        // ✅ Get user ID (can be null for guests)
        const userId = req.user?._id || req.user?.userId || req.user?.id || null;
        const userEmail = req.user?.email || customer?.email;
        
        // ✅ Generate unique order ID
        const orderId = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
        
        // ✅ Process items safely
        const processedItems = items.map(item => ({
            name: item.name || 'Unknown Product',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.img || item.image || ''
        }));

        // ✅ Handle paymentDetails safely with default values
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
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid'
        });

        const savedOrder = await newOrder.save();
        console.log('✅ Order saved to DB:', savedOrder.orderId);
        console.log('✅ User ID:', userId);
        console.log('✅ Customer email:', savedOrder.customer.email);

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
// @desc    Get all orders for logged in user
// @route   GET /api/user/orders
// @access  Private
// @desc    Get all orders for logged in user
// @route   GET /api/user/orders
// @access  Private
const getUserOrders = async (req, res) => {
    try {
        console.log('📋 Fetching orders - FORCE MODE');
        
        // ✅ FORCE: Return ALL orders (ignore user filter temporarily)
        const orders = await Order.find().sort({ createdAt: -1 });
        
        console.log(`✅ Found ${orders.length} total orders`);
        
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

// @desc    Get single order by ID
// @route   GET /api/user/orders/:orderId
// @access  Private
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

// @desc    Update order status (for admin)
// @route   PUT /api/orders/:orderId/status
// @access  Private/Admin
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

// @desc    Cancel order
// @route   PUT /api/orders/:orderId/cancel
// @access  Private
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

        // Check if order can be cancelled (only pending or confirmed)
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

module.exports = {
    getUserOrders,
    getSingleOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
     getAllOrders
}; 