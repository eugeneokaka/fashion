import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const comments = await prisma.comment.findMany({
      where: { productId: id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(comments), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch comments" }), {
      status: 500,
    });
  }
}
