"use client";

import { useState } from "react";
import { FoodItem, OrderItem, createOrder } from "@/lib/api";
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  Trash2,
} from "lucide-react";

interface OrderDrawerProps {
  selectedFood: FoodItem | null;
  onClearSelected: () => void;
  orders: OrderItem[];
  onOpenVerifyModal: (orderId: string, amount: number, foodName: string) => void;
  onOrderCreated: () => void;
}

export default function OrderDrawer({
  selectedFood,
  onClearSelected,
  orders,
  onOpenVerifyModal,
  onOrderCreated,
}: OrderDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [quickCode, setQuickCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!selectedFood) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const order = await createOrder(selectedFood.id, quantity, quickCode.trim() || undefined);
      onOrderCreated();
      onClearSelected();
      setQuantity(1);
      setQuickCode("");

      // If user did not provide "123" upfront, automatically trigger the verification modal
      if (quickCode.trim() !== "123") {
        onOpenVerifyModal(order.id, order.totalPrice, order.foodName);
      }
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <aside className="space-y-6">
      {/* Checkout / Active Selection Card */}
      <div className="rounded-2xl bg-white p-6 border border-linen-border shadow-warm">
        <div className="flex items-center justify-between pb-4 border-b border-linen-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-broken-100 flex items-center justify-center text-espresso-900">
              <ShoppingBag className="w-4 h-4 text-caramel-500" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso-950">Place Order</h3>
          </div>
          {selectedFood && (
            <button
              onClick={onClearSelected}
              className="text-xs text-linen-muted hover:text-rose-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {selectedFood ? (
          <div className="mt-5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-espresso-950 block">{selectedFood.name}</span>
              <span className="text-sm font-serif font-bold text-caramel-600">
                ${selectedFood.price.toFixed(2)} each
              </span>
            </div>

            {/* Quantity Controller */}
            <div className="flex items-center justify-between py-2 border-y border-linen-border/70">
              <span className="text-xs font-semibold text-linen-muted uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-linen-border flex items-center justify-center text-espresso-900 hover:bg-broken-100 transition active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-espresso-950">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg border border-linen-border flex items-center justify-center text-espresso-900 hover:bg-broken-100 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-espresso-950">Total Amount</span>
              <span className="font-serif text-2xl font-bold text-espresso-950">
                ${(selectedFood.price * quantity).toFixed(2)}
              </span>
            </div>

            {/* Optional Immediate Verification Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-espresso-950">
                  Verification Code (Optional)
                </label>
                <span className="text-xs text-caramel-600 font-semibold">Enter 123</span>
              </div>
              <input
                type="text"
                placeholder="Leave blank or enter 123"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-linen-border bg-broken-50/50 text-xs text-espresso-950 focus:outline-none focus:ring-2 focus:ring-caramel-500 transition"
              />
              <p className="text-xs text-linen-muted mt-1">
                If left empty, order starts in <strong>PaymentPending</strong>.
              </p>
            </div>

            {orderError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                {orderError}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-espresso-900 text-broken-50 text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition shadow-warm disabled:opacity-50"
            >
              {placing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-caramel-400" />
                  <span>Submitting to OrderService...</span>
                </>
              ) : (
                <>
                  <span>Dispatch Order</span>
                  <ArrowRight className="w-4 h-4 text-caramel-400" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center py-6">
            <p className="text-sm text-linen-muted">
              Select any dish from the Artisan Menu on the left to start an order.
            </p>
          </div>
        )}
      </div>

      {/* Orders List & Eventual Consistency Hub */}
      <div className="rounded-2xl bg-white p-6 border border-linen-border shadow-warm">
        <div className="flex items-center justify-between pb-4 border-b border-linen-border">
          <h3 className="font-serif text-lg font-bold text-espresso-950">Recent Orders</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-broken-200 text-linen-muted font-semibold">
            {orders.length} in DB
          </span>
        </div>

        <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {orders.length === 0 ? (
            <p className="text-xs text-linen-muted text-center py-6">No orders placed yet.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-xl border border-linen-border/80 bg-broken-50/50 flex flex-col gap-2 hover:border-caramel-400/40 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-espresso-950">
                    {order.foodName} &times; {order.quantity}
                  </span>
                  <span className="font-bold text-xs text-espresso-950">
                    ${order.totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Status Badge */}
                  {order.status === "Paid" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Paid</span>
                    </span>
                  )}
                  {order.status === "PaymentPending" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      <span>Payment Pending</span>
                    </span>
                  )}
                  {order.status === "PaymentFailed" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      <span>Payment Failed</span>
                    </span>
                  )}

                  {/* Verification CTA for Pending Orders */}
                  {order.status === "PaymentPending" && (
                    <button
                      onClick={() => onOpenVerifyModal(order.id, order.totalPrice, order.foodName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-caramel-500 hover:bg-caramel-600 text-white text-xs font-semibold transition active:scale-95 shadow-sm"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Enter 123</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
