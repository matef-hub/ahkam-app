import {
  validateSearchQuery,
  validateCaseParams,
  validateIdParam,
  SECURITY_HEADERS,
  getCorsHeaders,
} from "../lib/security.js";
import {
  getCourts,
  getJudgmentByCase,
  getJudgmentById,
  recordSearchAnalytics,
  searchJudgments,
} from "../lib/db.js";
import { matchCache, storeInCache } from "../lib/cache.js";

const CACHEABLE = new Set([200, 404]);

function jsonResponse(data, status = 200, cacheTtl = 0, request = null, extraHeaders = {}) {
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  };

  if (request) Object.assign(headers, getCorsHeaders(request));

  headers["Cache-Control"] = cacheTtl > 0 && CACHEABLE.has(status)
    ? `public, max-age=${cacheTtl}, s-maxage=${cacheTtl}, stale-while-revalidate=86400`
    : "no-store";

  return new Response(JSON.stringify(data), { status, headers });
}

function publicApiData(data) {
  if (!data || typeof data !== "object") return data;
  const { d1_metrics: _diagnostics, ...publicData } = data;
  return publicData;
}

// Optional: bind a Workers Rate Limiting namespace called SEARCH_LIMITER in
// wrangler.toml (see the commented example there). Without the binding this is
// a no-op, so deploying never breaks.
async function isRateLimited(request, env) {
  if (!env.SEARCH_LIMITER) return false;
  try {
    const key = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.SEARCH_LIMITER.limit({ key });
    return !success;
  } catch {
    return false;
  }
}

function tooManyRequests(request) {
  return jsonResponse(
    { error: "عدد الطلبات كبير. يرجى الانتظار قليلاً ثم المحاولة مجدداً." },
    429,
    0,
    request,
    { "Retry-After": "30" }
  );
}

function judgmentResult(data, request, ctx) {
  const status = data.found ? 200 : 404;
  const ttl = data.found ? 7200 : 300;
  return storeInCache(request, jsonResponse(publicApiData(data), status, ttl, request), ttl, ctx);
}

export async function handleApiSearch(request, env, url, ctx) {
  const validation = validateSearchQuery(url);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 400, 0, request);
  }

  const cached = await matchCache(request);
  if (cached) return cached;

  if (await isRateLimited(request, env)) return tooManyRequests(request);

  try {
    const data = await searchJudgments(env.DB, validation);
    const analytics = recordSearchAnalytics(env.DB, validation, data.total_judgments || 0);
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(analytics);
    else await analytics;
    const resp = jsonResponse(publicApiData(data), 200, 1800, request);
    return await storeInCache(request, resp, 1800, ctx);
  } catch (err) {
    console.error("API Search Failure:", err);
    return jsonResponse({ error: "تعذر إتمام عملية البحث في الفهرس السحابي" }, 500, 0, request);
  }
}

export async function handleApiCourts(request, env, ctx) {
  const cached = await matchCache(request);
  if (cached) return cached;
  if (await isRateLimited(request, env)) return tooManyRequests(request);
  try {
    const courts = await getCourts(env.DB);
    const resp = jsonResponse({ courts }, 200, 3600, request);
    return await storeInCache(request, resp, 3600, ctx);
  } catch (err) {
    console.error("API Courts Failure:", err);
    return jsonResponse({ error: "تعذر تحميل قائمة المحاكم" }, 500, 0, request);
  }
}

export async function handleApiJudgment(request, env, url, ctx) {
  const cached = await matchCache(request);
  if (cached) return cached;

  try {
    if (url.searchParams.has("id")) {
      const idValidation = validateIdParam(url);
      if (!idValidation.valid) {
        return jsonResponse({ error: idValidation.error }, 400, 0, request);
      }
      if (await isRateLimited(request, env)) return tooManyRequests(request);

      const data = await getJudgmentById(env.DB, idValidation.id);
      return await judgmentResult(data, request, ctx);
    }

    if (url.searchParams.has("no") && url.searchParams.has("yr")) {
      const caseValidation = validateCaseParams(url);
      if (!caseValidation.valid) {
        return jsonResponse({ error: caseValidation.error }, 400, 0, request);
      }
      if (await isRateLimited(request, env)) return tooManyRequests(request);

      const data = await getJudgmentByCase(env.DB, caseValidation);
      return await judgmentResult(data, request, ctx);
    }

    return jsonResponse({ error: "يرجى تحديد معرف الحكم أو رقم وسنة الطعن" }, 400, 0, request);
  } catch (err) {
    console.error("API Judgment Retrieval Failure:", err);
    return jsonResponse({ error: "تعذر استرجاع ملف الحكم القضائي" }, 500, 0, request);
  }
}
