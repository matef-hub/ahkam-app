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
