"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer } from "react-leaflet";
import L from "leaflet";

import lotsData from "@/data/lots.json";
import type { LatLng, LotData, PrivateLot } from "@/lib/types";
import LotInfoCard from "./LotInfoCard";
import Legend from "./Legend";
import FilterBar from "./FilterBar";

// Average of polygon vertices. Works for the roughly-rectangular tailgate lots
// in our seed data; if a lot is heavily concave we'd switch to a manual anchor.
function polygonCentroid(points: LatLng[]): LatLng {
  const lat = points.reduce((s, [a]) => s + a, 0) / points.length;
  const lng = points.reduce((s, [, b]) => s + b, 0) / points.length;
  return [lat, lng];
}

// New Highmark Stadium (under construction, opening 2026 season).
// Across Abbott Rd from the old stadium.
const STADIUM_CENTER: [number, number] = [42.77350, -78.79222];

// Initial map view — centered on the bounding box of all seeded lots (not
// the stadium itself) and zoomed out enough that most lots are visible on
// first load, so fans get oriented before having to pan/zoom themselves.
const DEFAULT_VIEW_CENTER: [number, number] = [42.77485, -78.78663];
const DEFAULT_ZOOM = 15;

// Mapbox Satellite Streets gives us proper labels designed for satellite
// imagery — no more hand-placed road markers. Token set via
// NEXT_PUBLIC_MAPBOX_TOKEN in .env.local. If missing, falls back to bare
// Esri satellite so the map still renders.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Private lots: Bills navy fill + navy stroke at rest, Bills red stroke on
// hover. The red-on-blue swap reads as a clear interactivity cue and stays
// inside the Bills color palette.
const PRIVATE_STYLE = {
  color: "#00338D",
  weight: 2,
  fillColor: "#00338D",
  fillOpacity: 0.35,
} as const;

const PRIVATE_HOVER_STYLE = {
  color: "#C60C30",
  weight: 4,
  fillColor: "#00338D",
  fillOpacity: 0.55,
} as const;

// Stadium-owned lots: grey, dashed, non-interactive. No polygons yet (we're
// waiting on accurate Bills-published coords), but the style is ready for
// when they're seeded.
const STADIUM_STYLE = {
  color: "#6B7280",
  weight: 2,
  fillColor: "#6B7280",
  fillOpacity: 0.25,
  dashArray: "6 6",
} as const;

// lots.json's inferred JSON shape (plain number[] coordinate pairs, and a
// label_anchor present on only some lots) is structurally looser than the
// LotData/LatLng tuple types, so TypeScript can't verify the cast directly.
// We trust the seed data matches the schema, so cast through `unknown`.
const data = lotsData as unknown as LotData;

// Only "live" lots belong on the public map — "pending_review" and
// "archived" are admin-facing workflow states, not visible to fans.
const liveLots = data.private_lots.filter((lot) => lot.status === "live");

// Filter slider bounds (KAN-31 AC5) — derived from the actual live-lot
// dataset rather than hardcoded, so they stay correct as lots are added.
const PRICE_BOUNDS: [number, number] = [
  Math.min(...liveLots.map((lot) => lot.price_usd)),
  Math.max(...liveLots.map((lot) => lot.price_usd)),
];
const WALK_BOUNDS: [number, number] = [
  Math.min(...liveLots.map((lot) => lot.walk_minutes)),
  Math.max(...liveLots.map((lot) => lot.walk_minutes)),
];

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLot, setHoveredLot] = useState<PrivateLot | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [priceRange, setPriceRange] = useState<[number, number]>(PRICE_BOUNDS);
  const [walkRange, setWalkRange] = useState<[number, number]>(WALK_BOUNDS);

  // AC6: a lot must fall within both ranges simultaneously to stay visible.
  const filteredLots = useMemo(
    () =>
      liveLots.filter(
        (lot) =>
          lot.price_usd >= priceRange[0] &&
          lot.price_usd <= priceRange[1] &&
          lot.walk_minutes >= walkRange[0] &&
          lot.walk_minutes <= walkRange[1]
      ),
    [priceRange, walkRange]
  );

  // If the hovered lot gets filtered out from under the cursor, its polygon
  // unmounts without ever firing mouseout — clear the orphaned card instead
  // of leaving it floating with nothing underneath.
  useEffect(() => {
    if (hoveredLot && !filteredLots.some((lot) => lot.id === hoveredLot.id)) {
      setHoveredLot(null);
    }
  }, [filteredLots, hoveredLot]);

  const stadiumIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div class="stadium-label">Highmark Stadium</div>`,
        iconSize: [200, 32],
        iconAnchor: [100, 16],
      }),
    []
  );

  // One icon per lot, memoized so React doesn't recreate them on every render.
  const priceIcons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const lot of liveLots) {
      map.set(
        lot.id,
        L.divIcon({
          className: "",
          html: `<div class="price-tab">$${lot.price_usd}</div>`,
          iconSize: [56, 26],
          iconAnchor: [28, 13],
        })
      );
    }
    return map;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const cardPosition = useMemo(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const containerWidth = rect?.width ?? 1200;
    const containerHeight = rect?.height ?? 800;
    const CARD_WIDTH = 320;
    const CARD_HEIGHT_ESTIMATE = 360;
    const OFFSET = 16;

    const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0));

    const flipX = cursor.x + OFFSET + CARD_WIDTH > containerWidth;
    const flipY = cursor.y + OFFSET + CARD_HEIGHT_ESTIMATE > containerHeight;
    let pos = {
      left: flipX ? cursor.x - OFFSET - CARD_WIDTH : cursor.x + OFFSET,
      top: flipY ? cursor.y - OFFSET - CARD_HEIGHT_ESTIMATE : cursor.y + OFFSET,
    };

    // Nudge the card clear of the fixed "Highmark Stadium" label (KAN-10
    // AC4) if the default cursor-relative position would land on top of it.
    // Prefer sliding below/above the label (kept within container bounds)
    // over the container-edge flip above, which can push the card
    // off-screen when the label sits near a viewport edge.
    if (rect) {
      const stadiumEl = containerRef.current?.querySelector<HTMLElement>(".stadium-label");
      if (stadiumEl) {
        const sRect = stadiumEl.getBoundingClientRect();
        const stadiumBox = {
          left: sRect.left - rect.left,
          top: sRect.top - rect.top,
          right: sRect.right - rect.left,
          bottom: sRect.bottom - rect.top,
        };
        const overlaps = (p: { left: number; top: number }) =>
          p.left < stadiumBox.right &&
          p.left + CARD_WIDTH > stadiumBox.left &&
          p.top < stadiumBox.bottom &&
          p.top + CARD_HEIGHT_ESTIMATE > stadiumBox.top;

        if (overlaps(pos)) {
          const candidates = [
            { left: pos.left, top: stadiumBox.bottom + OFFSET }, // below label
            { left: pos.left, top: stadiumBox.top - OFFSET - CARD_HEIGHT_ESTIMATE }, // above label
            { left: stadiumBox.right + OFFSET, top: pos.top }, // right of label
            { left: stadiumBox.left - OFFSET - CARD_WIDTH, top: pos.top }, // left of label
          ];
          const fitsContainer = (p: { left: number; top: number }) =>
            p.left >= 0 &&
            p.top >= 0 &&
            p.left + CARD_WIDTH <= containerWidth &&
            p.top + CARD_HEIGHT_ESTIMATE <= containerHeight;

          const clear = candidates.find((c) => fitsContainer(c) && !overlaps(c));
          pos = clear ?? pos;
        }
      }
    }

    return {
      left: clamp(pos.left, containerWidth - CARD_WIDTH),
      top: clamp(pos.top, containerHeight - CARD_HEIGHT_ESTIMATE),
    };
  }, [cursor]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Normal document flow, not an overlay — an absolutely-positioned bar
          here would sit on top of and hide Leaflet's zoom controls, which
          also claim the top-left corner. */}
      <FilterBar
        priceBounds={PRICE_BOUNDS}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        walkBounds={WALK_BOUNDS}
        walkRange={walkRange}
        onWalkRangeChange={setWalkRange}
      />

      <div
        ref={containerRef}
        className="relative flex-1"
        onMouseMove={handleMouseMove}
      >
        <MapContainer
          center={DEFAULT_VIEW_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {MAPBOX_TOKEN ? (
            <TileLayer
              attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
              tileSize={512}
              zoomOffset={-1}
              maxZoom={19}
            />
          ) : (
            // Fallback when NEXT_PUBLIC_MAPBOX_TOKEN isn't set — free, keyless
            // Esri satellite imagery with a road-labels overlay stacked on top
            // (KAN-28), so street names show without requiring any account.
            <>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <TileLayer
                attribution='Labels &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </>
          )}

          {data.stadium_lots.map((lot) => (
            <Polygon
              key={lot.id}
              positions={lot.polygon_coordinates}
              pathOptions={STADIUM_STYLE}
              interactive={false}
            />
          ))}

          {filteredLots.map((lot) => {
            const isHovered = hoveredLot?.id === lot.id;
            return (
              <Polygon
                key={lot.id}
                positions={lot.polygon_coordinates}
                pathOptions={isHovered ? PRIVATE_HOVER_STYLE : PRIVATE_STYLE}
                eventHandlers={{
                  mouseover: () => setHoveredLot(lot),
                  mouseout: () => setHoveredLot(null),
                }}
              />
            );
          })}

          {filteredLots.map((lot) => {
            const icon = priceIcons.get(lot.id);
            if (!icon) return null;
            return (
              <Marker
                key={`price-${lot.id}`}
                position={lot.label_anchor ?? polygonCentroid(lot.polygon_coordinates)}
                icon={icon}
                interactive={false}
              />
            );
          })}

          <Marker position={STADIUM_CENTER} icon={stadiumIcon} interactive={false} />
        </MapContainer>

        <Legend />

        {hoveredLot && (
          <div
            className="absolute pointer-events-none z-[1000]"
            style={{ left: cardPosition.left, top: cardPosition.top }}
          >
            <LotInfoCard lot={hoveredLot} />
          </div>
        )}
      </div>
    </div>
  );
}
