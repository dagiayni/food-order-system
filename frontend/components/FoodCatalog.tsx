"use client";

import { useState } from "react";
import { FoodItem, toggleFoodAvailability } from "@/lib/api";
import { Plus, Check, ShoppingBag, ToggleLeft, ToggleRight, Sparkles, ChefHat } from "lucide-react";

interface FoodCatalogProps {
  foods: FoodItem[];
  onSelectForOrder: (food: FoodItem) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
}

export default function FoodCatalog({
  foods,
  onSelectForOrder,
  onOpenCreateModal,
  onRefresh,
}: FoodCatalogProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleAvailability = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(id);
    try {
      await toggleFoodAvailability(id, !currentStatus);
      onRefresh();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-espresso-950">Artisan Menu</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-broken-200 text-espresso-800 font-semibold border border-linen-border">
              {foods.length} Dishes
            </span>
          </div>
          <p className="text-sm text-linen-muted mt-1">
            Managed by FoodService with automatic event broadcast to RabbitMQ.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-espresso-900 text-broken-50 text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition shadow-warm focus-visible:ring-2 focus-visible:ring-caramel-500"
        >
          <Plus className="w-4 h-4 text-caramel-400" />
          <span>New Dish</span>
        </button>
      </div>

      {/* Grid of Food Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {foods.map((food) => (
          <div
            key={food.id}
            className={`group relative rounded-2xl bg-white p-6 border transition-all duration-200 flex flex-col justify-between ${
              food.isAvailable
                ? "border-linen-border hover:border-caramel-400/60 shadow-warm hover:shadow-warmLg"
                : "border-linen-border/60 bg-broken-50/70 opacity-75"
            }`}
          >
            {/* Demo badge for Cheese Burger */}
            {food.name.toLowerCase().includes("burger") && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-caramel-500/15 text-caramel-600 text-xs font-semibold border border-caramel-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Demo Item</span>
              </div>
            )}

            <div>
              <div className="w-10 h-10 rounded-xl bg-broken-100 flex items-center justify-center text-espresso-900 mb-4 border border-linen-border">
                <ChefHat className="w-5 h-5 text-cocoa-600" />
              </div>

              <h3 className="font-serif text-lg font-bold text-espresso-950 group-hover:text-cocoa-700 transition-colors">
                {food.name}
              </h3>
              <p className="text-sm text-linen-muted mt-1.5 line-clamp-2 leading-relaxed">
                {food.description || "Freshly crafted using signature seasonal ingredients."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-linen-border/70 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-linen-muted uppercase tracking-wider block">Price</span>
                <span className="font-serif text-xl font-bold text-espresso-950">
                  ${food.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Availability Toggle */}
                <button
                  onClick={(e) => handleToggleAvailability(food.id, food.isAvailable, e)}
                  disabled={togglingId === food.id}
                  title={food.isAvailable ? "Set to Unavailable" : "Set to Available"}
                  className="p-1.5 rounded-lg border border-linen-border hover:bg-broken-100 text-linen-muted transition"
                >
                  {food.isAvailable ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-linen-muted" />
                  )}
                </button>

                {/* Order CTA */}
                <button
                  onClick={() => onSelectForOrder(food)}
                  disabled={!food.isAvailable}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    food.isAvailable
                      ? "bg-caramel-500 hover:bg-caramel-600 text-white shadow-sm active:scale-95"
                      : "bg-broken-200 text-linen-muted cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{food.isAvailable ? "Order" : "Sold Out"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
