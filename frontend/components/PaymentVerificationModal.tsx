"use client";

import { useState } from "react";
import { verifyOrderPayment } from "@/lib/api";
import { X, KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface PaymentVerificationModalProps {
  orderId: string | null;
  amount: number;
  foodName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentVerificationModal({
  orderId,
  amount,
  foodName,
  isOpen,
  onClose,
  onSuccess,
}: PaymentVerificationModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen || !orderId) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!code.trim()) {
      setFeedback({ type: "error", message: "Please enter the verification code." });
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOrderPayment(orderId, code.trim());
      if (res.success && code.trim() === "123") {
        setFeedback({
          type: "success",
          message: "Payment verified successfully with code 123! Order status updated to Paid.",
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: "error",
          message: res.message || `Verification code '${code}' is invalid. Enter '123' to approve payment.`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to communicate with payment service.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-warmLg border border-linen-border overflow-hidden p-6 sm:p-7">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-linen-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-caramel-500/15 flex items-center justify-center text-caramel-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-950">
                Payment Verification
              </h3>
              <p className="text-xs text-linen-muted">Order ID: {orderId.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-linen-muted hover:bg-broken-100 hover:text-espresso-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Preview */}
        <div className="mt-4 p-4 rounded-xl bg-broken-50 border border-linen-border/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-espresso-950 block">{foodName}</span>
            <span className="text-xs text-linen-muted">Amount Due</span>
          </div>
          <span className="font-serif text-xl font-bold text-espresso-950">
            ${amount.toFixed(2)}
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-espresso-950 uppercase tracking-wider">
                Verification Code *
              </label>
              <span className="text-xs text-caramel-600 font-semibold bg-caramel-500/10 px-2 py-0.5 rounded-md border border-caramel-500/20">
                Hint: 123
              </span>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={10}
              placeholder="Enter code 123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-xl border border-linen-border bg-broken-50/50 text-espresso-950 placeholder:text-linen-muted/50 focus:outline-none focus:ring-2 focus:ring-caramel-500 transition"
            />
            <p className="text-xs text-linen-muted mt-2 text-center">
              Enter <strong className="text-espresso-900">123</strong> to mark as Paid. Entering any other code simulates a failure.
            </p>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-caramel-500 text-white text-sm font-semibold hover:bg-caramel-600 active:scale-95 transition shadow-warm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Confirm Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
