"use client";

import DualRangeSlider from "./DualRangeSlider";

interface Props {
  priceBounds: [number, number];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  walkBounds: [number, number];
  walkRange: [number, number];
  onWalkRangeChange: (range: [number, number]) => void;
}

export default function FilterBar({
  priceBounds,
  priceRange,
  onPriceRangeChange,
  walkBounds,
  walkRange,
  onWalkRangeChange,
}: Props) {
  return (
    <div className="bg-bills-blue px-4 py-3 flex flex-wrap gap-x-10 gap-y-3 shadow-lg">
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
    </div>
  );
}
