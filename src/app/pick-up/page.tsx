"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  contact?: string;
}

export default function PickupLocationPage() {
  const { user } = useUser();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    contact: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    const res = await fetch("/api/pickup-locations");
    const data = await res.json();
    setLocations(data);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in as an admin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pickup-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userClerkId: user.id, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create location");
        return;
      }

      toast.success("Pickup location added successfully!");
      setForm({ name: "", address: "", city: "", contact: "" });
      fetchLocations();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 pb-20 px-6">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          Manage Pickup Locations
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Add or manage pickup points where customers can collect their orders.
        </p>
      </div>

      {/* Form Section */}
      <Card className="border border-blue-100 bg-white/70 backdrop-blur-md shadow-md hover:shadow-lg transition-all">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Add New Pickup Location
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Location Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <Input
              placeholder="Contact (optional)"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white rounded-xl px-6 py-2 font-medium transition-all"
            >
              {loading ? "Saving..." : "Create Location"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Locations */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">
          Existing Pickup Locations
        </h2>
        {locations.length === 0 ? (
          <p className="text-muted-foreground">No locations added yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <Card
                key={loc.id}
                className="border border-blue-100 bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md transition-all"
              >
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg text-blue-700 mb-1">
                    {loc.name}
                  </h3>
                  <p className="text-sm text-gray-600">{loc.address}</p>
                  <p className="text-sm text-gray-600">{loc.city}</p>
                  {loc.contact && (
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {loc.contact}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
