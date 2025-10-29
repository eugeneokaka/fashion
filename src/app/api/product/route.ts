import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================
// GET all products (with filters)
// =============================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    const products = await prisma.product.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                  { brand: { contains: search, mode: "insensitive" } },
                  { category: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
          maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
          category ? { category: { equals: category } } : {},
          brand ? { brand: { contains: brand, mode: "insensitive" } } : {},
        ],
      },
      include: {
        images: true,
        seller: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// =============================
// POST create a new product
// =============================
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      description,
      price,
      category,
      brand,
      color,
      size,
      material,
      stock,
      images,
    } = body;

    if (!name || !price)
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );

    const seller = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!seller)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        brand,
        color,
        size,
        material,
        stock: stock || 0,
        sellerId: seller.id,
        images: {
          create: images?.map((url: string) => ({ imageUrl: url })) || [],
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
