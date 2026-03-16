import { useState, useCallback } from "react";
import type { MenuItem, Category, Table, Order, OrderItem } from "../types";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Appetizers", icon: "Salad" },
  { id: "cat-2", name: "Main Course", icon: "UtensilsCrossed" },
  { id: "cat-3", name: "Pizza", icon: "Pizza" },
  { id: "cat-4", name: "Burgers", icon: "Beef" },
  { id: "cat-5", name: "Desserts", icon: "IceCreamCone" },
  { id: "cat-6", name: "Beverages", icon: "Coffee" },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: "m-1", name: "Caesar Salad", price: 8.99, category: "cat-1", description: "Fresh romaine lettuce with caesar dressing, croutons & parmesan", available: true },
  { id: "m-2", name: "Garlic Bread", price: 5.49, category: "cat-1", description: "Toasted bread with garlic butter and herbs", available: true },
  { id: "m-3", name: "Bruschetta", price: 7.99, category: "cat-1", description: "Grilled bread topped with tomato, basil & mozzarella", available: true },
  { id: "m-4", name: "Grilled Salmon", price: 18.99, category: "cat-2", description: "Atlantic salmon with lemon butter sauce and vegetables", available: true },
  { id: "m-5", name: "Chicken Parmesan", price: 15.99, category: "cat-2", description: "Breaded chicken with marinara sauce and melted cheese", available: true },
  { id: "m-6", name: "Beef Steak", price: 24.99, category: "cat-2", description: "8oz ribeye steak cooked to perfection", available: true },
  { id: "m-7", name: "Pasta Alfredo", price: 13.99, category: "cat-2", description: "Fettuccine with creamy alfredo sauce", available: true },
  { id: "m-8", name: "Margherita Pizza", price: 12.99, category: "cat-3", description: "Classic pizza with tomato sauce, mozzarella & basil", available: true },
  { id: "m-9", name: "Pepperoni Pizza", price: 14.99, category: "cat-3", description: "Pizza with pepperoni, mozzarella & tomato sauce", available: true },
  { id: "m-10", name: "BBQ Chicken Pizza", price: 15.99, category: "cat-3", description: "BBQ sauce, grilled chicken, red onions & cilantro", available: true },
  { id: "m-11", name: "Classic Burger", price: 11.99, category: "cat-4", description: "Beef patty with lettuce, tomato, onion & pickles", available: true },
  { id: "m-12", name: "Cheese Burger", price: 12.99, category: "cat-4", description: "Classic burger with cheddar cheese", available: true },
  { id: "m-13", name: "Bacon Burger", price: 14.99, category: "cat-4", description: "Burger with crispy bacon and cheddar", available: true },
  { id: "m-14", name: "Chocolate Cake", price: 7.99, category: "cat-5", description: "Rich chocolate layer cake with ganache", available: true },
  { id: "m-15", name: "Tiramisu", price: 8.99, category: "cat-5", description: "Classic Italian coffee-flavored dessert", available: true },
  { id: "m-16", name: "Ice Cream Sundae", price: 6.99, category: "cat-5", description: "Three scoops with whipped cream & toppings", available: true },
  { id: "m-17", name: "Cola", price: 2.99, category: "cat-6", description: "Refreshing cola drink", available: true },
  { id: "m-18", name: "Fresh Juice", price: 4.99, category: "cat-6", description: "Freshly squeezed orange juice", available: true },
  { id: "m-19", name: "Coffee", price: 3.49, category: "cat-6", description: "Freshly brewed house coffee", available: true },
  { id: "m-20", name: "Iced Tea", price: 2.99, category: "cat-6", description: "Chilled tea with lemon", available: true },
];

const DEFAULT_TABLES: Table[] = [
  { id: "t-1", number: 1, seats: 2, status: "available", x: 5, y: 5 },
  { id: "t-2", number: 2, seats: 2, status: "available", x: 25, y: 5 },
  { id: "t-3", number: 3, seats: 4, status: "available", x: 45, y: 5 },
  { id: "t-4", number: 4, seats: 4, status: "available", x: 65, y: 5 },
  { id: "t-5", number: 5, seats: 6, status: "available", x: 5, y: 30 },
  { id: "t-6", number: 6, seats: 6, status: "available", x: 25, y: 30 },
  { id: "t-7", number: 7, seats: 4, status: "available", x: 45, y: 30 },
  { id: "t-8", number: 8, seats: 8, status: "available", x: 65, y: 30 },
  { id: "t-9", number: 9, seats: 2, status: "available", x: 5, y: 55 },
  { id: "t-10", number: 10, seats: 4, status: "available", x: 25, y: 55 },
  { id: "t-11", number: 11, seats: 6, status: "available", x: 45, y: 55 },
  { id: "t-12", number: 12, seats: 8, status: "available", x: 65, y: 55 },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useStore() {
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage("pos-categories", DEFAULT_CATEGORIES)
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() =>
    loadFromStorage("pos-menu-items", DEFAULT_MENU_ITEMS)
  );
  const [tables, setTables] = useState<Table[]>(() =>
    loadFromStorage("pos-tables", DEFAULT_TABLES)
  );
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = loadFromStorage<Order[]>("pos-orders", []);
    return saved.map((o) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      completedAt: o.completedAt ? new Date(o.completedAt) : undefined,
    }));
  });

  const persistCategories = useCallback((cats: Category[]) => {
    setCategories(cats);
    saveToStorage("pos-categories", cats);
  }, []);

  const persistMenuItems = useCallback((items: MenuItem[]) => {
    setMenuItems(items);
    saveToStorage("pos-menu-items", items);
  }, []);

  const persistTables = useCallback((tbls: Table[]) => {
    setTables(tbls);
    saveToStorage("pos-tables", tbls);
  }, []);

  const persistOrders = useCallback((ords: Order[]) => {
    setOrders(ords);
    saveToStorage("pos-orders", ords);
  }, []);

  // Menu operations
  const addMenuItem = useCallback(
    (item: Omit<MenuItem, "id">) => {
      const newItem = { ...item, id: generateId() };
      const updated = [...menuItems, newItem];
      persistMenuItems(updated);
      return newItem;
    },
    [menuItems, persistMenuItems]
  );

  const updateMenuItem = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      const updated = menuItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      persistMenuItems(updated);
    },
    [menuItems, persistMenuItems]
  );

  const deleteMenuItem = useCallback(
    (id: string) => {
      persistMenuItems(menuItems.filter((item) => item.id !== id));
    },
    [menuItems, persistMenuItems]
  );

  // Category operations
  const addCategory = useCallback(
    (cat: Omit<Category, "id">) => {
      const newCat = { ...cat, id: generateId() };
      persistCategories([...categories, newCat]);
      return newCat;
    },
    [categories, persistCategories]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      persistCategories(categories.filter((c) => c.id !== id));
    },
    [categories, persistCategories]
  );

  // Table operations
  const updateTableStatus = useCallback(
    (id: string, status: Table["status"], orderId?: string) => {
      const updated = tables.map((t) =>
        t.id === id
          ? { ...t, status, currentOrderId: orderId ?? t.currentOrderId }
          : t
      );
      persistTables(updated);
    },
    [tables, persistTables]
  );

  // Order operations
  const createOrder = useCallback(
    (tableId: string, tableNumber: number, customerName?: string) => {
      const newOrder: Order = {
        id: generateId(),
        tableId,
        tableNumber,
        items: [],
        status: "active",
        createdAt: new Date(),
        subtotal: 0,
        tax: 0,
        total: 0,
        customerName,
      };
      const updated = [...orders, newOrder];
      persistOrders(updated);
      updateTableStatus(tableId, "occupied", newOrder.id);
      return newOrder;
    },
    [orders, persistOrders, updateTableStatus]
  );

  const addItemToOrder = useCallback(
    (orderId: string, menuItem: MenuItem, quantity: number, notes: string) => {
      const updated = orders.map((order) => {
        if (order.id !== orderId) return order;
        const existingIdx = order.items.findIndex(
          (i) => i.menuItem.id === menuItem.id && i.notes === notes
        );
        let newItems: OrderItem[];
        if (existingIdx >= 0) {
          newItems = order.items.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [
            ...order.items,
            { menuItem, quantity, notes, status: "pending" as const },
          ];
        }
        const subtotal = newItems.reduce(
          (sum, i) => sum + i.menuItem.price * i.quantity,
          0
        );
        const tax = subtotal * 0.08;
        return { ...order, items: newItems, subtotal, tax, total: subtotal + tax };
      });
      persistOrders(updated);
    },
    [orders, persistOrders]
  );

  const removeItemFromOrder = useCallback(
    (orderId: string, itemIndex: number) => {
      const updated = orders.map((order) => {
        if (order.id !== orderId) return order;
        const newItems = order.items.filter((_, idx) => idx !== itemIndex);
        const subtotal = newItems.reduce(
          (sum, i) => sum + i.menuItem.price * i.quantity,
          0
        );
        const tax = subtotal * 0.08;
        return { ...order, items: newItems, subtotal, tax, total: subtotal + tax };
      });
      persistOrders(updated);
    },
    [orders, persistOrders]
  );

  const updateOrderItemStatus = useCallback(
    (orderId: string, itemIndex: number, status: OrderItem["status"]) => {
      const updated = orders.map((order) => {
        if (order.id !== orderId) return order;
        const newItems = order.items.map((item, idx) =>
          idx === itemIndex ? { ...item, status } : item
        );
        return { ...order, items: newItems };
      });
      persistOrders(updated);
    },
    [orders, persistOrders]
  );

  const completeOrder = useCallback(
    (orderId: string, paymentMethod: "cash" | "card" | "split") => {
      let tableId = "";
      const updated = orders.map((order) => {
        if (order.id !== orderId) return order;
        tableId = order.tableId;
        return {
          ...order,
          status: "completed" as const,
          completedAt: new Date(),
          paymentMethod,
        };
      });
      persistOrders(updated);
      if (tableId) {
        updateTableStatus(tableId, "cleaning");
        setTimeout(() => {
          updateTableStatus(tableId, "available");
        }, 3000);
      }
    },
    [orders, persistOrders, updateTableStatus]
  );

  const cancelOrder = useCallback(
    (orderId: string) => {
      let tableId = "";
      const updated = orders.map((order) => {
        if (order.id !== orderId) return order;
        tableId = order.tableId;
        return { ...order, status: "cancelled" as const };
      });
      persistOrders(updated);
      if (tableId) {
        updateTableStatus(tableId, "available");
      }
    },
    [orders, persistOrders, updateTableStatus]
  );

  const activeOrders = orders.filter((o) => o.status === "active");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const todayRevenue = completedOrders
    .filter((o) => {
      const today = new Date();
      const orderDate = new Date(o.completedAt ?? o.createdAt);
      return orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, o) => sum + o.total, 0);

  const todayOrderCount = completedOrders.filter((o) => {
    const today = new Date();
    const orderDate = new Date(o.completedAt ?? o.createdAt);
    return orderDate.toDateString() === today.toDateString();
  }).length;

  return {
    categories,
    menuItems,
    tables,
    orders,
    activeOrders,
    completedOrders,
    todayRevenue,
    todayOrderCount,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
    updateTableStatus,
    createOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateOrderItemStatus,
    completeOrder,
    cancelOrder,
  };
}

export type Store = ReturnType<typeof useStore>;
