"use client";

import type { PrivateLot } from "@/lib/types";
import { CURRENT_SEASON } from "@/lib/types";
import { amenityLabels, formatLastUpdated, paymentLabels } from "@/lib/labels";

interface Props {
  lot: PrivateLot;
}

// NOTE: This is the Epic 3 stub — it renders the MVP schema so the data store
// is provably wired to the map. The Bills-colors visual rebuild (navy bg,
// white text, red accents) happens in Epic 2.
export default function LotInfoCard({ lot }: Props) {
  return (
    <div className="w-80 rounded-lg bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
      <div className="bg-bills-blue px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-white font-semibold text-base leading-tight">
            {lot.name}
          </h3>
          <span className="text-white text-lg font-bold tabular-nums">
            {lot.price_usd > 0 ? `$${lot.price_usd}` : "Price TBD"}
          </span>
        </div>
        <p className="text-blue-100 text-xs mt-0.5">per car · per game</p>
      </div>

      <div className="p-4 space-y-3 text-sm text-slate-700">
        {lot.verified_for_season === CURRENT_SEASON && (
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-semibold">
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
              aria-hidden="true"
            >
              <path d="M2 6.5 5 9.5 10 3" />
            </svg>
            {CURRENT_SEASON} Season Verified
          </div>
        )}
        <Row label="Walk to stadium" value={`${lot.walk_minutes} min walk`} />
        <Row
          label="Payment"
          value={
            lot.payment_methods.length > 0
              ? lot.payment_methods.map((m) => paymentLabels[m]).join(" · ")
              : "Not yet listed"
          }
        />

        {lot.amenities.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              Amenities
            </div>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
              {lot.amenities.map((a) => (
                <li key={a} className="flex items-center gap-1.5">
                  <span className="text-bills-blue">✓</span>
                  {amenityLabels[a]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 border-t border-slate-100 text-right">
        Updated {formatLastUpdated(lot.last_updated)}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-800 text-right">{value}</span>
    </div>
  );
}
