import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clerkId, firstName, lastName, role, email, phone } = body; // ✅ phone

    if (!clerkId || !email) {
      return NextResponse.json(
        { error: "Missing Clerk data" },
        { status: 400 }
      );
    }

    await prisma.user.upsert({
      where: { clerkId },
      update: {
        firstName,
        lastName,
        role,
        email,
        phone, // ✅ save phone
        hasCompletedOnboarding: true,
      },
      create: {
        clerkId,
        firstName,
        lastName,
        role,
        email,
        phone, // ✅ save phone
        hasCompletedOnboarding: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
