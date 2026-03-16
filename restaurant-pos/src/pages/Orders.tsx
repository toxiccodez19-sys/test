import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Store } from "@/store";
import type { MenuItem, Order } from "@/types";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdersProps {
  store: Store;
}

export function Orders({ store }: OrdersProps) {
  const {
    categories,
    menuItems,
    activeOrders,
    completedOrders,
    orders,
    addItemToOrder,
    removeItemFromOrder,
    cancelOrder,
  } = store;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedMenuCategory, setSelectedMenuCategory] = useState("all");
  const [itemNotes, setItemNotes] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  // Keep selectedOrder in sync
  const currentOrder = selectedOrder
    ? orders.find((o) => o.id === selectedOrder.id) ?? null
    : null;

  function handleAddItem(item: MenuItem) {
    if (!currentOrder) return;
    addItemToOrder(currentOrder.id, item, itemQuantity, itemNotes);
    setItemNotes("");
    setItemQuantity(1);
  }

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.available) return false;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(menuSearch.toLowerCase());
    const matchesCat =
      selectedMenuCategory === "all" ||
      item.category === selectedMenuCategory;
    return matchesSearch && matchesCat;
  });

  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-500">
            View and manage all restaurant orders
          </p>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Orders List */}
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      No active orders. Create one from the Tables page.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-orange-300",
                      currentOrder?.id === order.id &&
                        "border-orange-400 ring-1 ring-orange-400"
                    )}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                            <span className="text-sm font-bold text-orange-700">
                              T{order.tableNumber}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold">
                              Table {order.tableNumber}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleTimeString()}
                              <span>
                                &middot; {order.items.length} items
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${order.total.toFixed(2)}
                          </p>
                          <Badge variant="warning">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Order Detail */}
            {currentOrder && currentOrder.status === "active" && (
              <Card className="sticky top-4">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Order - Table {currentOrder.tableNumber}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsAddItemDialogOpen(true)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {currentOrder.items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                      No items in this order yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.menuItem.name}
                              </span>
                              <Badge
                                variant={
                                  item.status === "pending"
                                    ? "secondary"
                                    : item.status === "preparing"
                                    ? "warning"
                                    : item.status === "ready"
                                    ? "success"
                                    : "info"
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                            {item.notes && (
                              <p className="mt-1 text-xs text-gray-500">
                                Note: {item.notes}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-gray-600">
                              ${item.menuItem.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              $
                              {(item.menuItem.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                removeItemFromOrder(currentOrder.id, idx)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Summary */}
                  {currentOrder.items.length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>${currentOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax (8%)</span>
                        <span>${currentOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span>${currentOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        cancelOrder(currentOrder.id);
                        setSelectedOrder(null);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-3">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <CheckCircle className="h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    No completed orders yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Table {order.tableNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()} &middot;{" "}
                          {order.items.length} items &middot; Paid by{" "}
                          {order.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">
                          ${order.total.toFixed(2)}
                        </span>
                        <Badge variant="success">Completed</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="space-y-3">
            {cancelledOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <XCircle className="h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-400">
                    No cancelled orders
                  </p>
                </CardContent>
              </Card>
            ) : (
              cancelledOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Table {order.tableNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()} &middot;{" "}
                          {order.items.length} items
                        </p>
                      </div>
                      <Badge variant="destructive">Cancelled</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Items to Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search menu..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedMenuCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedMenuCategory("all")}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={
                    selectedMenuCategory === cat.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedMenuCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Menu items list */}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-orange-600">
                      ${item.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          setItemQuantity(Math.max(1, itemQuantity - 1))
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {itemQuantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => handleAddItem(item)}>
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Textarea
                placeholder="Special notes for this item..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddItemDialogOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
