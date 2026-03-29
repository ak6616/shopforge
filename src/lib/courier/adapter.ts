export type CourierEventType =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "returned"
  | "unknown";

export interface NormalizedCourierEvent {
  eventId: string;
  trackingId: string;
  type: CourierEventType;
  description: string;
  trackingUrl?: string;
  occurredAt: Date;
}

export function normalizeCourierEvent(
  payload: Record<string, unknown>,
  provider: string
): NormalizedCourierEvent {
  switch (provider) {
    case "easypost":
      return normalizeEasyPost(payload);
    case "shipengine":
      return normalizeShipEngine(payload);
    default:
      return normalizeGeneric(payload);
  }
}

function normalizeEasyPost(payload: Record<string, unknown>): NormalizedCourierEvent {
  const result = payload.result as Record<string, unknown> | undefined;
  return {
    eventId: (payload.id as string) || String(Date.now()),
    trackingId: (result?.tracking_code as string) || "",
    type: mapEasyPostStatus((result?.status as string) || ""),
    description: (result?.status_detail as string) || "",
    trackingUrl: result?.public_url as string | undefined,
    occurredAt: new Date((payload.created_at as string) || Date.now()),
  };
}

function normalizeShipEngine(payload: Record<string, unknown>): NormalizedCourierEvent {
  const data = payload.data as Record<string, unknown> | undefined;
  return {
    eventId: (payload.message_id as string) || String(Date.now()),
    trackingId: (data?.tracking_number as string) || "",
    type: mapShipEngineStatus((data?.status_code as string) || ""),
    description: (data?.status_description as string) || "",
    trackingUrl: undefined,
    occurredAt: new Date((data?.occurred_at as string) || Date.now()),
  };
}

function normalizeGeneric(payload: Record<string, unknown>): NormalizedCourierEvent {
  return {
    eventId: (payload.eventId as string) || (payload.event_id as string) || String(Date.now()),
    trackingId: (payload.trackingId as string) || (payload.tracking_id as string) || "",
    type: (payload.type as CourierEventType) || "unknown",
    description: (payload.description as string) || "",
    trackingUrl: payload.trackingUrl as string | undefined,
    occurredAt: new Date((payload.occurredAt as string) || Date.now()),
  };
}

function mapEasyPostStatus(status: string): CourierEventType {
  const map: Record<string, CourierEventType> = {
    pre_transit: "label_created",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    return_to_sender: "returned",
    failure: "delivery_failed",
  };
  return map[status] || "unknown";
}

function mapShipEngineStatus(status: string): CourierEventType {
  const map: Record<string, CourierEventType> = {
    AC: "label_created",
    IT: "in_transit",
    OD: "out_for_delivery",
    DE: "delivered",
    EX: "delivery_failed",
    RS: "returned",
  };
  return map[status] || "unknown";
}
