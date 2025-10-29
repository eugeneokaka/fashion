import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pickupLocationId = searchParams.get("pickupLocationId");
    const orderId = searchParams.get("orderId");
    const email = searchParams.get("email");

    const filters: any = {};

    // If pickupLocationId is selected → filter + sort
    if (pickupLocationId) {
      filters.pickupLocationId = pickupLocationId;
    }

    // Optional orderId search
    if (orderId) {
      filters.id = {
        contains: orderId,
        mode: "insensitive",
      };
    }

    // Optional email search (via buyer relation)
    if (email) {
      filters.buyer = {
        is: {
          email: {
            contains: email,
            mode: "insensitive",
          },
        },
      };
    }

    const orders = await prisma.order.findMany({
      where: filters,
      include: {
        buyer: true,
        items: {
          include: { product: { include: { images: true } } },
        },
      },
      orderBy: pickupLocationId ? { createdAt: "desc" } : undefined, // ✅ Sort ONLY when location is selected
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { pathname } = new URL(req.url);
    const orderId = pathname.split("/").pop();

    if (!orderId)
      return NextResponse.json({ error: "Order not found" }, { status: 400 });

    const body = await req.json();
    const { status } = body;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
