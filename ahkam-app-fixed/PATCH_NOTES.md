# Ahkam.app — patched worker files

## Included fixes

- Arabic search no longer silently truncates to six words.
- Search units are capped explicitly at 10; the API returns a clear validation error instead of silently dropping terms.
- Multi-word searches are evaluated at the **judgment level**: different terms can occur in different paragraphs of the same judgment and still satisfy an AND search.
- Quoted searches support FTS5 phrase matching instead of being flattened into separate terms.
- Arabic query expansion was reduced to a compact set of meaningful spellings/prefix forms.
- Search snippets are limited inside SQL to three paragraphs per judgment instead of loading all matching paragraphs into the Worker and discarding most of them afterward.
- Duplicate paragraphs that match multiple search units are de-duplicated before snippet ranking.
- Highlighting now uses word-boundary checks to reduce substring false positives.
- Safe JSON serialization was added for SSR JSON-LD to prevent `</script>` breakout.
- Judgment structured data was changed from `Legislation` to `WebPage` and the homepage now publishes a `SearchAction`.
- Public API responses no longer expose D1 row-read/duration diagnostics.
- Cache keys use an allowlist for recognized API parameters and separate cached CORS responses by origin.
- Search/case/id validation now rejects malformed numeric values instead of accepting prefixes such as `123abc`.
- Browser history handling avoids pushing a new history entry while replaying a `popstate` event.
- Copy citation, copy link and print actions are enabled on the judgment page.
- Error responses consistently include the security headers.
- Sitemap page validation was hardened.
- Added supporting D1 indexes in `migrations/0002_search_indexes.sql`.

## Deployment

1. Deploy the Worker normally with Wrangler.
2. Apply the new migration once against the remote D1 database:

```bash
npx wrangler d1 migrations apply egypt-judgments --remote
```

3. After deployment, smoke-test:
   - `/`
   - `/robots.txt`
   - `/sitemap.xml`
   - `/api/search?q=بطلان%20إعلان`
   - `/judgment/<existing-master-id>`

## Important architecture note

The patch keeps the existing FTS table and ingestion format. It does **not** replace the current index with a new master-level FTS table, so existing data does not need to be rebuilt just to deploy this patch.

## Round 2 – review fixes

**Search / Arabic**
- Highlighting now matches the same forms the FTS query finds (`إعلان` highlights `الإعلان`, `وبالإعلان`, `والإعلانات`) and the snippet window centres on the first real match.
- Query expansion rebuilt: strip one article/preposition to get a stem, generate spelling alternates (ة/ه, ى/ي, ؤ/ئ/ء), then add prefix forms in priority order (`ال وال بال لل ولل وبال …`), capped at 30 terms. Fixes the old cap that silently dropped the ة/ه variants and the junk `الالمسئولية` forms. Latin/numeric tokens no longer receive Arabic prefixes.
- Stray `"` `*` `^` and leading `-` are stripped from tokens; `م.ت` style tokens split cleanly.
- Offset map is unit-accurate for characters whose lowercase form changes length.
- `MAX_SEARCH_UNITS` is defined once (arabic.js).
- Court filter accepts a list (`court=3,31`); the footer link for مجلس الدولة now covers الإدارية العليا + القضاء الإداري, and the court select has a matching option.

**Caching / API**
- Cache key only varies by an Origin in `ALLOWED_ORIGINS`; arbitrary Origin values can no longer bypass the cache.
- Non-API paths ignore the query string in the cache key (`/judgment/1?x=…` shares one entry).
- Cache writes use `ctx.waitUntil` (no added latency).
- `/api/judgment` returns HTTP 404 (`{found:false}`) for missing judgments; 404s are cached for 5 minutes.
- Optional per-IP rate limiting hook (`SEARCH_LIMITER`, see commented block in `wrangler.toml`; no-op until bound).
- Arabic-Indic/Persian digits accepted for id / case number / year / page / court.
- `getJudgmentByCase`: no `Master_Text` in the multi-chamber list, deterministic `ORDER BY`, single match reuses `getJudgmentById`. Paragraph query has a `Fakra_ID` tiebreaker.

**Routing / SEO**
- HEAD is served like GET; other methods return 405.
- Only `/sitemap.xml` and `/sitemap-<n>.xml` are valid; page 1 of a split sitemap includes the homepage.
- `apple-touch-icon` no longer returns an SVG (iOS ignores it) – add a real PNG if wanted.
- Judgment pages: no double space in the description when the date is missing; `datePublished` is emitted only as an ISO date (converts `dd/mm/yyyy`); canonical copy-link; toast instead of `alert()`; added `theme-color`, `twitter:card`, `og:site_name`, `og:locale`.

**Browser**
- One shared abort/request-id guard for text search, judgment view and case lookup (no more late responses overwriting the page).
- Case number / year inputs are text + numeric keypad and accept `٩٥`.
- No duplicate history entries when repeating the same search; leaving to the empty home state cancels in-flight requests.
- Pagination capped at the API limit (100 pages); footer court links are real links; arrow keys switch search tabs; Enter works in the case-number field; dead `showSubNotice` removed.

**Config / DB**
- `workers_dev = false` (no duplicate `*.workers.dev` copy).
- `migrations/0003_drop_duplicate_indexes.sql` drops two redundant indexes.

**Not changed (needs your decision)**
- The judgment-level AND search still runs one FTS scan per term. For very common words this is the main cost driver; the real protection is a Cloudflare rate-limiting rule or the `SEARCH_LIMITER` binding.
- `og:image` needs a PNG/JPG asset (SVG is not supported by social platforms).
- CSP still allows `'unsafe-inline'` because pages use inline `onclick` handlers.
- Phrase (quoted) searches remain exact-spelling.
- Check whether indexed text stores `240` or `٢٤٠` before normalising digits inside text search.

## Deployment (updated)

```bash
npx wrangler deploy
npx wrangler d1 migrations apply egypt-judgments --remote   # applies 0002 (if not yet) and 0003
```
Smoke-test: `/`, `/robots.txt`, `/sitemap.xml`, `/api/search?q=بطلان%20إعلان`, `/api/search?q=إعلان&court=3,31`, `/judgment/<id>`, `curl -I https://ahkam.app/`.
