const TASHKEEL_CHAR = /[\u064B-\u065F\u0670]/;
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;
const ARABIC_LETTER = /[\u0621-\u064A\u0671-\u06D3]/;
const SEARCH_TOKEN_MIN_LENGTH = 2;
const MAX_VARIANTS_PER_TOKEN = 30;

export const MAX_SEARCH_UNITS = 10;

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
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
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

/**
 * Safe JSON serializer for embedding JSON inside an HTML <script> block.
 * JSON.stringify alone does not protect against a literal </script> sequence.
 */
export function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function cleanFtsText(text) {
  return stripTashkeelAndTatweel(String(text ?? ""))
    // Quotes, wildcard and column-filter characters are never meaningful in user
    // input; removing them also prevents a stray " from leaking into a token.
    .replace(/[\u060C\u061B\u061F.,;:!?(){}[\]\\/"*^]/g, " ")
    .replace(/(^|\s)[-+]+(?=\S)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteFtsPhrase(text) {
  const cleaned = cleanFtsText(text);
  if (!cleaned) return null;
  return `"${cleaned}"`;
}

/**
 * Remove ONE leading article/preposition group from an Arabic word and return
 * the stem. Stripping never leaves fewer than 3 letters.
 *   الإعلان -> إعلان | والإعلان -> إعلان | بالإعلان -> إعلان | للإعلان -> إعلان
 */
export function stripArabicPrefix(word) {
  const w = String(word ?? "");
  const m = w.match(/^[وف]?(?:بال|كال|لل|ال)/);
  if (m && w.length - m[0].length >= 3) return w.slice(m[0].length);
  if (w.length > 3 && w.startsWith("و")) return w.slice(1);
  return w;
}

// Prefix forms in priority order. If the variant cap is reached, the rarer
// forms at the end are the ones that are dropped.
const PREFIX_FORMS = ["", "ال", "وال", "بال", "لل", "ولل", "وبال", "كال", "فال", "و", "ب", "ل"];

function spellingAlternates(word) {
  const finals = new Set([word]);
  if (word.endsWith("ة")) finals.add(`${word.slice(0, -1)}ه`);
  if (word.endsWith("ه")) finals.add(`${word.slice(0, -1)}ة`);
  if (word.endsWith("ي")) finals.add(`${word.slice(0, -1)}ى`);
  if (word.endsWith("ى")) finals.add(`${word.slice(0, -1)}ي`);

  const out = new Set();
  for (const f of finals) {
    out.add(f);
    if (/[ؤئء]/.test(f)) {
      for (const seat of ["ئ", "ؤ", "ء"]) out.add(f.replace(/[ؤئء]/g, seat));
    }
  }
  return Array.from(out);
}

function buildTokenVariants(rawToken) {
  const raw = cleanFtsText(rawToken);
  if (raw.length < SEARCH_TOKEN_MIN_LENGTH) return [];

  // Non-Arabic tokens (numbers, Latin words) never receive Arabic prefixes.
  if (!ARABIC_LETTER.test(raw)) return [raw];

  const normalized = normalizeArabic(raw);
  const seeds = Array.from(new Set([raw, normalized].filter((s) => s.length >= SEARCH_TOKEN_MIN_LENGTH)));

  const variants = new Set(seeds); // exactly what the user typed always comes first

  const cores = [];
  const seenCores = new Set();
  for (const seed of seeds) {
    for (const alt of spellingAlternates(stripArabicPrefix(seed))) {
      if (!seenCores.has(alt) && alt.length >= SEARCH_TOKEN_MIN_LENGTH) {
        seenCores.add(alt);
        cores.push(alt);
      }
    }
  }

  for (const prefix of PREFIX_FORMS) {
    for (const core of cores) {
      if (variants.size >= MAX_VARIANTS_PER_TOKEN) return Array.from(variants);
      variants.add(`${prefix}${core}`);
    }
  }

  return Array.from(variants);
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

function parseQuotedAndUnquoted(rawQuery) {
  const raw = String(rawQuery ?? "").trim();
  const units = [];
  const seen = new Set();
  let remaining = raw;
  let match;
  const quotedRegex = /"([^"\n]{1,160})"/g;

  while ((match = quotedRegex.exec(raw)) !== null) {
    const phrase = cleanFtsText(match[1]);
    if (phrase) {
      const key = `phrase:${phrase}`;
      if (!seen.has(key)) {
        seen.add(key);
        units.push({ type: "phrase", value: phrase });
      }
    }
    remaining = remaining.replace(match[0], " ");
  }

  const plainTokens = remaining
    .replace(/[+|،,]/g, " ")
    .split(/\s+/)
    .flatMap((token) => cleanFtsText(token).split(" "))
    .filter(Boolean);

  for (const token of plainTokens) {
    const normalized = normalizeArabic(token);
    if (!normalized || normalized.length < SEARCH_TOKEN_MIN_LENGTH) continue;
    const key = `term:${normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    units.push({ type: "term", value: token, normalized });
  }

  return units;
}

export function getSearchUnits(rawQuery) {
  return parseQuotedAndUnquoted(rawQuery);
}

export function buildFts5Query(rawQuery) {
  const units = parseQuotedAndUnquoted(rawQuery);
  if (!units.length || units.length > MAX_SEARCH_UNITS) return null;

  const queries = [];
  for (const unit of units) {
    const ftsQuery = unit.type === "phrase" ? quoteFtsPhrase(unit.value) : buildTokenFtsQuery(unit.value);
    if (ftsQuery) queries.push(ftsQuery);
  }

  if (!queries.length || queries.length > MAX_SEARCH_UNITS) return null;

  // Each query is independently matched against FTS. The DB layer then
  // requires all units at the judgment level, even when they occur in
  // different paragraphs.
  return {
    queries,
    unit_count: queries.length,
    max_units: MAX_SEARCH_UNITS,
  };
}

/* ------------------------------------------------------------------ */
/* Highlighting                                                        */
/* ------------------------------------------------------------------ */

// Builds the normalized text plus a map from every normalized UTF-16 unit back
// to its index in the original string. Characters that lowercase to more than
// one unit are mapped unit-by-unit so offsets can never drift.
function createOffsetMap(original) {
  const map = [];
  let normalized = "";

  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    if (TASHKEEL_CHAR.test(ch) || ch === "\u0640") continue;

    let normChar = ch;
    if (ch === "أ" || ch === "إ" || ch === "آ" || ch === "ٱ") normChar = "ا";
    else if (ch === "ة") normChar = "ه";
    else if (ch === "ى") normChar = "ي";
    else if (ch === "ؤ" || ch === "ئ") normChar = "ء";

    const lowered = normChar.toLowerCase();
    normalized += lowered;
    for (let k = 0; k < lowered.length; k++) map.push(i);
  }

  return { normalized, map };
}

function buildMatchers(query) {
  const units = parseQuotedAndUnquoted(query);
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

// Mirrors what the FTS query matches: the query stem, with or without a
// leading article/preposition, followed by any suffix (prefix search).
function wordMatches(word, matcher) {
  const core = stripArabicPrefix(word);
  if (matcher.core.length < 3) return core === matcher.core || word === matcher.full;
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
