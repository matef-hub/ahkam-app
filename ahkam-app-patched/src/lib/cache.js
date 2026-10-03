const CACHE_PARAM_ALLOWLIST = {
  "/api/search": ["q", "court", "page", "page_size"],
  "/api/judgment": ["id", "no", "yr", "court"],
};

export function getCacheKey(request) {
  const url = new URL(request.url);
  const allowed = CACHE_PARAM_ALLOWLIST[url.pathname];
  const sortedParams = new URLSearchParams();

  if (allowed) {
    for (const key of [...allowed].sort()) {
      const value = url.searchParams.get(key);
      if (value !== null && value !== "") sortedParams.set(key, value);
    }
  } else {
    const entries = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of entries) sortedParams.append(key, value);
  }

  // CORS responses contain Access-Control-Allow-Origin, so different origins
  // must never share the same cached response object.
  const origin = request.headers.get("Origin");
  if (origin) sortedParams.set("__cache_origin", origin);

  const cleanUrl = `${url.origin}${url.pathname}${sortedParams.toString() ? `?${sortedParams}` : ""}`;
  return new Request(cleanUrl, { method: "GET" });
}

export async function matchCache(request) {
  try {
    return await caches.default.match(getCacheKey(request));
  } catch {
    return null;
  }
}

export async function storeInCache(request, response, ttlSeconds = 3600) {
  try {
    if (request.method !== "GET" || response.status !== 200) return response;

    const cloned = new Response(response.body, response);
    cloned.headers.set(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
    );

    await caches.default.put(getCacheKey(request), cloned.clone());
    return cloned;
  } catch {
    return response;
  }
}
