const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Import the Model

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST add product
router.post('/', async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        res.json({ success: true, data: newProduct });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;