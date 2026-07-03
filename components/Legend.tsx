"use client";

// Legend colors are kept identical to the polygon styles in MapView.tsx
// (Story 3 AC3 — colors must exactly match what's on the map).
const PRIVATE_BLUE = "#00338D";
const STADIUM_GREY = "#6B7280";

export default function Legend() {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur rounded-md shadow-lg ring-1 ring-black/5 px-4 py-3 text-sm">
      <div className="font-semibold text-slate-800 mb-2">Legend</div>
      <div className="space-y-1.5">
        <LegendRow
          color={PRIVATE_BLUE}
          label="Private Tailgate Lots"
          subtitle="Hover for details"
        />
        <LegendRow
          color={STADIUM_GREY}
          label="Stadium Lots"
          subtitle="Not interactive"
          striped
        />
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  subtitle,
  striped = false,
}: {
  color: string;
  label: string;
  subtitle: string;
  striped?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="block w-5 h-5 rounded ring-1 ring-black/20"
        style={{
          background: striped
            ? `repeating-linear-gradient(45deg, ${color}66, ${color}66 4px, transparent 4px, transparent 8px)`
            : `${color}aa`,
          borderColor: color,
        }}
      />
      <div>
        <div className="text-slate-800 leading-tight">{label}</div>
        <div className="text-xs text-slate-500 leading-tight">{subtitle}</div>
      </div>
    </div>
  );
}
