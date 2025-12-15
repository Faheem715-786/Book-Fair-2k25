import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { DollarSign, FileText, Package, AlertTriangle, ArrowRight, ShoppingCart } from 'lucide-react';
import { dbService as mockDb } from '../services/api';
import { Link } from 'react-router-dom';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

interface Stats {
  todaySales: number;
  invoiceCount: number;
  productCount: number;
  lowStockCount: number;
}

const StatCard = ({ title, value, icon: Icon, colorClass, linkTo }: { title: string, value: string, icon: any, colorClass: string, linkTo: string }) => (
  <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
    <Link to={linkTo} className="text-sm font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
      View Details <ArrowRight size={14} />
    </Link>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  // Initialize with zeros so the UI doesn't crash
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    invoiceCount: 0,
    productCount: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // 1. Fetch the server stats (Sales, Invoices)
        const serverStats = await mockDb.getDashboardStats().catch(() => null);

        // 2. Fetch Products explicitly to calculate Low Stock
        const productsData = await mockDb.getProducts().catch(() => []);
        
        // Safety check: Ensure we handle { data: [...] } or [...]
        // @ts-ignore
        const validProducts = Array.isArray(productsData) ? productsData : (productsData?.data || []);

        // 3. Manually calculate counts
        const calculatedLowStock = validProducts.filter((p: any) => p.stock <= 10).length;
        const calculatedTotalProducts = validProducts.length;

        setStats({
          todaySales: serverStats?.todaySales || 0,
          invoiceCount: serverStats?.invoiceCount || 0,
          productCount: calculatedTotalProducts, // Use our accurate count
          lowStockCount: calculatedLowStock      // Use our accurate count
        });

      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <div className="p-8 flex justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={`₹${((stats.todaySales || 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          colorClass="bg-green-500 text-green-600"
          linkTo="/reports"
        />
        <StatCard
          title="Total Invoices"
          value={stats.invoiceCount.toString()}
          icon={FileText}
          colorClass="bg-blue-500 text-blue-600"
          linkTo="/invoices"
        />
        <StatCard
          title="Total Products"
          value={stats.productCount.toString()}
          icon={Package}
          colorClass="bg-purple-500 text-purple-600"
          linkTo="/products"
        />
        {/* Now this will show the correct calculated number */}
        <StatCard
          title="Low Stock Alert"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          colorClass="bg-orange-500 text-orange-600"
          linkTo="/products"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="text-blue-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Quick Sale</h3>
            <p className="text-slate-500 text-sm mb-4">Jump directly to POS to create a new order.</p>
            <Link to="/pos">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-blue-200 shadow-md">
                    Open POS
                </motion.button>
            </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm h-64 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-3xl opacity-10 -mr-16 -mt-16"></div>
            <h3 className="text-lg font-bold text-white z-10">System Status</h3>
            <p className="text-slate-400 text-sm mb-4 z-10">Database connected. All systems operational.</p>
            <div className="mt-auto z-10">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Online
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
};