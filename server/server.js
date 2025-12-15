const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dbConnect = require('./lib/dbConnect'); // Import the helper we just made

const app = express();

// 1. Middleware
app.use(cors({
    origin: '*', // Be sure to change this to your Vercel Frontend URL in production!
    credentials: true
}));
app.use(express.json());

// 2. Database Connection Middleware
// This runs on EVERY request to ensure DB is connected before accessing routes
app.use(async (req, res, next) => {
    try {
        await dbConnect();
        next();
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// 3. Import Routes
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');

// 4. Use Routes
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 5. Basic Health Check Route
app.get('/', (req, res) => {
    res.send('API is running on Vercel!');
});

// 6. Export for Vercel (Do NOT use app.listen)
module.exports = app;