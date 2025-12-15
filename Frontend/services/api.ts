import { Product, Invoice, Customer, InvoiceItem } from '../types';

const API_URL = 'http://localhost:5000/api'; // Or your deployed URL

export const dbService = {
  // --- Products ---
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products`);
    return res.json();
  },

  async updateProductStock(id: string, newStock: number): Promise<void> {
    await fetch(`${API_URL}/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock })
    });
  },

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_URL}/customers`);
    return res.json();
  },

  async addCustomer(customerData: Omit<Customer, '_id' | 'createdAt'>): Promise<Customer> {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    return res.json();
  },

  async deleteCustomer(id: string): Promise<void> {
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
  },

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${API_URL}/invoices`);
    return res.json();
  },

  async getStudentRecentInvoice(customerId: string): Promise<Invoice | null> {
    const res = await fetch(`${API_URL}/invoices/student-recent/${customerId}`);
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
    await fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE' });
  },

  // --- Dashboard ---
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/dashboard`);
    return res.json();
  }
};