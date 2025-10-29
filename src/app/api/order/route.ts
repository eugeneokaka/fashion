// /app/api/order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userClerkId, pickupLocationId } = await req.json();

    if (!userClerkId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    if (!pickupLocationId) {
      return NextResponse.json(
        { error: "Pickup location required" },
        { status: 400 }
      );
    }

    // Fetch user with cart and items
    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
      include: {
        cart: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!user || !user.cart) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const items = user.cart.items.filter((i) => i.product !== null);
    if (!items.length) {
      return NextResponse.json(
        { error: "No valid items in cart" },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
      0
    );

    // Create the order
    const order = await prisma.order.create({
      data: {
        buyer: { connect: { id: user.id } },
        pickupLocation: { connect: { id: pickupLocationId } },
        totalAmount,
        items: {
          create: items.map((i) => ({
            productId: i.productId!,
            quantity: i.quantity,
            price: i.product?.price ?? 0,
          })),
        },
      },
      include: { items: true, pickupLocation: true },
    });

    // Clear the user's cart
    await prisma.cartItem.deleteMany({ where: { cartId: user.cart.id } });

    // Send order confirmation email (Resend)
    if (user.email) {
      try {
        const { default: resend } = await import("@/lib/resend");
        await resend.emails.send({
          from: "contact@mail.eugenecode.xyz",
          to: user.email,
          subject: "Fashion Order Confirmation",
          html: `<h2>Thank you for your order!</h2>
                 <p>Your order #${order.id} has been placed successfully.</p>
                 <p>Total Amount: Ksh ${order.totalAmount}</p>
                 <p>Pickup city: ${order.pickupLocation?.city ?? "N/A"}</p>
                 <p>Pickup Location: ${order.pickupLocation?.name ?? "N/A"}</p>
                 <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                 <p>We appreciate your business!</p>`,
        });
      } catch (emailError) {
        console.error("❌ Error sending order email:", emailError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        pickupLocation: true,
        items: { include: { product: { include: { images: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ Error fetching user orders:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
