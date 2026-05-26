const Product = require('../models/product');
const cloudinary = require('cloudinary').v2; // ADD THIS - IMPORTANT!

// Helper function to upload multiple images to Cloudinary
const uploadMultipleImages = async (files, folder) => {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: folder },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                }
            );
            uploadStream.end(file.buffer);
        });
    });
    
    return Promise.all(uploadPromises);
};

exports.addProduct = async (req, res) => {
    try {
        const { 
            productName, productPrice, originalPrice, category, tag, 
            status, rating, reviews, stock, description, variants 
        } = req.body;

        if (!req.files?.image?.[0]) {
            return res.status(400).json({ status: false, message: "Main image required" });
        }

        const mainImageUrl = req.files.image[0].path;
        const sideImageUrls = req.files?.sideImages?.map(file => file.path) || [];

        // === VARIANTS HANDLING - SAFER VERSION ===
        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (e) {
                console.error("Variants parse error:", e);
            }
        }

        if (!Array.isArray(parsedVariants)) parsedVariants = [];

        const variantImages = req.files?.variantImages || [];
        let imageIndex = 0;

        const finalVariants = parsedVariants.map((variant) => {
            const imageCount = Number(variant.imagesCount) || 0;
            const variantImageUrls = [];

            for (let i = 0; i < imageCount; i++) {
                if (variantImages[imageIndex]) {
                    variantImageUrls.push(variantImages[imageIndex].path);
                    imageIndex++;
                }
            }

            return {
                color: variant.color || "#000000",
                colorName: variant.colorName || "Default",
                stock: Number(variant.stock) || 50,
                images: variantImageUrls
            };
        });

        const product = await Product.create({
            name: productName,
            price: Number(productPrice),
            originalPrice: Number(originalPrice),
            image: mainImageUrl,
            sideImages: sideImageUrls,
            category: category || "Uncategorized",
            tag: tag || "",
            status: status || "In Stock",
            rating: Number(rating) || 4.5,
            reviews: Number(reviews) || 0,
            stock: Number(stock) || 50,
            description: description || "",
            variants: finalVariants
        });

        res.status(201).json({ status: true, data: product });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ 
            status: false, 
            message: error.message 
        });
    }
};

// Keep other functions (getProducts, getProduct, updateProduct, deleteProduct)
// Make sure to fix updateProduct similarly:

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            productName, 
            productPrice, 
            originalPrice, 
            category, 
            tag, 
            status, 
            rating, 
            reviews,
            stock,
            description,
            variants
        } = req.body;
        
        let updateData = {
            name: productName,
            price: Number(productPrice),
            originalPrice: Number(originalPrice),
            category: category,
            tag: tag || "",
            status: status || "In Stock",
            rating: Number(rating) || 4.5,
            reviews: Number(reviews) || 0,
            stock: Number(stock) || 50,
            description: description || ""
        };

        // FIXED: Check for main image in req.files.image
        if (req.files && req.files.image && req.files.image[0]) {
            updateData.image = req.files.image[0].path;
        } else if (req.file) {
            updateData.image = req.file.path;
        }

        // Handle side images
        if (req.files && req.files.sideImages && req.files.sideImages.length > 0) {
            updateData.sideImages = req.files.sideImages.map(file => file.path);
        }

        // Handle variants
        if (variants && variants !== 'undefined' && variants !== 'null') {
            try {
                updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (e) {
                console.error("Error parsing variants:", e);
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
            new: true, 
            runValidators: true 
        });

        if (!updatedProduct) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        res.json({ status: true, message: "Product updated", data: updatedProduct });
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        let query = {};
        if (category && category !== "All Products") query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        const products = await Product.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.json({
            status: true,
            products,
            pagination: { page: Number(page), limit: Number(limit), total }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    const { id } = req.params; 
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Product found successfully",
            product
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Error in finding product",
            error: error.message
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({
                status: false,
                message: "Product not found to delete"
            });
        }

        res.status(200).json({ 
            status: true,
            message: "Product deleted successfully" 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ 
            status: false,
            message: "Error in deleting product",
            error: err.message 
        });
    }
};