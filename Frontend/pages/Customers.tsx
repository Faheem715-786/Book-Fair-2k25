import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, User, Hash, School, X, Filter } from 'lucide-react';
import { dbService } from '../services/api';
import { Customer } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newAdNo, setNewAdNo] = useState('');
  const [newClass, setNewClass] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    dbService.getCustomers().then(setCustomers);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    await dbService.addCustomer({
        name: newName,
        adNo: newAdNo,
        studentClass: newClass
    });

    setNewName('');
    setNewAdNo('');
    setNewClass('');
    setShowAddModal(false);
    loadCustomers();
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this student?')) {
        await dbService.deleteCustomer(id);
        loadCustomers();
    }
  };

  // Extract unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = new Set(customers.map(c => c.studentClass).filter(Boolean));
    return Array.from(classes).sort();
  }, [customers]);

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.adNo.includes(search);
    const matchesClass = classFilter ? c.studentClass === classFilter : true;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Students / Customers</h1>
           <p className="text-slate-500 mt-1">Manage student details and admission info.</p>
        </div>
        <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 flex items-center gap-2"
        >
            <Plus size={18} /> Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 flex-wrap">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <Search className="text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by Name or Ad No..." 
                    className="flex-1 outline-none bg-transparent text-slate-700 placeholder-slate-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-400" />
                <select 
                    value={classFilter} 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Classes</option>
                    {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Ad No.</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                <motion.tr 
                    key={customer._id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                >
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={16} />
                        </div>
                        {customer.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-2">
                            <Hash size={14} /> {customer.adNo}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                         <div className="flex items-center gap-2">
                            <School size={14} /> {customer.studentClass || '-'}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => handleDelete(customer._id)} 
                            className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 size={18} />
                        </button>
                    </td>
                </motion.tr>
                ))}
                {filtered.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                            No students found matching your criteria.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

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
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Add New Student</h2>
                        <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ad No.</label>
                            <input 
                                type="text" 
                                required
                                value={newAdNo}
                                onChange={e => setNewAdNo(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 1004"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                            <input 
                                type="text" 
                                required
                                value={newClass}
                                onChange={e => setNewClass(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 10 A"
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 mt-4"
                        >
                            Save Student
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};