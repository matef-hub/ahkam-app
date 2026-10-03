const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;

export function stripTashkeelAndTatweel(text) {
  if (!text) return "";
  return String(text).replace(TASHKEEL_REGEX, "").replace(TATWEEL_REGEX, "");
}

export function normalizeArabic(text) {
  if (!text) return "";
  return stripTashkeelAndTatweel(text)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[،؛؟.,;:!?"'()[\]{}\\/]/g, " ")
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

export function buildFts5Query(rawQuery) {
  if (!rawQuery) return null;

  // تنظيف الرموز الخاصة التي قد تكسر استعلام SQLite FTS5
  const sanitized = rawQuery
    .replace(/["*()^~:]/g, " ")
    .replace(/[+،,]/g, " ")
    .trim();

  // تقييد عدد الكلمات إلى 6 كلمات لمنع تضخم الاستعلام واستنزاف الذاكرة
  const tokens = sanitized.split(/\s+/).filter((t) => t.length > 0).slice(0, 6);
  if (!tokens.length) return null;

  const clauses = [];

  for (const token of tokens) {
    const cleanToken = stripTashkeelAndTatweel(token);
    if (!cleanToken) continue;

    const baseStems = new Set();
    baseStems.add(cleanToken);

    // معالجة واو العطف
    if (cleanToken.startsWith("و") && cleanToken.length > 3) {
      baseStems.add(cleanToken.substring(1));
    }

    // إزالة السوابق الشائعة للوصول إلى الجذر الظاهري
    for (const item of Array.from(baseStems)) {
      if (item.startsWith("ال") && item.length > 4) {
        baseStems.add(item.substring(2));
      } else if ((item.startsWith("بال") || item.startsWith("كال") || item.startsWith("فال")) && item.length > 5) {
        baseStems.add(item.substring(3));
        baseStems.add(item.substring(1)); // بالـ -> الـ
      } else if (item.startsWith("لل") && item.length > 4) {
        baseStems.add(item.substring(2));
        baseStems.add("ال" + item.substring(2));
      } else if (item.startsWith("ولل") && item.length > 5) {
        baseStems.add(item.substring(3));
        baseStems.add("ال" + item.substring(3));
      }
    }

    const variants = new Set();

    for (const stem of baseStems) {
      if (stem.length < 2) continue;

      const forms = [
        stem,
        "ال" + stem,
        "بال" + stem,
        "كال" + stem,
        "لل" + stem,
        "ولل" + stem
      ];

      for (const f of forms) {
        variants.add(f);
        if (f.length >= 3) {
          variants.add(`${f}*`);
        }

        // أشكال الألف
        if (/[أإآا]/.test(f)) {
          const bare = f.replace(/[أإآ]/g, "ا");
          variants.add(bare);
          variants.add(`${bare}*`);
          variants.add(bare.replace(/ا/g, "أ"));
          variants.add(bare.replace(/ا/g, "إ"));
        }

        // التاء المربوطة والهاء
        if (/[ةه]$/.test(f)) {
          variants.add(f.replace(/ة$/, "ه"));
          variants.add(f.replace(/ه$/, "ة"));
        }

        // الياء والألف المقصورة
        if (/[يى]$/.test(f)) {
          variants.add(f.replace(/ي$/, "ى"));
          variants.add(f.replace(/ى$/, "ي"));
        }

        // الهمزات (مسؤولية / مسئولية)
        if (/[ؤئ]/.test(f)) {
          variants.add(f.replace(/ؤ/g, "ئ"));
          variants.add(f.replace(/ئ/g, "ؤ"));
        }
      }
    }

    if (!variants.size) continue;

    // حصر التباديل بـ 20 خياراً كحد أقصى لكل لفظ لمنع تعقيد الاستعلام
    const terms = Array.from(variants)
      .slice(0, 20)
      .map((v) => (v.endsWith("*") ? `"${v.slice(0, -1)}"*` : `"${v}"`));

    clauses.push(terms.length === 1 ? terms[0] : `(${terms.join(" OR ")})`);
  }

  if (!clauses.length) return null;
  return clauses.join(" AND ");
}

/**
 * خريطة محاذاة لإحداثيات النص الأصلي
 * لمطابقة الكلمات بدقة بالغة دون المساس بالنص الأصلي المخزن
 */
function createOffsetMap(original) {
  const map = [];
  let normalized = "";

  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    if (TASHKEEL_REGEX.test(ch) || ch === "\u0640") {
      TASHKEEL_REGEX.lastIndex = 0;
      continue;
    }

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

export function extractSnippetAndHighlight(text, query, radius = 160) {
  const original = String(text ?? "").trim();
  if (!original) return "";
  if (!query) {
    const truncated = original.length > 320 ? original.substring(0, 320) + "..." : original;
    return escapeHtml(truncated);
  }

  const { normalized, map } = createOffsetMap(original);
  const searchWords = query
    .replace(/[+،,]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => normalizeArabic(w).toLowerCase())
    .filter((w) => w.length >= 2);

  if (!searchWords.length) {
    const truncated = original.length > 320 ? original.substring(0, 320) + "..." : original;
    return escapeHtml(truncated);
  }

  let bestNormPos = -1;
  let matchLenInNorm = 0;

  for (const word of searchWords) {
    const idx = normalized.indexOf(word);
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
      if (spaceIdx !== -1 && spaceIdx < origMatchStart) {
        snippetStart = spaceIdx + 1;
      }
    }
    if (snippetEnd < original.length) {
      const spaceIdx = original.lastIndexOf(" ", snippetEnd);
      if (spaceIdx !== -1 && spaceIdx > origMatchEnd) {
        snippetEnd = spaceIdx;
      }
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
  const intervals = [];

  for (const word of searchWords) {
    let startIndex = 0;
    while (startIndex < normalized.length) {
      const foundIdx = normalized.indexOf(word, startIndex);
      if (foundIdx === -1) break;

      const origStart = map[foundIdx];
      const origEnd = map[Math.min(foundIdx + word.length - 1, map.length - 1)] + 1;

      if (origStart !== undefined && origEnd !== undefined && origEnd > origStart) {
        intervals.push([origStart, origEnd]);
      }
      startIndex = foundIdx + Math.max(1, word.length);
    }
  }

  if (!intervals.length) {
    return escapeHtml(segment);
  }

  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];
  let curr = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next[0] <= curr[1]) {
      curr[1] = Math.max(curr[1], next[1]);
    } else {
      merged.push(curr);
      curr = next;
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