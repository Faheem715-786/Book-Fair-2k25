import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, DollarSign, Download, Eye, Trash2, User, Filter } from 'lucide-react';
import { dbService } from '../services/mockDb';
import { Invoice } from '../types';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    dbService.getInvoices().then(setInvoices);
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this invoice? Stock will NOT be restored (implement separately if needed).')) {
      await dbService.deleteInvoice(id);
      loadInvoices();
    }
  }

  // Extract unique classes from invoices for filter
  const uniqueClasses = useMemo(() => {
    const classes = new Set(invoices.map(inv => inv.customer?.studentClass).filter(Boolean));
    return Array.from(classes).sort();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
      if (!classFilter) return invoices;
      return invoices.filter(inv => inv.customer?.studentClass === classFilter);
  }, [invoices, classFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
           <p className="text-slate-500 mt-1">History of all transactions.</p>
        </div>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
            <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Filter size={20} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filter by Class:</span>
          <select 
            value={classFilter} 
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
                <option key={cls} value={cls as string}>{cls as string}</option>
            ))}
          </select>
          {classFilter && (
            <span className="text-xs text-slate-400 ml-auto">
                Showing {filteredInvoices.length} result(s)
            </span>
          )}
      </div>

      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-2 opacity-20" />
                <p>No invoices found matching criteria.</p>
            </div>
        ) : (
            filteredInvoices.map((inv, index) => (
            <motion.div
                key={inv._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText size={24} />
                    </div>
                    <div>
                    <h3 className="font-bold text-slate-800">{inv.number}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(inv.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                            <User size={14} /> 
                            {inv.customer?.name || "Guest"} 
                            {inv.customer?.studentClass && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs ml-1">{inv.customer.studentClass}</span>}
                        </span>
                        <span>{inv.items.reduce((acc, i) => acc + i.qty, 0)} items</span>
                    </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                    <p className="text-sm text-slate-400">Total Amount</p>
                    <p className="text-xl font-bold text-slate-800">₹{(inv.total / 100).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="View Details">
                            <Eye size={20} />
                        </button>
                        <button 
                        onClick={(e) => handleDelete(e, inv._id)} 
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors" 
                        title="Delete Invoice"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
                </div>
                
                {/* Expanded details */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                    {inv.items.slice(0, 5).map((item, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                            {item.qty}x {item.name}
                        </span>
                    ))}
                    {inv.items.length > 5 && (
                        <span className="text-xs text-slate-400 px-2 py-1">+ {inv.items.length - 5} more</span>
                    )}
                </div>
            </motion.div>
            ))
        )}
      </div>
    </div>
  );
};