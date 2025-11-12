import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ALLOWED = ["PENDING", "READY_FOR_PICKUP", "PAID", "CANCELLED"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !ALLOWED.includes(status as any))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    // ✅ Update order
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        buyer: true,
        pickupLocation: true,
        items: { include: { product: true } },
      },
    });

    // ✅ Create Sale records if status is PAID
    if (status === "PAID") {
      const salesData = order.items.map((item) => ({
        buyerId: order.buyerId!,
        sellerId: item.product?.sellerId!,
        productId: item.productId!,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
      }));

      // Create all sales in a single query
      await prisma.sale.createMany({
        data: salesData,
      });
    }

    // ✅ Send email when order is ready for pickup
    if (status === "READY_FOR_PICKUP" && order.buyer?.email) {
      const buyerEmail = order.buyer.email;
      const buyerName =
        `${order.buyer.firstName ?? ""} ${order.buyer.lastName ?? ""}`.trim() ||
        "Customer";
      const location = order.pickupLocation;

      const subject = `Your order #${order.id.slice(0, 8)} is ready for pickup`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          <h2 style="color:#333;">Hi ${buyerName},</h2>
          <p>Your order <strong>#${
            order.id
          }</strong> is now <strong>ready for pickup</strong>.</p>

          ${
            location
              ? `<p><strong>Pickup Location:</strong><br/>
                 ${location.name}<br/>
                 ${location.address}, ${location.city}</p>`
              : ""
          }

          <p>Please bring your order ID and confirmation to collect your items.</p>

          <p style="margin-top:24px;">Thank you for shopping with us!</p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: "contact@mail.eugenecode.xyz",
          to: buyerEmail,
          subject,
          html: htmlContent,
        });
        console.log(`📧 Sent pickup email to ${buyerEmail}`);
      } catch (emailErr) {
        console.error("❌ Failed to send pickup email:", emailErr);
      }
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// import { NextResponse, NextRequest } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY); // ✅ Make sure you set this in your .env
// const ALLOWED = ["PENDING", "READY_FOR_PICKUP", "PAID", "CANCELLED"] as const;

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const id = (await params).id;

//   try {
//     const { userId } = await auth();
//     if (!userId)
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
//     if (!admin || admin.role !== "ADMIN")
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });

//     const body = await req.json();
//     const { status } = body as { status?: string };

//     if (!status || !ALLOWED.includes(status as any))
//       return NextResponse.json({ error: "Invalid status" }, { status: 400 });

//     // ✅ Update order
//     const order = await prisma.order.update({
//       where: { id },
//       data: { status: status as any },
//       include: {
//         buyer: true,
//         pickupLocation: true,
//         items: { include: { product: true } },
//       },
//     });

//     // ✅ Send email when order is ready for pickup
//     if (status === "READY_FOR_PICKUP" && order.buyer?.email) {
//       const buyerEmail = order.buyer.email;
//       const buyerName =
//         `${order.buyer.firstName ?? ""} ${order.buyer.lastName ?? ""}`.trim() ||
//         "Customer";
//       const location = order.pickupLocation;

//       const subject = `Your order #${order.id.slice(0, 8)} is ready for pickup`;

//       const htmlContent = `
//         <div style="font-family: Arial, sans-serif; line-height:1.6;">
//           <h2 style="color:#333;">Hi ${buyerName},</h2>
//           <p>Your order <strong>#${
//             order.id
//           }</strong> is now <strong>ready for pickup</strong>.</p>

//           ${
//             location
//               ? `<p><strong>Pickup Location:</strong><br/>
//                  ${location.name}<br/>
//                  ${location.address}, ${location.city}</p>`
//               : ""
//           }

//           <p>Please bring your order ID and confirmation to collect your items.</p>

//           <p style="margin-top:24px;">Thank you for shopping with us!</p>
//         </div>
//       `;

//       try {
//         await resend.emails.send({
//           from: "contact@mail.eugenecode.xyz", // ✅ Must match a verified domain/sender in Resend
//           to: buyerEmail,
//           subject,
//           html: htmlContent,
//         });
//         console.log(`📧 Sent pickup email to ${buyerEmail}`);
//       } catch (emailErr) {
//         console.error("❌ Failed to send pickup email:", emailErr);
//       }
//     }

//     return NextResponse.json(order);
//   } catch (err) {
//     console.error("Error updating order status:", err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
