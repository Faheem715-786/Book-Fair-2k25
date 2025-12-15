import { Product, Invoice, Customer, InvoiceItem } from '../types';

// Initial Dummy Data
const INITIAL_PRODUCTS: Product[] = [
  { _id: '1', name: 'Premium Notebook A5', sku: 'NB-001', price: 1250, stock: 45, category: 'Paper', createdAt: new Date().toISOString() },
  { _id: '2', name: 'Gel Pen Blue (Pack of 10)', sku: 'PEN-BL-10', price: 899, stock: 120, category: 'Writing', createdAt: new Date().toISOString() },
  { _id: '3', name: 'Stapler Heavy Duty', sku: 'STP-HD', price: 1500, stock: 15, category: 'Desk', createdAt: new Date().toISOString() },
  { _id: '4', name: 'A4 Printer Paper (500 sheets)', sku: 'PPR-A4', price: 650, stock: 200, category: 'Paper', createdAt: new Date().toISOString() },
  { _id: '5', name: 'Correction Tape', sku: 'COR-TP', price: 250, stock: 5, category: 'Writing', createdAt: new Date().toISOString() },
  { _id: '6', name: 'Sticky Notes Neon', sku: 'STK-NEO', price: 300, stock: 80, category: 'Paper', createdAt: new Date().toISOString() },
  { _id: '7', name: 'File Folder (Set of 5)', sku: 'FL-SET', price: 550, stock: 60, category: 'Organization', createdAt: new Date().toISOString() },
  { _id: '8', name: 'Whiteboard Marker Black', sku: 'WB-BLK', price: 150, stock: 300, category: 'Writing', createdAt: new Date().toISOString() },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { _id: 'c1', name: 'Rahul Sharma', adNo: '1001', studentClass: '10 A', createdAt: new Date().toISOString() },
  { _id: 'c2', name: 'Priya Patel', adNo: '1002', studentClass: '10 A', createdAt: new Date().toISOString() },
  { _id: 'c3', name: 'Amit Kumar', adNo: '1003', studentClass: '9 B', createdAt: new Date().toISOString() },
  { _id: 'c4', name: 'Sarah Khan', adNo: '1004', studentClass: '11 Sci', createdAt: new Date().toISOString() },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    _id: '101',
    number: 'INV-2025-001',
    customer: INITIAL_CUSTOMERS[0],
    subtotal: 2149,
    tax: 0,
    total: 2149,
    notes: 'Walk-in customer',
    items: [
      { product: '1', name: 'Premium Notebook A5', qty: 1, price: 1250, amount: 1250 },
      { product: '2', name: 'Gel Pen Blue', qty: 1, price: 899, amount: 899 }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: 'paid'
  }
];

class MockDbService {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private invoices: Invoice[] = [...INITIAL_INVOICES];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];

  async getProducts(): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.products];
  }

  // --- Customer Methods ---
  async getCustomers(): Promise<Customer[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.customers];
  }

  async addCustomer(customerData: Omit<Customer, '_id' | 'createdAt'>): Promise<Customer> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newCustomer = {
      ...customerData,
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.customers = this.customers.filter(c => c._id !== id);
  }

  // --- Invoice Methods ---
  async getInvoices(): Promise<Invoice[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStudentRecentInvoice(customerId: string): Promise<Invoice | undefined> {
    // Find an invoice from today for this student
    const today = new Date().toISOString().split('T')[0];
    return this.invoices.find(inv => 
      inv.customer?._id === customerId && 
      inv.createdAt.startsWith(today)
    );
  }

  async createInvoice(invoiceData: Omit<Invoice, '_id' | 'createdAt' | 'number'>): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const newInvoice: Invoice = {
      ...invoiceData,
      tax: 0, // No Tax
      total: invoiceData.subtotal, // Total = Subtotal
      _id: Math.random().toString(36).substr(2, 9),
      number: `INV-2025-${(this.invoices.length + 1).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };

    // Decrement stock
    this.decrementStock(invoiceData.items);

    this.invoices.push(newInvoice);
    return newInvoice;
  }

  async addToInvoice(invoiceId: string, newItems: InvoiceItem[]): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.invoices.findIndex(inv => inv._id === invoiceId);
    if (index === -1) throw new Error("Invoice not found");

    const invoice = this.invoices[index];
    
    // Merge logic
    const updatedItems = [...invoice.items];
    newItems.forEach(newItem => {
      const existingItemIndex = updatedItems.findIndex(i => i.product === newItem.product);
      if (existingItemIndex > -1) {
        updatedItems[existingItemIndex].qty += newItem.qty;
        updatedItems[existingItemIndex].amount += newItem.amount;
      } else {
        updatedItems.push(newItem);
      }
    });

    const addedSubtotal = newItems.reduce((acc, item) => acc + item.amount, 0);
    
    const updatedInvoice = {
      ...invoice,
      items: updatedItems,
      subtotal: invoice.subtotal + addedSubtotal,
      total: invoice.total + addedSubtotal, // No tax
      notes: invoice.notes + ` (Updated: added ${newItems.length} items)`
    };

    this.decrementStock(newItems);
    this.invoices[index] = updatedInvoice;
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.invoices = this.invoices.filter(i => i._id !== id);
  }

  private decrementStock(items: InvoiceItem[]) {
    items.forEach(item => {
      const productIndex = this.products.findIndex(p => p._id === item.product);
      if (productIndex > -1) {
        this.products[productIndex].stock -= item.qty;
      }
    });
  }

  async updateProductStock(id: string, newStock: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.products.findIndex(p => p._id === id);
    if (index > -1) {
      this.products[index].stock = newStock;
    }
  }

  async getDashboardStats() {
    await new Promise(resolve => setTimeout(resolve, 400));
    const today = new Date().toISOString().split('T')[0];
    
    const todaySales = this.invoices
      .filter(inv => inv.createdAt.startsWith(today))
      .reduce((acc, curr) => acc + curr.total, 0);

    const lowStockCount = this.products.filter(p => p.stock < 10).length;

    return {
      todaySales,
      invoiceCount: this.invoices.length,
      productCount: this.products.length,
      lowStockCount
    };
  }
}

export const dbService = new MockDbService();