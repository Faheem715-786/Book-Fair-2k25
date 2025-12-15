import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingBag, User, X, Check, ChevronsUpDown } from 'lucide-react';
import { dbService } from '../services/mockDb';
import { Product, CartItem, Customer, Invoice } from '../types';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const POS: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Student Selector State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    dbService.getProducts().then(setProducts);
    dbService.getCustomers().then(setCustomers);

    const handleClickOutside = (event: MouseEvent) => {
        if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
            setIsStudentDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Product Search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lower = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.sku.toLowerCase().includes(lower)
    );
  }, [products, searchQuery]);

  // Filtered Students
  const filteredCustomers = useMemo(() => {
    if (!studentSearchTerm) return customers;
    const lower = studentSearchTerm.toLowerCase();
    return customers.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        c.adNo.toLowerCase().includes(lower) ||
        c.studentClass.toLowerCase().includes(lower)
    );
  }, [customers, studentSearchTerm]);

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer._id);
    setStudentSearchTerm(customer.name);
    setIsStudentDropdownOpen(false);
  };

  const clearCustomer = () => {
    setSelectedCustomerId('');
    setStudentSearchTerm('');
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.cartQty >= product.stock) return prev;
        return prev.map(item => 
          item._id === product._id ? { ...item, cartQty: item.cartQty + 1 } : item
        );
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item._id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === productId) {
          const newQty = item.cartQty + delta;
          if (newQty < 1) return item;
          if (newQty > item.stock) return item;
          return { ...item, cartQty: newQty };
        }
        return item;
      });
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.cartQty), 0);
  const total = cartTotal; // Tax Removed

  const initiateCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomerId) {
      alert("Please select a student/customer first.");
      return;
    }

    setIsCheckingOut(true);
    
    // Check for existing invoice for this student today
    const recent = await dbService.getStudentRecentInvoice(selectedCustomerId);
    
    if (recent) {
      setExistingInvoice(recent);
      setShowInvoiceModal(true);
      setIsCheckingOut(false);
    } else {
      await processCheckout('new');
    }
  };

  const processCheckout = async (mode: 'new' | 'existing') => {
    setIsCheckingOut(true);
    setShowInvoiceModal(false);
    
    try {
      const customer = customers.find(c => c._id === selectedCustomerId);
      const itemsPayload = cart.map(c => ({
        product: c._id,
        name: c.name,
        qty: c.cartQty,
        price: c.price,
        amount: c.price * c.cartQty
      }));

      if (mode === 'existing' && existingInvoice) {
        await dbService.addToInvoice(existingInvoice._id, itemsPayload);
      } else {
        await dbService.createInvoice({
          customer: customer,
          subtotal: cartTotal,
          tax: 0,
          total: total,
          notes: 'POS Sale',
          items: itemsPayload,
          status: 'paid'
        });
      }

      // Refresh products
      const updatedProducts = await dbService.getProducts();
      setProducts(updatedProducts);
      setCart([]);
      clearCustomer();
      setExistingInvoice(null);
      navigate('/invoices');
    } catch (e) {
      console.error(e);
      alert("Error processing checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 relative">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                className={clsx(
                  "bg-white p-4 rounded-xl border cursor-pointer flex flex-col h-48",
                  product.stock === 0 ? "border-slate-100 opacity-60 grayscale" : "border-slate-200 hover:border-blue-300"
                )}
                onClick={() => addToCart(product)}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                     <ShoppingBag size={18} />
                   </div>
                   <span className={clsx(
                     "text-xs font-bold px-2 py-1 rounded-full",
                     product.stock > 10 ? "bg-green-100 text-green-700" : (product.stock === 0 ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-700")
                   )}>
                     {product.stock === 0 ? "Out of Stock" : `${product.stock} left`}
                   </span>
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-auto">{product.name}</h3>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-xs text-slate-400">{product.sku}</p>
                  <p className="font-bold text-blue-600 text-lg">₹{(product.price / 100).toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Customer Selector */}
        <div className="p-4 bg-slate-100 border-b border-slate-200">
           <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Student / Customer</label>
           
           <div className="relative" ref={studentDropdownRef}>
              <div 
                className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent cursor-text"
                onClick={() => setIsStudentDropdownOpen(true)}
              >
                  <User className="text-slate-400 mr-2" size={16} />
                  <input 
                    type="text"
                    className="flex-1 outline-none text-sm bg-transparent"
                    placeholder="Search Name or Ad No..."
                    value={studentSearchTerm}
                    onChange={(e) => {
                        setStudentSearchTerm(e.target.value);
                        setSelectedCustomerId(''); // Clear selection on edit
                        setIsStudentDropdownOpen(true);
                    }}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                  />
                  {selectedCustomerId ? (
                      <button onClick={(e) => { e.stopPropagation(); clearCustomer(); }} className="text-slate-400 hover:text-red-500">
                          <X size={16} />
                      </button>
                  ) : (
                      <ChevronsUpDown size={16} className="text-slate-400" />
                  )}
              </div>

              <AnimatePresence>
                {isStudentDropdownOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto"
                    >
                        {filteredCustomers.length === 0 ? (
                            <div className="p-3 text-sm text-slate-500 text-center">No students found.</div>
                        ) : (
                            filteredCustomers.map(c => (
                                <div 
                                    key={c._id}
                                    className={clsx(
                                        "p-3 text-sm cursor-pointer hover:bg-slate-50 flex justify-between items-center",
                                        c._id === selectedCustomerId && "bg-blue-50 text-blue-700"
                                    )}
                                    onClick={() => selectCustomer(c)}
                                >
                                    <div>
                                        <p className="font-medium">{c.name}</p>
                                        <p className="text-xs text-slate-500">Ad No: {c.adNo} • {c.studentClass}</p>
                                    </div>
                                    {c._id === selectedCustomerId && <Check size={16} />}
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
              </AnimatePresence>
           </div>
           {selectedCustomerId && selectedCustomer && (
               <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                   Selected: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.studentClass})
               </div>
           )}
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Current Order</h2>
          <p className="text-sm text-slate-500">{cart.length} items</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-slate-400"
                    >
                        <ShoppingBag size={48} className="mb-2 opacity-20" />
                        <p>Cart is empty</p>
                    </motion.div>
                ) : (
                    cart.map((item) => (
                        <motion.div
                            key={item._id}
                            layout
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                        >
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-800 truncate">{item.name}</h4>
                                <p className="text-xs text-slate-500">₹{(item.price / 100).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateQty(item._id, -1)}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-medium w-6 text-center">{item.cartQty}</span>
                                <button 
                                  onClick={() => updateQty(item._id, 1)}
                                  disabled={item.cartQty >= item.stock}
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-50 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                            </div>
                            <button 
                                onClick={() => removeFromCart(item._id)}
                                className="text-red-400 hover:text-red-600 p-1 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>₹{(total / 100).toFixed(2)}</span>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={cart.length === 0 || isCheckingOut}
                onClick={initiateCheckout}
                className={clsx(
                    "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg",
                    (cart.length === 0 || !selectedCustomerId) ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
            >
                {isCheckingOut ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <CreditCard size={20} />
                        Checkout
                    </>
                )}
            </motion.button>
        </div>
      </div>

      {/* Modal for Invoice Choice */}
      <AnimatePresence>
        {showInvoiceModal && existingInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full m-4"
             >
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-slate-800">Existing Invoice Found</h3>
                   <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                
                <p className="text-slate-600 mb-6 text-sm">
                  This student has an open invoice <strong>{existingInvoice.number}</strong> from today. Would you like to add these items to it?
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={() => processCheckout('existing')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200"
                  >
                    Add to Existing ({existingInvoice.number})
                  </button>
                  <button 
                    onClick={() => processCheckout('new')}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg"
                  >
                    Create New Invoice
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};