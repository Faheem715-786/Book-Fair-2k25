import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Save, X, Search, Filter } from 'lucide-react';
import { dbService } from '../services/mockDb';
import { Product } from '../types';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [search, setSearch] = useState('');

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
    loadProducts(); // Reload to confirm
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
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">
                Add Product
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
                        <button onClick={() => startEdit(product)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={18} />
                        </button>
                    )}
                    </td>
                </motion.tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};