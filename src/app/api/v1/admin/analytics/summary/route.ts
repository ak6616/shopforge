import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { OrderStatus } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.DELIVERED,
      OrderStatus.SHIPPED,
      OrderStatus.FULFILLMENT_PENDING,
    ];

    const [todayRevenue, last7Revenue, last30Revenue, pendingFulfilment, lowStock, activeCarts] =
      await Promise.all([
        prisma.order.aggregate({
          where: { status: { in: paidStatuses }, createdAt: { gte: todayStart } },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        prisma.order.aggregate({
          where: { status: { in: paidStatuses }, createdAt: { gte: last7 } },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        prisma.order.aggregate({
          where: { status: { in: paidStatuses }, createdAt: { gte: last30 } },
          _sum: { totalAmount: true },
          _count: { _all: true },
        }),
        prisma.order.count({
          where: { status: { in: [OrderStatus.PAID, OrderStatus.FULFILLMENT_PENDING] } },
        }),
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM "ProductVariant"
          WHERE "stockQuantity" <= "lowStockThreshold"
        `,
        prisma.cart.count({
          where: {
            updatedAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        }),
      ]);

    const totalOrders30d = last30Revenue._count._all;
    const totalRevenue30d = last30Revenue._sum?.totalAmount ?? 0;
    const aov = totalOrders30d > 0 ? Math.round(totalRevenue30d / totalOrders30d) : 0;

    return NextResponse.json({
      revenue: {
        today: todayRevenue._sum?.totalAmount ?? 0,
        last7Days: last7Revenue._sum?.totalAmount ?? 0,
        last30Days: totalRevenue30d,
      },
      orders: {
        today: todayRevenue._count._all,
        last7Days: last7Revenue._count._all,
        last30Days: totalOrders30d,
      },
      averageOrderValue: aov,
      pendingFulfilment,
      lowStockAlerts: Number(lowStock[0]?.count ?? 0),
      activeCarts,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Analytics summary error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
