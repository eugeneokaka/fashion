import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search"); // search by buyer name or product name

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { buyer: { firstName: { contains: search, mode: "insensitive" } } },
        { buyer: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        buyer: true,
        seller: true,
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}
