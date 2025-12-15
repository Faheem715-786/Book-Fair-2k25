const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
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
  status: { type: String, default: 'paid' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);