const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/', async (req, res) => {
    res.json({ success: true, data: req.body });
});

// Important for POS check
router.get('/student-recent/:id', async (req, res) => {
    // Return null if no invoice found (simulated)
    res.status(404).json(null); 
});

module.exports = router;