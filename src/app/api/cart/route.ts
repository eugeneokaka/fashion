import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userClerkId = searchParams.get("userClerkId");

    if (!userClerkId)
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.cart) return NextResponse.json({ items: [] });

    return NextResponse.json({ items: user.cart.items });
  } catch (error) {
    console.error("🛒 Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userClerkId, productId, quantity } = await req.json();

    if (!userClerkId || !productId || !quantity)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // 🧍 Find user and their cart
    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: { cart: { include: { items: true } } },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🛍 Create cart if not exists
    let cart = user.cart;
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
    }

    // 🧾 Check if product exists in cart
    const existingItem = cart.items.find((i) => i.productId === productId);

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
