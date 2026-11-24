# 06: Frontend architecture

## Stack (OBSERVED)

| Layer | Finding | Evidence |
|---|---|---|
| Framework | Next.js pages router, React | `X-Powered-By: Next.js`, `__NEXT_DATA__`, `pages/_app-*.js`, REA `bundle` vendor fingerprints (Next.js high ×8, React medium) |
| Rendering | SSR on nearly every page (`getServerSideProps`; `__N_SSP` in 6 of 6 sampled pages). `getStaticProps` appears in only 3 chunks. The job detail is SSR plus CDN-cached (`s-maxage=7200, stale-while-revalidate=86400`). | `__NEXT_DATA__.gssp` in `s2`, `p_*`, `m_land`. Grep of the public chunks. |
| UI kit | Ant Design: `Typography.Text`, `Progress type="dashboard"` for the match ring, `notification.error({message: errorMsg})` for API errors | chunks `20414-*`, `23841-*`, `27515-*` |
| Styling | CSS Modules: class lookups like `styles["job-card-sub-content"]`, `styles["expired-job"]`, `styles["job-more-dropdown"]`. 4 global CSS files load at `/_next/static/css/*.css`. | chunk `23841-*`. Network in `s1`. |
| State | **Zustand.** Library code is in `_app` (the `useStoreWithEqualityFn` notice). Stores are read outside React through `store.getState()`, e.g. an onboarding-checklist store with `hydrated`, `completed.<task>`, `markCompleted("chooseJob" | "tailorResume", userId)`, and a separate `useReferralStore`. 25 chunks touch `getState()`. | chunks `_app-4ca79da83657f056.js`, `34296-*` |
| Data fetching | axios instance with `withCredentials`. Thin per-endpoint functions that unwrap the envelope: return `data.result` when `success`, otherwise reject with `errorMsg`. Request interceptors timestamp each request and special-case `/swan/aisearch`, `/swan/easyapply/submit` and `/swan/greenhouse/submit`. No React Query, SWR or Redux library code was found in the public chunks. | `_app` call sites. Library grep found nothing. |
| Streaming | fetch-based SSE client (`accept: text/event-stream`, `onopen`, `onmessage`, `AbortController`) for Orion and resume chat | chunks `15902-*`, `97342-*`, `45805-*` |
| Rich content | pdf.js / react-pdf (resume preview), ProseMirror/Tiptap (resume editor), Lottie (animations), Mux player (landing video) | chunk grep. Mux traffic in `s1`. |
| Concurrency guard | `navigator.locks.request("easy-apply-applied:…")` around marking a job applied | chunk `50501-*` |
| Telemetry | Sentry (release `pigeon_production@v0.5.12`, tunnel `/monitoring`, an ignore list of noisy third-party hosts), first-party `/swan/event/submit` exposure events, Amplitude SDK, GTM/GA4, ad pixels | `s1`, chunk `main-*`, `16288-*` |

## Component structure (OBSERVED names only; structure INFERRED)

The bundle is split into one entry per Next page (`pages/<route>-<hash>.js`) plus shared numeric chunks. These component areas were seen in the chunks:

- **Job card:** company logo, title, match-score ring (`displayScore`, tour anchor `jobs-card-match-score-1`), tag row (`recommendationTags`, `jobTags`), "more" dropdown (ignore or report, which calls `/swan/job/ignore`), expired state (`isDeleted` → `expired-job` class), like and apply actions.
- **Job detail:** SSR `pageProps.dataSource`. It carries the summary, responsibilities, qualifications (must-have and preferred, split into yoe, education, hard and soft skills), the match breakdown (`recommendationScores`, `skillMatchingScores`), the company block (`companyResult` with funding, leadership, press and H1B history) and social connections. The SSR also emits schema.org `JobPosting` pieces (`baseSalary`, `jobLocation`) and one `application/ld+json` block for SEO (`s2`: 1 ld+json tag).
- **Feed shell:** `/jobs/recommend`, with saved filters (`/swan/filter/saved/list`), credit balance (`/swan/credit/balance-v2`), office-hour popup and the promo popup family (`/swan/popup/*`, `/swan/payment/*-offer`).
- **Copilot / agent:** Orion chat (SSE), agent tasks and filter confirmation (`AGENT_INPUT`, `AGENT_UPDATE_FILTER`, `AGENT_SHOW_FILTER`, `AGENT_CONFIRM_FILTER` message types in `_app` module 20227).
- **Resume tools:** upload with polling, rewriter and diagnose, tailor (diff, keywords, chat).

## Routing (OBSERVED)

- File routes from `_buildManifest.js` (see 02). Dynamic segments: `/jobs/info/[id]`, `/jobs/[visit]`, `/interview/[companyId]`, `/role/[id]`, `/compare/[slug]`, `/[...slug]`, `/minisites-jobs/[...slug]`.
- Server redirects: `/jobs/explore` → 307 → `/jobs/recommend`, and `/interview` → 307 → `/interview-landing` for anonymous users (`s3`, `p_interview`).
- Client auth gate: `/jobs/recommend` renders, gets 401s, reads `auth/newinfo` (`logined:false`), then does a client-side Next navigation to `/`. The navigation itself is OBSERVED, through its fetch of `/_next/data/<buildId>/index.json` (`p_feed`). `/coaching/discover` also ends at `/` (`s3`).
- A deep link reaches the feed as `pageProps.deeplinkId`, which is passed to `list/jobs?deeplink=` (`p_feed` plus the bundle).

## Loading and error states

- SSR delivers the first page of jobs, so a cold list page shows no feed spinner. The SEO list carries `initialJobsError` for server fetch failure (`p_remote` `pageProps`; OBSERVED).
- Client API errors show an antd `notification.error` with the server's `errorMsg` (OBSERVED in the `/swan/job/ignore` handler). Failures are also logged with job and impression ids, and Sentry gets them through the tunnel.
- Chat stream 429 → "Copilot Rate limit" toast. Non-200 → throws (OBSERVED in chunk `15902-*`).
- Skeleton or spinner components were not identified (see 08).

## Mobile behavior

- SSR decides `isMobile`, `initialIsMobile` and `isSsrMobile` from the **user agent**, not the viewport. At 375×812 with a desktop Chrome UA, all three came back `false` (`m_land`, `m_job`). Server-side UA sniffing is INFERRED from that result.
- The client also adapts to viewport width. At 375 px the landing page fired the analytics event `mobile_landing_page_exposure` instead of `landing_exposure_v3`, while the event payload still had `is_mobile:false` (`m_land` vs `s1`; OBSERVED). So layout is responsive client-side, and `is_mobile` means the device, not the layout.
- Viewport meta: `width=device-width, initial-scale=1, maximum-scale=2` (all pages sampled).
- A native app exists (`/mobile-app` route, `landing_downloadapp_exposure` event, `is_in_app` in the event payload, and `clientTypes` on the user).
