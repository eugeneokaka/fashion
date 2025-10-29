"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("BUYER");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <p className="text-center mt-10">Loading...</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          firstName,
          lastName,
          phone,
          role,
        }),
      });

      if (res.ok) {
        toast.success("Profile setup complete 🎉");
        router.push("/");
      } else {
        toast.error("Failed to save onboarding info.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 px-4 font-inter">
      <Card className="w-full max-w-lg shadow-lg border border-blue-100 rounded-3xl bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-semibold text-blue-800">
            Welcome to <span className="text-indigo-600">ModaHaus</span>
          </CardTitle>
          <CardDescription className="text-gray-500 font-normal">
            Let’s personalize your shopping experience 👕
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  First Name
                </Label>
                <Input
                  placeholder="e.g. Alice"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="border-blue-100 focus-visible:ring-blue-200 focus-visible:border-blue-300"
                />
              </div>
              <div>
                <Label className="text-gray-700 text-sm font-medium">
                  Last Name
                </Label>
                <Input
                  placeholder="e.g. Kimani"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="border-blue-100 focus-visible:ring-blue-200 focus-visible:border-blue-300"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 text-sm font-medium">
                Phone Number
              </Label>
              <Input
                type="tel"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-blue-100 focus-visible:ring-blue-200 focus-visible:border-blue-300"
              />
            </div>

            <div>
              <Label className="text-gray-700 text-sm font-medium">
                Account Type
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-blue-100 focus-visible:ring-blue-200 focus-visible:border-blue-300">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUYER">Buyer 🛍️</SelectItem>
                  <SelectItem value="SELLER">Seller 👗</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white py-2 rounded-xl text-lg transition-all duration-300 shadow-md"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Saving...
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-5">
            Your data is securely stored and used only to personalize your
            experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
