# 02: Sitemap, routes, framework, build, third parties

## Framework and build (all OBSERVED)

| Fact | Evidence |
|---|---|
| Next.js, pages router (`__NEXT_DATA__`, `/_next/data/<buildId>/…`, `pages/_app-*.js`) | `GET https://jobright.ai/` response header `X-Powered-By: Next.js`. `__NEXT_DATA__` holds `"page":"/"`, `"buildId":"jVvHpgwrK3EATiknHbdDx"`. REA `bundle` inference `vendor_fingerprint: Next.js` (high, 8 scripts), `React` (medium). |
| Build id `jVvHpgwrK3EATiknHbdDx`. Manifests at `static.jobright.ai/_next/static/<buildId>/_buildManifest.js` and `_ssgManifest.js` | `<script src>` tags in landing HTML |
| Asset CDN: `static.jobright.ai` (225 references in landing HTML). Chunk names are webpack content-hashed (`chunks/<id>-<hash>.js`). | landing HTML |
| Pages use `getServerSideProps`: `"gssp":true`, `__N_SSP` on `/`, `/jobs/info/[id]`, `/jobs/recommend`, `/tools/job-tracker`, `/tools/resume-checker`, `/[...slug]` (remote-jobs) | `__NEXT_DATA__` in captures `s2`, `p_feed`, `p_tracker`, `p_resumecheck`, `p_remote`, `m_land` |
| Sentry release `pigeon_production@v0.5.12` (front-end code name "pigeon") | `baggage` header on `POST /swan/event/submit` (capture `s1`) |
| HSTS `max-age=15724800; includeSubDomains`. The landing page is `Cache-Control: private, no-cache, no-store` | `curl -D` of `https://jobright.ai/` |
| `Access-Control-Allow-Origin: https://www.jobright.ai` and `allow-credentials: true` on `/swan/*` | response headers of `GET /swan/recommend/landing/jobs` (`s1`) |

## Route inventory

Source: the route keys of `_buildManifest.js` (OBSERVED, 120+ pages). Grouped by product area. Logged-out behavior is shown where a page was loaded.

| Area | Routes | Logged-out behavior observed |
|---|---|---|
| Landing and marketing | `/`, `/about`, `/ai-job-match`, `/ai-agent`, `/agent`, `/orion-copilot`, `/job-referral`, `/coach-landing`, `/interview-landing`, `/mobile-app`, `/partners`, `/security`, `/compare/[slug]`, `/top-jobs`, `/SWE-intern(-video)`, `/engineering-intern(-video)`, `/data-science`, `/*-jobs` SEO pages (`/h1b-jobs`, `/intern-jobs`, `/entry-level-jobs`, `/remote-jobs-usa`, `/software-engineer-jobs`, `/marketing-jobs`, `/data-analyst-jobs`) | `/` renders and calls `/swan/recommend/landing/jobs` (`s1`, `m_land`) |
| SEO job lists (catch-all) | `/[...slug]` serves `/remote-jobs/*` and `/role/[id]`, plus `/minisites-jobs/[...slug]`, `/job-collections`, `/collection-table` | `/remote-jobs/software-engineering` is SSR with 20 jobs in `pageProps.defaultData` (`p_remote`) |
| Jobs feed (app) | `/jobs/recommend`, `/jobs/explore`, `/jobs/[visit]`, `/jobs/external`, `/jobs/search` (string in bundle) | `/jobs/explore` → **307** → `/jobs/recommend` (`s3`). `/jobs/recommend` returns 200 SSR, its `/swan/*` calls return 401, then the client navigates to `/` (`p_feed`, `s1`, `s2`) |
| Job detail | `/jobs/info/[id]` (24-hex id) | 200 SSR, full job and company in `pageProps.dataSource` (`s2`, `m_job`). `Cache-Control: public, s-maxage=7200, stale-while-revalidate=86400` |
| Company tab | No standalone company route in the manifest. Company data rides inside the job (`companyResult`) on `/jobs/info/[id]`. `/interview/[companyId]` is per-company interview prep. | (see 05) |
| Saved, applied, tracker | `/jobs/liked`, `/jobs/applied`, `/tools/job-tracker` (public marketing page) | `/tools/job-tracker` 200 SSR, calls `/swan/recommend/landing/jobs` (`p_tracker`) |
| Resume | `/jobs/resume`, `/jobs/resume/edit/[id]`, `/resume-templates`, `/ai-resume-builder`, `/ats-resume-builder`, `/ats-resume-checker` | not loaded logged-in |
| Profile and settings | `/jobs/profile`, `/settings`, `/candidate-preferences` | not loaded |
| AI tools (public) | `/tools`, plus `/tools/{ai-job-apply, ai-job-assistant, ats-score-checker, check-your-resume-score, cover-letter-generator, grad-jobs, job-alert(+/unsubscribe), job-clipper, job-tracker, resume-bullet-point-generator, resume-checker, resume-fixer, resume-grammar-checker, resume-headline-generator, resume-helper, resume-job-matcher, resume-maker, resume-matcher, resume-parser, resume-rewriter, resume-summary-generator, resume-tailor}`, `/job-autofill`, `/voice-chat` | `/tools/resume-checker` 200 SSR (`p_resumecheck`) |
| Interview prep | `/interview`, `/interview/[companyId]`, `/interview_tip` | `/interview` → **307** → `/interview-landing` (`p_interview`) |
| Coaching | `/coaching`, `/coaching/discover`, `/coaching/bookings`, `/coaching-policy` | `/coaching/discover` ends at `/` (`s3`) |
| Onboarding and auth | `/onboarding-v3/{signup, mode-selection, career-goals, advanced-preferences, resume-upload, diagnostics}`, `/matching`, `/auth/callback/{email,linkedin}`, `/email-verification`, `/verify-email/[code]`, `/verify-referral/[code]`, `/reset-password`, `/linkedin-verification/callback`, `/work-email-verify`, `/return` | not loaded |
| Pricing | Consumer pricing has **no page route**. It is a client flow backed by `/swan/payment/price-v2` and related endpoints (bundle strings), plus many `*_offer` and `pricing_*` A/B flags. `/employers/pricing` is the B2B page. | not loaded |
| Employer (B2B) | `/employers`, `/employers/pricing`, `/employer-signup`, `/employer-v1`, `/fake-candidate-detection`, `/tnt` | not loaded |
| Legal | `/legal/{privacy, service, cookie-policy, refund, sales}`, `/referral-policy` | not loaded |

`robots.txt` and `sitemap.xml` agree with this split (OBSERVED). `robots.txt` allows marketing, `/tools/*`, `/jobs/*`, `/role/*`, `/remote-jobs/*` and `/blog/*`. It disallows the onboarding steps, `/matching`, the logged-in `/jobs/{recommend,profile,resume,liked,applied}`, `/swan/`, `/api/` and `/monitoring`. The sitemap index lists `sitemap-{pages, comparison, blog, taxonomy, taxonomy-1, taxonomy-2, remote-jobs}.xml`. `/blog/*` is in `robots.txt` but is not a Next page in this build's manifest, so it is served by something else (see 08).

## Third-party services seen on the wire (OBSERVED, host counts from `s1`)

| Service | Hosts | Purpose (from URL shape) |
|---|---|---|
| Mux video | `stream.mux.com`, `manifest-…fastly.mux.com`, `chunk-…fastly.mux.com`, `inferred.litix.io` (Mux Data) | HLS landing-page video and playback analytics |
| Google | `www.googletagmanager.com`, `analytics.google.com`, `www.google-analytics.com`, `stats.g.doubleclick.net`, `accounts.google.com/gsi/status` | GTM, GA4 `g/collect`, Google One Tap / Identity Services |
| LinkedIn | `snap.licdn.com`, `px.ads.linkedin.com`, `px4.ads.linkedin.com`, `media.licdn.com` | Insight tag, conversions, logo images |
| Meta | `connect.facebook.net` | Pixel |
| Microsoft | `bat.bing.com` | UET conversions |
| TikTok | `analytics.tiktok.com` | Pixel |
| Plausible | `plausible.io` | analytics |
| Fonts | `fonts.cdnfonts.com` | web font |

Named in the bundle but not seen on the wire in these captures (OBSERVED in public chunks, not in traffic): Amplitude (`api2.amplitude.com/2/httpapi`), Stripe, Microsoft Clarity (`clarity.ms` is in a Sentry ignore list next to the other pixels), Lottie, pdf.js / react-pdf, ProseMirror/Tiptap, Trustpilot, Calendly, and the ATS integrations Greenhouse, Workday (`myworkday`), JobTarget and Lensa.

Sentry: envelopes are POSTed to the first-party tunnel `POST /monitoring?o=<org>&p=<project>` (`s1`), so they do not go to `sentry.io` directly.
