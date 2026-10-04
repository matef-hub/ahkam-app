const TASHKEEL_CHAR = /[\u064B-\u065F\u0670]/;
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;
const ARABIC_LETTER = /[\u0621-\u064A\u0671-\u06D3]/;
const SEARCH_TOKEN_MIN_LENGTH = 2;
const MAX_VARIANTS_PER_TOKEN = 10;

export const MAX_SEARCH_UNITS = 12;
export const MAX_SEARCH_QUERY_LENGTH = 280;
export const MAX_FTS_EXPRESSION_LENGTH = 2048;

export const ARABIC_PREFIX_RE = /^(?:[وف])?(?:بال|كال|لل|ال|[بكل])?/;

export function stripTashkeelAndTatweel(text) {
  if (!text) return "";
  return String(text)
    .replace(TASHKEEL_REGEX, "")
    .replace(TATWEEL_REGEX, "");
}

export function normalizeArabic(text) {
  if (!text) return "";
  return stripTashkeelAndTatweel(text)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/[\u060C\u061B\u061F.,;:!?"'()[\]{}\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function cleanFtsText(text) {
  let cleaned = stripTashkeelAndTatweel(String(text ?? ""))
    .replace(/[\u060C\u061B\u061F.,;:!?(){}[\]\\/*^~]/g, " ")
    .replace(/(^|\s)[-+]+(?=\S)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  // موازنة أو إزالة علامات التنصيص الفردية التي قد تكسر استعلام FTS5
  const quoteCount = (cleaned.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    cleaned = cleaned.replace(/"/g, " ");
  }

  return cleaned.trim();
}

function quoteFtsPhrase(text) {
  const cleaned = cleanFtsText(text);
  if (!cleaned) return null;
  return `"${cleaned}"`;
}

export function stripArabicPrefix(word) {
  const w = String(word ?? "");
  const stripped = w.replace(ARABIC_PREFIX_RE, "");
  return stripped.length >= 2 ? stripped : w;
}

const PREFIX_FORMS = ["", "ال", "و", "ف", "بال", "كال", "لل", "وال", "ب", "ل"];

function buildTokenVariants(rawToken) {
  const normalized = normalizeArabic(cleanFtsText(rawToken));
  if (normalized.length < SEARCH_TOKEN_MIN_LENGTH) return [];
  if (!ARABIC_LETTER.test(normalized)) return [normalized];

  const core = stripArabicPrefix(normalized);
  if (core.length < SEARCH_TOKEN_MIN_LENGTH) return [normalized];

  const variants = new Set([
    normalized,
    core,
    ...PREFIX_FORMS.map((prefix) => `${prefix}${core}`)
  ]);

  return Array.from(variants).slice(0, MAX_VARIANTS_PER_TOKEN);
}

function buildTokenFtsQuery(token) {
  const variants = buildTokenVariants(token);
  if (!variants.length) return null;

  const expressions = variants.map((variant) => {
    const escaped = variant.replace(/"/g, '""');
    return escaped.length >= 3 ? `"${escaped}"*` : `"${escaped}"`;
  });

  return expressions.length === 1 ? expressions[0] : `(${expressions.join(" OR ")})`;
}

export function parseSearchQuery(rawQuery, requestedMode = "normal") {
  const raw = String(rawQuery ?? "").trim();
  const units = [];
  const seen = new Set();
  let containsOr = false;
  const tokenPattern = /(?:^|\s)(-)?(?:"([^"\n]{1,160})"|([^\s"]+))/g;
  let match;

  while ((match = tokenPattern.exec(raw)) !== null) {
    const excluded = Boolean(match[1]);
    const quoted = match[2];
    const bare = match[3];
    if (!quoted && /^(?:OR|\|)$/i.test(bare)) {
      containsOr = true;
      continue;
    }
    if (!quoted && /^(?:AND|\+)$/i.test(bare)) continue;

    const value = cleanFtsText(quoted ?? bare);
    const normalized = normalizeArabic(value);
    if (!normalized || normalized.length < SEARCH_TOKEN_MIN_LENGTH) continue;

    const type = quoted !== undefined ? "phrase" : "term";
    const key = `${excluded ? "-" : "+"}:${type}:${normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    units.push({ type, value, normalized, excluded });
  }

  let mode = requestedMode;
  if (mode === "normal" && containsOr) mode = "or";
  if (mode === "exact") {
    const phrase = cleanFtsText(raw.replace(/(^|\s)-\S+/g, " ").replace(/"/g, " "));
    const normalized = normalizeArabic(phrase);
    if (normalized) {
      return {
        mode,
        units: [{ type: "phrase", value: normalized, normalized, excluded: false }],
        excluded: units.filter((unit) => unit.excluded),
      };
    }
  }

  return {
    mode,
    units: units.filter((unit) => !unit.excluded),
    excluded: units.filter((unit) => unit.excluded),
  };
}

export function getSearchUnits(rawQuery, mode = "normal") {
  return parseSearchQuery(rawQuery, mode).units;
}

export function buildFts5Query(rawQuery, requestedMode = "normal") {
  const parsed = parseSearchQuery(rawQuery, requestedMode);
  if (!parsed.units.length || parsed.units.length > MAX_SEARCH_UNITS) return null;

  const toFts = (unit) => unit.type === "phrase"
    ? quoteFtsPhrase(normalizeArabic(unit.value))
    : buildTokenFtsQuery(unit.value);
  const positiveQueries = parsed.units.map(toFts).filter(Boolean);
  const excludedQueries = parsed.excluded.map(toFts).filter(Boolean);
  const expressionLength = [...positiveQueries, ...excludedQueries]
    .reduce((total, expression) => total + expression.length, 0);

  if (!positiveQueries.length || expressionLength > MAX_FTS_EXPRESSION_LENGTH) return null;

  return {
    queries: positiveQueries,
    positiveQueries,
    excludedQueries,
    units: parsed.units,
    mode: parsed.mode,
    unit_count: positiveQueries.length,
    max_units: MAX_SEARCH_UNITS,
  };
}

/* ------------------------------------------------------------------ */
/* Highlighting & Snippet Extraction                                   */
/* ------------------------------------------------------------------ */

function createOffsetMap(original) {
  const map = [];
  let normalized = "";

  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    if (TASHKEEL_CHAR.test(ch) || ch === "\u0640") continue;

    let normChar = ch;
    if (ch === "أ" || ch === "إ" || ch === "آ" || ch === "ٱ") normChar = "ا";
    else if (ch === "ى") normChar = "ي";
    else if (ch === "ؤ" || ch === "ئ") normChar = "ء";

    const lowered = normChar.toLowerCase();
    normalized += lowered;
    for (let k = 0; k < lowered.length; k++) map.push(i);
  }

  return { normalized, map };
}

function buildMatchers(query) {
  const units = parseSearchQuery(query).units;
  const matchers = [];
  const seen = new Set();

  for (const unit of units) {
    const source = unit.type === "phrase" ? unit.value : unit.normalized;
    for (const piece of normalizeArabic(source).toLowerCase().split(/\s+/)) {
      if (piece.length < SEARCH_TOKEN_MIN_LENGTH || seen.has(piece)) continue;
      seen.add(piece);
      matchers.push({ full: piece, core: stripArabicPrefix(piece) });
    }
  }
  return matchers;
}

function wordMatches(word, matcher) {
  const core = stripArabicPrefix(word);
  if (matcher.core.length < 2) return core === matcher.core || word === matcher.full;
  return core.startsWith(matcher.core) || word.startsWith(matcher.full);
}

function findMatches(normalized, matchers) {
  const hits = [];
  for (const tok of normalized.matchAll(/[\p{L}\p{N}_]+/gu)) {
    const word = tok[0];
    if (matchers.some((m) => wordMatches(word, m))) {
      hits.push([tok.index, tok.index + word.length]);
    }
  }
  return hits;
}

export function extractSnippetAndHighlight(text, query, radius = 160) {
  const original = String(text ?? "").trim();
  if (!original) return "";

  const plain = () => {
    const truncated = original.length > 320 ? `${original.substring(0, 320)}...` : original;
    return escapeHtml(truncated);
  };

  if (!query) return plain();

  const matchers = buildMatchers(query);
  if (!matchers.length) return plain();

  const { normalized, map } = createOffsetMap(original);
  const hits = findMatches(normalized, matchers);

  let snippetStart = 0;
  let snippetEnd = original.length;

  if (hits.length && map.length > 0) {
    const [normStart, normEnd] = hits[0];
    const origMatchStart = map[normStart] ?? 0;
    const origMatchEnd = map[Math.min(normEnd - 1, map.length - 1)] ?? origMatchStart;

    snippetStart = Math.max(0, origMatchStart - radius);
    snippetEnd = Math.min(original.length, origMatchEnd + radius);

    if (snippetStart > 0) {
      const spaceIdx = original.indexOf(" ", snippetStart);
      if (spaceIdx !== -1 && spaceIdx < origMatchStart) snippetStart = spaceIdx + 1;
    }
    if (snippetEnd < original.length) {
      const spaceIdx = original.lastIndexOf(" ", snippetEnd);
      if (spaceIdx !== -1 && spaceIdx > origMatchEnd) snippetEnd = spaceIdx;
    }
  } else {
    snippetEnd = Math.min(original.length, radius * 2);
  }

  const snippetSlice = original.substring(snippetStart, snippetEnd);
  const prefix = snippetStart > 0 ? "... " : "";
  const suffix = snippetEnd < original.length ? " ..." : "";

  return prefix + safeHighlightSegment(snippetSlice, matchers) + suffix;
}

function safeHighlightSegment(segment, matchers) {
  if (!segment) return "";
  const { normalized, map } = createOffsetMap(segment);
  const intervals = [];

  for (const [s, e] of findMatches(normalized, matchers)) {
    const origStart = map[s];
    const lastMapped = map[e - 1];
    if (origStart === undefined || lastMapped === undefined) continue;
    const origEnd = lastMapped + 1;
    if (origEnd > origStart) intervals.push([origStart, origEnd]);
  }

  if (!intervals.length) return escapeHtml(segment);

  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];
  let curr = intervals[0].slice();

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next[0] <= curr[1]) {
      curr[1] = Math.max(curr[1], next[1]);
    } else {
      merged.push(curr);
      curr = next.slice();
    }
  }
  merged.push(curr);

  let result = "";
  let lastIndex = 0;

  for (const [start, end] of merged) {
    result += escapeHtml(segment.substring(lastIndex, start));
    result += `<mark class="search-hit">${escapeHtml(segment.substring(start, end))}</mark>`;
    lastIndex = end;
  }

  result += escapeHtml(segment.substring(lastIndex));
  return result;
}