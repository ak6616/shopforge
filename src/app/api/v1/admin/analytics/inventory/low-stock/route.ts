import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const lowStockVariants = await prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        stockQuantity: number;
        lowStockThreshold: number;
        productId: string;
        productName: string;
      }>
    >`
      SELECT pv."id", pv."sku", pv."name", pv."stockQuantity",
             pv."lowStockThreshold", pv."productId",
             p."name" as "productName"
      FROM "ProductVariant" pv
      JOIN "Product" p ON p."id" = pv."productId"
      WHERE pv."stockQuantity" <= pv."lowStockThreshold"
        AND p."deletedAt" IS NULL
      ORDER BY pv."stockQuantity" ASC
    `;

    return NextResponse.json({ variants: lowStockVariants });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Low stock error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
