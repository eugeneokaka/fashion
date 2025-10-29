import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// ✅ GET a single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            location: true,
          },
        },
      },
    });

    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const seller = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!seller)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      category,
      brand,
      color,
      size,
      material,
      images,
    } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const data: any = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      brand,
      color,
      size,
      material,
    };

    if (Array.isArray(images)) {
      data.images = {
        deleteMany: {},
        create: images.map((img: any) => ({
          imageUrl: typeof img === "string" ? img : img.imageUrl,
        })),
      };
    }

    const updated = await prisma.product.update({
      where: { id, sellerId: seller.id },
      data,
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
