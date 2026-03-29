import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCourierEvent, CourierEventType } from "@/lib/courier/adapter";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-courier-signature") || "";
  const provider = req.headers.get("x-courier-provider") || "default";

  // Verify HMAC signature
  const secret = process.env.COURIER_WEBHOOK_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = JSON.parse(rawBody);
  const event = normalizeCourierEvent(payload, provider);

  // Idempotency
  const dup = await prisma.webhookLog.findUnique({
    where: { source_eventId: { source: "courier", eventId: event.eventId } },
  });
  if (dup) return NextResponse.json({ received: true });

  const order = await prisma.order.findFirst({
    where: { courierTrackingId: event.trackingId },
  });

  if (!order) {
    await prisma.webhookLog.create({
      data: {
        source: "courier",
        eventId: event.eventId,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(payload)),
        status: "ignored",
        error: `No order found for trackingId ${event.trackingId}`,
      },
    });
    return NextResponse.json({ received: true });
  }

  const newStatus = mapCourierEventToOrderStatus(event.type);
  const eventType = mapCourierEventToOrderEventType(event.type);

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: (newStatus || order.status) as "PENDING",
        trackingUrl: event.trackingUrl || order.trackingUrl,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: eventType as "TRACKING_UPDATED",
        description: event.description,
        metadata: { provider, rawEvent: payload },
        source: "courier",
      },
    }),
    prisma.webhookLog.create({
      data: {
        source: "courier",
        eventId: event.eventId,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(payload)),
        status: "processed",
      },
    }),
  ]);

  return NextResponse.json({ received: true });
}

function mapCourierEventToOrderStatus(
  eventType: CourierEventType
): string | null {
  const map: Partial<Record<CourierEventType, string>> = {
    label_created: "FULFILLMENT_PENDING",
    picked_up: "SHIPPED",
    in_transit: "SHIPPED",
    out_for_delivery: "SHIPPED",
    delivered: "DELIVERED",
    delivery_failed: "ON_HOLD",
    returned: "ON_HOLD",
  };
  return map[eventType] || null;
}

function mapCourierEventToOrderEventType(
  eventType: CourierEventType
): string {
  const map: Partial<Record<CourierEventType, string>> = {
    label_created: "STATUS_CHANGED",
    picked_up: "SHIPPED",
    in_transit: "TRACKING_UPDATED",
    out_for_delivery: "OUT_FOR_DELIVERY",
    delivered: "DELIVERED",
    delivery_failed: "STATUS_CHANGED",
    returned: "STATUS_CHANGED",
  };
  return map[eventType] || "TRACKING_UPDATED";
}
