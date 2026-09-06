"use client";

import { useEffect, useState } from "react";
import { fetchHealth, ServiceHealth } from "@/lib/api";
import { UtensilsCrossed, Server, Activity, RefreshCw } from "lucide-react";

export default function Header({ onRefresh }: { onRefresh: () => void }) {
  const [health, setHealth] = useState<ServiceHealth>({
    foodService: false,
    orderService: false,
    paymentService: false,
  });
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    const res = await fetchHealth();
    setHealth(res);
    setChecking(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-broken-50/90 backdrop-blur-md border-b border-linen-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-espresso-900 flex items-center justify-center text-broken-50 shadow-warm">
            <UtensilsCrossed className="w-5 h-5 text-caramel-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-espresso-950">
                Artisan Kitchen
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-caramel-500/15 text-caramel-600 border border-caramel-500/25">
                EDA MVP
              </span>
            </div>
            <p className="text-xs text-linen-muted">
              Microservices &bull; Event-Driven &bull; RabbitMQ
            </p>
          </div>
        </div>

        {/* Live Backend Connection Pills */}
        <div className="hidden md:flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              health.foodService
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-broken-200/70 text-linen-muted border-linen-border"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health.foodService ? "bg-emerald-500 animate-pulse" : "bg-linen-muted"
              }`}
            />
            <span>FoodService :5001</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              health.orderService
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-broken-200/70 text-linen-muted border-linen-border"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health.orderService ? "bg-emerald-500 animate-pulse" : "bg-linen-muted"
              }`}
            />
            <span>OrderService :5002</span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              health.paymentService
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-broken-200/70 text-linen-muted border-linen-border"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health.paymentService ? "bg-emerald-500 animate-pulse" : "bg-linen-muted"
              }`}
            />
            <span>PaymentService :5003</span>
          </div>

          <button
            onClick={() => {
              checkStatus();
              onRefresh();
            }}
            disabled={checking}
            title="Refresh Services & Data"
            className="p-2 rounded-lg border border-linen-border text-espresso-900 bg-white hover:bg-broken-200 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-caramel-500"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin text-caramel-500" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
