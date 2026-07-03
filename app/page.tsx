import MapClient from "@/components/MapClient";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-slate-900">
      <header className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Highmark Tailgate Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Private tailgate lots around the new Bills stadium · Hover a red lot for details
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          POC · Data is illustrative, not verified
        </div>
      </header>

      <div className="flex-1 relative">
        <MapClient />
      </div>
    </main>
  );
}
