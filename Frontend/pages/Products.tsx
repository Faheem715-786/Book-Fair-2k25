import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Search, Filter, Plus, Trash2 } from 'lucide-react';
import { dbService } from '../services/api'; // Or '../services/api' if you switched to backend
import { Product } from '../types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState(''); // String to handle input easily
  const [newStock, setNewStock] = useState(''); // String to handle input easily

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    dbService.getProducts().then(setProducts);
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditStockValue(product.stock);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    await dbService.updateProductStock(id, editStockValue);
    setEditingId(null);
    loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    // 1. Send delete request to backend
    await dbService.deleteProduct(id);
    
    // 2. IMPORTANT: Remove it from the screen immediately
    setProducts(prevProducts => prevProducts.filter(p => p._id !== id));
    
  } catch (error) {
    console.error("Failed to delete:", error);
    alert("Could not delete product. It might already be removed.");
    
    // Optional: Reload data just in case
    // const refreshed = await dbService.getProducts();
    // setProducts(refreshed);
  }
};

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSku || !newPrice) return;

    await dbService.addProduct({
      name: newName,
      sku: newSku,
      category: newCategory || 'General',
      price: parseFloat(newPrice) * 100, // Convert to cents
      stock: parseInt(newStock) || 0
    });

    // Reset Form
    setNewName('');
    setNewSku('');
    setNewCategory('');
    setNewPrice('');
    setNewStock('');
    setShowAddModal(false);
    loadProducts();
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Inventory</h1>
           <p className="text-slate-500 mt-1">Manage your products and stock levels.</p>
        </div>
        <div className="flex gap-2">
            <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
                <Filter size={16} /> Filter
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 flex items-center gap-2"
            >
                <Plus size={18} /> Add Product
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
            <Search className="text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search inventory..." 
                className="flex-1 outline-none text-slate-700 placeholder-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => (
                <motion.tr 
                    key={product._id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                >
                    <td className="px-6 py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{product.sku}</td>
                    <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                            {product.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">₹{(product.price / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                    {editingId === product._id ? (
                        <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className="w-20 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(parseInt(e.target.value) || 0)}
                        />
                        </div>
                    ) : (
                        <span className={`font-medium ${product.stock < 10 ? 'text-orange-600' : 'text-slate-700'}`}>
                        {product.stock} units
                        </span>
                    )}
                    </td>
                    <td className="px-6 py-4">
                    {editingId === product._id ? (
                        <div className="flex gap-2">
                        <button onClick={() => saveEdit(product._id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={18} /></button>
                        <button onClick={cancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={18} /></button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => startEdit(product)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit Stock">
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDeleteProduct(product._id)} 
                                className="text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Product"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                    </td>
                </motion.tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Add Product Modal (This section remains unchanged from the previous step) */}
      <AnimatePresence>
        {showAddModal && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Add New Product</h2>
                        <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                            <input 
                                type="text" 
                                required
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Classmate Notebook"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Code</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newSku}
                                    onChange={e => setNewSku(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. NB-005"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Paper"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    step="0.01"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                                <input 
                                    type="number" 
                                    required
                                    value={newStock}
                                    onChange={e => setNewStock(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 mt-4"
                        >
                            Save Product
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};