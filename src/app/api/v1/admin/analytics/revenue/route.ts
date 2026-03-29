import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
    const granularity = searchParams.get("granularity") || "day";

    let truncExpr: string;
    switch (granularity) {
      case "week":
        truncExpr = "week";
        break;
      case "month":
        truncExpr = "month";
        break;
      default:
        truncExpr = "day";
    }

    const data = await prisma.$queryRawUnsafe<
      Array<{ period: Date; revenue: bigint; order_count: bigint }>
    >(
      `SELECT date_trunc($1, "createdAt") as period,
              SUM("totalAmount") as revenue,
              COUNT(*) as order_count
       FROM "Order"
       WHERE "createdAt" >= $2
         AND "createdAt" <= $3
         AND "status" IN ('PAID', 'DELIVERED', 'SHIPPED', 'FULFILLMENT_PENDING')
       GROUP BY period
       ORDER BY period ASC`,
      truncExpr,
      from,
      to
    );

    return NextResponse.json({
      data: data.map((row: { period: Date; revenue: bigint; order_count: bigint }) => ({
        period: row.period,
        revenue: Number(row.revenue),
        orderCount: Number(row.order_count),
      })),
      from,
      to,
      granularity,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Revenue analytics error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
