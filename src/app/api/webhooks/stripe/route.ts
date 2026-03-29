import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.webhookLog.findUnique({
    where: { source_eventId: { source: "stripe", eventId: event.id } },
  });
  if (existing) return NextResponse.json({ received: true });

  try {
    await handleStripeEvent(event);
    await prisma.webhookLog.create({
      data: {
        source: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(event)),
        status: "processed",
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await prisma.webhookLog.create({
      data: {
        source: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(event)),
        status: "failed",
        error: errorMessage,
      },
    });
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.orderId;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.$transaction(async (tx: any) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
          include: { items: true },
        });

        await tx.payment.create({
          data: {
            orderId,
            stripePaymentIntentId: pi.id,
            stripeChargeId: pi.latest_charge as string,
            amount: pi.amount,
            currency: pi.currency,
            status: "SUCCEEDED",
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId,
            type: "PAYMENT_SUCCEEDED",
            description: `PaymentIntent ${pi.id} succeeded`,
            source: "stripe",
            metadata: { chargeId: pi.latest_charge },
          },
        });

        // Decrement stock
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.orderId;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAYMENT_FAILED" },
      });

      await prisma.orderEvent.create({
        data: {
          orderId,
          type: "PAYMENT_FAILED",
          description: pi.last_payment_error?.message || "Payment failed",
          source: "stripe",
        },
      });
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const payment = await prisma.payment.findFirst({
        where: { stripeChargeId: charge.id },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmount: charge.amount_refunded,
            status: charge.refunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
          },
        });

        await prisma.orderEvent.create({
          data: {
            orderId: payment.orderId,
            type: "PAYMENT_REFUNDED",
            description: `Refund of ${charge.amount_refunded} ${charge.currency}`,
            source: "stripe",
          },
        });
      }
      break;
    }

    default:
      break;
  }
}
