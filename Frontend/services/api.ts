import { Product, Invoice, Customer, InvoiceItem } from '../types';

const API_URL = 'http://localhost:5000/api'; 

export const dbService = {
  // --- Products ---
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  async addProduct(productData: Omit<Product, '_id' | 'createdAt'>): Promise<Product> {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  async updateProductStock(id: string, newStock: number): Promise<void> {
    const res = await fetch(`${API_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock })
    });
    if (!res.ok) throw new Error('Failed to update stock');
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    
    // FIX: If server says 404, the item is already gone. Treat as success.
    if (res.status === 404) return;
    
    if (!res.ok) throw new Error('Failed to delete product');
  },

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_URL}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  async addCustomer(customerData: Omit<Customer, '_id' | 'createdAt'>): Promise<Customer> {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!res.ok) throw new Error('Failed to add customer');
    return res.json();
  },

  async deleteCustomer(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    
    // FIX: If server says 404, the customer is already gone. Treat as success.
    if (res.status === 404) return;

    if (!res.ok) throw new Error('Failed to delete customer');
  },

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${API_URL}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  async getStudentRecentInvoice(customerId: string): Promise<Invoice | null> {
    const res = await fetch(`${API_URL}/invoices/student-recent/${customerId}`);
    if (res.status === 404) return null; 
    if (!res.ok) return null; 
    const data = await res.json();
    return data || null;
  },

  async createInvoice(invoiceData: any): Promise<Invoice> {
    const res = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    return res.json();
  },

  async addToInvoice(invoiceId: string, newItems: InvoiceItem[]): Promise<Invoice> {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/add-items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems })
    });
    if (!res.ok) throw new Error('Failed to update invoice');
    return res.json();
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE' });
    
    // FIX: If server says 404, it's already deleted.
    if (res.status === 404) return;

    if (!res.ok) throw new Error('Failed to delete invoice');
  },

  // --- Dashboard ---
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/dashboard`);
    if (!res.ok) {
       // Return empty stats instead of crashing
       return { todaySales: 0, invoiceCount: 0, productCount: 0, lowStockCount: 0 };
    }
    return res.json();
  }
};