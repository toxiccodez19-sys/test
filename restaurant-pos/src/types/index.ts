export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  currentOrderId?: string;
  x: number;
  y: number;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  status: "pending" | "preparing" | "ready" | "served";
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: "cash" | "card" | "split";
  customerName?: string;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export type PageType =
  | "dashboard"
  | "orders"
  | "menu"
  | "tables"
  | "kitchen"
  | "billing"
  | "reports";
