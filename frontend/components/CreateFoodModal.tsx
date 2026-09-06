"use client";

import { useState } from "react";
import { createFood } from "@/lib/api";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";

interface CreateFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateFoodModal({ isOpen, onClose, onCreated }: CreateFoodModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("9.50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numPrice = parseFloat(price);
    if (!name.trim()) {
      setError("Please enter a dish name.");
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Please enter a valid price greater than $0.");
      return;
    }

    setLoading(true);
    try {
      await createFood(name.trim(), description.trim(), numPrice);
      setName("");
      setDescription("");
      setPrice("9.50");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create food item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-warmLg border border-linen-border overflow-hidden p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-linen-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-broken-100 flex items-center justify-center text-caramel-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-espresso-950">Add Artisan Dish</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-linen-muted hover:bg-broken-100 hover:text-espresso-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-espresso-950 uppercase tracking-wider mb-1.5">
              Dish Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Truffle Fries, Smoked Ribs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-linen-border bg-broken-50/50 text-espresso-950 text-sm focus:outline-none focus:ring-2 focus:ring-caramel-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso-950 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Flavor notes, ingredients..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-linen-border bg-broken-50/50 text-espresso-950 text-sm focus:outline-none focus:ring-2 focus:ring-caramel-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso-950 uppercase tracking-wider mb-1.5">
              Price (USD) *
            </label>
            <input
              type="number"
              step="0.10"
              min="0.10"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-linen-border bg-broken-50/50 text-espresso-950 text-sm focus:outline-none focus:ring-2 focus:ring-caramel-500 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-linen-border text-sm font-semibold text-linen-muted hover:bg-broken-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-espresso-900 text-broken-50 text-sm font-semibold hover:bg-espresso-800 active:scale-95 transition shadow-warm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-caramel-400" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-caramel-400" />
                  <span>Publish to Catalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
