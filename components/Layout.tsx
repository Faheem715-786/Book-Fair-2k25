import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, BarChart3, Settings, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink to={to}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200",
          isActive 
            ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
            : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </motion.div>
    </NavLink>
  );
};

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 shadow-sm z-10">
        <div className="mb-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Hisan Book<br/>Fair 2k25</h1>
        </div>

        <nav className="flex-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/pos" icon={ShoppingCart} label="Point of Sale" />
          <SidebarItem to="/customers" icon={Users} label="Customers" />
          <SidebarItem to="/products" icon={Package} label="Products" />
          <SidebarItem to="/invoices" icon={FileText} label="Invoices" />
          <SidebarItem to="/reports" icon={BarChart3} label="Reports" />
        </nav>

        <div className="pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
             <Settings size={20} />
             <span className="font-medium">Settings</span>
           </div>
           <div className="mt-4 px-4 text-xs text-slate-400">
             v1.0.1 &copy; 2025
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-8 max-w-7xl mx-auto h-full">
           <Outlet />
        </div>
      </main>
    </div>
  );
};