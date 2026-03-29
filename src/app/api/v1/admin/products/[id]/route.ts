import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  taxCategory: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin product get error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = UpdateProductSchema.parse(await req.json());

    const product = await prisma.product.update({
      where: { id },
      data: body,
      include: {
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json(product);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Admin product update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req);
    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Admin product delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
