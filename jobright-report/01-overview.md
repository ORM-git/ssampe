# jobright.ai: overview of a reverse-engineering pass

Date of capture: 2026-11-24 (UTC). Scope: public, logged-out pages and the traffic a browser sends while loading them. No login was used. No auth, rate limit or paywall was bypassed. No `/swan/*` or `/api/*` endpoint was called directly: every API fact below comes from requests the site's own pages made in the browser. Source code, copy, images and branding are not reproduced. Only field names, path names and value-free shapes are recorded.

## Tools and method

| Tool | Used for |
|---|---|
| REA `rea-agents@6.10.1` CLI (`capture-browser-scenario`, `analyze-web-bundle`), run on Node 24.22.3 through `npx -p node@24` because the local Node 24.18 is below REA's minimum | Scripted Chrome 157 page loads that record network metadata, request and response bodies and headers. Static bundle analysis of 55 landing-page scripts. |
| `curl` (public, non-API files only) | `robots.txt`, `sitemap.xml`, landing HTML headers, `_buildManifest.js`, public JS chunks under `static.jobright.ai/_next/static/` |
| Local Node scripts | Turn the REA Evidence into value-free JSON shapes (see `shapes/`). Grep the public chunks for path strings. |

### Captures cited in this report

These are REA Evidence bundles, kept in the session scratchpad and not copied here, because they contain raw third-party data such as company leadership names.

| Id | Pages loaded (viewport) | Evidence id prefix |
|---|---|---|
| `s1` | `/` → `/remote-jobs/software-engineering` → `/jobs/recommend` (1440×900) | `ev_109f56f95c8bd2ec` |
| `s2` | `/jobs/info/6a6b2730acb0a61f9dbbf5cd` → `/jobs/recommend` (1440×900) | `ev_ca1f0f4f1cd0715f` |
| `s3` | `/jobs/explore`, `/interview`, `/tools/job-tracker`, `/tools/resume-checker`, `/coaching/discover` (1440×900). Event budget overflowed after the first page. | `ev_68c6458a445e1719` |
| `p_feed` | `/jobs/recommend` | `ev_4f70e3ab7ce08574` |
| `p_interview` | `/interview` | `ev_f1bd7556be55155d` |
| `p_remote` | `/remote-jobs/software-engineering` | `ev_5a64a10280f2d105` |
| `p_tracker` | `/tools/job-tracker` | `ev_0c5fe51c98342e33` |
| `p_resumecheck` | `/tools/resume-checker` | `ev_8af88f7919ac3f70` |
| `m_land`, `m_job` | `/`, `/jobs/info/6b055048a78a58c9d3c885a7` at 375×812 (desktop user agent) | `ev_c49b6780aa3cbc46`, `ev_229be76120878ec6` |
| `bundle` | REA `analyze-web-bundle` on a settled `/` tab | `ev_999f07e890deff78` |

REA marks every browser capture `incomplete`: its total event budget drops some events on heavy pages (the landing page streams Mux video). Single-page captures (`p_*`, `m_*`) were added to cover that. See [08-unknowns.md](08-unknowns.md).

## One-paragraph summary

jobright.ai is a **Next.js pages-router** app. Its build id is `jVvHpgwrK3EATiknHbdDx` and its assets come from `static.jobright.ai`. Almost every page uses `getServerSideProps`. It talks to a same-origin JSON API under **`/swan/*`** using axios with cookies (`withCredentials`). Every response comes in one envelope: `{success, errorCode, errorMsg, result}`. Jobs come from a server-side **recommendation/search pipeline**. Public responses leak its internals in a `jobNotes.notesMap` object: retriever names (`titleText`, `originTitleEmbed`, `titleTaxonomy`), recall counts, an Elasticsearch recall deadline, filter counters (including `dup_desc_filter`), and rank weights. In the observed samples, `rankScore` equals the product of boost and freshness weights. **"Early applicant"** is a server-sent `jobTags` entry that matches a bundle constant of 25 ("Less than 25 applicants"). **Match scores** (`displayScore`, `recommendationScores`, `skillMatchingScores`) are present but all `0` for anonymous visitors, which points to per-user computation. Client state uses Zustand, the UI uses Ant Design, and telemetry goes to Sentry (tunneled through `/monitoring`), Amplitude, a first-party `/swan/event/submit`, and several ad pixels.

## Report index

- [02-sitemap-and-routes.md](02-sitemap-and-routes.md): routes, framework, build, third parties
- [03-api-catalog.md](03-api-catalog.md): observed endpoints with shapes, plus the endpoint inventory from the bundle
- [04-feed-and-search.md](04-feed-and-search.md): retrieval, filters, ranking, pagination, dedup, match score, early applicant
- [05-data-model.md](05-data-model.md): entities and fields
- [06-frontend-architecture.md](06-frontend-architecture.md): components, state, routing, loading and error, mobile
- [07-backend-inference.md](07-backend-inference.md): services, with each claim marked OBSERVED or INFERRED, and the mermaid diagram
- [08-unknowns.md](08-unknowns.md): what could not be verified
- [shapes/](shapes/): value-free request and response shapes (types only, arrays shown as first-element shape plus length)

## Conduct notes

- `robots.txt` disallows `/swan/`, `/api/` and the logged-in `/jobs/*` areas for all crawlers, and disallows `/jobs/` entirely for `ClaudeBot` and `GPTBot`. This pass did not crawl. It loaded 2 job-detail pages total and no API URL directly, which respects that intent.
- Some public responses carry personal data about third parties: company leadership names and LinkedIn URLs, and "socialConnections" people on job pages. Only the field names are recorded here.
