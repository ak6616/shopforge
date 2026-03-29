import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        children: true,
        products: {
          include: {
            product: {
              include: {
                variants: true,
                images: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (err) {
    console.error("Category get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
