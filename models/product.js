const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
    type: Number,
    required: true,
    min: 0
},
    image: {
        type: String,
        required: true
    },
      sideImages: [{
        type: String,  
        default: []
    }],
    category: {
        type: String,
        required: true
    },
    tag: String,
    status: String,
    rating: {
        type: Number,
        default: 4.5
    },
    reviews: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 50
    },
    description: String,
    variants: [{
        color: { 
            type: String, 
            required: true 
        },
        colorName: {        // e.g., "Royal Blue", "Matte Black"
            type: String 
        },
        images: [{          // Multiple images per color
            type: String, 
            required: true 
        }],
        stock: {
            type: Number,
            default: 50
        }
    }],
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);