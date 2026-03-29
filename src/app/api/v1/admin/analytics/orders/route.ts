import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin orders error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
