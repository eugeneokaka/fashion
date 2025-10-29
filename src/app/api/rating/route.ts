import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // ⭐ Get all ratings for this product
    const ratings = await prisma.rating.findMany({
      where: { productId },
      select: { rating: true, numberOfRaters: true },
    });

    if (ratings.length === 0) {
      return NextResponse.json({
        averageRating: 0,
        totalRaters: 0,
        userRating: null,
      });
    }

    // ✅ Calculate average rating
    const totalRaters = ratings.reduce(
      (sum, r) => sum + (r.numberOfRaters || 0),
      0
    );
    const totalScore = ratings.reduce(
      (sum, r) => sum + (r.rating || 0) * (r.numberOfRaters || 1),
      0
    );

    const { userId } = await auth();
    let userRating = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (user) {
        const existing = await prisma.rating.findUnique({
          where: {
            userId_productId: { userId: user.id, productId },
          },
        });

        userRating = existing?.rating || null;
      }
    }

    return NextResponse.json({
      averageRating: totalScore / totalRaters,
      totalRaters,
      userRating,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    console.log("Authenticated Clerk ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX: Find actual Prisma user using userId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const { productId, rating } = await req.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check if user already rated this product
    const existing = await prisma.rating.findUnique({
      where: {
        userId_productId: { userId: user.id, productId },
      },
    });

    if (existing) {
      // Just update — DO NOT increment numberOfRaters
      console.log("Updating existing rating");
      const updated = await prisma.rating.update({
        where: { id: existing.id },
        data: { rating },
      });
      return NextResponse.json({ message: "Rating updated", rating: updated });
    }

    // First time → create with numberOfRaters = 1
    const created = await prisma.rating.create({
      data: {
        userId: user.id, // ✅ Important: REAL prisma user id
        productId,
        rating,
        numberOfRaters: 1,
      },
    });

    return NextResponse.json({ message: "Rating created", rating: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
