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

        // ✅ Validate numbers
        const validPrice = Number(productPrice);
        const validOriginalPrice = Number(originalPrice);
        const validRating = Number(rating);
        const validReviews = Number(reviews);
        const validStock = Number(stock);

        // Handle variants
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
                stock: isNaN(Number(variant.stock)) ? 50 : Number(variant.stock),
                images: variantImageUrls
            };
        });

        const product = await Product.create({
            name: productName,
            price: isNaN(validPrice) ? 0 : validPrice,
            originalPrice: isNaN(validOriginalPrice) ? 0 : validOriginalPrice,
            image: mainImageUrl,
            sideImages: sideImageUrls,
            category: category || "Uncategorized",
            tag: tag || "",
            status: status || "In Stock",
            rating: isNaN(validRating) ? 4.5 : validRating,
            reviews: isNaN(validReviews) ? 0 : validReviews,
            stock: isNaN(validStock) ? 50 : validStock,
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

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ✅ Extract fields
        let parsedVariants = null;
        
        if (req.body.variants) {
            try {
                parsedVariants = JSON.parse(req.body.variants);
                console.log("✅ Variants parsed successfully:", parsedVariants.length);
            } catch (e) {
                console.error("❌ Error parsing variants:", e);
                if (Array.isArray(req.body.variants)) {
                    parsedVariants = req.body.variants;
                }
            }
        }
        
        // ✅ Build update data
        let updateData = {
            name: req.body.productName,
            price: parseFloat(req.body.productPrice) || 0,
            originalPrice: parseFloat(req.body.originalPrice) || 0,
            category: req.body.category,
            tag: req.body.tag || "",
            status: req.body.status || "In Stock",
            rating: parseFloat(req.body.rating) || 4.5,
            reviews: parseInt(req.body.reviews) || 0,
            stock: parseInt(req.body.stock) || 50,
            description: req.body.description || ""
        };

        // Handle images
        if (req.files && req.files.image && req.files.image[0]) {
            updateData.image = req.files.image[0].path;
        }
        if (req.files && req.files.sideImages && req.files.sideImages.length > 0) {
            updateData.sideImages = req.files.sideImages.map(file => file.path);
        }

        // ✅ Handle variants with proper validation
        if (parsedVariants && Array.isArray(parsedVariants)) {
            const formattedVariants = parsedVariants.map(v => ({
                color: v.color || "#000000",
                colorName: v.colorName || "Default",
                stock: parseInt(v.stock) || 50,
                images: Array.isArray(v.images) && v.images.length > 0 ? v.images : []  // ✅ Ensure images is array
            }));
            updateData.variants = formattedVariants;
        }

        console.log("📦 Final updateData:", JSON.stringify(updateData, null, 2));

        // ✅ TRY THIS: Use updateOne instead of findByIdAndUpdate
        const result = await Product.updateOne(
            { _id: id },
            { $set: updateData }
        );

        console.log("📊 Update Result:", {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            acknowledged: result.acknowledged
        });

        if (result.matchedCount === 0) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        if (result.modifiedCount === 0) {
            console.log("⚠️ No changes made to document");
            // Fetch current product to see if it already has the data
            const currentProduct = await Product.findById(id);
            return res.json({ 
                status: true, 
                message: "No changes needed", 
                data: currentProduct 
            });
        }

        // Fetch updated product
        const updatedProduct = await Product.findById(id);
        
        console.log("✅ Product updated successfully!");
        console.log("✅ Variants count in DB:", updatedProduct.variants?.length);

        res.json({ status: true, message: "Product updated", data: updatedProduct });
        
    } catch (error) {
        console.error("Update Product Error:", error);
        // ✅ Log validation errors
        if (error.name === 'ValidationError') {
            console.error("Validation Error Details:", error.errors);
        }
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