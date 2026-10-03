const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;
const SEARCH_TOKEN_MIN_LENGTH = 2;
const MAX_SEARCH_UNITS = 10;

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
    .replace(/[\u060C\u061B\u061F.,;:!?(){}[\]\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteFtsPhrase(text) {
  const cleaned = cleanFtsText(text).replace(/"/g, "");
  if (!cleaned) return null;
  return `"${cleaned.replace(/"/g, '""')}"`;
}

function uniquePush(set, value) {
  const normalized = String(value ?? "").trim();
  if (normalized.length >= SEARCH_TOKEN_MIN_LENGTH) set.add(normalized);
}

function buildTokenVariants(rawToken) {
  const raw = cleanFtsText(rawToken);
  const normalized = normalizeArabic(raw);
  const variants = new Set();

  for (const seed of [raw, normalized]) {
    uniquePush(variants, seed);
  }

  const seeds = Array.from(variants);
  for (const seed of seeds) {
    // Keep the common Arabic article/conjunction forms explicitly so a query
    // for "إعلان" also finds "الإعلان" without generating a huge variant set.
    uniquePush(variants, `ال${seed}`);
    uniquePush(variants, `بال${seed}`);
    uniquePush(variants, `كال${seed}`);
    uniquePush(variants, `فال${seed}`);
    uniquePush(variants, `لل${seed}`);
    uniquePush(variants, `ولل${seed}`);

    if (seed.startsWith("و") && seed.length > 3) {
      uniquePush(variants, seed.slice(1));
    }

    if (seed.startsWith("ولل") && seed.length > 5) {
      uniquePush(variants, seed.slice(3));
      uniquePush(variants, `ال${seed.slice(3)}`);
    } else if (seed.startsWith("لل") && seed.length > 4) {
      uniquePush(variants, seed.slice(2));
      uniquePush(variants, `ال${seed.slice(2)}`);
    } else if (seed.startsWith("بال") || seed.startsWith("كال") || seed.startsWith("فال")) {
      if (seed.length > 5) {
        uniquePush(variants, seed.slice(3));
        uniquePush(variants, `ال${seed.slice(3)}`);
      }
    } else if (seed.startsWith("ال") && seed.length > 4) {
      uniquePush(variants, seed.slice(2));
    }
  }

  // Handle the most common spelling alternations without generating dozens
  // of synthetic strings that inflate the FTS query.
  const spellingVariants = new Set(variants);
  for (const value of spellingVariants) {
    if (value.endsWith("ة")) uniquePush(variants, `${value.slice(0, -1)}ه`);
    if (value.endsWith("ه")) uniquePush(variants, `${value.slice(0, -1)}ة`);
    if (value.endsWith("ي")) uniquePush(variants, `${value.slice(0, -1)}ى`);
    if (value.endsWith("ى")) uniquePush(variants, `${value.slice(0, -1)}ي`);
    if (value.includes("ؤ")) uniquePush(variants, value.replace(/ؤ/g, "ئ"));
    if (value.includes("ئ")) uniquePush(variants, value.replace(/ئ/g, "ؤ"));
  }

  return Array.from(variants).filter((v) => v.length >= SEARCH_TOKEN_MIN_LENGTH);
}

function buildTokenFtsQuery(token) {
  const variants = buildTokenVariants(token);
  if (!variants.length) return null;

  // Keep the query deliberately small. Prefix matching remains useful for
  // common Arabic inflections, but only the compact set of real spellings is used.
  const expressions = variants.slice(0, 10).map((variant) => {
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
    .replace(/[+|،،,]/g, " ")
    .split(/\s+/)
    .map((token) => cleanFtsText(token))
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

  // Each query is independently matched against FTS. The DB layer can then
  // require all units at the judgment level, even when they occur in different paragraphs.
  return {
    queries,
    unit_count: queries.length,
    max_units: MAX_SEARCH_UNITS,
  };
}

function createOffsetMap(original) {
  const map = [];
  let normalized = "";

  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    const isTashkeel = TASHKEEL_REGEX.test(ch);
    TASHKEEL_REGEX.lastIndex = 0;
    if (isTashkeel || ch === "\u0640") continue;

    let normChar = ch;
    if (ch === "أ" || ch === "إ" || ch === "آ" || ch === "ٱ") normChar = "ا";
    else if (ch === "ة") normChar = "ه";
    else if (ch === "ى") normChar = "ي";
    else if (ch === "ؤ" || ch === "ئ") normChar = "ء";

    normalized += normChar.toLowerCase();
    map.push(i);
  }

  return { normalized, map };
}

function isWordChar(ch) {
  return Boolean(ch) && /[\p{L}\p{N}_]/u.test(ch);
}

function collectHighlightWords(query) {
  const units = parseQuotedAndUnquoted(query);
  const words = [];
  const seen = new Set();

  for (const unit of units) {
    const source = unit.type === "phrase" ? unit.value : unit.normalized;
    const pieces = normalizeArabic(source)
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length >= SEARCH_TOKEN_MIN_LENGTH);

    for (const word of pieces) {
      if (!seen.has(word)) {
        seen.add(word);
        words.push(word);
      }
    }
  }

  return words;
}

function findBoundaryMatch(normalized, word, fromIndex = 0) {
  let index = normalized.indexOf(word, fromIndex);
  while (index !== -1) {
    const before = index > 0 ? normalized[index - 1] : "";
    const afterIndex = index + word.length;
    const after = afterIndex < normalized.length ? normalized[afterIndex] : "";

    if (!isWordChar(before) && !isWordChar(after)) {
      return index;
    }

    index = normalized.indexOf(word, index + Math.max(1, word.length));
  }
  return -1;
}

export function extractSnippetAndHighlight(text, query, radius = 160) {
  const original = String(text ?? "").trim();
  if (!original) return "";
  if (!query) {
    const truncated = original.length > 320 ? `${original.substring(0, 320)}...` : original;
    return escapeHtml(truncated);
  }

  const { normalized, map } = createOffsetMap(original);
  const searchWords = collectHighlightWords(query);

  if (!searchWords.length) {
    const truncated = original.length > 320 ? `${original.substring(0, 320)}...` : original;
    return escapeHtml(truncated);
  }

  let bestNormPos = -1;
  let matchLenInNorm = 0;

  for (const word of searchWords) {
    const idx = findBoundaryMatch(normalized.toLowerCase(), word.toLowerCase());
    if (idx !== -1) {
      bestNormPos = idx;
      matchLenInNorm = word.length;
      break;
    }
  }

  let snippetStart = 0;
  let snippetEnd = original.length;

  if (bestNormPos !== -1 && map.length > 0) {
    const origMatchStart = map[bestNormPos] ?? 0;
    const origMatchEnd = map[Math.min(bestNormPos + matchLenInNorm - 1, map.length - 1)] ?? origMatchStart;

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

  return prefix + safeHighlightSegment(snippetSlice, searchWords) + suffix;
}

function safeHighlightSegment(segment, searchWords) {
  if (!segment) return "";
  const { normalized, map } = createOffsetMap(segment);
  const lowerNormalized = normalized.toLowerCase();
  const intervals = [];

  for (const word of searchWords) {
    let startIndex = 0;
    while (startIndex < lowerNormalized.length) {
      const foundIdx = findBoundaryMatch(lowerNormalized, word.toLowerCase(), startIndex);
      if (foundIdx === -1) break;

      const origStart = map[foundIdx];
      const lastMapped = map[Math.min(foundIdx + word.length - 1, map.length - 1)];
      const origEnd = lastMapped === undefined ? undefined : lastMapped + 1;

      if (origStart !== undefined && origEnd !== undefined && origEnd > origStart) {
        intervals.push([origStart, origEnd]);
      }
      startIndex = foundIdx + Math.max(1, word.length);
    }
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
