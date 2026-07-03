import type { Amenity, PaymentMethod } from "./types";

export const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  venmo: "Venmo",
  zelle: "Zelle",
  card: "Card",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
};

export const amenityLabels: Record<Amenity, string> = {
  porta_potty: "Porta-potty",
  indoor_bathrooms: "Indoor bathrooms",
  grills_allowed: "Grills allowed",
  generators_allowed: "Generators allowed",
  rvs_allowed: "RVs/campers allowed",
  rv_hookups: "RV hookups",
  overnight_parking: "Overnight parking",
  tents_allowed: "Tents allowed",
  shuttle_to_stadium: "Shuttle to stadium",
  lights: "Overhead lighting",
};

export function formatLastUpdated(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
