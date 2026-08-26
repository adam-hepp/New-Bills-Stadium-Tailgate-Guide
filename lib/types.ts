// ----------------------------------------------------------------------------
// Bills Tailgate Map — MVP Lot Schema
//
// This file is the source of truth for the lot data model. Every field listed
// here is required for MVP. Fields the PRD explicitly excludes from MVP are
// documented at the bottom of this file so the next contributor knows why
// they're missing (and can find them when we're ready for v2).
// ----------------------------------------------------------------------------

// A polygon is an ordered list of [lat, lng] points. Leaflet expects this shape.
export type LatLng = [number, number];
export type Polygon = LatLng[];

export type PaymentMethod =
  | "cash"
  | "venmo"
  | "zelle"
  | "card"
  | "paypal"
  | "apple_pay";

export type Amenity =
  | "porta_potty"
  | "indoor_bathrooms"
  | "grills_allowed"
  | "generators_allowed"
  | "rvs_allowed"
  | "rv_hookups"
  | "overnight_parking"
  | "tents_allowed"
  | "shuttle_to_stadium"
  | "lights";

// "live" renders on the public map. "pending_review" is a submission awaiting
// admin approval. "archived" is hidden but kept for history.
export type LotStatus = "live" | "pending_review" | "archived";

// The season the public-facing UI is currently displaying. Used to compare
// against each lot's `verified_for_season` value — a lot with a matching
// year shows the "Season Verified" badge. Bump this every August when the
// new season's data has been re-verified.
export const CURRENT_SEASON = 2026;

export interface PrivateLot {
  // Stable kebab-case slug used as React key and URL fragment.
  id: string;

  // Public-facing display name, as the lot owner advertises it.
  name: string;

  // Street address for the hover card. Optional since not every seeded lot
  // has one confirmed yet — shown as "Not yet listed" when omitted.
  address?: string;

  // Ordered [lat, lng] points outlining the lot on the satellite map.
  // Admin-controlled only — not user-submittable.
  polygon_coordinates: Polygon;

  // Per-car, per-game price in whole US dollars.
  price_usd: number;

  // Accepted payment methods. Order is preserved for display.
  payment_methods: PaymentMethod[];

  // Walking minutes from the lot entrance to Highmark Stadium's main entrance,
  // manually verified via Google Maps. Admin-controlled — not user-submittable.
  walk_minutes: number;

  // On-site amenities. Empty array is valid (bring-your-own lots exist).
  amenities: Amenity[];

  // ISO-8601 date the lot data was last verified or edited (YYYY-MM-DD).
  last_updated: string;

  // Free-form provenance — where the info originally came from.
  // Examples: "Reddit r/buffalobills", "Bills Mafia Facebook group",
  // "Direct outreach", "User submission".
  source: string;

  // Workflow state controlling whether the lot is visible to the public.
  status: LotStatus;

  // Season year (e.g. 2026) that this lot's price, payment methods, and
  // amenities have been explicitly confirmed for. `null` if not yet verified.
  // Drives the "Season Verified" trust badge on the hover card — only shown
  // when this value matches CURRENT_SEASON. Distinct from `last_updated`,
  // which only tracks edit recency, not verification.
  verified_for_season: number | null;

  // Optional override for where the price tag renders on the map. Defaults
  // to the polygon's centroid when omitted. Set this when a lot sits close
  // enough to a neighbor that their price tags would otherwise overlap.
  label_anchor?: LatLng;
}

// Stadium-owned lots are visual-only context — grey, non-interactive.
// They have no schema beyond an id, label, and polygon.
export interface StadiumLot {
  id: string;
  name: string;
  polygon_coordinates: Polygon;
}

export interface LotData {
  private_lots: PrivateLot[];
  stadium_lots: StadiumLot[];
}

// ----------------------------------------------------------------------------
// Excluded from MVP (do not add to PrivateLot until the relevant epic ships):
//
//   vibe_tags       — v2. Tag set TBD (rowdy, family-friendly, etc.).
//   owner_name      — Out of scope. Removed for privacy/scope reasons.
//   owner_contact   — Out of scope. Removed for privacy/scope reasons.
//   exit_direction  — Out of scope. Post-game exit routing isn't needed for MVP.
//   exit_roads      — Out of scope. Post-game exit routing isn't needed for MVP.
// ----------------------------------------------------------------------------
