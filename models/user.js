const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
         resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpires: {
            type: Date,
            default: null
        },
        password: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        state: {
            type: String,
            default: ''
        },
        pincode: {
            type: String,
            default: ''
        },
        dateOfBirth: {
            type: Date,
            default: null
        },
        wishlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }]
    }, 
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);