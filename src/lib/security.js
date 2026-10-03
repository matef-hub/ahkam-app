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
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("page_size") || "20", 10);

  if (!q) {
    return { valid: false, error: "نص البحث مطلوب" };
  }
  if (q.length < 2) {
    return { valid: false, error: "يجب ألا يقل نص البحث عن حرفين" };
  }
  if (q.length > 80) {
    return { valid: false, error: "نص البحث طويل جداً (الحد الأقصى 80 حرفاً)" };
  }

  let validCourt = null;
  if (court !== null && court !== "") {
    const parsedCourt = parseInt(court, 10);
    if (isNaN(parsedCourt) || parsedCourt < 1 || parsedCourt > 1000) {
      return { valid: false, error: "معرف المحكمة المحدد غير صالح" };
    }
    validCourt = parsedCourt;
  }

  const validPage = isNaN(page) || page < 1 ? 1 : Math.min(page, 50);
  const validPageSize = isNaN(pageSize) || pageSize < 5 ? 20 : Math.min(pageSize, 50);

  return {
    valid: true,
    query: q,
    courtId: validCourt,
    page: validPage,
    pageSize: validPageSize,
  };
}

export function validateCaseParams(url) {
  const no = url.searchParams.get("no");
  const yr = url.searchParams.get("yr");
  const court = url.searchParams.get("court");

  if (!no || !yr) {
    return { valid: false, error: "يجب تحديد رقم الطعن وسنته القضائية معاً" };
  }

  const caseNo = parseInt(no, 10);
  const caseYear = parseInt(yr, 10);

  if (isNaN(caseNo) || caseNo <= 0 || caseNo > 1000000) {
    return { valid: false, error: "رقم الطعن غير صحيح" };
  }
  if (isNaN(caseYear) || caseYear <= 0 || caseYear > 2100) {
    return { valid: false, error: "السنة القضائية غير صحيحة" };
  }

  let validCourt = null;
  if (court !== null && court !== "") {
    const parsedCourt = parseInt(court, 10);
    if (!isNaN(parsedCourt) && parsedCourt > 0) {
      validCourt = parsedCourt;
    }
  }

  return { valid: true, caseNo, caseYear, courtId: validCourt };
}

export function validateIdParam(url) {
  const idStr = url.searchParams.get("id");
  if (!idStr) {
    return { valid: false, error: "معرف الحكم مطلوب" };
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0 || id > 2147483647) {
    return { valid: false, error: "معرف الحكم غير صالح" };
  }

  return { valid: true, id };
}