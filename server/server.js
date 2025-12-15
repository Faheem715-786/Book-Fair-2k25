// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

app.use(cors({
    origin: [
        "http://localhost:5173", // Allow local development
        "https://your-vercel-app-name.vercel.app" // ADD YOUR VERCEL DOMAIN HERE
    ],
    credentials: true
}));

app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookfair')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Schemas & Models ---

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true }, // in cents
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adNo: { type: String, required: true },
  studentClass: { type: String, required: true },
}, { timestamps: true });

const InvoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  qty: Number,
  price: Number,
  amount: Number
});

const InvoiceSchema = new mongoose.Schema({
  number: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  subtotal: Number,
  tax: Number,
  total: Number,
  notes: String,
  items: [InvoiceItemSchema],
  status: { type: String, enum: ['paid', 'pending'], default: 'paid' }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Customer = mongoose.model('Customer', CustomerSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);

// --- Helpers ---
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  return `INV-2025-${(count + 1).toString().padStart(3, '0')}`;
};

// --- Routes ---

// 1. PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => { // Added for easier initial setup
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/products/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { stock });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. CUSTOMERS
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json(customer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. INVOICES
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/invoices/student-recent/:customerId', async (req, res) => {
  try {
    // Find invoice for this student created "today"
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const invoice = await Invoice.findOne({
      customer: req.params.customerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer');
    
    res.json(invoice || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invoices', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer, subtotal, total, notes, items } = req.body;
    
    // 1. Create Invoice
    const number = await generateInvoiceNumber();
    const invoice = new Invoice({
      number,
      customer: customer._id,
      subtotal,
      tax: 0,
      total,
      notes,
      items,
      status: 'paid'
    });
    
    await invoice.save({ session });

    // 2. Decrement Stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product, 
        { $inc: { stock: -item.qty } },
        { session }
      );
    }

    await session.commitTransaction();
    res.json(invoice);
  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

app.patch('/api/invoices/:id/add-items', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items: newItems } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) throw new Error('Invoice not found');

    // Merge items logic
    let updatedItems = [...invoice.items];
    let addedAmount = 0;

    for (const newItem of newItems) {
      addedAmount += newItem.amount;
      const existingIdx = updatedItems.findIndex(i => i.product.toString() === newItem.product.toString());
      
      if (existingIdx > -1) {
        updatedItems[existingIdx].qty += newItem.qty;
        updatedItems[existingIdx].amount += newItem.amount;
      } else {
        updatedItems.push(newItem);
      }

      // Decrement stock for new items
      await Product.findByIdAndUpdate(
        newItem.product,
        { $inc: { stock: -newItem.qty } },
        { session }
      );
    }

    invoice.items = updatedItems;
    invoice.subtotal += addedAmount;
    invoice.total += addedAmount;
    invoice.notes += ` (Updated: added ${newItems.length} items)`;
    
    await invoice.save({ session });
    await session.commitTransaction();
    
    // Return populated invoice for frontend consistency
    const populated = await Invoice.findById(invoice._id).populate('customer');
    res.json(populated);

  } catch (e) {
    await session.abortTransaction();
    res.status(500).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. DASHBOARD
app.get('/api/dashboard', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const todaySalesAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const invoiceCount = await Invoice.countDocuments();
    const productCount = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

    res.json({
      todaySales: todaySalesAgg[0]?.total || 0,
      invoiceCount,
      productCount,
      lowStockCount
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const productRoutes = require('./routes/products'); 
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard'); // If you have this

// Tell the app to use them
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
// --------------------------------------

// Database Connection
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.error('MongoDB Error:', err));
}

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));