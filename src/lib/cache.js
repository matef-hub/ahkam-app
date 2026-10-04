import { ALLOWED_ORIGINS } from "./security.js";

const CACHE_PARAM_ALLOWLIST = {
  "/api/search": [
    "q", "court", "page", "page_size", "cursor", "sort", "mode", "scope",
    "case_no", "case_year", "date_from", "date_to", "chamber", "type", "category",
  ],
  "/api/judgment": ["id", "no", "yr", "court"],
  "/api/courts": [],
  "/api/court-judgments": ["court", "page", "page_size", "sort"],
};

// Bump this when the search response ordering changes so old Cache API entries
// cannot continue serving results in the previous order.
const CACHE_KEY_VERSIONS = {
  "/api/search": "judgment-search-v3",
  "/api/courts": "courts-v1",
  "/api/court-judgments": "court-judgments-v1",
};

const SEARCH_DEFAULTS = {
  page: "1",
  page_size: "20",
  sort: "relevance",
  mode: "normal",
  scope: "full",
};

function canonicalValue(pathname, key, value) {
  if (pathname !== "/api/search" && pathname !== "/api/court-judgments") return value;
  if (key === "q") return value.trim().replace(/\s+/g, " ");
  if (key === "court") {
    return [...new Set(value.split(",").filter((v) => /^\d+$/.test(v)).map(Number))]
      .sort((a, b) => a - b)
      .join(",");
  }
  return value;
}

const CACHEABLE_STATUSES = new Set([200, 404]);

export function getCacheKey(request) {
  const url = new URL(request.url);
  const allowed = CACHE_PARAM_ALLOWLIST[url.pathname];
  const sortedParams = new URLSearchParams();

  // Only recognized API parameters take part in the key. Every other path
  // (judgment pages, sitemaps) ignores the query string completely so that
  // /judgment/1?x=1, /judgment/1?x=2 ... all share a single cache entry.
  if (allowed) {
    const cacheVersion = CACHE_KEY_VERSIONS[url.pathname];
    if (cacheVersion) sortedParams.set("__cache_version", cacheVersion);

    for (const key of [...allowed].sort()) {
      const rawValue = url.searchParams.get(key);
      const value = rawValue === null || rawValue === ""
        ? SEARCH_DEFAULTS[key]
        : canonicalValue(url.pathname, key, rawValue);
      if (value !== undefined && value !== "") sortedParams.set(key, value);
    }

    // CORS responses contain Access-Control-Allow-Origin, so each ALLOWED
    // origin needs its own entry. Arbitrary Origin values must never create
    // new keys, otherwise a client could bypass the cache at will.
    const origin = request.headers.get("Origin");
    if (origin && ALLOWED_ORIGINS.has(origin)) sortedParams.set("__cache_origin", origin);
  }

  const qs = sortedParams.toString();
  return new Request(`${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function matchCache(request) {
  try {
    return await caches.default.match(getCacheKey(request));
  } catch {
    return null;
  }
}

/**
 * Stores a response in the edge cache. When an execution context is passed,
 * the write happens in the background so the visitor does not wait for it.
 */
export async function storeInCache(request, response, ttlSeconds = 3600, ctx = null) {
  try {
    if (request.method !== "GET" || !CACHEABLE_STATUSES.has(response.status)) return response;

    const cloned = new Response(response.body, response);
    cloned.headers.set(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
    );

    const write = caches.default.put(getCacheKey(request), cloned.clone());
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(write.catch(() => {}));
    } else {
      await write;
    }
    return cloned;
  } catch {
    return response;
  }
}
