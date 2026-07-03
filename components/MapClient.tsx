"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so the map module must only load in the
// browser. `ssr: false` is allowed inside a client component.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
      Loading map…
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
