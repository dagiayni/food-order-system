export interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  foodId: string;
  foodName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  status: "Pending" | "PaymentPending" | "Paid" | "PaymentFailed" | "Cancelled" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  verificationCode?: string;
  failureReason?: string | null;
  createdAt?: string;
}

export interface ServiceHealth {
  foodService: boolean;
  orderService: boolean;
  paymentService: boolean;
}

const FOOD_URL = typeof window !== "undefined" ? "/api/proxy/foods" : "http://localhost:5001/api/foods";
const ORDER_URL = typeof window !== "undefined" ? "/api/proxy/orders" : "http://localhost:5002/api/orders";
const PAYMENT_URL = typeof window !== "undefined" ? "/api/proxy/payments" : "http://localhost:5003/api/payments";

export async function fetchHealth(): Promise<ServiceHealth> {
  const check = async (url: string) => {
    try {
      const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  };

  const [food, order, payment] = await Promise.all([
    check(`${FOOD_URL}/health`),
    check(`${ORDER_URL}/health`),
    check(`${PAYMENT_URL}/health`),
  ]);

  return { foodService: food, orderService: order, paymentService: payment };
}

export async function getFoods(): Promise<FoodItem[]> {
  try {
    const res = await fetch(FOOD_URL, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch foods");
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch foods from FoodService. Using fallback.", err);
    return [
      {
        id: "f1d2e3b4-1234-4567-89ab-cdef01234567",
        name: "Cheese Burger",
        description: "Double patty beef burger with cheddar and artisan brioche",
        price: 8.5,
        isAvailable: true,
      },
    ];
  }
}

export async function createFood(name: string, description: string, price: number): Promise<FoodItem> {
  const res = await fetch(FOOD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, price, isAvailable: true }),
  });
  if (!res.ok) throw new Error("Failed to create food item");
  return await res.json();
}

export async function toggleFoodAvailability(id: string, isAvailable: boolean): Promise<boolean> {
  const res = await fetch(`${FOOD_URL}/${id}/availability?isAvailable=${isAvailable}`, {
    method: "PUT",
  });
  return res.ok;
}

export async function getOrders(): Promise<OrderItem[]> {
  try {
    const res = await fetch(ORDER_URL, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createOrder(foodId: string, quantity: number, verificationCode?: string): Promise<OrderItem> {
  const res = await fetch(ORDER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId, quantity, verificationCode: verificationCode || null }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to place order");
  }
  return await res.json();
}

export async function getOrderById(id: string): Promise<OrderItem | null> {
  try {
    const res = await fetch(`${ORDER_URL}/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function verifyOrderPayment(orderId: string, verificationCode: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${ORDER_URL}/${orderId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationCode }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data.message || (res.ok ? "Payment verified successfully!" : "Verification failed."),
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Connection to OrderService failed." };
  }
}
