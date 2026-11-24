# 08: What could not be verified

## Not observed because it needs a login (out of scope by rule)

- Live responses of the logged-in feed (`GET /swan/recommend/list/jobs`) and of search (`visitor-search` was named but not triggered, because this pass did not type into the search UI). Their request params come from bundle call sites only. Their response shapes are assumed to match the landing and SSR `FeedItem`, but that was **not verified**.
- Real (non-zero) match scores. The aggregation from `recommendationScores` and `skillMatchingScores` into `displayScore`, and the color bands the card uses for it (a helper picks a class from `displayScore`, and its thresholds were not read).
- The content and shape of saved jobs, the applied tracker, the resume, the profile, credits, pricing, the agent and the chat stream. Only path names and a few param names are known (03 §B, 05).
- The response bodies of the 401s (`filter/saved/list`, `popup/office-hour/registration`, `credit/balance-v2`): they were captured as non-JSON, and their `errorCode` was not read.
- Session cookie names and attributes. REA reported the request `cookie` header value as null, and no first-party `set-cookie` was exposed.
- Pricing amounts and plans: no public consumer pricing page exists, and `/swan/payment/price-v2` was not called.

## Gaps in the captures

- Every REA browser capture is marked `incomplete`: the total event-allocation budget dropped some events, even with the limits raised to 128 MiB. REA's effective cap is unknown. Heavy pages lose them first (Mux video on `/`, and multi-page runs: `s3` lost everything after its first page). Single-page reruns (`p_*`, `m_*`) cover the pages cited. An endpoint that fires only late on a heavy page could still be missing.
- Captures ran without user interaction (no scroll, click, filter change or search). So **infinite-scroll paging, client-side dedup across pages, filter-change requests and AI search requests were not seen**.
- REA's static `analyze-web-bundle` found no `/swan` endpoints itself, because the paths are string-concatenated. The 313-path inventory comes from a plain string grep of the public chunks. Some call sites may be unreachable, legacy or dead code, and dynamically built paths would be missed.
- The search-path bundle grep was case- and quote-sensitive. Paths built from template pieces may be missing.
- Only `_buildManifest.js` pages and the landing HTML's chunks were downloaded. Lazy chunks not listed there were not examined.

## Inferences with weak support

- Elasticsearch (only the key name `es_recall_deadline_nanos`). MongoDB (only the ObjectId-shaped ids and the `mongoId` field). The title-embedding retriever (only the key `originTitleEmbed`).
- Description-similarity dedup: only the counter name `dup_desc_filter`. The method (hash, MinHash, embedding) is unknown.
- `applicantsCount` coming from LinkedIn and being capped at 25: fits the data (values 20–25, plus a `linkedin_job_id` on each job) but is not proven.
- `company_scatter_demote`: only the value 1.0 was seen, so its effect is unknown.
- The landing freshness curve was fitted on 3 captures within about 3 h of age. The visitor-search curve was fitted on 20 items covering 3–9 h. Behavior outside those ranges is unknown.
- Mobile: SSR `isMobile` is assumed to be user-agent based, because it was false at a 375 px width with a desktop UA. A mobile UA was **not** tested.
- Which LLM provider, queue technology, hosting or cloud is used: no evidence (the API sits behind a generic HTTPS front, and the only response header hints are `via` and `alt-svc`).
- Whether `/swan` is one service or a gateway over several.
- `/blog/*` is allowed in `robots.txt` and listed in the sitemap, but is not a page in this Next build. It may be another app or a rewrite, which was not checked.
- Skeleton or loading components, and the error boundary design: not identified in the minified bundle.
- No source maps were fetched, on purpose, to avoid reproducing source code. So component names and file structure are unknown beyond CSS-module class names and constants.
