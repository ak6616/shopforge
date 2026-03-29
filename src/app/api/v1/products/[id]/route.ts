import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Support lookup by id or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        deletedAt: null,
      },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("Product get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
