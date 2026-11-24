# 04: Job feed and search

Everything here is either read from response fields (OBSERVED) or fitted to those fields (OBSERVED fit, with the sample size given). Reasoning beyond the data is marked INFERRED.

## 1. Three feed surfaces

| Surface | Transport | `notesMap.mode` / retriever | Evidence |
|---|---|---|---|
| Landing "latest jobs" (`/`, `/tools/*`) | XHR `GET /swan/recommend/landing/jobs`, no params, 20 items | no `mode` key. `retriever = titleTaxonomy`, `taxonomy_ids = 01-08-02` | `s1`, `p_tracker`, `p_resumecheck`, `m_land` |
| SEO list (`/remote-jobs/<slug>`) | SSR `pageProps.defaultData`, 20 items | `mode = visitor_search`, `retriever = titleText`, `search_type = job_title`, `sort_condition = RELEVANCE` | `p_remote`, `s1` step 2 |
| Logged-in feed (`/jobs/recommend`) | XHR `GET /swan/recommend/list/jobs?refresh&sortCondition&position&deeplink&reqJobIds&count&syncRerank` | not observed (needs a login) | bundle call site, `_app-4ca79da83657f056.js` |

Anonymous visitors to `/jobs/recommend` get 401s on the user endpoints and then a client redirect to `/` (`p_feed`).

## 2. Retrieval (OBSERVED in `notesMap` on `p_remote`)

The SEO remote-jobs page returns the search pipeline's own counters in each job's `jobNotes.notesMap`. On the first job of `/remote-jobs/software-engineering`:

| Key | Value | Reading |
|---|---|---|
| `search_words` / `retrieve_trigger` | the page's title list ("Backend Engineer, Java Engineer, …") | query = a fixed title set per SEO slug (`queryParams.jobTitle`) |
| `retriever_key_list` | `titleText` | lexical title retriever |
| `titleText_after_retrieve_retrieve_num` | 3000 | lexical recall cap |
| `originTitleEmbed_after_retrieve_retrieve_num` | 500 | second retriever on title **embeddings**, recall cap 500 |
| `…_exclusive_retrieve_num` | 2692 / 192 | items only that retriever found |
| `unique_retrieve_num` | 3192 | union after merge |
| `total_job_num` | 2335 | left after filters |
| `es_recall_deadline_nanos` | a nanosecond deadline | the recall stage runs against **Elasticsearch** with a time budget (INFERRED from the key name) |
| `recommend_recall` `v4`, `recommend_strategy` `v2`, `search_strategy` `v3`, `ranking_test_1` `v2`, `strategy_reverse` `v2` | | versioned strategies and a ranking A/B bucket |

3192 − 2335 = 857 removed, which matches the filter counters below (821 + 36 = 857). **OBSERVED arithmetic.**

## 3. Filtering and dedup (OBSERVED counters)

The filter stage records one counter per filter. Non-zero values on `p_remote`: `dup_desc_filter = 821` and `bad_candidate_filter = 36`. Zero-valued filters: `after_ts_filter, company_cat_filter, company_stage_filter, exclude_company_filter, exclude_company_cat_filter_conf, exclude_security_clearance_filter_conf, exclude_skill_filter, exclude_staffing_agency_filter, h1b_filter, job_time_filter, min_years_of_experience_range_filter, role_type_filter, salary_filter, skill_filter, taxonomy_relevance_filter, upfront_relevance_filter`.

- **Server-side dedup is description-based.** `dup_desc_filter` removed 821 of 3192 recalled items (about 26%) (OBSERVED). Because the key is "desc", jobs are deduplicated by job-description similarity or hash rather than by id (INFERRED). Reposts are flagged separately (`is_repost`, `jobResult.repost`).
- No duplicate `jobId` was found in any captured page of 20 (`s1`, `p_remote`, `p_tracker`; OBSERVED).
- The filters the user picks reach the server as `e_*` keys: `e_city = Within US`, `e_w_model = 2` (remote), `e_job_type = 4,3,2,1`, `e_seniority = executive, staff, senior, mid-level, entry-level(junior), new-grad`, `e_isH1BOnly = false`, `e_radius_range = 0.0`, `e_taxonomy_ids`. The normalized forms are `modify_job_type` and `modify_seniority` (OBSERVED).
- The client-side filter UI options come from `/swan/filter/suggestion/*` and the 19,206-city list `GET /swan/filter/open/cities` (OBSERVED). Saved feed filters use `/swan/filter/{get,update}/filter(-v2)` (bundle).
- Company diversity: `company_scatter_demote = 1.0` on every captured item, which points to a demotion multiplier for runs of the same company (INFERRED: only the neutral value was seen).

## 4. Ranking (OBSERVED formula, verified on 80 of 80 item observations; the same job can appear in two captures)

`jobNotes.rankScore` always equals `jobNotes.boostedFactor`, and both equal the product:

```
rankScore = freshness_weight × mix_rank_weight × direct_title_match_boost_weight × company_scatter_demote
```

A missing term counts as 1. Verified exactly (to 1e-3) on all 20 items in each of `s1` landing, `s1` SSR, `p_remote` SSR and `p_tracker` landing. Lists are returned **sorted by `rankScore` descending** in all four.

- Search: `direct_title_match_boost_weight = 4.5` when `custom_title_direct_match = 1`, and `mix_rank_weight = 1.0`.
- Landing: `mix_rank_weight = 1.5`, no title boost.

### Freshness weight (fitted to observed values)

- **Visitor search:** `freshness_weight = 1.18 − 0.0075 × freshness_hours`. Exact on 20 of 20 items in `p_remote`, for 3 h to 9 h old. `freshness_hours` and `freshness_minutes` are both present in `notesMap`.
- **Landing feed:** for jobs under an hour old, about `2.28 − 0.0036 × minutes_since_publishTime` (within one minute, `s1`, `p_tracker`). Older jobs are bucketed: every "1 hour ago" job has 2.0280 and every "2 hours ago" job has 1.9920, whatever its exact minute. So past the first hour the server uses hour granularity (OBSERVED in 3 captures).
- The landing feed holds only the last 2–3 hours of jobs, newest first. In effect it is "latest jobs in taxonomy 01-08-02" (OBSERVED: ages 8 min to about 3 h).

## 5. Pagination (OBSERVED from call sites)

Offset-based. Every list endpoint takes `position` (offset) and `count` (page size): `list/jobs` defaults `count` to **10**, and `visitor-search` and `visitor-list/jobs` take both in the query string. An A/B flag `job_list_fetch_batch_size_20` exists in `/swan/ab/user` (OBSERVED), so page size is under experiment. `notesMap.startPos` (0) and `position` (0..19) echo the offset and the in-page rank. `refresh` and `syncRerank` on `list/jobs` point to a server-held ranked list that can be regenerated or re-ranked on demand (INFERRED). No cursor token was seen.

## 6. Match score (OBSERVED fields, INFERRED computation)

Fields on `/jobs/info/[id]` SSR (`s2`):

- `displayScore` (number). It sits at the item level next to `jobResult` in feed items too, and is the number in the card's dashboard-style progress ring (antd `Progress type="dashboard"` in chunk `23841-*.js`, marker `data-tut="jobs-card-match-score-1"`).
- `jobResult.recommendationScores[]`: `{featureName, displayName, score}` with `q_seniority_match` "Experience Level", `q_job_skill_match` "Skill Match", `q_industry_match` "Industry Experience". The bundle's label map for these keys has at least one more entry, whose label ends in "…ion Match". Its key was not read (see 08).
- `jobResult.skillMatchingScores[]`: one per skill, `{featureName, displayName, score}` (12 on the sample job). `industryMatchingScores[]` is empty for the sample.
- `jobResult.jdCoreSkills[]`: `{skill, score, type: "hard_skill"…}` (score 3 on the sample), the job-side skill weights.

For an anonymous visitor every one of these scores is **0** (`s2`: `displayScore 0`, all three feature scores 0, all skill scores 0, and `displayScore 0` on all 20 landing items). So: the job side (skills extracted from the JD, with weights) is computed ahead of time and stored with the job. The user-side match (seniority, skills, industry, and maybe education) is computed per request against the user's resume or profile, and `displayScore` is an aggregate of those feature scores (INFERRED). The aggregation formula is not visible.

## 7. "Early applicant" label (OBSERVED rule)

- It is **server-sent**, as a string in `jobResult.jobTags` (OBSERVED in every capture).
- The bundle constants block in `_app-4ca79da83657f056.js` defines `25`, "Less than 25", "Less than 25 applicants", "Be an early applicant" and "Early applicant", next to an hour constant `36e5` and `24`.
- Across 80 captured items, `jobTags` contains "Early applicant" exactly when `applicantsCount ≤ 25` (OBSERVED, 80 of 80. The one counter-example had 112 applicants and no tag).
- `applicantsCount` values cluster at 20–25, with 25 the most common, and `jobNotes.notesMap.linkedin_job_id` is present on each job. So applicant counts look like they come from LinkedIn's public "applicants" count, which is shown as "under 25", and get clamped to 25 (INFERRED).

## 8. Other job-card signals (OBSERVED)

- `recommendationTags` seen: "Growth Opportunities", "No H1B", "H1B Sponsor Likely", "Culture & Values", "Comp. & Benefits", "Security Clearance Required", "U.S. Citizen Only". Boolean twins on the detail: `isH1bSponsor, isWorkAuthRequired, isCitizenOnly, isClearanceRequired`. `h1BStatus` is on the card.
- `publishTimeDesc` ("8 minutes ago") is server-formatted.
- `impId` per item: an impression id, sent back with actions such as `/swan/job/ignore` (logged with `jobId` + `impId` on error, chunk `23841-*.js`) and folded into a client key `<impId>-<jobId>` (chunk `20414-*.js`).
