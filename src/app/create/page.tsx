"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    color: "",
    size: "",
    material: "",
    stock: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileValidation = (files: FileList) => {
    for (let file of Array.from(files)) {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 4) {
        toast.error(`"${file.name}" is too large. Max size is 4MB.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!images.length) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "❌ Failed to create product");
        return;
      }

      toast.success("✅ Product added successfully!");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Men", "Women", "Kids", "Accessories", "Shoes", "Other"];

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className="shadow-md border border-border/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Add New Fashion Product
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Name */}
            <div className="space-y-1">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Denim Jacket"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write a short description"
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 2500"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded-md bg-background p-2"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-1">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. Nike, Zara"
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="e.g. Black, Red"
              />
            </div>

            {/* Size */}
            <div className="space-y-1">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                name="size"
                value={form.size}
                onChange={handleChange}
                placeholder="e.g. M, L, 38"
              />
            </div>

            {/* Material */}
            <div className="space-y-1">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                name="material"
                value={form.material}
                onChange={handleChange}
                placeholder="e.g. Cotton, Leather"
              />
            </div>

            {/* Stock */}
            <div className="space-y-1">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="e.g. 20"
                required
              />
            </div>

            {/* Upload Images */}
            <div className="mt-6">
              <Label>Upload Product Images (Max 4MB each)</Label>
              <div className="border border-dashed border-muted-foreground/40 rounded-md p-4 mt-2">
                <UploadButton<OurFileRouter, "imageUploader">
                  endpoint="imageUploader"
                  onBeforeUploadBegin={(files) => {
                    if (!handleFileValidation(files as unknown as FileList)) {
                      throw new Error("File too large");
                    }
                    return files;
                  }}
                  onUploadBegin={() => {
                    setUploading(true);
                    setProgress(0);
                    toast.message("Starting upload...");
                  }}
                  onUploadProgress={(p) => setProgress(p)}
                  onClientUploadComplete={(res) => {
                    const urls = res?.map((f) => f.url) || [];
                    setImages((prev) => [...prev, ...urls]);
                    setUploading(false);
                    setProgress(100);
                    toast.success("Images uploaded successfully!");
                  }}
                  onUploadError={(err) => {
                    if (err.message === "File too large") return;
                    toast.error(`Upload failed: ${err.message}`);
                    setUploading(false);
                  }}
                />
              </div>

              {uploading && (
                <div className="mt-3">
                  <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-black transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uploading... {progress.toFixed(0)}%
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Uploaded"
                      className="rounded-lg object-cover w-full h-24 border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-black hover:bg-gray-800 text-white transition"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Adding Product..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
