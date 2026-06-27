const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const adminAuth = require('../middleware/adminAuth');

const { 
  addProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { adminLogin } = require('../controllers/authController');

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let folder = 'products';
        if (file.fieldname === 'sideImages') {
            folder = 'products/side';
        } else if (file.fieldname === 'variantImages') {
            folder = 'products/variants';
        }
        return { folder: folder };
    }
});

const upload = multer({ storage: storage });

// IMPORTANT: Use fields to accept multiple file types
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'sideImages', maxCount: 10 },
    { name: 'variantImages', maxCount: 20 }
]);

// Public Routes
router.post('/admin/login', adminLogin);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected Admin Routes - USE uploadFields instead of upload.single
router.post('/add', adminAuth, uploadFields, addProduct);
router.put('/:id', adminAuth, uploadFields, updateProduct);
router.delete('/:id/delete', adminAuth, deleteProduct);

module.exports = router;