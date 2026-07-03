# Bills Tailgate Map

Interactive, browser-based map of private tailgate parking lots around the new Highmark Stadium in Orchard Park, NY. Bills fans planning their gameday hover a blue lot to see price, payment methods, walk time, and amenities — and pick the right spot before they leave home.

Desktop-only for MVP. Targeting launch before the first Bills home game of the 2026 season.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Leaflet** + **react-leaflet** with Esri World Imagery satellite tiles (free, no API key)
- Lot data lives in [`data/lots.json`](data/lots.json) and is enforced by the schema in [`lib/types.ts`](lib/types.ts).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Mapbox satellite (recommended)

The map uses Mapbox Satellite Streets for hybrid satellite imagery with road labels designed for aerial backgrounds. Setup:

1. Sign up at [mapbox.com](https://mapbox.com) (free).
2. Go to [account.mapbox.com](https://account.mapbox.com) → Access tokens.
3. Copy the **Default public token** (starts with `pk.`).
4. Create a `.env.local` file in the project root with:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```
5. Restart `npm run dev`.

The free tier gives 50,000 map loads/month — plenty for portfolio and early traffic.

If `NEXT_PUBLIC_MAPBOX_TOKEN` is unset, the map falls back to bare Esri satellite (no labels) so it still renders. Add the token when you're ready for the polished hybrid view.

Vercel deployment: add the same env var in the Vercel project settings → Environment Variables.

## Data store

All lot data lives in a single JSON file: [`data/lots.json`](data/lots.json). It's the single source of truth — change the file, redeploy, the map updates.

The file has two top-level arrays:

- `private_lots[]` — the blue, interactive lots. Full MVP schema (see below).
- `stadium_lots[]` — the grey, non-interactive Bills-owned lots. Visual context only (`id`, `name`, `polygon_coordinates`).

### MVP lot schema

Every entry in `private_lots[]` must match this shape:

| Field                 | Type                  | Notes |
|-----------------------|-----------------------|-------|
| `id`                  | string                | Stable kebab-case slug, e.g. `"hammers-lot"`. Used as React key. |
| `name`                | string                | Public-facing display name. |
| `polygon_coordinates` | array of `[lat, lng]` | Ordered points outlining the lot. Admin-controlled only. |
| `price_usd`           | number                | Per-car, per-game price in whole US dollars. |
| `payment_methods`     | array of enum         | One or more of: `cash`, `venmo`, `zelle`, `card`, `paypal`, `apple_pay`. |
| `walk_minutes`        | number                | Walking minutes from lot entrance to Highmark Stadium main entrance, **manually verified via Google Maps**. Admin-controlled only. |
| `amenities`           | array of enum         | Any of: `porta_potty`, `indoor_bathrooms`, `grills_allowed`, `generators_allowed`, `rvs_allowed`, `rv_hookups`, `overnight_parking`, `tents_allowed`, `shuttle_to_stadium`, `lights`. Empty array is valid. |
| `last_updated`        | string (ISO date)     | `YYYY-MM-DD`. Date the data was last verified or edited. |
| `source`              | string                | Free-form provenance — where the info came from. Examples: `"Reddit r/buffalobills"`, `"Bills Mafia Facebook group"`, `"Direct outreach"`, `"User submission"`. |
| `status`              | enum                  | `live` (shown on map), `pending_review` (admin-approval queue), `archived` (hidden). |
| `verified_for_season` | number \| null        | Season year (e.g. `2026`) the lot's price, payment methods, and amenities have been confirmed for. `null` if not verified. Drives the "Season Verified" badge on the hover card — shown when this matches `CURRENT_SEASON` in [`lib/types.ts`](lib/types.ts). Bump `CURRENT_SEASON` each August after re-verifying. |

#### Excluded from MVP

- `vibe_tags` — deferred to v2.
- `owner_name`, `owner_contact` — out of scope (privacy / scope).
- `exit_direction`, `exit_roads` — out of scope. Post-game exit routing isn't needed for MVP.
- Walk time is **never** user-submittable. Only price, payment methods, and amenity corrections (plus brand-new lot requests) come in via the form.

### Editing lots without code

Because the data store is a plain JSON file in the repo, any non-engineer with GitHub access can update a lot's price, payment methods, amenities, or status:

1. Open [`data/lots.json`](data/lots.json) on GitHub.
2. Click the pencil icon ("Edit this file").
3. Edit the relevant lot's field(s).
4. Commit straight to `main` (or open a PR for review).
5. Vercel auto-deploys on every push to `main`. Change is live in ~60 seconds.

No local dev environment required. No developer required.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), pick the repo, accept defaults, click Deploy.
3. Every push to `main` re-deploys; branch pushes get preview URLs.
