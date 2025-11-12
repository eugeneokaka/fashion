"use client";

import { useEffect, useState } from "react";
import { Star as StarOutline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface RatingProps {
  productId: string;
  onRatingUpdated?: (rating: number, numberOfRaters: number) => void;
}

export default function RatingComponent({
  productId,
  onRatingUpdated,
}: RatingProps) {
  const { user } = useUser();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (!user || !productId) return;

    const checkUserRating = async () => {
      try {
        const res = await fetch(`/api/rating/${productId}?userId=${user.id}`);
        const data = await res.json();
        if (data.userHasRated) {
          setHasRated(true);
          setSelectedRating(data.userRating);
        }
      } catch (err) {
        console.error("Error checking rating:", err);
      }
    };

    checkUserRating();
  }, [user, productId]);

  const handleRate = async (ratingValue: number) => {
    if (!user) {
      toast.error("Please sign in to rate this product.");
      return;
    }
    if (hasRated) {
      toast.info("You already rated this product.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rating/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          rating: ratingValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit rating");
        return;
      }

      setHasRated(true);
      setSelectedRating(ratingValue);
      toast.success("Thanks for your rating!");

      if (onRatingUpdated) {
        onRatingUpdated(data.rating, data.numberOfRaters);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* ⭐ Star Rating Row */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <svg
            key={num}
            onClick={() => handleRate(num)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={num <= (selectedRating || 0) ? "#facc15" : "none"} // yellow fill
            stroke={num <= (selectedRating || 0) ? "#facc15" : "#d1d5db"} // gray stroke
            strokeWidth="2"
            className="w-6 h-6 cursor-pointer transition"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.104 4.26a.562.562 0 00.424.308l4.705.683a.562.562 0 01.312.959l-3.406 3.32a.562.562 0 00-.162.497l.804 4.685a.562.562 0 01-.815.592L12 17.347l-4.217 2.216a.562.562 0 01-.815-.592l.804-4.685a.562.562 0 00-.162-.497L4.204 9.71a.562.562 0 01.312-.959l4.705-.683a.562.562 0 00.424-.308l2.104-4.26z"
            />
          </svg>
        ))}
      </div>

      {/* ✅ Submit Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={hasRated || loading}
        className="w-fit mt-2"
      >
        {loading ? "Submitting..." : hasRated ? "Rated" : "Submit Rating"}
      </Button>
    </div>
  );
}
