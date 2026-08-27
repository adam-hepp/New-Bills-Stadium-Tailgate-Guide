"use client";

interface Props {
  label: string;
  active: boolean;
  onToggle: () => void;
}

// Small pill-style toggle button used for on/off filters in the filter bar
// (payment method, season-verified) — as opposed to the range sliders used
// for price/walking distance.
export default function FilterToggle({ label, active, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={
        "rounded-full px-3 py-1 text-xs font-semibold border transition-colors " +
        (active
          ? "bg-bills-red text-white border-bills-red"
          : "bg-transparent text-white/80 border-white/30 hover:border-white/60")
      }
    >
      {label}
    </button>
  );
}
