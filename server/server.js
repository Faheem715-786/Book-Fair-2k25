const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dbConnect = require('./lib/dbConnect'); // Your DB helper

const app = express();

// 1. Middleware
app.use(cors({
    origin: '*', // Change to your Vercel URL in production for security!
    credentials: true
}));
app.use(express.json());

// 2. Database Connection Middleware
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

// 5. Basic Health Check
app.get('/', (req, res) => {
    res.send('API is running!');
});

// 6. EXPORT APP (Required for Vercel)
module.exports = app;

// 7. START SERVER (Only if running locally)
// This check ensures it runs on your PC but doesn't crash Vercel
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Server running locally on port ${PORT}`);
    });
}