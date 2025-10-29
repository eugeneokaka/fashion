"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  material?: string;
  images?: { id: string; imageUrl: string }[];
  seller?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
  };
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useUser();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments/${id}`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add to cart.");
      return;
    }
    if (!product || added) return;

    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userClerkId: user.id,
          productId: product.id,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add to cart");
        return;
      }
      setAdded(true);
      toast.success("Item added to cart 🛒");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  // -------------------------------
  // COMMENT API
  // -------------------------------
  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;
    setAddingComment(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          userId: user.id,
          content: commentText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to post comment");
        return;
      }

      setComments((prev) => [data, ...prev]);
      setCommentText("");
      toast.success("Comment posted!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setAddingComment(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin h-7 w-7 text-indigo-500" />
      </div>
    );

  if (!product)
    return (
      <p className="text-center text-gray-500 mt-20">Product not found.</p>
    );

  const images = product.images || [];

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-2xl shadow-sm p-6">
        <CardContent className="grid md:grid-cols-2 gap-10 items-start">
          {/* 🖼️ Product Images */}
          <div className="space-y-4">
            <div className="relative">
              {images.length > 0 ? (
                <Image
                  src={images[0].imageUrl}
                  alt={product.name}
                  width={600}
                  height={500}
                  className="rounded-2xl border border-indigo-100 object-cover w-full h-[400px]"
                />
              ) : (
                <div className="w-full h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((img) => (
                  <Image
                    key={img.id}
                    src={img.imageUrl}
                    alt="Product"
                    width={100}
                    height={100}
                    className="rounded-lg object-cover h-24 w-full border border-indigo-100 hover:opacity-90 cursor-pointer transition"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 💎 Product Info */}
          <div className="space-y-5">
            <h1 className="text-3xl font-semibold text-gray-800">
              {product.name}
            </h1>
            <p className="text-indigo-500 font-bold text-2xl">
              KSh {product.price.toLocaleString()}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "No description available."}
            </p>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={added || adding}
              className={`mt-4 w-full sm:w-auto rounded-full transition-all duration-300 ${
                added
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white shadow-md"
              }`}
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : added ? (
                "Added to Cart"
              ) : (
                "Add to Cart"
              )}
            </Button>

            {/* Seller Info */}
            <div className="mt-8 border-t pt-5">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Seller Information
              </h3>
              <div className="flex items-center gap-4">
                {product.seller?.imageUrl ? (
                  <Image
                    src={product.seller.imageUrl}
                    alt="Seller"
                    width={48}
                    height={48}
                    className="rounded-full border border-indigo-100"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                )}
                <div>
                  <p className="font-medium text-gray-800">
                    {product.seller?.firstName} {product.seller?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.seller?.email && (
                      <span>{product.seller.email}</span>
                    )}
                    {product.seller?.phone && (
                      <span> • {product.seller.phone}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-10">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Comments
              </h3>

              {user ? (
                <div className="mb-6">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 mb-2"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={addingComment || !commentText.trim()}
                  >
                    {addingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Sign in to leave a comment.</p>
              )}

              <div className="space-y-4">
                {comments.length === 0 && (
                  <p className="text-gray-500">No comments yet.</p>
                )}
                {comments.map((c) => (
                  <Card key={c.id} className="bg-gray-50 border">
                    <CardContent>
                      <p className="text-gray-700">{c.content}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {c.user?.firstName} {c.user?.lastName} •{" "}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
