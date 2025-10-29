"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PickupLocation = {
  id: string;
  name: string;
  city: string;
  address: string;
};
type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id?: string;
    name?: string;
    images?: { imageUrl: string }[];
  } | null;
};
type Order = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  buyer?: { firstName?: string; lastName?: string; email?: string } | null;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");

  const debounceRef = useRef<number | null>(null);
  const DEBOUNCE_MS = 500;

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/pickup-locations");
        const data = await res.json();
        setLocations(data || []);
      } catch {
        toast.error("Failed to load pickup locations");
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        ...(selectedLocation ? { pickupLocationId: selectedLocation } : {}),
        ...(orderIdSearch ? { orderId: orderIdSearch } : {}),
        ...(emailSearch ? { email: emailSearch } : {}),
      });

      const url = `/api/admin/orders${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (err: any) {
      toast.error(err.message || "Error fetching orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchOrders();
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdSearch, emailSearch]);

  const updateStatus = async (
    orderId: string,
    status: "READY_FOR_PICKUP" | "PAID" | "CANCELLED"
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update order");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success("Order status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleReset = () => {
    setSelectedLocation("");
    setOrderIdSearch("");
    setEmailSearch("");
    setTimeout(fetchOrders, 0);
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      READY_FOR_PICKUP: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-gradient-to-b from-white to-blue-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Fashion Admin Panel
          </h1>
          <p className="text-slate-500 mt-1">
            Manage customer orders & pickups
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          className="bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:opacity-90"
        >
          Refresh Orders
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow p-6 border border-slate-100 mb-10">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Pickup Location
            </label>
            <Select
              onValueChange={(v) => setSelectedLocation(v)}
              value={selectedLocation}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingLocations ? "Loading..." : "Select location"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} — {loc.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Order ID
            </label>
            <Input
              placeholder="Search by Order ID"
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Buyer Email
            </label>
            <Input
              placeholder="Search by email"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button className="bg-slate-900 text-white" onClick={fetchOrders}>
              Search
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {loadingOrders ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="animate-spin" /> Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <p className="text-slate-500 text-center">No orders found.</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 shadow hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      #{order.id.slice(0, 10)}
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-3">
                <div>
                  <p className="text-sm text-slate-600">
                    <strong>Buyer:</strong>{" "}
                    {order.buyer?.firstName ?? "Unknown"}{" "}
                    {order.buyer?.lastName ?? ""}{" "}
                    <span className="text-slate-400">
                      ({order.buyer?.email ?? "No email"})
                    </span>
                  </p>
                  <p className="text-sm text-slate-700 font-semibold">
                    Total: KSh {order.totalAmount.toLocaleString()}
                  </p>
                </div>

                <div className="border-t pt-3 space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {it.product?.name ?? "Deleted product"}
                        </p>
                        <p className="text-slate-500">
                          Qty: {it.quantity} • KSh {it.price}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-800">
                        KSh {(it.price * it.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "READY_FOR_PICKUP")}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {updatingOrderId === order.id ? "..." : "Ready"}
                  </Button>
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "PAID")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {updatingOrderId === order.id ? "..." : "Paid"}
                  </Button>
                  <Button
                    disabled={updatingOrderId === order.id}
                    onClick={() => updateStatus(order.id, "CANCELLED")}
                    variant="destructive"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
