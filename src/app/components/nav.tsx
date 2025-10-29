"use client";

import { useEffect, useState } from "react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to make navbar more solid
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`w-full fixed top-0 left-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-blue-200 shadow-sm"
            : "bg-white/70 backdrop-blur-md border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Brand */}
          <Link
            href="/"
            className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition"
          >
            ModaHaus
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white rounded-xl px-4 py-1.5 text-sm font-medium">
                  Login / Sign Up
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3">
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <LayoutDashboard className="h-5 w-5 text-gray-700" />
                </Link>

                {/* Cart link */}
                <Link
                  href="/cart"
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <ShoppingCart className="h-5 w-5 text-gray-700" />
                  {/* Optional: Add a badge for cart items */}
                  {/* <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    3
                  </span> */}
                </Link>

                {/* User button */}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 border border-blue-200 rounded-full",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </nav>
      {/* Small spacer */}
      <div className="mt-12" /> {/* Adjust mt-12 → mt-16 or mt-20 if needed */}
    </>
  );
}
