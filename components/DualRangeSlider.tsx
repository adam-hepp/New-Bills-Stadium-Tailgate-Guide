"use client";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

// Two overlapping native range inputs, each only clickable/draggable via its
// own thumb (see .dual-range-input in globals.css) — the standard
// lightweight way to build a dual-handle slider without a new dependency.
export default function DualRangeSlider({ min, max, value, onChange, step = 1 }: Props) {
  const [low, high] = value;
  const span = max - min || 1;

  const handleLowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.min(Number(e.target.value), high - step);
    onChange([Math.max(min, next), high]);
  };

  const handleHighChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(Number(e.target.value), low + step);
    onChange([low, Math.min(max, next)]);
  };

  const lowPercent = ((low - min) / span) * 100;
  const highPercent = ((high - min) / span) * 100;

  return (
    <div className="relative h-5 flex items-center">
      <div className="absolute w-full h-1 bg-white/25 rounded-full" />
      <div
        className="absolute h-1 bg-bills-red rounded-full"
        style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={handleLowChange}
        className="dual-range-input"
        aria-label="Minimum"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={handleHighChange}
        className="dual-range-input"
        aria-label="Maximum"
      />
    </div>
  );
}
