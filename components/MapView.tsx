"use client";

import { useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer } from "react-leaflet";
import L from "leaflet";

import lotsData from "@/data/lots.json";
import type { LatLng, LotData, PrivateLot } from "@/lib/types";
import LotInfoCard from "./LotInfoCard";
import Legend from "./Legend";

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
const DEFAULT_ZOOM = 17;

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

const data = lotsData as LotData;

// Only "live" lots belong on the public map — "pending_review" and
// "archived" are admin-facing workflow states, not visible to fans.
const liveLots = data.private_lots.filter((lot) => lot.status === "live");

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLot, setHoveredLot] = useState<PrivateLot | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

    const flipX = cursor.x + OFFSET + CARD_WIDTH > containerWidth;
    const flipY = cursor.y + OFFSET + CARD_HEIGHT_ESTIMATE > containerHeight;

    return {
      left: flipX ? cursor.x - OFFSET - CARD_WIDTH : cursor.x + OFFSET,
      top: flipY ? cursor.y - OFFSET - CARD_HEIGHT_ESTIMATE : cursor.y + OFFSET,
    };
  }, [cursor]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <MapContainer
        center={STADIUM_CENTER}
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

        {liveLots.map((lot) => {
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

        {liveLots.map((lot) => {
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
  );
}
