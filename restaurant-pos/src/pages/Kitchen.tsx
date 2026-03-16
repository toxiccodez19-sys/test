import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Store } from "@/store";
import { ChefHat, Clock, CheckCircle, ArrowRight } from "lucide-react";

interface KitchenProps {
  store: Store;
}

export function Kitchen({ store }: KitchenProps) {
  const { activeOrders, updateOrderItemStatus, startAllOrderItems } = store;

  const pendingOrders = activeOrders.filter((o) =>
    o.items.some((i) => i.status === "pending")
  );
  const preparingOrders = activeOrders.filter((o) =>
    o.items.some((i) => i.status === "preparing")
  );
  const readyOrders = activeOrders.filter((o) =>
    o.items.some((i) => i.status === "ready")
  );

  function getElapsedTime(date: Date): string {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Kitchen Display
            </h2>
            <p className="text-sm text-gray-500">
              Manage order preparation in real time
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            Pending: {pendingOrders.length}
          </Badge>
          <Badge variant="warning" className="px-3 py-1.5 text-sm">
            Preparing: {preparingOrders.length}
          </Badge>
          <Badge variant="success" className="px-3 py-1.5 text-sm">
            Ready: {readyOrders.length}
          </Badge>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <ChefHat className="h-16 w-16 text-gray-200" />
            <p className="text-lg font-medium text-gray-400">
              No active orders
            </p>
            <p className="text-sm text-gray-400">
              Orders will appear here when customers place them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeOrders.map((order) => {
            const hasPending = order.items.some((i) => i.status === "pending");
            const hasPreparing = order.items.some(
              (i) => i.status === "preparing"
            );
            const allReady = order.items.every(
              (i) => i.status === "ready" || i.status === "served"
            );

            return (
              <Card
                key={order.id}
                className={
                  allReady
                    ? "border-emerald-300 bg-emerald-50"
                    : hasPreparing
                    ? "border-amber-300 bg-amber-50"
                    : "border-orange-200"
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Table {order.tableNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {getElapsedTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">
                            {item.quantity}
                          </span>
                          <span className="font-medium text-sm">
                            {item.menuItem.name}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="ml-8 mt-1 text-xs text-orange-600">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <div>
                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() =>
                              updateOrderItemStatus(
                                order.id,
                                idx,
                                "preparing"
                              )
                            }
                          >
                            Start
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        )}
                        {item.status === "preparing" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              updateOrderItemStatus(order.id, idx, "ready")
                            }
                          >
                            Ready
                            <CheckCircle className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        )}
                        {item.status === "ready" && (
                          <Badge variant="success">Ready to serve</Badge>
                        )}
                        {item.status === "served" && (
                          <Badge variant="info">Served</Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {allReady && order.items.length > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-100 p-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">
                        All items ready!
                      </span>
                    </div>
                  )}

                  {hasPending && !hasPreparing && (
                    <Button
                      className="mt-2 w-full"
                      variant="warning"
                      onClick={() => startAllOrderItems(order.id)}
                    >
                      Start All Items
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
