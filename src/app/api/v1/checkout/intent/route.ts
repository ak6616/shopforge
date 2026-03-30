import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/orders";

const AddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(2),
});

const CartItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().min(1),
});

const IntentSchema = z.object({
  email: z.string().email(),
  cartItems: z.array(CartItemSchema).min(1),
  shippingAddress: AddressSchema,
  shippingMethod: z.string().default("standard"),
});

const SHIPPING_AMOUNTS: Record<string, number> = {
  standard: 0,
  express: 999,
  overnight: 2499,
};

export async function POST(req: NextRequest) {
  try {
    const body = IntentSchema.parse(await req.json());

    // Resolve variants and validate stock
    const variantIds = body.cartItems.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json(
        { error: "One or more cart items reference invalid variants" },
        { status: 400 }
      );
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of body.cartItems) {
      const variant = variantMap.get(item.variantId)!;
      if (variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for SKU ${variant.sku}` },
          { status: 409 }
        );
      }
    }

    const subtotal = body.cartItems.reduce((sum, item) => {
      const variant = variantMap.get(item.variantId)!;
      return sum + variant.priceAmount * item.quantity;
    }, 0);

    const shippingAmount = SHIPPING_AMOUNTS[body.shippingMethod] ?? 0;
    const taxAmount = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    // Find or create a guest user record for this email
    let user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: body.email,
          firstName: body.shippingAddress.firstName,
          lastName: body.shippingAddress.lastName,
          role: "CUSTOMER",
        },
      });
    }

    // Create address record
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        line1: body.shippingAddress.address1,
        line2: body.shippingAddress.address2 ?? null,
        city: body.shippingAddress.city,
        state: body.shippingAddress.state,
        postalCode: body.shippingAddress.postalCode,
        country: body.shippingAddress.country,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: await generateOrderNumber(),
        userId: user.id,
        addressId: address.id,
        status: "PENDING",
        currency: "PLN",
        subtotalAmount: subtotal,
        shippingAmount,
        taxAmount,
        totalAmount,
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
        items: {
          create: body.cartItems.map((item) => {
            const variant = variantMap.get(item.variantId)!;
            return {
              variantId: item.variantId,
              productName: variant.name,
              variantName: variant.name,
              sku: variant.sku,
              quantity: item.quantity,
              unitPrice: variant.priceAmount,
              totalPrice: variant.priceAmount * item.quantity,
            };
          }),
        },
        events: {
          create: {
            type: "CREATED",
            description: "Order created from checkout",
            source: "system",
          },
        },
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "pln",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
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
