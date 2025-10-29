import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { productId, content } = body;

    if (!productId || !content) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        product: { connect: { id: productId } },
        user: { connect: { clerkId: userId } },
      },
      include: { user: true },
    });

    return new Response(JSON.stringify(comment), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to post comment" }), {
      status: 500,
    });
  }
}
