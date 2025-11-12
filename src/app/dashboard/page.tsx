"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images?: { imageUrl: string }[];
    } | null;
  }[];
  pickupLocation?: {
    name: string;
    city: string;
  };
};

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock: number;
  createdAt: string;
  images: { imageUrl: string }[];
};

export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!user) return;

    const baseUrl =
      typeof window !== "undefined"
        ? ""
        : process.env.NEXT_PUBLIC_BASE_URL || "";

    // Fetch user role
    const fetchRole = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/role?clerkId=${user.id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRole(data.role);
      } catch (error) {
        console.error("❌ Error fetching role:", error);
      }
    };

    // Fetch orders
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/order?userClerkId=${user.id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("❌ Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    // Fetch products
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/my-products`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchRole();
    fetchOrders();
    fetchProducts();
  }, [user]);

  const statusColor = (s: OrderStatus) => {
    switch (s) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "READY_FOR_PICKUP":
        return "bg-blue-100 text-blue-800";
      case "PAID":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Top header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your orders and listings from one place.
          </p>
        </div>

        <div className="flex gap-3">
          {role === "ADMIN" && (
            <Link href="/admin/orders">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700"
              >
                Admin Orders
              </Button>
            </Link>
          )}
          <Link href="/create">
            <Button className="bg-gradient-to-r from-blue-600 to-sky-600 text-white">
              + new product
            </Button>
          </Link>
          <Link href="/sales">
            <Button className="bg-gradient-to-r from-blue-600 to-sky-600 text-white">
              sales
            </Button>
          </Link>
        </div>
      </div>

      {/* Orders area - different layout (compact tiles) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            Recent Orders
          </h2>
          <p className="text-sm text-slate-500">
            {loadingOrders ? "loading…" : `${orders.length} orders`}
          </p>
        </div>

        {loadingOrders ? (
          <Card className="p-6">Loading orders...</Card>
        ) : orders.length === 0 ? (
          <Card className="p-6">
            No orders yet — your customers are waiting!
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="flex flex-col md:flex-row items-stretch gap-4 p-4 rounded-lg border shadow-sm bg-white"
              >
                {/* left: meta */}
                <div className="flex-shrink-0 w-full md:w-56 bg-gradient-to-b from-sky-50 to-white rounded-md p-3 flex flex-col justify-between border">
                  <div>
                    <p className="text-xs text-slate-500">Order</p>
                    <p className="font-semibold text-slate-800 truncate">
                      #{order.id.slice(0, 10)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-500">Pickup</p>
                    <p className="text-sm text-slate-700">
                      {order.pickupLocation?.name ?? "—"}{" "}
                      <span className="text-xs text-slate-400 block">
                        {order.pickupLocation?.city ?? ""}
                      </span>
                    </p>
                  </div>
                </div>

                {/* middle: product thumbnails */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-3 overflow-x-auto py-2">
                    {order.items.length === 0 && (
                      <div className="text-sm text-slate-500">No items</div>
                    )}
                    {order.items.map((it) => {
                      const url = it.product?.images?.[0]?.imageUrl;
                      return (
                        <div
                          key={it.id}
                          className="flex items-center gap-3 min-w-[160px] bg-slate-50 rounded-md p-2 border"
                        >
                          <div className="w-14 h-14 flex items-center justify-center bg-white rounded-md overflow-hidden border">
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt={it.product?.name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-xs text-slate-400">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {it.product?.name ?? "Deleted product"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Qty: {it.quantity}
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-slate-700">
                            Ksh {(it.price * it.quantity).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* small note or action */}
                  {/* <div className="mt-3 text-sm text-slate-500">
                    Tip: click{" "}
                    <span className="font-medium text-slate-700">View</span> to
                    see order details or manage the listing.
                  </div> */}
                </div>

                {/* right: total, status, actions */}
                <div className="w-full md:w-48 flex flex-col justify-between gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-900">
                      Ksh {order.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                        order.status as OrderStatus
                      )} text-center`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>

                    {/* <div className="flex gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button
                          variant="outline"
                          className="border-slate-200 text-slate-700 w-full"
                        >
                          View
                        </Button>
                      </Link>

                      <Link href={`/orders/${order.id}/message`}>
                        <Button className="bg-sky-600 text-white hover:bg-sky-700 w-full">
                          Contact
                        </Button>
                      </Link>
                    </div> */}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Products area — card grid but with a different compact card style */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">My Listings</h2>
          <p className="text-sm text-slate-500">
            {loadingProducts ? "loading…" : `${products.length} items`}
          </p>
        </div>

        {loadingProducts ? (
          <Card className="p-6">Loading products...</Card>
        ) : products.length === 0 ? (
          <Card className="p-6">
            No listings yet — add a product to get started.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="flex flex-col overflow-hidden">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0].imageUrl}
                    alt={p.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 w-full bg-slate-50 flex items-center justify-center text-slate-400">
                    No image
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{p.name}</h3>
                      <p className="text-sm text-slate-500">{p.category}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        Ksh {p.price}
                      </div>
                      <div className="text-xs text-slate-400">
                        Stock: {p.stock}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/products/${p.id}`}>
                      <Button variant="outline" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Link href={`/products/${p.id}/edit`}>
                      <Button className="w-full bg-sky-600 text-white hover:bg-sky-700">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
