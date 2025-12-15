const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.json({
        todaySales: 0,
        invoiceCount: 0,
        productCount: 0,
        lowStockCount: 0
    });
});

module.exports = router;