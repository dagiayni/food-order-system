"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import FoodCatalog from "@/components/FoodCatalog";
import OrderDrawer from "@/components/OrderDrawer";
import EventTimeline from "@/components/EventTimeline";
import CreateFoodModal from "@/components/CreateFoodModal";
import PaymentVerificationModal from "@/components/PaymentVerificationModal";
import { FoodItem, OrderItem, getFoods, getOrders } from "@/lib/api";
import { Sparkles, ShieldCheck, Cpu } from "lucide-react";

export default function Home() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [verifyModalData, setVerifyModalData] = useState<{
    isOpen: boolean;
    orderId: string | null;
    amount: number;
    foodName: string;
  }>({
    isOpen: false,
    orderId: null,
    amount: 0,
    foodName: "",
  });

  const loadData = async () => {
    const [foodList, orderList] = await Promise.all([getFoods(), getOrders()]);
    setFoods(foodList);
    setOrders(orderList);

    // Default select Cheese Burger if nothing selected yet
    if (!selectedFood && foodList.length > 0) {
      setSelectedFood(foodList[0]);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openVerifyModal = (orderId: string, amount: number, foodName: string) => {
    setVerifyModalData({
      isOpen: true,
      orderId,
      amount,
      foodName,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header onRefresh={loadData} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-espresso-950 text-broken-50 p-8 sm:p-10 shadow-warmLg border border-espresso-800">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-caramel-500/20 text-caramel-400 text-xs font-semibold border border-caramel-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>UI-UX Pro Max Design System</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-broken-50 leading-tight">
                Artisan Dining, Powered by Event-Driven Microservices.
              </h1>
              <p className="text-sm sm:text-base text-broken-200/80 leading-relaxed max-w-2xl">
                Experience independent services collaborating through RabbitMQ. Create foods, place orders, and verify payments using code <strong className="text-caramel-400 font-bold underline">123</strong> to experience eventual consistency in real time.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-broken-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Isolated PostgreSQL Databases</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-caramel-400" />
                  <span>MassTransit Asynchronous Highway</span>
                </span>
              </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-caramel-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 -mb-20 w-80 h-80 rounded-full bg-cocoa-500/10 blur-3xl pointer-events-none" />
          </section>

          {/* Main Grid: Menu on Left, Checkout & Active Orders on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <FoodCatalog
                foods={foods}
                onSelectForOrder={(food) => setSelectedFood(food)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onRefresh={loadData}
              />
            </div>

            <div className="lg:col-span-4 sticky top-28">
              <OrderDrawer
                selectedFood={selectedFood}
                onClearSelected={() => setSelectedFood(null)}
                orders={orders}
                onOpenVerifyModal={openVerifyModal}
                onOrderCreated={loadData}
              />
            </div>
          </div>

          {/* Event Timeline Monitor */}
          <EventTimeline />
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-linen-border bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-linen-muted flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Artisan Kitchen &bull; Food Ordering System Microservices Architecture</p>
          <p>Palette: Warm Espresso &amp; Broken White &bull; Developed with UI-UX Pro Max</p>
        </div>
      </footer>

      {/* Modals */}
      <CreateFoodModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />

      <PaymentVerificationModal
        isOpen={verifyModalData.isOpen}
        orderId={verifyModalData.orderId}
        amount={verifyModalData.amount}
        foodName={verifyModalData.foodName}
        onClose={() =>
          setVerifyModalData({ isOpen: false, orderId: null, amount: 0, foodName: "" })
        }
        onSuccess={loadData}
      />
    </div>
  );
}
