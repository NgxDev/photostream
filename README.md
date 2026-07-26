# Photostream

**Live: <https://ngxdev.github.io/photostream/>**

An endless stream of random photos, with a favorites library. Angular 22, zoneless, no backend — the
whole app is prerendered to static HTML and served from GitHub Pages.

---

## Quick start

Node **22.12+** (`.nvmrc` pins `v22`), npm.

```bash
npm install
npm start          # http://localhost:4200
```

## Commands

| command                           | what it does                                              |
| --------------------------------- | --------------------------------------------------------- |
| `npm start`                       | dev server on :4200                                       |
| `npm run build`                   | production build + prerender, base href `/`               |
| `npm run build:pages`             | the same with base href `/photostream/` — what CI deploys |
| `npm test`                        | unit tests, watch mode in a TTY                           |
| `npm run test:ci`                 | unit tests, single run                                    |
| `npm run lint` / `lint:fix`       | ESLint over `src/**/*.{ts,html}`                          |
| `npm run format` / `format:check` | Prettier                                                  |

### Serving a production build locally

`ng serve` cannot exercise the service worker, so offline behaviour has to be checked against a real
build.

```bash
npm run build
npx serve dist/photostream/browser --single      # ← don't
```

`serve` defaults to `cleanUrls: true`, which 301s `/index.csr.html` to `/index.csr`. That isn't a file,
so `--single` answers with `index.html` instead, the worker hashes the wrong file, hits `Hash mismatch`
and drops into a state where it passes everything to the network and synthesises a **504 when offline**.
It fails identically on every install, so unregistering does not help. Pass a config with
`{ "cleanUrls": false }`, and diagnose with `fetch('/ngsw/state')` rather than the DevTools green dot —
a worker can be "activated and running" while ngsw has internally given up.

## The three screens

| route         | what it does                                                                        |
| ------------- | ----------------------------------------------------------------------------------- |
| `/`           | the infinite stream. Click a photo to save it — idempotent, not a toggle            |
| `/favorites`  | everything saved, from localStorage. Click a photo to open it                       |
| `/photos/:id` | one photo fitted to the viewport, with chevron navigation and remove-from-favorites |

## How it works

### Talking to picsum

The catalog is **993 photos in a fixed order**, so they have to repeat if we want an "infinite random" stream
Batches come from `/v2/list?page=n&limit=30`, and a
`PageDeck` shuffles the page numbers and reshuffles when it empties, never handing out the same page twice across that boundary.

- Any dimension above **5000** returns `400 Invalid size`
- Angular's default
  `NgOptimizedImage` breakpoints go to 3840, which for a 2:3 portrait means a 5760px height and a broken
  srcset. So `PICSUM_BREAKPOINTS` topping out at 3200.
- Only `.jpg` and `.webp` work; **WebP is 27% smaller**, so everything
  requests WebP.

### The infinite stream

Used CDK **virtual scroll**.

Every "API" call goes through `emulateLatency()` — a 200–300ms delay,
as required — including reading favorites at startup.

### State

NgRx **Signal Store** (`@ngrx/signals`), one store per feature.
Favourites are written to `localStorage` through an SSR-safe wrapper, since we are also doing static pre-rendering.

### Offline

A service worker prefetches the app shell and lazily caches the Google Fonts files. Photos are **not** in a `dataGroup`, picsum already sends `cache-control: public, max-age=2592000, immutable`, so the photos are cached for 30 days.

With the shell cached and favorites already local-first, **the entire favorites experience works with no network.**

## Testing

```bash
npm run test:ci
```

## Deployment

Push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run build:pages`, then
`upload-pages-artifact` + `deploy-pages`.

`.github/workflows/ci.yml` gates every PR with lint, tests and a build.

## Project structure

Directories are named for a **feature or a theme**, never for a kind of code — no `core/`, `shared/`,
`services/`, `models/` or `utils/`, per the
[v22 style guide](https://angular.dev/style-guide#project-structure). No type suffix on any filename:
`favorites-store.ts`, not `favorites.store.ts`.

```text
src/app/
  emulate-latency.ts   the 200-300ms fake round-trip, used by every "API" we fake
  picsum/              the picsum integration. No components
  storage/             SSR-safe localStorage wrapper, shared by two stores
  photos/              "/" screen + photo-stream-store.ts
  favorites/           store + api + "/favorites" + photo-detail/ for "/photos/:id"
  theme/               theme-store.ts + theme-switcher/
  header/              app header
  photo-tile/  photo-grid/  empty-state/    presentational, shared by two features
```

Angular Material is styled through **tokens only** — `mat.theme()` and per-component `mat.<component>-overrides()` mixins. Light and dark modes are driven by the CSS `color-scheme` property.
