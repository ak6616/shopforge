import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/orders";

const IntentSchema = z.object({
  cartToken: z.string(),
  addressId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = IntentSchema.parse(await req.json());

    const cart = await prisma.cart.findUnique({
      where: { token: body.cartToken },
      include: { items: { include: { variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty or not found" },
        { status: 400 }
      );
    }

    // Validate stock
    for (const item of cart.items) {
      if (item.variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for SKU ${item.variant.sku}` },
          { status: 409 }
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );
    const shippingAmount = 0; // Free shipping for now
    const taxAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    const order = await prisma.order.create({
      data: {
        orderNumber: await generateOrderNumber(),
        userId: cart.userId,
        addressId: body.addressId,
        status: "PENDING",
        currency: cart.currency,
        subtotalAmount: subtotal,
        shippingAmount,
        taxAmount,
        totalAmount,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        items: {
          create: cart.items.map((item: { variantId: string; variant: { name: string; sku: string }; quantity: number; unitPrice: number }) => ({
            variantId: item.variantId,
            productName: item.variant.name,
            variantName: item.variant.name,
            sku: item.variant.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
        events: {
          create: {
            type: "CREATED",
            description: "Order created from cart",
            source: "system",
          },
        },
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: cart.currency.toLowerCase(),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cartToken: body.cartToken,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        status: "PAYMENT_PROCESSING",
      },
    });

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_INITIATED",
        description: `PaymentIntent ${paymentIntent.id} created`,
        source: "system",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Checkout intent error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
