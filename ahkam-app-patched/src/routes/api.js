import {
  validateSearchQuery,
  validateCaseParams,
  validateIdParam,
  SECURITY_HEADERS,
  getCorsHeaders,
} from "../lib/security.js";
import { searchJudgments, getJudgmentById, getJudgmentByCase } from "../lib/db.js";
import { matchCache, storeInCache } from "../lib/cache.js";

function jsonResponse(data, status = 200, cacheTtl = 0, request = null, extraHeaders = {}) {
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  };

  if (request) Object.assign(headers, getCorsHeaders(request));

  headers["Cache-Control"] = cacheTtl > 0 && status === 200
    ? `public, max-age=${cacheTtl}, s-maxage=${cacheTtl}, stale-while-revalidate=86400`
    : "no-store";

  return new Response(JSON.stringify(data), { status, headers });
}

function publicApiData(data) {
  if (!data || typeof data !== "object") return data;
  const { d1_metrics: _diagnostics, ...publicData } = data;
  return publicData;
}

export async function handleApiSearch(request, env, url) {
  const cached = await matchCache(request);
  if (cached) return cached;

  const validation = validateSearchQuery(url);
  if (!validation.valid) {
    return jsonResponse({ error: validation.error }, 400, 0, request);
  }

  try {
    const data = await searchJudgments(env.DB, validation);
    const resp = jsonResponse(publicApiData(data), 200, 1800, request);
    return await storeInCache(request, resp, 1800);
  } catch (err) {
    console.error("API Search Failure:", err);
    return jsonResponse({ error: "تعذر إتمام عملية البحث في الفهرس السحابي" }, 500, 0, request);
  }
}

export async function handleApiJudgment(request, env, url) {
  const cached = await matchCache(request);
  if (cached) return cached;

  try {
    if (url.searchParams.has("id")) {
      const idValidation = validateIdParam(url);
      if (!idValidation.valid) {
        return jsonResponse({ error: idValidation.error }, 400, 0, request);
      }

      const data = await getJudgmentById(env.DB, idValidation.id);
      const resp = jsonResponse(publicApiData(data), 200, data.found ? 7200 : 300, request);
      return await storeInCache(request, resp, data.found ? 7200 : 300);
    }

    if (url.searchParams.has("no") && url.searchParams.has("yr")) {
      const caseValidation = validateCaseParams(url);
      if (!caseValidation.valid) {
        return jsonResponse({ error: caseValidation.error }, 400, 0, request);
      }

      const data = await getJudgmentByCase(env.DB, caseValidation);
      const resp = jsonResponse(publicApiData(data), 200, data.found ? 7200 : 300, request);
      return await storeInCache(request, resp, data.found ? 7200 : 300);
    }

    return jsonResponse({ error: "يرجى تحديد معرف الحكم أو رقم وسنة الطعن" }, 400, 0, request);
  } catch (err) {
    console.error("API Judgment Retrieval Failure:", err);
    return jsonResponse({ error: "تعذر استرجاع ملف الحكم القضائي" }, 500, 0, request);
  }
}
