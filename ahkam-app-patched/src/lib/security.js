import { getSearchUnits } from "./arabic.js";

export const MAX_SEARCH_UNITS = 10;
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self';",
};

const ALLOWED_ORIGINS = new Set([
  "https://ahkam.app",
  "https://ahkam.ateflaw.com",
  "https://ateflaw.com"
]);

function isUnsignedInteger(value) {
  return /^\d+$/.test(String(value ?? ""));
}

export function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return {};

  if (ALLOWED_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
  }

  return {};
}

export function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: {
      ...SECURITY_HEADERS,
      ...getCorsHeaders(request),
    },
  });
}

export function validateSearchQuery(url) {
  const q = (url.searchParams.get("q") || "").trim();
  const court = url.searchParams.get("court");
  const pageRaw = url.searchParams.get("page");
  const pageSizeRaw = url.searchParams.get("page_size");

  if (!q) return { valid: false, error: "نص البحث مطلوب" };
  if (q.length < 2) return { valid: false, error: "يجب ألا يقل نص البحث عن حرفين" };
  if (q.length > 160) return { valid: false, error: "نص البحث طويل جداً (الحد الأقصى 160 حرفاً)" };

  const units = getSearchUnits(q);
  if (!units.length) return { valid: false, error: "تعذر استخراج كلمات صالحة من نص البحث" };
  if (units.length > MAX_SEARCH_UNITS) {
    return { valid: false, error: `يرجى تبسيط البحث إلى ${MAX_SEARCH_UNITS} عبارات أو كلمات كحد أقصى` };
  }

  let validCourt = null;
  if (court !== null && court !== "") {
    if (!isUnsignedInteger(court)) {
      return { valid: false, error: "معرف المحكمة المحدد غير صالح" };
    }
    const parsedCourt = Number(court);
    if (!Number.isSafeInteger(parsedCourt) || parsedCourt < 1 || parsedCourt > 1000) {
      return { valid: false, error: "معرف المحكمة المحدد غير صالح" };
    }
    validCourt = parsedCourt;
  }

  let page = 1;
  if (pageRaw !== null && pageRaw !== "") {
    if (!isUnsignedInteger(pageRaw)) return { valid: false, error: "رقم الصفحة غير صالح" };
    page = Number(pageRaw);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100) {
      return { valid: false, error: "رقم الصفحة خارج النطاق المسموح" };
    }
  }

  let pageSize = 20;
  if (pageSizeRaw !== null && pageSizeRaw !== "") {
    if (!isUnsignedInteger(pageSizeRaw)) return { valid: false, error: "حجم الصفحة غير صالح" };
    pageSize = Number(pageSizeRaw);
    if (!Number.isSafeInteger(pageSize) || pageSize < 5 || pageSize > 50) {
      return { valid: false, error: "حجم الصفحة يجب أن يكون بين 5 و50" };
    }
  }

  return {
    valid: true,
    query: q,
    courtId: validCourt,
    page,
    pageSize,
  };
}

export function validateCaseParams(url) {
  const no = url.searchParams.get("no");
  const yr = url.searchParams.get("yr");
  const court = url.searchParams.get("court");

  if (!no || !yr) {
    return { valid: false, error: "يجب تحديد رقم الطعن وسنته القضائية معاً" };
  }

  if (!isUnsignedInteger(no) || !isUnsignedInteger(yr)) {
    return { valid: false, error: "رقم الطعن والسنة يجب أن يكونا أرقاماً صحيحة فقط" };
  }

  const caseNo = Number(no);
  const caseYear = Number(yr);

  if (!Number.isSafeInteger(caseNo) || caseNo <= 0 || caseNo > 1000000) {
    return { valid: false, error: "رقم الطعن غير صحيح" };
  }
  if (!Number.isSafeInteger(caseYear) || caseYear <= 0 || caseYear > 2100) {
    return { valid: false, error: "السنة القضائية غير صحيحة" };
  }

  let validCourt = null;
  if (court !== null && court !== "") {
    if (!isUnsignedInteger(court)) {
      return { valid: false, error: "معرف المحكمة المحدد غير صالح" };
    }
    const parsedCourt = Number(court);
    if (!Number.isSafeInteger(parsedCourt) || parsedCourt < 1 || parsedCourt > 1000) {
      return { valid: false, error: "معرف المحكمة المحدد غير صالح" };
    }
    validCourt = parsedCourt;
  }

  return { valid: true, caseNo, caseYear, courtId: validCourt };
}

export function validateIdParam(url) {
  const idStr = url.searchParams.get("id");
  if (!idStr) return { valid: false, error: "معرف الحكم مطلوب" };

  if (!isUnsignedInteger(idStr)) {
    return { valid: false, error: "معرف الحكم غير صالح" };
  }

  const id = Number(idStr);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
    return { valid: false, error: "معرف الحكم غير صالح" };
  }

  return { valid: true, id };
}
