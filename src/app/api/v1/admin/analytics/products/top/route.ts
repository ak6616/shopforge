import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

    const topProducts = await prisma.$queryRawUnsafe<
      Array<{
        variant_id: string;
        product_name: string;
        variant_name: string;
        sku: string;
        total_revenue: bigint;
        total_quantity: bigint;
      }>
    >(
      `SELECT oi."variantId" as variant_id,
              oi."productName" as product_name,
              oi."variantName" as variant_name,
              oi."sku" as sku,
              SUM(oi."totalPrice") as total_revenue,
              SUM(oi."quantity") as total_quantity
       FROM "OrderItem" oi
       JOIN "Order" o ON o."id" = oi."orderId"
       WHERE o."createdAt" >= $1
         AND o."createdAt" <= $2
         AND o."status" IN ('PAID', 'DELIVERED', 'SHIPPED', 'FULFILLMENT_PENDING')
       GROUP BY oi."variantId", oi."productName", oi."variantName", oi."sku"
       ORDER BY total_revenue DESC
       LIMIT $3`,
      from,
      to,
      limit
    );

    return NextResponse.json({
      products: topProducts.map((p: { variant_id: string; product_name: string; variant_name: string; sku: string; total_revenue: bigint; total_quantity: bigint }) => ({
        variantId: p.variant_id,
        productName: p.product_name,
        variantName: p.variant_name,
        sku: p.sku,
        totalRevenue: Number(p.total_revenue),
        totalQuantity: Number(p.total_quantity),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Top products error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
