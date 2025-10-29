import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userClerkId, name, address, city, contact } = await req.json();

    if (!userClerkId)
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

    // ✅ Verify the user is an admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userClerkId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access only." },
        { status: 403 }
      );
    }

    if (!name || !address || !city)
      return NextResponse.json(
        { error: "Please provide all required fields." },
        { status: 400 }
      );

    const pickupLocation = await prisma.pickupLocation.create({
      data: {
        name,
        address,
        city,
        contact,
      },
    });

    return NextResponse.json(pickupLocation);
  } catch (error) {
    console.error("Error creating pickup location:", error);
    return NextResponse.json(
      { error: "Failed to create pickup location" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const locations = await prisma.pickupLocation.findMany({
      //   orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching pickup locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
