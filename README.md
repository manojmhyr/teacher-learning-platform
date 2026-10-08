# Teacher Learning Platform

A secure internal platform for teachers: lesson plans, classroom videos, resources and
teaching-coverage tracking. **One codebase** runs as a web app on laptops and as native iOS and
Android apps via Capacitor.

> Lesson content is served from **built-in demo data** out of the box, and switches to **Azure
> Blob Storage** with a configuration change. No code change is needed — see
> [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md).

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

Sign in with employee ID **`T1024`** and any password of four or more characters.

```bash
npm run build          # production build into dist/
npm run preview        # serve the production build
npm run typecheck      # tsc --noEmit
npm run test:smoke     # end-to-end smoke test over the built app
```

---

## One codebase, three targets

| Target | How it runs | Command |
|---|---|---|
| Web (laptop, desktop, tablet) | Served as a static site | `npm run build` |
| Android app | Same build inside Capacitor | `npm run cap:add:android` then `npm run cap:android` |
| iOS app | Same build inside Capacitor | `npm run cap:add:ios` then `npm run cap:ios` |

The native projects (`android/`, `ios/`) are generated, not committed. `npm run cap:sync`
rebuilds the web app and copies it into both.

The UI is responsive rather than duplicated: a fixed sidebar on large screens, a drawer on
tablets, and a hamburger plus bottom navigation on phones. Lesson tables collapse to cards
below `md`, and the lesson plan reflows to phone width with no horizontal scrolling.

---

## Architecture

```
src/
  config/env.ts            Runtime configuration from VITE_ vars; validated at startup
  types/                   Shared TypeScript types
  theme/                   Design tokens and the MUI theme
  data/                    Catalog, seed history, demo lesson content
  services/
    content/               ← THE SEAM: ContentProvider, mock + Azure implementations
    authService.ts         Sign in / restore / sign out — swap point for Azure Entra ID
    tokenStore.ts          Access token, in memory only
    secureStore.ts         Keychain / EncryptedSharedPreferences on native; allowlist on web
    http.ts                Fetch wrapper with bearer token and idempotency keys
    progressService.ts     Coverage derived from the append-only record history
    recordService.ts       Builds, validates and saves teaching records
  security/
    screenProtection.ts    FLAG_SECURE, privacy screen, capture detection
    leakGuards.ts          Copy, context-menu, print and focus guards
  context/                 Auth, Platform (records/annotations), Security, Toast
  components/              DocumentViewer, VideoPlayer, FractionGame, QnA, Coverage, Security
  layouts/AppLayout.tsx    Sidebar, drawer, app bar, bottom navigation
  pages/                   One file per screen
```

### The content seam

Every screen reads content through one interface, `ContentProvider`:

```ts
contentProvider.getLessonContent(lessonId)   // demo today, Azure tomorrow
```

`src/services/content/index.ts` picks the implementation from `VITE_CONTENT_SOURCE`. Adding a
third source later (SharePoint, S3, on-prem) means writing one more file.

### Append-only teaching records

A teaching record is never updated or deleted. Saving always appends, and coverage is
recomputed from the full history, so a teacher's record of what was taught cannot be
overwritten. Each record carries a client-generated UUID used as the API's `Idempotency-Key`,
so a retry on a flaky classroom network cannot create a duplicate.

### Why the lesson plan is JSON, not a PDF

The plan is stored and served as structured text blocks. This gives three things a PDF cannot:
there is no original file to download, the text reflows properly on a phone, and highlights
anchor to character offsets within a block so they stay correct across devices and zoom levels.

---

## Security

Full detail in **[docs/SECURITY.md](docs/SECURITY.md)**, including an honest table of what is
enforced versus what is only a deterrent. The headline:

- **Screenshots are genuinely blocked on Android** (`FLAG_SECURE`, enforced by the OS).
- **iOS cannot block screenshots** — no app can. The app hides content when backgrounded and
  detects and logs screenshots after the fact.
- **Browsers cannot block screenshots** either. The web build relies on watermarking and audit
  logging.
- Every page of protected content carries a **per-teacher watermark** (name, employee ID, date),
  which makes a leaked screenshot traceable.
- Copy, right-click, drag and print are blocked; content is hidden when the window loses focus.
- The access token is held **in memory only**; logout wipes all app storage; sessions idle out
  after 20 minutes.
- No storage account key ever reaches the client. Blobs are read through short-lived,
  read-only SAS URLs minted by the backend after an entitlement check.

---

## Configuration

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `VITE_CONTENT_SOURCE` | `mock` (demo data) or `azure` |
| `VITE_API_BASE_URL` | Backend base URL; required for `azure` |
| `VITE_AZURE_BLOB_BASE_URL` | e.g. `https://acct.blob.core.windows.net` |
| `VITE_AZURE_CONTAINER` | Container holding lesson content |
| `VITE_SAS_ENDPOINT` | Backend endpoint that mints SAS URLs |
| `VITE_SAS_TTL_SECONDS` | SAS lifetime; keep short |
| `VITE_APP_NAME`, `VITE_ORG_NAME` | Branding |
| `VITE_BUILD_ID` | Set by CI; shown in Settings |

**Never put a storage account key or connection string in a `VITE_` variable** — they are
compiled into the bundle and readable by anyone.

---

## Intended backend

Not in this repository. The app expects a Spring Boot service providing:

- `POST /auth/login` → access token, expiry, teacher profile
- `GET  /api/content/sas?container=&blob=&ttl=` → short-lived read-only SAS URL
- `GET  /api/content/sas/health` → 200
- `POST /teaching-records` (honouring `Idempotency-Key`) → persists an append-only record

PostgreSQL with an insert-only `teaching_record` table matches the app's model.

---

## Demo walkthrough

Login → Dashboard → Class 5A → Mathematics → Introduction to Fractions → Lesson Plan (highlight
text, change pages, search, note the disabled download and the watermark) → Videos → Game →
Q&A → Coverage (tick topics, add a note, save) → Teaching History → Teaching Progress.

**Settings → Reset demo data** restores everything before a presentation.
