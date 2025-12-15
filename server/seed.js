// server/seed.js
const mongoose = require('mongoose');
const Product = require('./index').Product; // You might need to export Product from index.js
// ... (Connect to DB, insert INITIAL_PRODUCTS from your mockDb, then exit)