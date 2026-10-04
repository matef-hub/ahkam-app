# Operations and rollout

## Safe deployment order

1. Back up/export the production D1 database according to the organisation's
   retention policy.
2. Apply migrations to the intended D1 database before deploying Worker code:

   ```powershell
   npx wrangler d1 migrations apply DB --remote
   ```

3. Verify the normalized index contains source records and run representative
   phrase, multi-paragraph, exclusion, and full-summary searches.
4. Deploy the Worker:

   ```powershell
   npx wrangler deploy
   ```

5. Review Workers Observability for request IDs, 5xx responses, slow searches,
   cache behavior, and zero-result trends.

For a local D1 database that has already been provisioned with the base schema
and source data, use `npx wrangler d1 migrations apply DB --local`.

## Environment and secrets

`wrangler.toml` contains only public binding identifiers. Do not place API
keys, database exports, or credentials in it. Store secrets with
`npx wrangler secret put NAME` and configure preview/staging bindings
independently: Cloudflare binding settings are not inherited automatically by
named environments.

## Performance budget

- Return cached searches from the edge without D1 work.
- Keep uncached searches bounded by 12 query units, 2,048 characters of FTS
  expression, and 50 result rows.
- Return at most three snippets per judgment.
- Use `rows_read` and duration from internal logs to identify regressions;
  neither belongs in the public API.

## Migration notes

All repository migrations are additive or create indexes. Migration 0004 may
be safely replayed: it rebuilds only `FTS_Judgments_Normalized`, never primary
judgment data. Do not run manual destructive schema commands against the
production database.
