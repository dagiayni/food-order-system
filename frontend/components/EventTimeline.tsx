"use client";

import { Activity, ArrowRight, Database, Send, Radio } from "lucide-react";

export default function EventTimeline() {
  const steps = [
    {
      step: 1,
      title: "FoodCreated",
      sender: "FoodService (:5001)",
      receiver: "OrderService (:5002)",
      desc: "Updates local food_catalog_projection table without cross-service SQL joins.",
      type: "Event",
    },
    {
      step: 2,
      title: "CreateOrder",
      sender: "Client / Next.js",
      receiver: "OrderService (:5002)",
      desc: "Validates against projection, records order in order_db with status PaymentPending.",
      type: "Command",
    },
    {
      step: 3,
      title: "RequestPayment",
      sender: "OrderService (:5002)",
      receiver: "PaymentService (:5003)",
      desc: "Delivered to payment-service queue in RabbitMQ. Awaits verification code 123.",
      type: "Command",
    },
    {
      step: 4,
      title: "PaymentSucceeded",
      sender: "PaymentService (:5003)",
      receiver: "OrderService (:5002)",
      desc: "Published when code 123 is verified. Stored in payment_db.",
      type: "Event",
    },
    {
      step: 5,
      title: "OrderPaid",
      sender: "OrderService (:5002)",
      receiver: "Subscribers",
      desc: "Order status updated to Paid in order_db. Eventual consistency reached!",
      type: "Event",
    },
  ];

  return (
    <section className="rounded-2xl bg-white p-6 sm:p-8 border border-linen-border shadow-warm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-linen-border">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-caramel-500 animate-pulse" />
            <h2 className="font-serif text-xl font-bold text-espresso-950">
              RabbitMQ Event & Command Highway
            </h2>
          </div>
          <p className="text-sm text-linen-muted mt-1">
            How independent microservices synchronize state and guarantee eventual consistency.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-broken-100 text-espresso-950 border border-linen-border">
            <Database className="w-3.5 h-3.5 text-cocoa-600" />
            <span>Database-per-Service</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-broken-100 text-espresso-950 border border-linen-border">
            <Send className="w-3.5 h-3.5 text-caramel-500" />
            <span>MassTransit Bus</span>
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((s) => (
          <div
            key={s.step}
            className="p-4 rounded-xl border border-linen-border/70 bg-broken-50/40 hover:border-caramel-400/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-espresso-900 text-broken-50 text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    s.type === "Command"
                      ? "bg-amber-100/70 text-amber-900 border border-amber-300/40"
                      : "bg-emerald-100/70 text-emerald-900 border border-emerald-300/40"
                  }`}
                >
                  {s.type}
                </span>
              </div>

              <h4 className="font-serif font-bold text-sm text-espresso-950">{s.title}</h4>
              <p className="text-[11px] text-linen-muted mt-1 leading-relaxed">{s.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-linen-border/50 text-[10px] text-espresso-950 font-medium space-y-0.5">
              <div>
                <span className="text-linen-muted">From:</span> {s.sender}
              </div>
              <div>
                <span className="text-linen-muted">To:</span> {s.receiver}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
