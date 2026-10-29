# agents.md — Handoff for Codex

Latest handoff update: **2026-10-20**, accountant and supervisor visual redesign (see §9). The rest of this document preserves the earlier application handoff and known open items.

Historical status snapshot covering work from **2026-09-22 → 2026-09-29** (HEAD at that snapshot = `dd88f3e`).
Read this first. The open items are context, not authorization to expand a requested change.

## 1. Project overview

ManageTaxMission is a multi-tenant tax/invoicing app that prepares sales-tax invoices and pushes them to Pakistan's FBR (Federal Board of Revenue) through a separate **FBR bridge** service.

- Stack: Next.js 14 (App Router, JavaScript — no TypeScript), React 18, Mongoose 9 (MongoDB), JWT + bcryptjs auth, yarn. Plain CSS in `styles/` plus CSS modules next to components.
- Scripts: `yarn dev`, `yarn build`, `yarn start`, `yarn lint`. There is **no test suite**; verify with `yarn lint` / `yarn build` and manual UI checks.
- Env (`.env.local.example` lists only the first three; the rest are read in code):
  - `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
  - `FBR_BRIDGE_BASE_URL`, `FBR_BRIDGE_API_KEY`, `FBR_BRIDGE_TIMEOUT_MS` (default 35000) — used by `lib/fbr/bridgeClient.js`
  - `SEED_SECRET_KEY` — used by `app/api/seed/route.js`
- Roles (`models/User.js`): `super_admin` (admin area, `/admin/*`) and `company_user` (company area, `/company/*`). Guards: `lib/auth/requireAdmin.js`, `lib/auth/requireCompanyUser.js`.

### Layout

| Path | What lives there |
|------|------------------|
| `app/admin/*`, `app/api/admin/*` | Super-admin UI + APIs (companies, users, submissions, reference data, stats) |
| `app/company/*`, `app/api/company/*` | Company UI + APIs (dashboard, submissions, invoice items, records, FBR records, profile) |
| `app/api/fbr/submit`, `app/api/fbr/receipts` | Server-side FBR submit + receipt (audit log) listing. The browser never calls the bridge directly |
| `lib/fbr/` | `bridgeClient.js` (HTTP client), `mapSubmissionToInvoice.js` (Submission → FBR invoice), `scenarioProfiles.js`, `fbrStatus.js`, `exampleInvoice.js` |
| `lib/validators/` | `submissionValidator.js` (client + server validation of the DSI form), company/user validators |
| `models/` | `Company`, `Submission`, `FbrReceipt`, `InvoiceItem`, `ReferenceData`, `User` |
| `components/company/` | `SubmissionForm.jsx` (+ `submissionFormReducer.js`), `SubmissionViewModal`, `ReceiptViewModal`, `FbrSuccessModal`, etc. |
| `styles/print.css` | Global print rules (A4, hides everything except `.print-area`) |
| `smaple_payload.json` | (sic) Example of the payload shape sent to the bridge; filename typo ("smaple") is pre-existing |

### FBR flow (how a submission reaches FBR)

1. Company user fills `SubmissionForm` → saved as a `Submission` (status draft).
2. `POST /api/fbr/submit` (`app/api/fbr/submit/route.js`) loads the Submission by `submissionRef`, runs `mapSubmissionToInvoice()`, picks the environment and token (see §2.2), calls `submitInvoice()` in `bridgeClient.js`.
3. Bridge call: `POST {FBR_BRIDGE_BASE_URL}/api/v1/fbr/invoices/{validate|submit}` with headers `Authorization`, `X-Request-ID`, `X-Idempotency-Key` (`<submissionId>:<action>`), `X-FBR-Environment`, and optional `X-FBR-Token`.
4. An `FbrReceipt` is always created (success or failure). On success the Submission becomes `submitted` (+ `submittedAt`), otherwise `failed`; `fbrResponse`, `fbrPayload`, `fbrEnvironment` are stored on the Submission.

## 2. Changes in the last month (chronological)

### 2.1 Scenario support: SN018 + SN019 — `3e7a68b` (2026-09-22)

Previously only scenario `SN019` was accepted and the scenario field was free text.

- **New** `lib/fbr/scenarioProfiles.js` — `SCENARIO_PROFILES` + `getScenarioProfile(id)`:
  - `SN019`: `submissionType: 'sale_tax_fed'`, `saleType: 'Services'`, HS `9815.9000`, tax rate 16, SRO `ICTO TABLE II`, SRO item `1(i)`.
  - `SN018`: `submissionType: 'services_fed_st_mode'`, `saleType: 'Services (FED in ST Mode)'`, no default HS/rate/SRO.
- `SubmissionForm.jsx`: scenario is now a `<select>` (SN018 / SN019) instead of a text input. `applyScenarioDefaults()` sets `scenarioId` + `submissionType` and overwrites `saleType`, `hsCode`, `taxRate`, `sroScheduleNo`, `sroItemSerialNo` on **every existing item row** (changing scenario resets those fields). The "fill sample data" helper now uses `state.scenarioId` instead of hardcoding `SN019`.
- `submissionValidator.js`: removed the "must be SN019" / "must be `sale_tax_fed`" hard rules. Now:
  - SN018 ⇒ `submissionType` must be `services_fed_st_mode`; SN019 ⇒ `sale_tax_fed`.
  - Per-item `saleType` must match the scenario (`Services (FED in ST Mode)` for SN018, `Services` for SN019).
  - Any other scenario ID is accepted with no type/sale-type check (only "scenario required").

### 2.2 Sandbox/Production environment selection — `7348982` (2026-09-22) and `503046a` (2026-09-24)

- `models/Submission.js`: new `fbrEnvironment` (`'sandbox' | 'production'`, default `'sandbox'`).
- `submissionFormReducer.js` / `SubmissionForm.jsx`: new `fbrEnvironment` state (default `sandbox`) and a **"FBR Environment"** select next to Scenario ID. (`envBadgeStyle()` helper was added in the form but is currently unused.)
- `lib/fbr/bridgeClient.js`: `callBridge` takes `environment` (default `sandbox`) and sends `X-FBR-Environment`. **Also removed the `assertConfig()` call**, so missing `FBR_BRIDGE_BASE_URL` / `FBR_BRIDGE_API_KEY` no longer throws a clear error — the URL becomes `undefined/api/...` and surfaces as `FBR_NETWORK_ERROR`. (`assertConfig` is still defined but unused; likely unintentional — restore it unless there is a reason not to.)
- `app/api/fbr/submit/route.js`: `selectedEnvironment = submissionDoc.fbrEnvironment || body.fbrEnvironment || 'sandbox'` (lowercased). The receipt's `environment` now records the **selected** environment rather than whatever the bridge echoed. The selected environment is persisted back to `Submission.fbrEnvironment`.
- **Per-environment company tokens** (`503046a`): `models/Company.js` gained `fbrProductionToken` next to `fbrSandboxToken`; `components/admin/CompanyForm.jsx` has a new "FBR Production Token" input. Submit route selects `fbrProductionToken` when environment is `production`, else `fbrSandboxToken`. If the matching token is empty, `X-FBR-Token` is omitted and the bridge falls back to its own default token — a sandbox token is never sent for production (and vice versa).
- UI: `app/company/records/page.js` and `app/company/fbr-records/page.js` gained **Scenario** and **Environment** columns (Sandbox = yellow pill, Production = green pill) and both are included in the search haystack. Pill styling is duplicated inline in both pages.

### 2.3 Alphanumeric NTN support — `d963001` (2026-09-24)

`submissionValidator.js` `normalizeIdentifier()` now keeps `[0-9A-Za-z]` and uppercases (was digits only). Seller/Buyer NTN/CNIC must match `^[0-9A-Z]{7}$` (NTN, e.g. `F443122`) or `^[0-9]{13}$` (CNIC). Error text: "must be 7 characters (NTN) or 13 numeric digits (CNIC)". Note: `mapSubmissionToInvoice` sends the stored value (`str()`), which is only trimmed — it is **not** re-normalized, so uppercase/stripping happens only in validation.

### 2.4 Sample payload — `503046a`

Added `smaple_payload.json` at the repo root: an SN018 example (`sellerNTNCNIC: "4765371"`, FGK Back Office Services → Nemesis Asset Management LLP UK, one "Services (FED in ST Mode)" item at 16%, `sroScheduleNo: "ICTO TABLE II"`, `sroItemSerialNo: "1(i)"`). Useful as a reference for what `mapSubmissionToInvoice` should output.

### 2.5 Print / view-modal improvements — `5687a46`, `dd88f3e` (2026-09-29)

Goal: Submission and FBR Invoice modals print on **one** A4 page.

- `styles/print.css`: in print, `html, body` are now `height: 281mm; max-height: 281mm; overflow: hidden` to stop `visibility:hidden` content from creating a blank extra page.
- `SubmissionViewModal.module.css`: print overrides for `.backdrop` (was `position: fixed`, which browsers repeat on every printed page — the "page 1 repeated on page 2" bug) and `.modal` (static, full width, no max-height/shadow/radius); new `.itemsTableSpacer` (0.75rem top margin).
- `SubmissionViewModal.jsx`: `modalRef` + `useEffect` registering `beforeprint`/`afterprint` handlers that `display:none` every sibling along the modal's ancestor chain up to `<body>` and restore them after printing. Added a second items table: Extra Tax, Further Tax, ST Withheld at Source, SRO No./Schedule No., Item S. No.
- `ReceiptViewModal.jsx`: same second items table (uses `extraTax`, `furtherTax`, `salesTaxWithheldAtSource`, `sroScheduleNo`, `sroItemSerialNo`), backdrop now uses `styles.backdrop` instead of inline `alignItems`, and a new **Totals** section (Total Sale Value, Total Tax, Total Bill).
- `dd88f3e` fix: **Total Bill = Σ valueSalesExcludingST + Σ salesTaxApplicable**, *not* Σ `totalValues` (that is the PFAD-only "Total Value of Sales" field and is usually 0 for non-PFAD invoices). Values are computed once as `totalSaleValue` / `totalTax` in `InvoiceDetails`.
- Caveat: `ReceiptViewModal.jsx` does **not** register the `beforeprint` sibling-hiding effect that `SubmissionViewModal.jsx` has; it relies on the CSS only. Verify its print output separately (the page-height cap in `print.css` applies to both).

## 3. Conventions and gotchas

- **Bridge payload typing** (from `mapSubmissionToInvoice.js`): NTN/CNIC fields are strings; `item.extraTax` is a **string**; other item tax fields are numbers; required text must be non-empty after trim. UI province names are mapped to FBR names (e.g. Islamabad → `CAPITAL TERRITORY`); invoice types are title-cased (`Sale Invoice`, `Debit Note`, `Credit Note`).
- Only **one invoice per submission**: the seller comes from the Submission top level, the buyer from the **first** item row, all rows become `items[]`.
- Scenario defaults (§2.1) are applied only when the user changes the dropdown; editing the type/sale type afterwards is validated against the scenario.
- Validation exists in two places: `lib/validators/submissionValidator.js` (shared, also used client-side) and FBR-side validation through the bridge. `validateInvoice()` in `bridgeClient.js` is exported but **not called from any route** right now; `/api/company/submissions/[id]/validate` is local validation only.
- Print CSS: if you touch modals that print, check both `styles/print.css` and the module `@media print` blocks together; `.print-area` is the only element revealed.
- Commit style so far is "added changes"; prefer descriptive messages.

## 4. Open items / next steps

1. **Restore `assertConfig()`** in `callBridge` (accidentally dropped in `7348982`), or deliberately remove the dead function.
2. **Validate `fbrEnvironment`** server-side in `app/api/fbr/submit/route.js`: a body value other than `sandbox`/`production` is forwarded to the bridge unchecked (only the Submission schema enum constrains it, and only on save).
3. **Production safety**: production submits are one dropdown away and default token fallback goes to the bridge's default. Consider a confirmation step and/or blocking production submit when `fbrProductionToken` is empty.
4. **Token handling**: `fbrSandboxToken` / `fbrProductionToken` are stored in plaintext on `Company` and are editable in the admin form; **`GET /api/company/profile` returns the full company document (`.lean()`, no `select`), so both tokens are sent to company users' browsers** — exclude them (`.select('-fbrSandboxToken -fbrProductionToken')`) unless intended. Also consider encrypting at rest / masking in the admin form.
5. **Seed endpoint** (`app/api/seed/route.js`) has a hardcoded fallback secret and default admin password; remove before any real deployment.
6. **Dedupe UI**: environment pill inline styles are copied in `records/page.js`, `fbr-records/page.js` (and an unused `envBadgeStyle` in `SubmissionForm.jsx`) — extract a shared `EnvBadge` component.
7. **More scenarios**: add profiles to `scenarioProfiles.js`, the `<select>` options in `SubmissionForm.jsx`, and the scenario-specific rules in `submissionValidator.js` (currently SN018/SN019 only; unknown scenarios skip type/sale-type checks).
8. **Normalize NTN in the mapper**: apply the same alphanumeric/uppercase normalization in `mapSubmissionToInvoice` as the validator uses.
9. **Print QA**: manually verify one-page A4 output of the Submission and FBR Invoice modals in Chrome and Firefox, especially with many items; confirm `ReceiptViewModal` prints without the sibling-hiding effect.
10. Add tests (none exist) — start with `submissionValidator` (scenario/NTN rules) and `mapSubmissionToInvoice`.

## 5. Earlier history (context only)

Repo started 2026-06-08 (Create Next App). Before the period above: core admin/company areas, FBR bridge integration and receipts (June–Aug 2026), print/PDF work (Aug 2026 — the `html2pdf.js` "Download PDF" button was removed on 2026-08-06 in favor of browser print), and the autofill fix on FBR Invoices filter / delete-password fields (2026-08-04).

## 6. Login-page visual refresh — 2026-10-16

### Authorized scope

- Update **only the login page**, plus this handoff. Keep admin/company screens, shared styling, authentication APIs, and invoice/FBR behavior unchanged.
- The new logo is used on the login page only. Applying it elsewhere is deferred until the user requests it.
- **Remember me** and **Forgot password?** are deliberately disabled visual placeholders. Do not add session persistence, password recovery, routes, or backend behavior for them without a new request.

### Implementation and assets

- `app/login/page.js`: replaces the old centered card with the supplied reference's two-column layout: branding, introductory copy and three feature rows on the left; translucent sign-in card on the right. The promotional panel is hidden below 960px, leaving a responsive sign-in card with natural vertical scrolling on short screens.
- `app/login/page.module.css`: all new styling is scoped to the login route. Existing global `styles/auth.css`, brand variables, and other pages were not modified.
- Background follow-up (2026-10-20): confirmed `public/images/login_background.png` is the login page's centered, non-repeating cover background and removed the grey pseudo-element tint so its supplied colors show directly. Desktop/mobile Chrome checks confirmed the image loads with HTTP 200, no covering pseudo-element or horizontal overflow; lint retains only the existing two admin hook warnings.
- Assets under `public/images/` (preserve their existing filenames):
  - `Manage Taxmission Login Dashboard.png`: visual reference only, not rendered as the page.
  - `login_background.png`: page background; already includes the dashboard illustration and decorative curves.
  - `Mnagae_taxmission_logo_new.png`: supplied transparent logo, used in both login branding positions. It includes the tagline and large transparent margins; a clipped CSS viewport frames it without changing the original PNG or duplicating the tagline.
- Email/password remain controlled, required fields with `email` / `current-password` autocomplete. The original `login(email, password)` call, error handling, loading state, and redirects (`super_admin` → `/admin/dashboard`, company users → `/company/dashboard`) are preserved.
- Added an accessible password visibility toggle (`type="button"`, label and pressed state), visible keyboard focus, `role="alert"` login errors, and `aria-busy` while submitting.

### Verification and handoff

- `yarn lint` passed; only two existing hook-dependency warnings remain in `app/admin/reference-data/page.js` and `app/admin/submissions/page.js`.
- Production `yarn build` passed in an isolated `/tmp` source copy with dummy database/JWT settings, avoiding interference with the existing development server. The existing Google font needed network access to build. All 37 static pages generated.
- Browser previews checked at 1672×941, 1280×800, 768×1024, 390×844, and 320×568: assets loaded and no horizontal overflow. Checked password reveal/hide, Enter-key submission, request body shape, pending/disabled state, visible error and retry state, and disabled placeholder controls using intercepted mock API responses; no real sign-in or database changes were made.
- Include this file, both login source files, and the three supplied PNGs when committing. `agents.md` and the PNGs were already untracked at the start of this work. No commit or push was requested or performed.

## 7. Supervisor portal — 2026-10-19

- Supervisors now sign in using the existing `company_user` role with `personnelType: 'supervisor'`. Admin company/user forms accept supervisor passwords, validate a minimum of eight characters, and hash them. Existing supervisor contacts need an admin to set a password before they can sign in; leaving an existing password field blank preserves it.
- Routes: `/supervisor/dashboard`, `/supervisor/submissions`, `/supervisor/fbr-invoices`, and `/supervisor/profile`. The sidebar has exactly Dashboard, Submissions, FBR Invoices, and My Profile. `lib/auth/dashboardPath.js` drives login/home redirects and portal access redirects.
- The dashboard shows all five submission statuses, submission progress, financial totals, six tax periods, and recent activity. Totals explicitly include every status and environment. Reports are available in the app and as downloadable CSVs; email/scheduled delivery is not implemented.
- Submissions and FBR invoices support search, status/environment filters, pagination, CSV export of all matching records, and existing view/print modals. Supervisors have no create/edit/delete/submit operations. The submission modal has an optional `invoicesHref` so supervisor navigation stays inside the supervisor portal.
- GET-only `/api/supervisor/{stats,submissions,fbr-invoices,profile}` routes require `requireSupervisor`, scope every query to the authenticated company, disable response caching, and return safe company profile fields without integration tokens. Reporting month boundaries use `Asia/Karachi`.
- `getCurrentUser` checks current database identity, so personnel/role changes and deleted/inactive users take effect for existing sessions. Company users also require an active assigned company. `requireCompanyUser` rejects supervisors, protecting the existing company/FBR operations. `/api/auth/me` returns uncached 200/401 responses and a generic 503 on database failure.
- Verification: `yarn test:supervisor` exercises mocked auth/provisioning, company isolation, GET-only APIs, response caching, report dates and CSV security. `yarn lint` retains the two pre-existing admin hook warnings. Production build passes in an isolated `/tmp` copy with dummy credentials; no live FBR or database writes are needed for validation.
- Headless Chrome checks passed for desktop/mobile dashboard and record layouts, four sidebar links, summary CSV download, read-only detail modals, status links, profile, loading failure/retry, empty states, portal redirects, and supervisor login routing using mocked responses. Unauthenticated GETs to all four running supervisor APIs returned uncached 403s; POSTs returned 405s.
- Follow-up: `useSupervisorData` cleanup ignores obsolete results using an effect-local flag instead of aborting its read-only request, avoiding the reported cleanup `AbortError` after login. Added 13 data-hook regression tests to `yarn test:supervisor`. Slow-response Chrome checks passed for login and navigation away during initial loading/refresh with no unhandled errors or promise rejections.

## 8. Admin visual redesign — 2026-10-20

- User supplied `public/images/admindashboard.png` as the visual reference. The implementation uses `dashbord_background_styles.png` for the admin area, `sidebar_backgroundimage.png` for the sidebar, and `taxmission_dashboard_title_background.png` for the dashboard hero. Preserve the supplied filenames. The reference screenshot itself is not rendered as the dashboard.
- `app/admin/admin-theme.module.css` scopes the navy theme, typography, existing management forms/tables/modals, responsive behavior, and print resets to the admin shell. Login/company/supervisor styling remains independent. The page background scrolls over a solid navy base so long pages remain dark below the viewport.
- Admin layout uses the redesigned `AdminSidebar` and new `AdminTopbar`: active navigation icons, mobile drawer with focus management, keyboard search (Ctrl/Cmd+K), recent-submission activity, account menu, and logout. Search results link to existing company/user/submission pages; Escape returns focus to the triggering control.
- Dashboard components (`AdminDashboardCards`, `AdminDashboardOverview`, `AdminDashboard.module.css`) implement the hero, ten live metrics, five-status donut, yearly sales/tax chart, quick actions, recent submissions, and company performance. Period/year selectors work with live data. Quick actions use existing admin workflows: company registration, user creation, viewing submissions, and reference-data management. There are no fabricated change percentages or sample data in the application.
- `GET /api/admin/stats` retains prior headline fields and adds complete all-time/current-tax-month status counts, twelve months of selected-year financial activity, bounded recent submissions, and company rankings. Optional `year` is validated; reporting dates use `Asia/Karachi`. `GET /api/admin/search?q=...` returns bounded, safely projected results with escaped literal search text. Both endpoints retain admin authorization and return uncached responses.
- Validation: `yarn test:admin` passes 19 API/date/search tests; the supervisor suite also passes. `yarn lint` retains only the two pre-existing admin hook warnings. Production build passes in an isolated `/tmp` copy with dummy credentials.
- Headless Chrome with mocked API data checked the visual reference at 1672×941, responsive overflow at 320/390/768/1280/1672px, status/year filters, search and focus restoration, activity/account menus, existing company/user/reference forms, mobile drawer keyboard behavior, errors/retry, and empty states. Unauthenticated requests to the running stats/search APIs return uncached 403s. No live database writes or FBR submissions were performed.
- Follow-up layout adjustments: the admin sidebar now uses `Mnagae_taxmission_logo_new.png`, framed to remove its transparent margins while preserving the supplied file. Users and All Submissions share `AdminFilterBar.module.css`; Users retains its company/personnel-type choices and applies both selections with the Filter button.
- On desktop viewports at least 1100px wide and 600px high, the dashboard uses a viewport-height layout with shrinking chart/detail tracks. Recent Submissions shows approximately three rows on larger screens and two on shorter laptops, with keyboard-accessible internal scrolling and sticky headers. Long company names occupy at most two visual lines, with the full name available via title/detail. Company-performance history also scrolls within its card. Narrow screens retain the stacked layout.
- Follow-up validation: production build and lint pass (the same two existing hook warnings). Mock-data browser checks verified zero outer dashboard scrolling at 1920×1080, 1672×941, 1440×900, 1366×768, 1280×800, 1280×720, 1280×640, and 1100×600; two/three visible recent rows with the remaining records scrollable; the new logo; aligned Users filters; Filter-button behavior; matching filter-card backgrounds; and mobile filter usability.
- Further spacing refinement: the sidebar logo frame is 10% smaller (184px → 165.6px), with 16px top and 14px bottom padding. Desktop Submissions Status, Sales vs Tax Amount, and Quick Actions are 10% shorter; Recent Submissions and Company Performance move up and receive the entire freed height. Grid calculations preserve the existing compact-screen sizing rules. Browser measurements verified the exact height transfer across the same eight desktop sizes, no outer scrolling, two/three recent rows with internal scrolling, contained middle-card content, and the mobile layout. Lint passes with the same two existing warnings.
- Summary-card reference details: all eight small metrics now include colored percentage arrows and glowing sparklines, replacing descriptive notes and rotated corner decorations. Card icon tiles have stronger lighting; Validated, Submitted, Failed, and Tax use additional matching icon variants. Sales/Tax cards include warm upper waves and percentage footers, with sales bars and a tax sparkline. Existing card/grid dimensions and headline totals are preserved; compact layouts place the small-card percentages beside values when necessary.
- Summary-card trends are live: `/api/admin/stats` returns additive `cardTrendPeriods` and `cardTrends` for the six months through the current Karachi month, independent of the selected annual reporting year. Company/user trends count new registrations (active-company buckets include registrations currently active); submission/status/financial trends use tax periods. Accessible chart descriptions and percentage tooltips explain the basis and comparison. Percentages compare the current and previous month; `New` handles nonzero activity after zero, and two zero months show 0%. Increased failures are red; decreased failures are green. No historical company status transitions are inferred.
- Summary-card validation: all 21 admin API/search tests pass, including trend/date-boundary cases; lint and the isolated production build pass with the same two existing warnings. Mock-data Chrome checks compared before/after dimensions at twelve desktop/tablet/mobile sizes (320px through 1920px), verified all ten mini charts and percentages, new/zero/decreasing activity, financial waves, no clipped or overlapping badges/charts, and no outer desktop scrolling.

## 9. Accountant and supervisor visual redesign — 2026-10-20

- References: supplied `Accoutnant_dashbaord_desing.png` and `supervisor_dashbaord_desing.png`. Both portals now share the admin theme’s navy background, supplied sidebar/hero images, cropped new logo, pink active navigation, lit icon tiles, purple charts, rounded tables, and gradient filter panels. Preserve asset filenames. Login and admin styling remain independently scoped.
- `PortalShell` / `PortalSidebar` and the redesigned company/supervisor `Topbar` provide six accountant links and four supervisor links, company identity, account menu, activity links, and a mobile drawer with focus trapping, Escape/backdrop close, focus restoration and background scroll locking. Supervisor header search uses the existing company-scoped submissions API; results and activity entries open authorized record modals via `?record=`. Search supports Ctrl/Cmd+K. Authentication and role redirects are unchanged.
- `components/portal/PortalTheme.module.css` scopes shared forms, inputs, buttons, tables, status/environment badges, alerts, modals and print resets to these two portals. `PortalFilterBar` is used by accountant Submissions, FBR Invoices and saved Invoice Items; selections apply on Filter. The invoice entry grid retains its existing fields/calculations/actions, uses navy rows/headers and internally scrolls horizontally. Totals stack on mobile. Accountant profile now includes a themed account identity panel and password form; supervisor company/profile/password details use the same theme.
- Accountant dashboard uses a dedicated CSS module and live six-card overview, selectable three/six-month bill chart, all/current-tax-month five-status breakdown, scrolling recent activity, and five largest buyers by total bill (sort controls reorder only those displayed buyers). `/api/company/stats` retains company scoping and prior totals, adds Ready for Submission, six-month status/trend values and real month comparisons, uses Karachi boundaries, disables caching and returns a safe error. New `lib/company/dashboardStats.js` and `yarn test:company` cover this data.
- Supervisor dashboard follows its reference with submission progress, ready/failed links, three financial cards with real monthly sparklines/comparisons, five-status bars, monthly volume, and scrolling recent activity. Refresh/summary CSV, all-environment/all-status totals, report scope and empty/error/retry behavior remain. Supervisor records retain read-only detail/print modals, pagination and CSV export of every matching record; dark search/status/environment filters now apply with Filter. Profile password changes remain an account operation; supervisor tax records remain read-only.
- Both desktop dashboards fit tested 1672×941, 1366×768, 1280×720 and 1100×700 viewports without outer page scrolling; smaller screens stack naturally. Mock-data Chrome checks covered 320/390px portals and 768px shell, contained metrics/charts, working dashboard controls, filters, CSV downloads, off-page record links, details, white invoice print, profile password forms, saved-item editing, invoice autofill/draft saving, role redirects, error/retry and empty data. Navigation/search/activity/mobile keyboard behavior passed for both roles, including long company names; no runtime errors or promise rejections occurred. These checks performed no live database writes or FBR submissions.
- Validation: `yarn test:company` passes five new dashboard/API/trend tests; `yarn test:supervisor` and all 21 admin API/search tests pass. Lint and the isolated production build pass, retaining only the two pre-existing admin hook-dependency warnings. No commit or push was requested or performed.
- Table hover follow-up: all three portal themes use `--color-table-hover: #263354` (muted blue-navy), including recent/dashboard tables and alternating rows. The shared table rule uses this token rather than white, and the portal override no longer places its hover selector inside `:where`, which let the old global rule win. Editable invoice-row inline backgrounds and white print styling are preserved. Chrome verified actual mouse hover on odd/even rows in records and dashboard tables for admin, accountant and supervisor; lint retains only the existing warnings.
