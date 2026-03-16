import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Store } from "@/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
} from "lucide-react";

interface ReportsProps {
  store: Store;
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#eab308", "#ec4899"];

export function Reports({ store }: ReportsProps) {
  const { completedOrders, menuItems, categories } = store;
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("all");

  const now = new Date();

  function filterByPeriod<T extends { createdAt: Date }>(items: T[]): T[] {
    return items.filter((item) => {
      const d = new Date(item.createdAt);
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (period === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  const filteredCompleted = filterByPeriod(completedOrders);
  const totalRevenue = filteredCompleted.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredCompleted.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems = filteredCompleted.reduce(
    (s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  // Daily revenue chart
  const dailyMap = new Map<string, number>();
  filteredCompleted.forEach((order) => {
    const key = new Date(order.completedAt ?? order.createdAt).toLocaleDateString();
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + order.total);
  });
  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Category breakdown
  const catBreakdown = categories.map((cat) => {
    const catItemIds = new Set(
      menuItems.filter((m) => m.category === cat.id).map((m) => m.id)
    );
    const revenue = filteredCompleted.reduce(
      (sum, order) =>
        sum +
        order.items
          .filter((i) => catItemIds.has(i.menuItem.id))
          .reduce((s, i) => s + i.menuItem.price * i.quantity, 0),
      0
    );
    const qty = filteredCompleted.reduce(
      (sum, order) =>
        sum +
        order.items
          .filter((i) => catItemIds.has(i.menuItem.id))
          .reduce((s, i) => s + i.quantity, 0),
      0
    );
    return { name: cat.name, revenue: Math.round(revenue * 100) / 100, quantity: qty };
  }).filter((c) => c.revenue > 0);

  // Top items
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  filteredCompleted.forEach((order) => {
    order.items.forEach((item) => {
      const existing = itemMap.get(item.menuItem.id) ?? {
        name: item.menuItem.name,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.menuItem.price * item.quantity;
      itemMap.set(item.menuItem.id, existing);
    });
  });
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  filteredCompleted.forEach((o) => {
    const method = o.paymentMethod ?? "unknown";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + 1;
  });
  const paymentData = Object.entries(paymentBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500">
            Sales analytics and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month", "all"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Order</p>
              <p className="text-2xl font-bold">${avgOrder.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Items Sold</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: "#f97316" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No revenue data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {catBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      dataKey="revenue"
                      paddingAngle={2}
                    >
                      {catBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                    <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No payment data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
