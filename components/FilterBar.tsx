"use client";

import { useState } from "react";
import { CURRENT_SEASON } from "@/lib/types";
import type { Amenity, PaymentMethod } from "@/lib/types";
import { amenityLabels, paymentLabels } from "@/lib/labels";
import DualRangeSlider from "./DualRangeSlider";
import FilterToggle from "./FilterToggle";

// KAN-32: only these three are offered as filter toggles, by request — not
// the full PaymentMethod union (zelle/paypal/apple_pay stay valid lot data,
// just aren't surfaced as filter options here).
const FILTERABLE_PAYMENT_METHODS: PaymentMethod[] = ["cash", "venmo", "card"];

interface Props {
  priceBounds: [number, number];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  walkBounds: [number, number];
  walkRange: [number, number];
  onWalkRangeChange: (range: [number, number]) => void;
  selectedPaymentMethods: PaymentMethod[];
  onTogglePaymentMethod: (method: PaymentMethod) => void;
  verifiedOnly: boolean;
  onToggleVerifiedOnly: () => void;
  amenityOptions: Amenity[];
  selectedAmenities: Amenity[];
  onToggleAmenity: (amenity: Amenity) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function FilterBar({
  priceBounds,
  priceRange,
  onPriceRangeChange,
  walkBounds,
  walkRange,
  onWalkRangeChange,
  selectedPaymentMethods,
  onTogglePaymentMethod,
  verifiedOnly,
  onToggleVerifiedOnly,
  amenityOptions,
  selectedAmenities,
  onToggleAmenity,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  // KAN-36 AC1: below `md`, the full filter bar would push the map almost
  // entirely off-screen, so it collapses behind this toggle on small
  // viewports. At `md` and above it's always expanded — same layout as
  // before this story, untouched.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-bills-blue shadow-lg">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="md:hidden w-full flex items-center justify-between px-4 py-3 text-white text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-bills-red" aria-hidden="true" />
          )}
        </span>
        <span className="text-white/70 text-xs">{mobileOpen ? "Hide ▲" : "Show ▼"}</span>
      </button>

      <div
        className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-wrap gap-x-10 gap-y-3 px-4 pb-3 md:pt-3`}
      >
        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wide text-white/80">
              Price
            </span>
            <span className="text-sm font-semibold text-white tabular-nums">
              ${priceRange[0]}–${priceRange[1]}
            </span>
          </div>
          <DualRangeSlider
            min={priceBounds[0]}
            max={priceBounds[1]}
            value={priceRange}
            onChange={onPriceRangeChange}
          />
        </div>

        <div className="flex-1 min-w-[200px] max-w-xs">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wide text-white/80">
              Walking distance
            </span>
            <span className="text-sm font-semibold text-white tabular-nums">
              {walkRange[0]}–{walkRange[1]} min walk
            </span>
          </div>
          <DualRangeSlider
            min={walkBounds[0]}
            max={walkBounds[1]}
            value={walkRange}
            onChange={onWalkRangeChange}
          />
        </div>

        <div className="flex-1 min-w-[240px]">
          <div className="text-xs uppercase tracking-wide text-white/80 mb-1.5">
            Payment
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERABLE_PAYMENT_METHODS.map((method) => (
              <FilterToggle
                key={method}
                label={paymentLabels[method]}
                active={selectedPaymentMethods.includes(method)}
                onToggle={() => onTogglePaymentMethod(method)}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[160px]">
          <div className="text-xs uppercase tracking-wide text-white/80 mb-1.5">
            Verified
          </div>
          <FilterToggle
            label={`${CURRENT_SEASON} Season Verified`}
            active={verifiedOnly}
            onToggle={onToggleVerifiedOnly}
          />
        </div>

        {amenityOptions.length > 0 && (
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs uppercase tracking-wide text-white/80 mb-1.5">
              Amenities
            </div>
            <div className="flex flex-wrap gap-1.5">
              {amenityOptions.map((amenity) => (
                <FilterToggle
                  key={amenity}
                  label={amenityLabels[amenity]}
                  active={selectedAmenities.includes(amenity)}
                  onToggle={() => onToggleAmenity(amenity)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="rounded-full px-3 py-1 text-xs font-semibold border border-white/30 text-white/80 hover:border-white/60 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}
