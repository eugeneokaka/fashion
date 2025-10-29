import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// POST /api/rating/[id]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const { userId } = await auth();
    console.log("Params ID:", id);
    const productId = id;
    console.log("Product ID:", productId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating } = body; // expected: 1–5

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating value (must be between 1 and 5)" },
        { status: 400 }
      );
    }

    // check if user has already rated this product
    const existingUserRating = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        ratings: {
          where: { productId },
        },
      },
    });

    if (existingUserRating?.ratings.length) {
      return NextResponse.json(
        { error: "You have already rated this product." },
        { status: 400 }
      );
    }

    // find existing product rating record
    const existingRating = await prisma.rating.findFirst({
      where: { productId },
    });

    let updatedRating;

    if (!existingRating) {
      // no rating yet → create one
      updatedRating = await prisma.rating.create({
        data: {
          rating,
          numberOfRaters: 1,
          product: { connect: { id: productId } },
          user: { connect: { clerkId: userId } },
        },
      });
    } else {
      // update existing rating with new average
      const newAverage =
        (existingRating.rating! * existingRating.numberOfRaters + rating) /
        (existingRating.numberOfRaters + 1);

      updatedRating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating: newAverage,
          numberOfRaters: existingRating.numberOfRaters + 1,
          // create a new user->product rating link
          user: { connect: { clerkId: userId } },
        },
      });
    }

    return NextResponse.json(
      {
        message: "Rating submitted successfully",
        rating: updatedRating,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

// GET /api/rating/[id] → get product rating
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  try {
    const productId = id;
    console.log("Fetching rating for Product ID:", productId);

    const rating = await prisma.rating.findFirst({
      where: { productId },
      select: {
        rating: true,
        numberOfRaters: true,
      },
    });

    if (!rating) {
      return NextResponse.json(
        { message: "No rating yet for this product" },
        { status: 404 }
      );
    }

    return NextResponse.json(rating, { status: 200 });
  } catch (error) {
    console.error("Error fetching rating:", error);
    return NextResponse.json(
      { error: "Failed to fetch rating" },
      { status: 500 }
    );
  }
}
