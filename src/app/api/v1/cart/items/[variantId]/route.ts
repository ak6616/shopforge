import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const body = UpdateItemSchema.parse(await req.json());
    const cartToken = req.cookies.get("cart_token")?.value;

    if (!cartToken) {
      return NextResponse.json({ error: "No cart found" }, { status: 404 });
    }

    const cart = await prisma.cart.findUnique({
      where: { token: cartToken },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const item = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    if (body.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
      return NextResponse.json({ message: "Item removed from cart" });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (variant && variant.stockQuantity < body.quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 409 }
      );
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: body.quantity },
    });

    return NextResponse.json({ message: "Cart item updated" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Cart update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const cartToken = req.cookies.get("cart_token")?.value;

    if (!cartToken) {
      return NextResponse.json({ error: "No cart found" }, { status: 404 });
    }

    const cart = await prisma.cart.findUnique({
      where: { token: cartToken },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, variantId },
    });

    return NextResponse.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("Cart delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
