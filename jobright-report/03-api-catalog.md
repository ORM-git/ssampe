# 03: API catalog

Two kinds of evidence are kept apart in this file:

- **A. Observed on the wire.** The site's own pages made the request in a REA capture. Shapes are value-free, in [shapes/](shapes/).
- **B. Named in the public bundle only.** A path string appears in a public JS chunk. Method and params are read from the call site where noted. **None of the B endpoints were called.**

## Conventions (OBSERVED)

| Convention | Evidence |
|---|---|
| Base: same origin, `https://jobright.ai/swan/...`. The axios base prefix is a constant joined in front of `/swan/...` | every `/swan/*` request in `s1`. Call sites use `"".concat(<base>, "/swan/…")` in `pages/_app-4ca79da83657f056.js` |
| Envelope `{success: boolean, errorCode: number, errorMsg: string|null, result: …}` | every captured `/swan/*` JSON body, e.g. `shapes/recommend_landing_jobs.json`, `shapes/auth_newinfo.json` |
| Client headers: `x-client-type: web`, `accept: application/json, text/plain, */*`, Sentry `sentry-trace` and `baggage` | request headers of `GET /swan/recommend/landing/jobs` (`s1`) |
| Auth: **session cookie**, not a bearer token. axios `defaults.withCredentials = true`. No `authorization` header was seen on any `/swan/*` request. Anonymous calls to user endpoints return **HTTP 401**. | chunk `15902-*.js` sets `withCredentials`. `p_feed`: `GET /swan/filter/saved/list`, `/swan/popup/office-hour/registration`, `/swan/credit/balance-v2` → 401. The cookie names were not recoverable: REA reported the cookie header value as null. |
| CORS: `access-control-allow-origin: https://www.jobright.ai`, `allow-credentials: true`, `allow-headers: *`, `allow-methods: *` | response headers, `GET /swan/recommend/landing/jobs` (`s1`) |
| Caching: no `cache-control` on `/swan/*` JSON responses. SSR job detail: `public, s-maxage=7200, stale-while-revalidate=86400`. SSR remote-jobs and landing: `private, no-cache, no-store` | `s1`, `s2`, `p_remote` |
| Rate limits: no `x-ratelimit-*` or `retry-after` header seen. The chat streaming client special-cases **HTTP 429** ("Copilot Rate limit" toast). | chunk `15902-*.js` (`/swan/chat/stream` / resume chat `onopen` handler) |
| Streaming: AI chat uses `POST` with `accept: text/event-stream` (Server-Sent Events over fetch) | chunk `97342-*.js`, `/swan/chat/stream` call site |

## A. Endpoints observed on the wire

| Method and path | Seen on | Status (anon) | Query | Request body | Response `result` (shape file) |
|---|---|---|---|---|---|
| `GET /swan/recommend/landing/jobs` | `/`, `/tools/job-tracker`, `/tools/resume-checker` (`s1`, `p_tracker`, `p_resumecheck`, `m_land`) | 200 | none | none | `{jobList: JobItem[20], impId: null}` (`recommend_landing_jobs.json`) |
| `GET /swan/auth/newinfo` | every page | 200 | none | none | session and user summary, all nulls when anonymous (`auth_newinfo.json`) |
| `GET /swan/ab/user` | every page | 200 | `user` | none | `{config: {<flag>: string}, exp: {<flag>: string}}`, about 65 experiment flags (`ab_user.json`) |
| `POST /swan/event/submit` | every page | 200 | none | `{timestamp, timezoneId, browserInfo{userAgent}, eventDetail{platform, business_type, release_version, time_zone, browser_type, is_in_app, user_agent, is_mobile, utm_source, utm_campaign, …}, eventType, channel}` | `boolean` (`event_submit.json`) |
| `GET /swan/filter/open/cities` | `/remote-jobs/*` (`s1`, `p_remote`) | 200 | none | none | `string[19206]`, the city list for the location filter (`filter_open_cities.json`) |
| `GET /swan/filter/saved/list` | `/jobs/recommend` (`p_feed`) | 401 | none | none | body not JSON (`filter_saved_list.json`) |
| `GET /swan/popup/office-hour/registration` | `/jobs/recommend` | 401 | none | none | (`popup_office-hour_registration.json`) |
| `GET /swan/credit/balance-v2` | `/jobs/recommend` | 401 | none | none | (`credit_balance-v2.json`) |
| `POST /monitoring?o=&p=` | every page | 200 | `o`, `p` | Sentry envelope (`text/plain`) | `{}` |
| `GET /_next/data/<buildId>/index.json` | client navigation `/jobs/recommend` → `/` (`p_feed`) | n/a | none | none | Next.js `getServerSideProps` JSON for `/` |

`eventType` values seen (in `s1`, `s2`, `p_*`, `m_*`): `landing_exposure_v3`, `landing_downloadapp_exposure`, `mobile_landing_page_exposure`, `product_landing_exposure`, `visitor_reco_detail_exposure`, `resume_sidebar_exposure`, `error_notification_exposure`, `seo_tool_exp_job_tracker`, `user_incognito`. The naming pattern is `<surface>_exposure`, which suggests impression logging (INFERRED).

### SSR page data (OBSERVED, delivered through `__NEXT_DATA__` instead of an XHR)

| Page | `pageProps` keys | Shape file |
|---|---|---|
| `/jobs/info/[id]` | `isMobile, initialIsMobile, isSsrMobile, dataSource{impId, displayScore, pos, jobResult, companyResult, jdResponsibilitySummary}, baseSalary, jobLocation (schema.org), logined, jobHashedId, isTntDetail, pageUrl, keepVisitorLayoutForPendingOnboarding, industryTagGroup` | `ssr_jobs_info_id.json` |
| `/remote-jobs/[...slug]` | `isMobile, isGoogleBot, queryParams{slug, domain, type, workModel[], seniority[], city, jobTitle}, defaultData: JobItem[20], initialJobsError, internListConf, params` | `ssr_remote-jobs_slug.json` |
| `/` | `isMobile, initialIsMobile, recommendLinks[{name, link}]` | (inline) |
| `/jobs/recommend` | `isMobile, initialIsMobile, deeplinkId` | (inline) |
| `/tools/*` | `isMobile, initialIsMobile` | (inline) |

## B. Endpoint inventory from the public bundle (not called)

313 distinct `/swan/*` and `/api/*` path strings were found across the public chunks listed in `_buildManifest.js`. Grouped by first path segment, with counts:

`filter`(27) · `resume`(26) · `agent`(25) · `resume-tailor`(22) · `interview`(20) · `auth`(19) · `resume-rewriter`(18) · `job`(16) · `feedback`(16) · `payment`(15) · `recommend`(14) · `landing`(7) · `easyapply`(7) · `import`(6) · `work-verification`(5) · `profile`(5) · `career-coach`(5) · `popup`(4) · `greenhouse`(4) · `email-connection`(4) · `share`(3) · `orion`(3) · `msg`(3) · `linkedin-verification`(3) · `business`(3) · and 1–2 each for `user-settings, linkedin-diagnosis, lensa, intern-list, email, credit, chat, autofill, address, voice-chat, subscribe-email, referral, mini-sites, event, candidate-preference, aisearch, ab`. The Next.js API routes under `/api/` are `agent/trace, checkout_sessions, collection-jobs, events, jobtarget/questions, resume-tailor/download, resume/download`.

The endpoints that matter for the feed, with method and params read from the call site in `pages/_app-4ca79da83657f056.js` unless noted:

| Method and path | Params (names only) | Notes |
|---|---|---|
| `GET /swan/recommend/list/jobs` | `refresh, sortCondition, position, deeplink, reqJobIds, count` (default **10**), `syncRerank` (default false) | logged-in feed. Offset pagination (`position` + `count`). |
| `POST /swan/recommend/visitor-search` | query: `lite, count, position, searchType` (default `job-title`), `sortCondition` (default RECOMMENDED). Body: the search object. | anonymous search |
| `POST /swan/recommend/visitor-list/jobs` | query: `sortCondition=RECOMMENDED, count, position, useLegacySearch` | anonymous list |
| `POST /swan/recommend/similar/jobs` | body | similar jobs |
| `GET /swan/recommend/tnt/jobs` | none | "TNT" program jobs (`isTnt` company flag) |
| `/swan/recommend/{search, search-top-jobs, count-filter-jobs, count-hidden-jobs, count-search-filter-jobs, top-jobs-count, auto-apply/jobs, job/custom-questions}` | n/a | method not read |
| `POST /swan/job/like`, `/swan/job/unlike` | body | saved jobs. Success marks the onboarding task `chooseJob` complete in the store. |
| `POST /swan/job/liked/jobs-v2`, `/swan/job/applied/jobs-v3`, `/swan/job/applied/search-jobs` | body | saved and applied lists (tracker) |
| `POST /swan/job/apply` | `{jobId, source: 0}` | mark applied. chunk `50501-*.js` wraps it in `navigator.locks` (`easy-apply-applied:<…>`) to stop double submits. |
| `/swan/job/{ignore, report, unapply, apply-status/save, apply/count, like/count, statistic, direct-apply-v2, jt-apply, agent-apply}` | n/a | `ignore` = "not interested" (chunk `23841-*.js`, logs `jobId` and `impId` on error) |
| `POST /swan/filter/get/filter`, `/swan/filter/update/filter(-v2)` | body | the user's saved feed filter. The client normalizes `locations` after reading. |
| `/swan/filter/suggestion/{cities, companies, degree, industries-v2, major, schools, search-words, skills, titles-v2, titles-v3}` | n/a | typeahead |
| `/swan/aisearch` | n/a | natural-language search. The axios interceptor treats it specially (`ed()` check in `_app`). |
| `GET /swan/payment/price-v2` | `utm_campaign, winback, offer` | pricing. Other offers: `first-day-offer, trial-offer, winback-offer, unsub-offer, tg-offer, thanksgiving-2026-offer`. Stripe `checkout_sessions` is under `/api/`. |
| `POST /swan/chat/stream` | JSON body, SSE response | Orion copilot chat |
| `POST /swan/easyapply/submit`, `/swan/greenhouse/submit` | body includes `provider` | auto-apply to Greenhouse and Workday (`myworkday/tasks`) |

Sort enum (OBSERVED, `_app` module 20227): `RECOMMENDED = "RELEVANCE"`, `MOST_RECENT = "FRESHNESS"`, `TOP_MATCHED = "MATCH_SCORE"`. The SSR remote-jobs `notesMap.sort_condition` was `RELEVANCE` (`p_remote`).
