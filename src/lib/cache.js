export function getCacheKey(request) {
  const url = new URL(request.url);
  const sortedParams = new URLSearchParams();
  const keys = Array.from(url.searchParams.keys()).sort();
  for (const k of keys) {
    sortedParams.set(k, url.searchParams.get(k));
  }
  const cleanUrl = `${url.origin}${url.pathname}${sortedParams.toString() ? "?" + sortedParams.toString() : ""}`;
  return new Request(cleanUrl, { method: "GET" });
}

export async function matchCache(request) {
  try {
    const cache = caches.default;
    return await cache.match(getCacheKey(request));
  } catch {
    return null;
  }
}

export async function storeInCache(request, response, ttlSeconds = 3600) {
  try {
    if (request.method !== "GET" || response.status !== 200) {
      return response;
    }

    const cloned = new Response(response.body, response);
    cloned.headers.set(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
    );

    const cache = caches.default;
    await cache.put(getCacheKey(request), cloned.clone());
    return cloned;
  } catch {
    return response;
  }
}