const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/', async (req, res) => {
    res.json({ success: true, data: req.body });
});

router.delete('/:id', async (req, res) => {
    res.json({ success: true, message: "Customer deleted" });
});

module.exports = router;