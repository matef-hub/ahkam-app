import { buildFts5Query, getSearchUnits, MAX_SEARCH_QUERY_LENGTH, MAX_SEARCH_UNITS } from "./arabic.js";

export { MAX_SEARCH_UNITS };

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Inline scripts/styles are intentionally required by SSR until the UI is
  // extracted into hashed static assets. User data is never interpolated into
  // executable JS; JSON-LD is encoded with safeJsonForHtml.
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self';",
};

export const ALLOWED_ORIGINS = new Set(["https://ahkam.app", "https://ahkam.ateflaw.com", "https://ateflaw.com"]);

export function toAsciiDigits(value) {
  return String(value ?? "")
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0));
}

function readParam(url, key) {
  const value = url.searchParams.get(key);
  return value === null ? null : toAsciiDigits(value.trim());
}

function isUnsignedInteger(value) { return /^\d+$/.test(String(value ?? "")); }

function parseCourtList(raw) {
  if (raw === null || raw === "") return { ok: true, ids: [] };
  const parts = raw.split(",");
  if (parts.length > 5) return { ok: false };
  const ids = [];
  for (const part of parts) {
    if (!isUnsignedInteger(part)) return { ok: false };
    const id = Number(part);
    if (!Number.isSafeInteger(id) || id < 1 || id > 1000) return { ok: false };
    if (!ids.includes(id)) ids.push(id);
  }
  return { ok: true, ids };
}

function parseOptionalPositiveInteger(value, max) {
  if (value === null || value === "") return { ok: true, value: null };
  if (!isUnsignedInteger(value)) return { ok: false };
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= max ? { ok: true, value: number } : { ok: false };
}

function parseIsoDate(value) {
  if (value === null || value === "") return { ok: true, value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false };
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? { ok: false } : { ok: true, value };
}

function parseMetadataValue(value) {
  if (value === null || value === "") return { ok: true, value: null };
  const trimmed = value.trim();
  return trimmed.length <= 120 ? { ok: true, value: trimmed } : { ok: false };
}

function parseCursor(raw, sort) {
  if (raw === null || raw === "") return { ok: true, value: null };
  if (!/^[A-Za-z0-9_-]{8,800}$/.test(raw)) return { ok: false };
  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - raw.length % 4) % 4);
    const payload = JSON.parse(decodeURIComponent(escape(atob(padded))));
    const count = sort === "relevance" ? 7 : 4;
    if (payload?.v !== 1 || payload.sort !== sort || !Array.isArray(payload.values) || payload.values.length !== count) return { ok: false };
    if (!payload.values.every((value) => typeof value === "number" && Number.isFinite(value))) return { ok: false };
    return { ok: true, value: { values: payload.values } };
  } catch { return { ok: false }; }
}

export function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handleOptions(request) {
  return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...getCorsHeaders(request) } });
}

export function validateSearchQuery(url) {
  const q = (url.searchParams.get("q") || "").trim();
  const sort = url.searchParams.get("sort") || "relevance";
  const mode = url.searchParams.get("mode") || "normal";
  const scope = url.searchParams.get("scope") || "full";
  if (!q) return { valid: false, error: "نص البحث مطلوب" };
  if (q.length < 2) return { valid: false, error: "يجب ألا يقل نص البحث عن حرفين" };
  if (q.length > MAX_SEARCH_QUERY_LENGTH) return { valid: false, error: `نص البحث طويل جدًا (الحد الأقصى ${MAX_SEARCH_QUERY_LENGTH} حرفًا)` };
  if (!new Set(["relevance", "newest", "oldest"]).has(sort)) return { valid: false, error: "ترتيب النتائج غير صالح" };
  if (!new Set(["normal", "and", "or", "exact"]).has(mode)) return { valid: false, error: "نمط البحث غير صالح" };
  if (!new Set(["full", "principles", "reasons"]).has(scope)) return { valid: false, error: "نطاق البحث غير صالح" };

  const units = getSearchUnits(q, mode);
  if (!units.length) return { valid: false, error: "تعذر استخراج كلمات صالحة من نص البحث" };
  if (units.length > MAX_SEARCH_UNITS) return { valid: false, error: `يرجى تبسيط البحث إلى ${MAX_SEARCH_UNITS} عبارات أو كلمات كحد أقصى` };
  if (!buildFts5Query(q, mode)) return { valid: false, error: "تعذر إنشاء استعلام بحث آمن. يرجى تبسيط عبارة البحث." };

  const courts = parseCourtList(readParam(url, "court"));
  const caseNo = parseOptionalPositiveInteger(readParam(url, "case_no"), 1000000);
  const caseYear = parseOptionalPositiveInteger(readParam(url, "case_year"), 2100);
  const dateFrom = parseIsoDate(url.searchParams.get("date_from"));
  const dateTo = parseIsoDate(url.searchParams.get("date_to"));
  const chamber = parseMetadataValue(url.searchParams.get("chamber"));
  const type = parseMetadataValue(url.searchParams.get("type"));
  const category = parseMetadataValue(url.searchParams.get("category"));
  if (!courts.ok || !caseNo.ok || !caseYear.ok || !dateFrom.ok || !dateTo.ok || !chamber.ok || !type.ok || !category.ok) return { valid: false, error: "أحد فلاتر البحث غير صالح" };
  if (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value) return { valid: false, error: "تاريخ البداية يجب أن يسبق تاريخ النهاية" };

  let page = 1;
  const pageRaw = readParam(url, "page");
  if (pageRaw !== null && pageRaw !== "") {
    if (!isUnsignedInteger(pageRaw)) return { valid: false, error: "رقم الصفحة غير صالح" };
    page = Number(pageRaw);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return { valid: false, error: "رقم الصفحة خارج النطاق المسموح" };
  }
  let pageSize = 20;
  const pageSizeRaw = readParam(url, "page_size");
  if (pageSizeRaw !== null && pageSizeRaw !== "") {
    if (!isUnsignedInteger(pageSizeRaw)) return { valid: false, error: "حجم الصفحة غير صالح" };
    pageSize = Number(pageSizeRaw);
    if (!Number.isSafeInteger(pageSize) || pageSize < 5 || pageSize > 50) return { valid: false, error: "حجم الصفحة يجب أن يكون بين 5 و50" };
  }
  const cursor = parseCursor(url.searchParams.get("cursor"), sort);
  if (!cursor.ok) return { valid: false, error: "مؤشر الصفحة غير صالح. يرجى بدء البحث من جديد." };
  return {
    valid: true, query: q, courtIds: courts.ids, page, pageSize, sort, mode, scope, cursor: cursor.value,
    caseNo: caseNo.value, caseYear: caseYear.value, dateFrom: dateFrom.value, dateTo: dateTo.value,
    chamber: chamber.value, type: type.value, category: category.value,
  };
}

export function validateCaseParams(url) {
  const no = readParam(url, "no");
  const yr = readParam(url, "yr");
  if (!no || !yr) return { valid: false, error: "يجب تحديد رقم الطعن وسنته القضائية معًا" };
  const caseNo = parseOptionalPositiveInteger(no, 1000000);
  const caseYear = parseOptionalPositiveInteger(yr, 2100);
  const courts = parseCourtList(readParam(url, "court"));
  if (!caseNo.ok || !caseYear.ok || !courts.ok) return { valid: false, error: "بيانات الطعن أو المحكمة غير صالحة" };
  return { valid: true, caseNo: caseNo.value, caseYear: caseYear.value, courtIds: courts.ids, courtId: courts.ids[0] ?? null };
}

export function validateIdParam(url) {
  const parsed = parseOptionalPositiveInteger(readParam(url, "id"), 2147483647);
  return parsed.ok && parsed.value ? { valid: true, id: parsed.value } : { valid: false, error: "معرف الحكم غير صالح" };
}
