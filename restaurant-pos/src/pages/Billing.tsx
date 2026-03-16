import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Store } from "@/store";
import type { Order } from "@/types";
import {
  Receipt,
  CreditCard,
  Banknote,
  SplitSquareHorizontal,
  Printer,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingProps {
  store: Store;
}

export function Billing({ store }: BillingProps) {
  const { activeOrders, completeOrder } = store;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const billableOrders = activeOrders.filter((o) => o.items.length > 0);

  function handlePayment(method: "cash" | "card" | "split") {
    if (!selectedOrder) return;
    setCompletedOrder({ ...selectedOrder, paymentMethod: method });
    completeOrder(selectedOrder.id, method);
    setPaymentDialog(false);
    setSelectedOrder(null);
    setReceiptDialog(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
          <p className="text-sm text-gray-500">
            Process payments and generate receipts
          </p>
        </div>
      </div>

      {billableOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Receipt className="h-16 w-16 text-gray-200" />
            <p className="text-lg font-medium text-gray-400">
              No orders ready for billing
            </p>
            <p className="text-sm text-gray-400">
              Active orders with items will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {billableOrders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                "cursor-pointer transition-all hover:border-orange-300 hover:shadow-md",
                selectedOrder?.id === order.id &&
                  "border-orange-400 ring-1 ring-orange-400"
              )}
              onClick={() => setSelectedOrder(order)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Table {order.tableNumber}
                  </CardTitle>
                  <Badge variant="warning">{order.items.length} items</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span className="font-medium">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <p className="text-xs text-gray-400">
                      +{order.items.length - 4} more items
                    </p>
                  )}
                  <div className="mt-3 border-t pt-3">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Tax</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setPaymentDialog(true);
                    }}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Process Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Process Payment - Table{" "}
              {selectedOrder?.tableNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%)</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t pt-2 text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">
                    ${selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Select Payment Method
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex h-24 flex-col gap-2"
                    onClick={() => handlePayment("cash")}
                  >
                    <Banknote className="h-8 w-8 text-emerald-600" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-24 flex-col gap-2"
                    onClick={() => handlePayment("card")}
                  >
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <span>Card</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-24 flex-col gap-2"
                    onClick={() => handlePayment("split")}
                  >
                    <SplitSquareHorizontal className="h-8 w-8 text-purple-600" />
                    <span>Split</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Payment Complete
            </DialogTitle>
          </DialogHeader>
          {completedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold">RestoPOS</h3>
                  <p className="text-xs text-gray-500">
                    Thank you for dining with us!
                  </p>
                </div>
                <div className="my-4 border-t border-dashed" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Table</span>
                    <span>{completedOrder.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="capitalize">
                      {completedOrder.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="my-4 border-t border-dashed" />
                <div className="space-y-1 text-sm">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="my-4 border-t border-dashed" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${completedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${completedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>${completedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
