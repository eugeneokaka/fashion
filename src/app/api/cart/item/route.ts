import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { itemId, quantity } = await req.json();

    if (!itemId || quantity == null)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const item = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { itemId } = await req.json();
    if (!itemId)
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });

    await prisma.cartItem.delete({ where: { id: itemId } });

    return NextResponse.json({ message: "Item removed" });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
