export interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number; // in cents
  stock: number;
  category: string;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  adNo: string;      // Changed from phone
  studentClass: string; // Changed from email
  createdAt: string;
}

export interface InvoiceItem {
  product: string; // Product ID
  name: string;
  qty: number;
  price: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  number: string;
  customer?: Customer;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  items: InvoiceItem[];
  createdAt: string;
  status: 'paid' | 'pending';
}

export interface CartItem extends Product {
  cartQty: number;
}