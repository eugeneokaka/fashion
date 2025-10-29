"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  images: { imageUrl: string }[];
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/product");
        const data = await res.json();
        setProducts(data);
        setFiltered(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // 🔍 Filter Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      let results = [...products];

      if (search.trim()) {
        const term = search.toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.brand?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
        );
      }

      if (category !== "all") {
        results = results.filter(
          (p) => p.category?.toLowerCase() === category.toLowerCase()
        );
      }

      setFiltered(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, products]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white py-10 px-6 font-sans">
      {/* 🌊 Modern Search Bar */}
      <div className="max-w-5xl mx-auto mb-10 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl border border-indigo-100 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for styles, brands or colors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200 focus:ring-1 focus:ring-indigo-400 rounded-xl"
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44 border-gray-200 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="men">Men</SelectItem>
            <SelectItem value="women">Women</SelectItem>
            <SelectItem value="kids">Kids</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🛍️ Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="w-72 h-[420px] rounded-2xl shadow-sm bg-white border border-gray-100"
            >
              <CardContent className="p-4 space-y-3">
                <Skeleton className="w-full h-56 rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">
          No fashion items found 🕶️
        </p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-72 bg-white border border-indigo-100 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden flex flex-col">
                {/* 🖼️ Product Image */}
                <figure className="relative">
                  <Image
                    src={product.images[0]?.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-indigo-100/90 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full">
                    {product.category || "New"}
                  </span>
                </figure>

                {/* 📝 Text Content */}
                <div className="px-5 py-4 text-center flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-800 tracking-tight mb-1 line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-500 leading-snug mb-3 line-clamp-2">
                    {product.description ||
                      "Effortless, timeless, and made for comfort."}
                  </p>
                  <p className="font-bold text-indigo-600 text-lg mb-3">
                    KSh {product.price.toFixed(2)}
                  </p>

                  <Link
                    href={`/products/${product.id}`}
                    className="w-full mt-auto"
                  >
                    <button className="w-full rounded-full border border-indigo-400 text-indigo-500 py-2 text-sm font-medium hover:bg-indigo-500 hover:text-white transition-all duration-300">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
