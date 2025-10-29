"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: { imageUrl: string }[];
  };
}

interface PickupLocation {
  id: string;
  name: string;
  city: string;
  address: string;
}

export default function CartPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Load cart items
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/cart?userClerkId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load cart");
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user, isLoaded]);

  // Load pickup locations
  useEffect(() => {
    const fetchPickupLocations = async () => {
      try {
        const res = await fetch("/api/pickup-locations");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to load pickup locations");
        setPickupLocations(data);
      } catch {
        toast.error("Failed to load pickup locations");
      }
    };
    fetchPickupLocations();
  }, []);

  // Update quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const res = await fetch(`/api/cart/item`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }
    if (!selectedPickupId) {
      toast.error("Please select a pickup location");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userClerkId: user.id,
          pickupLocationId: selectedPickupId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Order placed successfully!");
      setItems([]);
      setSelectedPickupId("");
    } catch {
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <p className="text-gray-600 text-lg">
          Please sign in to view your fashion cart.
        </p>
        <SignInButton mode="modal">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6">
            Sign In
          </Button>
        </SignInButton>
      </div>
    );

  if (!items.length)
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Your cart is empty.</p>
        <Link href="/" className="text-indigo-600 underline">
          Continue shopping →
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 font-sans">
      <Card className="bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Your Fashion Cart
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 mt-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center justify-between border-b pb-5 gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {item.product.images?.[0]?.imageUrl ? (
                  <Image
                    src={item.product.images[0].imageUrl}
                    alt={item.product.name}
                    width={90}
                    height={90}
                    className="rounded-xl object-cover border border-indigo-100 w-20 h-20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl" />
                )}
                <div>
                  <h3 className="font-medium text-gray-800">
                    {item.product.name}
                  </h3>
                  <p className="text-indigo-500 font-semibold">
                    KSh {item.product.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border rounded-full px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, Number(e.target.value))
                    }
                    className="w-12 text-center border-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Pickup locations */}
          <div className="pt-4">
            <label className="block font-medium mb-2">Pickup Location</label>
            <select
              className="border rounded-md p-2 w-full"
              value={selectedPickupId}
              onChange={(e) => setSelectedPickupId(e.target.value)}
            >
              <option value="">Select a pickup location</option>
              {pickupLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} — {loc.city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4">
            <p className="text-lg font-semibold text-gray-800">
              Total:{" "}
              <span className="text-indigo-600">
                KSh {total.toLocaleString()}
              </span>
            </p>
            <Button
              onClick={placeOrder}
              disabled={placingOrder}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-2"
            >
              {placingOrder ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
