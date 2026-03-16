import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Store } from "@/store";
import type { PageType } from "@/types";
import { Users, Clock, Utensils, SprayCan } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableManagementProps {
  store: Store;
  onNavigate: (page: PageType) => void;
}

const statusConfig = {
  available: {
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    badge: "success" as const,
    icon: Utensils,
    label: "Available",
  },
  occupied: {
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    badge: "warning" as const,
    icon: Users,
    label: "Occupied",
  },
  reserved: {
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    badge: "info" as const,
    icon: Clock,
    label: "Reserved",
  },
  cleaning: {
    color: "bg-gray-50 border-gray-200",
    badge: "secondary" as const,
    icon: SprayCan,
    label: "Cleaning",
  },
};

export function TableManagement({ store, onNavigate }: TableManagementProps) {
  const { tables, orders, updateTableStatus, createOrder } = store;

  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const reservedCount = tables.filter((t) => t.status === "reserved").length;

  function handleTableClick(tableId: string, tableNumber: number, status: string) {
    if (status === "available") {
      createOrder(tableId, tableNumber);
      onNavigate("orders");
    } else if (status === "occupied") {
      onNavigate("orders");
    } else if (status === "reserved") {
      createOrder(tableId, tableNumber);
      onNavigate("orders");
    }
  }

  function getTableOrder(tableId: string) {
    return orders.find(
      (o) => o.tableId === tableId && o.status === "active"
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
          <p className="text-sm text-gray-500">
            Manage restaurant floor plan and table status
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Utensils className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{availableCount}</p>
              <p className="text-xs text-emerald-600">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-700">{occupiedCount}</p>
              <p className="text-xs text-orange-600">Occupied</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{reservedCount}</p>
              <p className="text-xs text-blue-600">Reserved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <span className="text-lg font-bold text-gray-700">{tables.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Tables</p>
              <p className="text-xs text-gray-500">
                {tables.reduce((s, t) => s + t.seats, 0)} total seats
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restaurant Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {tables.map((table) => {
              const config = statusConfig[table.status];
              const StatusIcon = config.icon;
              const activeOrder = getTableOrder(table.id);
              const timeSinceOrder = activeOrder
                ? Math.floor(
                    (Date.now() - new Date(activeOrder.createdAt).getTime()) /
                      60000
                  )
                : null;

              return (
                <button
                  key={table.id}
                  onClick={() =>
                    handleTableClick(table.id, table.number, table.status)
                  }
                  disabled={table.status === "cleaning"}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all",
                    config.color,
                    table.status === "cleaning"
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-xl font-bold text-gray-800">
                      T{table.number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{table.seats} seats</p>
                  <Badge variant={config.badge}>{config.label}</Badge>
                  {timeSinceOrder !== null && (
                    <p className="text-xs text-gray-500">{timeSinceOrder}m ago</p>
                  )}
                  {activeOrder && (
                    <p className="text-xs font-semibold text-orange-600">
                      ${activeOrder.total.toFixed(2)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tables
            .filter((t) => t.status === "occupied")
            .map((table) => (
              <Button
                key={table.id}
                variant="outline"
                size="sm"
                onClick={() => updateTableStatus(table.id, "cleaning")}
              >
                <SprayCan className="mr-1 h-3.5 w-3.5" />
                Clear Table {table.number}
              </Button>
            ))}
          {tables
            .filter((t) => t.status === "cleaning")
            .map((table) => (
              <Button
                key={table.id}
                variant="outline"
                size="sm"
                onClick={() => updateTableStatus(table.id, "available")}
              >
                Mark Table {table.number} Ready
              </Button>
            ))}
          {tables.filter(
            (t) => t.status === "occupied" || t.status === "cleaning"
          ).length === 0 && (
            <p className="text-sm text-gray-400">
              No occupied tables to manage
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
