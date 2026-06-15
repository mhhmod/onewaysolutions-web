# Admin Dashboard Overhaul — Implementation Plan

Author basis: `/impeccable` design laws + `/make-plan` structure + `taste-skill` anti-slop, all subordinate to this repo's `PRODUCT.md`, `DESIGN.md`, and the user's global rules.

## Progress

- **Phase 1 — DONE & verified live.** DB-driven catalog (`catalog-db.ts` + `supabase-server.ts`) with manifest fallback; public pages async + ISR. Catalog seeded (11 categories, 185 products). Production build generated 206 pages from the DB. Tech-leak copy sweep complete across admin + quote surfaces.
- **Phase 2 — DONE & build-verified.** Admin design system (`src/components/admin/ui/*`: Button, Badge, Skeleton, EmptyState, Toast, Drawer, ConfirmDialog, FormField, DataTable), app shell (`AdminProvider` gate + context + toasts, `AdminShell` sidebar/topbar), route group `(dashboard)` with Overview + Quotes (DataTable + detail Drawer) + Products/Categories placeholders. Old single-page `AdminDashboard.tsx` removed.
- **Phase 4 — DONE & build-verified.** Products module: `ProductsManager` (list, search, category/status filters, bulk publish/unpublish, delete with confirm) + `ProductForm` (create/edit drawer with image upload to storage + pick-from-library, required alt text, specs, publish/featured). Data layer `src/lib/admin/products.ts`. Admin-guarded on-demand revalidation (`/api/revalidate` + `src/lib/admin/revalidate.ts`) verified returning 401 to unauthenticated callers. Build green (207 pages); `/api/revalidate` is dynamic.
- **Phase 5 — DONE & build-verified.** Categories & brands: tabbed `TaxonomyManager`, `CategoriesManager` (list with product counts, parent/order/visibility, image upload + library, delete with orphan warning) and `BrandsManager` (logo, country, website, visibility). Data layers `categories.ts` / `brands.ts`; shared `ImageLibraryPicker`, `SingleImageField`, `storage.ts` upload helper, `errors.ts`. `ProductForm` refactored onto the shared picker.
- **Phase 3 — DONE & build-verified.** Quote inbox upgraded: search (name/company/email/phone), date-range filter, status chips, sortable columns, **pagination**, **bulk** status + delete, **CSV export**, single delete, and a detail drawer with **internal notes** that auto-detect the `admin_notes` column (migration `20260615061000_add_quote_admin_notes.sql`; notes stay hidden until it is applied).
- **Phase 6 — DONE & build-verified.** Auth: password reset on login (`resetPasswordForEmail`) + `/admin/reset` completion page (`AdminResetForm`, recovery-session detection, set-new-password); login polished to the design-system weight scale; `min-h-[100svh]`. i18n-ready confirmed: zero physical-direction utilities anywhere (all logical start/end/ps/pe).
- **Phase 7 — DONE (partial sweep) & fixes applied.** Multi-agent review (6 dimensions, adversarially verified). Confirmed + fixed: (high) quote bulk-select acting on stale cross-page/cross-filter rows; (med) notes effect double-fetch + stale-note flash; (med) non-atomic `saveProduct` media replacement now captures+restores on failure; (low) object-URL leak on product-drawer reuse. Coverage gap: the responsive/RTL/UI/Supabase reviewers were rate-limited mid-run and did not complete; re-run pending API limit reset.
- **Operational follow-ups:** run `admin_notes` migration (enables notes); rotate `service_role` key; allow-list `/admin/reset` redirect URL in Auth settings; smoke-test authed CRUD.

## Decisions (locked with the user)

1. **Source of truth → database.** The catalog moves into the DB. The current static `src/data/catalog-manifest.json` becomes a one-time **seed**. Public pages render from the DB with caching. Admin edits go live.
2. **Modules this round:** Products (core) · Categories & Brands · Quote-inbox upgrade. (Projects gallery, site settings, and admin-user management are deferred to a later round.)
3. **Product images:** upload new **and** pick from the existing imported image library.
4. **No technology names anywhere in the UI.** Operator-facing copy only.

## Hard constraints carried from project rules

- English-first, **Arabic-ready**: logical properties only (`start/end`, `border-e`, `ms/me`), no hardcoded left/right, allow text expansion.
- Responsive verified at **320, 360, 390, 430, 768, 1024, 1280, 1440**. No horizontal overflow. Tap targets >= 44px.
- WCAG AA: visible labels, keyboard paths, focus states, contrast, reduced-motion.
- Supabase safety: reversible/additive migrations only; no destructive ops; RLS already covers admin CRUD (verify, do not loosen).
- Restrained motion: transform/opacity, 150-250ms, no decorative choreography in admin. **No** framer-motion, GSAP, glassmorphism, purple/neon. Keep `lucide-react` and the system-sans stack already in use.

---

## Open dependencies / blockers (must resolve before Phase 1 runs)

- **B1 — Rotate the leaked `service_role` key** in the project API settings. It was pasted in chat; treat as compromised. Never ship it to the browser or commit it.
- **B2 — Backend access.** The database tool currently connected points at a different project, not `oqkojvazjtqjgjrufxug`. To seed and to develop against real data, either connect the correct project to the tooling, or provide the catalog project's URL + **publishable (anon)** key in `.env.local` and run the seed script locally with a server-side admin context. The browser app only ever uses the publishable key.
- **B3 — Confirm migrations are applied** on the catalog project (the two SQL files in `supabase/migrations/`). If not applied, apply them first (they are additive).
- **B4 — Create the first admin user** (an `admin_profiles` row with `is_active = true`) so the dashboard can be exercised end to end.

---

## Phase 0 — API grounding (Allowed APIs / anti-patterns)

Stack confirmed from `package.json`: Next.js (App Router, v16 per optional dep), React, `@supabase/supabase-js`, Tailwind 3.4, `lucide-react`, TypeScript. No state lib, no motion lib.

**Allowed APIs (use exactly these; do not invent):**
- Supabase client: `createClient(url, publishableKey)`; reads `supabase.from('<table>').select(...).eq/order/range/ilike(...)`; writes `.insert(...)`, `.update(...).eq(...)`, `.delete().eq(...)`; auth `supabase.auth.signInWithPassword`, `getSession`, `getUser`, `signOut`, `resetPasswordForEmail`.
- Storage: `supabase.storage.from('product-images').upload(path, file, { upsert })` then `.getPublicUrl(path)`. Buckets already exist (`product-images`, `catalog-pages`, `brand-assets`, `project-images`) and are public with admin-only write policies (see migration lines 355-397).
- Next.js: Server Components for public reads; Route Handler `app/api/revalidate/route.ts` for on-demand `revalidatePath()`; `export const revalidate = <seconds>` for time-based ISR; `app/admin` stays a client island for the authenticated session.
- Tailwind tokens already defined in `tailwind.config.ts` + `globals.css`: `primary, accent, steel, surface, muted, border, success, warning, danger, background, foreground`.

**Anti-pattern guards:**
- Never reference `service_role` / secret keys in any `src/` file.
- Do not call Supabase methods that are not in the list above.
- Do not block catalog browsing behind auth (public `select` on `is_published = true` is already allowed by RLS).
- Do not surface raw DB error strings to operators; map to friendly copy.
- Keep return shapes of `src/lib/catalog.ts` (`Category`, `Product` in `src/lib/types.ts`) stable so public components don't churn.

---

## Phase 1 — Data layer: DB as source of truth (with manifest seed)

**What to implement**
1. `src/lib/supabase-server.ts` — a server-side read client using the **publishable** key (anonymous, RLS-bound) for Server Components.
2. `src/lib/catalog-db.ts` — async equivalents of the functions in `src/lib/catalog.ts:6-52` (`getCategories`, `getProducts`, `getCategory`, `getProductsByCategory`, `getProduct`, `getRelatedProducts`, `getFeaturedProducts`, `getCatalogTotals`), querying the DB and mapping rows -> existing `Category`/`Product` types. Join `product_images` for `imagePath` (primary image), `categories` for `categoryName`.
3. Refactor public pages to `async` server reads: `src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/products/[category]/page.tsx`, `src/app/product/[slug]/page.tsx`, and the admin totals call in `src/app/admin/page.tsx:9`. Keep the manifest import only inside the seed script.
4. Caching: set `export const revalidate = 120` on public catalog routes as the baseline; add `app/api/revalidate/route.ts` (admin-guarded) for instant publish.
5. `scripts/seed-catalog.mjs` — read `src/data/catalog-manifest.json`, upsert `categories` then `products` then `product_images` (idempotent on `slug`). Additive only.

**References:** current data access `src/lib/catalog.ts`, types `src/lib/types.ts:1-45`, schema `supabase/migrations/20260614190000_initial_one_way_catalog.sql:21-90`, browser client pattern `src/lib/supabase.ts`.

**Verification:** public homepage/catalog render identical content sourced from DB; `tsc --noEmit` clean; seed script run twice = no duplicates; grep `catalog-manifest` shows it only imported by the seed script.

**Anti-pattern guards:** no service key server-side; mapping preserves `Product.imagePath` non-null contract; published filter applied on all public reads.

---

## Phase 2 — Admin design system + app shell + copy sanitation (cross-cutting)

**What to implement** (new `src/components/admin/` directory)
- `AdminShell` — persistent **sidebar** (Overview, Quote requests, Products, Categories & brands) + slim topbar (operator name/role, link to public site, sign out). Collapses to a top drawer below `md`. Logical props throughout.
- Primitives, each with loading/empty/error states baked in: `DataTable` (sortable headers, hover-reveal row actions, selection + bulk-action bar, pagination, responsive card fallback below `md`), `FormField` (label above, input, helper, error-below; `gap-2`), `Drawer` (slide-over for create/edit/detail — preferred over modals), `ConfirmDialog` (destructive guard), `Toast` (success/error feedback), `Badge` (status), `EmptyState`, `Skeleton`.
- **Typography fix:** stop using `font-black` everywhere. Define a weight scale (e.g. semibold headings, medium labels, regular body) so hierarchy comes from weight+scale+color, not all-900. Numbers/tables use tabular figures (`font-variant-numeric: tabular-nums`) per DESIGN.md.
- **Overview redesign:** replace the 4 identical stat cards (`AdminDashboard.tsx:324-345`) — which are the banned "hero-metric / identical-card-grid" cliché — with a calm signal strip (divide-x, not boxed) showing only actionable signals (new requests, active requests, unpublished products) each with a "last updated" stamp, plus quick actions (Add product, View new requests).
- **Tech-leak removal sweep** — replace every technology reference with operator copy:

  | Location | Current (leaks) | Replace with |
  |---|---|---|
  | `AdminDashboard.tsx:259-263` | ".env.local … NEXT_PUBLIC_SUPABASE_URL …" / "active row in admin_profiles" / "Supabase session" | "The dashboard is not connected yet. Contact your administrator." / "Your account does not have dashboard access." / "Checking your access." |
  | `AdminDashboard.tsx:299-301,508-516` | "signed-in Supabase user", "read from Supabase" | "your account", "Requests update live." |
  | `AdminLoginForm.tsx:52-54` | "Use a Supabase user that has an active row in admin_profiles" | "Sign in with your One Way Solutions admin account." |
  | `AdminLoginForm.tsx:18,41` | raw error / ".env.local" | "We could not sign you in. Check your email and password." |
  | `EnvNotice.tsx:9-13` | ".env.local … publishable key" | "This feature is not available right now. Please try again later." |
  | `supabase.ts:11` thrown error | env var names | generic message; never rendered to operators |

**References:** existing admin `src/components/AdminDashboard.tsx`, login `src/components/AdminLoginForm.tsx`, env notice `src/components/EnvNotice.tsx`, tokens `tailwind.config.ts`, `globals.css`.

**Verification:** `grep -ri "supabase\|env.local\|admin_profiles\|publishable" src/app src/components` returns nothing operator-facing; shell renders at all breakpoints with no overflow; keyboard tab order through sidebar + table is logical; reduced-motion respected.

**Anti-pattern guards:** no nested cards; modals only where a drawer/inline truly cannot work; no new icon or motion dependency.

---

## Phase 3 — Quote-inbox upgrade

**What to implement** (rebuild the inbox section of `AdminDashboard.tsx:347-477` on the new `DataTable`)
- Search (name/company/phone/email via `ilike`), filter by status + date range, sort by date/status, pagination via `.range()` (remove the hard `limit(20)` at `AdminDashboard.tsx:130`).
- Row click -> detail **Drawer**: full contact, selected items, message, status timeline.
- Internal notes (admin-only) + **bulk** status change + **delete** with `ConfirmDialog`.
- CSV **export** of the current filtered view.
- **Toast** on every status change (currently silent at `AdminDashboard.tsx:230-233`).

**References:** quote read/update logic `AdminDashboard.tsx:115-234`, status model `AdminDashboard.tsx:67-75`, schema `quote_requests`/`quote_request_items` `migration:92-116`. Notes: confirm whether to store in an existing column or add an additive `admin_notes text` column (reversible) — flag before migrating.

**Verification:** filter + search + paginate at 768/1440; empty/loading/error states show; bulk + delete guarded; export opens valid CSV; status change shows toast and persists on refresh.

---

## Phase 4 — Products module (the core ask)

**What to implement**
- **List:** `DataTable` of products — image thumb, name, category, brand, published/featured badges, updated date; search + filter by category/published; row actions edit/duplicate/delete; bulk publish/unpublish.
- **Create / Edit** in a `Drawer` (or full route for large forms): name, auto-slug (editable), summary, description, category (select), brand (select + inline create), model/SKU, featured + published toggles, sort order.
- **Images:** drag-drop **upload** to `product-images` bucket (`upload` -> `getPublicUrl`) **and** a "pick from existing library" picker over imported images; reorder; set primary; required **alt text** per image (DB enforces `alt_text not null`, `migration:66-80`). Edit alt on the same screen (no popup).
- **Specs:** repeatable label/value/unit rows -> `product_specs`.
- Inline validation (quiet) + submit-time summary; save -> toast + `revalidatePath` so the public catalog updates immediately.
- Delete -> `ConfirmDialog`; cascade handled by FK (`product_images`/`product_specs` on delete cascade).

**References:** schema `products` `migration:47-64`, `product_images` `:66-80`, `product_specs` `:82-90`; storage policies `:355-397`; RLS admin-manage `cleanup migration:72-118`. Public product page consuming this: `src/app/product/[slug]/page.tsx`.

**Verification:** create a product with a new uploaded image + an existing image + 2 specs -> appears on public catalog after save; required alt enforced; unpublish hides it publicly; delete removes images/specs; forms usable at 360 and 1440.

**Anti-pattern guards:** upload only allowed mime/size (bucket: 10MB, jpeg/png/webp/gif); never expose secret keys; slug uniqueness handled before insert.

---

## Phase 5 — Categories & brands module

**What to implement**
- Categories: `DataTable` + create/edit drawer (name, slug, description, image, parent for hierarchy, sort order, published). Reorder. Brands: same shape (name, slug, country, website, logo, sort, published) with inline-create reused by the product form.
- Deleting a category sets products' `category_id` null (FK `on delete set null`, `migration:49`) — warn in `ConfirmDialog`.

**References:** schema `categories` `migration:21-32`, `brands` `:34-45`; admin RLS `cleanup migration:40-70`. Public consumer `src/app/products/[category]/page.tsx`, `src/components/CategoryCard.tsx`.

**Verification:** add a category -> appears in public nav/grid after revalidate; hierarchy renders; publish toggle gates public visibility; delete warns about orphaned products.

---

## Phase 6 — Auth hardening + final i18n-ready pass

**What to implement**
- Move the access gate so unauthenticated `/admin` does not flash protected content (`AdminDashboard.tsx:147-193` currently client-only). Keep session client-side but render a clean checking state first.
- Friendly auth errors (no raw messages), optional "forgot password" via `resetPasswordForEmail`.
- Confirm all admin copy uses logical layout + can expand for Arabic; centralize strings so a future Arabic pass is a translation, not a rewrite.

**Verification:** direct hit to `/admin` while signed out shows the access screen, never protected data; wrong password shows friendly copy; layout holds in a simulated RTL/expanded-text run.

---

## Phase 7 — Verification (final gate, required by make-plan)

1. `npm run typecheck` and `npm run lint` clean.
2. `npm run build` succeeds with public pages DB-backed.
3. Responsive sweep at all 8 breakpoints: overflow, wrapping, tap targets, sticky topbar, table card-fallback, drawers. (Use `agent-responsive-checker`.)
4. RTL/i18n review: logical props, icon direction, truncation, expansion. (Use `agent-rtl-checker`.)
5. Supabase/RLS review: no loosened policies, additive migrations only, storage write stays admin-only. (Use `agent-supabase-guardian`.)
6. Leak grep: `supabase|env.local|admin_profiles|publishable|NEXT_PUBLIC` absent from operator-facing strings.
7. Manual end-to-end: sign in -> add product (upload + existing image + specs) -> see it live -> handle a quote (filter, note, status, export) -> add a category -> unpublish -> verify public.

---

## Risks & rollback

- **Going dynamic** could slow public pages: mitigated by ISR (`revalidate = 120`) + on-demand revalidate; can fall back to manifest instantly by reverting the data-layer import.
- **Seed mismatch** (manifest -> DB): seed is idempotent and additive; DB can be re-seeded; manifest retained as backup.
- **DB schema:** no destructive changes planned; only a possible additive `admin_notes` column (Phase 3) — reversible, flagged before applying.
- **Auth lockout:** ensure at least one active admin (B4) before removing any fallback.

## Suggested execution order

B1-B4 (blockers) -> Phase 1 -> Phase 2 -> Phase 4 -> Phase 5 -> Phase 3 -> Phase 6 -> Phase 7.
(Products before quote-inbox because the design-system primitives land in Phase 2 and Products exercises them hardest; reorder if quote handling is more urgent operationally.)
