"use client";

import { useState } from "react";
import MapClient from "@/components/MapClient";
import SuggestLotModal from "@/components/SuggestLotModal";

type ModalType = "new_lot" | "correction" | null;

export default function Home() {
  const [modalType, setModalType] = useState<ModalType>(null);

  return (
    <main className="h-screen w-screen flex flex-col bg-slate-900">
      <header className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Highmark Tailgate Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Private tailgate lots around the new Bills stadium · Hover a red lot for details
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setModalType("correction")}
            className="whitespace-nowrap rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400"
          >
            Report an Issue
          </button>
          <button
            type="button"
            onClick={() => setModalType("new_lot")}
            className="whitespace-nowrap rounded-md bg-bills-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-bills-red/90"
          >
            Add a Lot
          </button>
          <div className="hidden sm:block text-[11px] text-slate-500">
            POC · Data is illustrative, not verified
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapClient />
      </div>

      {modalType && (
        <SuggestLotModal initialType={modalType} onClose={() => setModalType(null)} />
      )}
    </main>
  );
}
