"use client";

import { useState, useEffect } from "react";

type Sale = {
  id: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  buyer: { firstName: string | null; lastName: string | null };
  seller: { firstName: string | null; lastName: string | null };
  product: { name: string };
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSales = async () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await fetch(`/api/sales?${params.toString()}`);
    const data = await res.json();
    setSales(data);
  };

  // Debounced search & date filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 100); // 200ms delay for faster response

    return () => clearTimeout(timer);
  }, [search, startDate, endDate]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by buyer or product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1 min-w-[200px]"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-blue-50/50 rounded-lg shadow-md">
          <thead className="bg-blue-200/50">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-left p-3">Seller</th>
              <th className="text-left p-3">Quantity</th>
              <th className="text-left p-3">Total Price</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-blue-100 hover:bg-blue-100/30 transition-colors"
              >
                <td className="p-3 font-medium">{sale.product.name}</td>
                <td className="p-3">{`${sale.buyer.firstName ?? ""} ${
                  sale.buyer.lastName ?? ""
                }`}</td>
                <td className="p-3">{`${sale.seller.firstName ?? ""} ${
                  sale.seller.lastName ?? ""
                }`}</td>
                <td className="p-3">{sale.quantity}</td>
                <td className="p-3">${sale.totalPrice.toFixed(2)}</td>
                <td className="p-3">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
