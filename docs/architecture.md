# Ahkam architecture

## Search path

`Judgments_Master` and `Judgments_Text` remain the source of truth. Migration
`0004_normalized_judgment_fts.sql` creates `FTS_Judgments_Normalized`, a
rebuildable projection of paragraph text and the `Master_Text` summary. The
original Arabic text is never changed or used as a display substitute.

For each request the Worker:

1. validates and parses the query and filters;
2. runs bounded FTS5 expressions to retrieve paragraph/master candidates;
3. groups candidates by `Master_ID`, so all required terms may occur in
   different paragraphs of one judgment;
4. applies exclusion and metadata filters with bound D1 values;
5. ranks by phrase hits, terms covered, matching sections, FTS score,
   principle hits, and finally date/ID tie breakers;
6. asks SQL for at most three ranked snippets per judgment.

The default scope is `full`; `principles` and `reasons` are explicit narrower
scopes. Phrase queries match one indexed section exactly. Search results use a
keyset cursor for forward traversal when one is available; the page parameter
remains supported for bookmarked and historical URLs.

## Data additions

`Judgment_Metadata` is additive storage for chamber, type, category, source,
and provenance filters. `Judgment_Relations` is an additive foundation for
editorial citations and future semantic relations. `Search_Analytics` records
only query-quality data (query, normalized query, court filter, count, time),
with no IP address, account, or cookie identifier.

## Delivery and safety

The Worker server-renders the home and judgment pages. The API and HTML use
security headers, request IDs, structured request timing logs, cached canonical
GET keys, prepared statements, input limits, CORS allowlisting, and the Worker
rate-limit binding. Cache/API diagnostics are not exposed in public responses.

The search UI uses `pushState` only for user-initiated navigation and
`replaceState` while restoring history, avoiding back/forward loops.
