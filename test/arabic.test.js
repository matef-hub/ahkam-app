import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFts5Query,
  extractSnippetAndHighlight,
  normalizeArabic,
  safeJsonForHtml,
} from "../src/lib/arabic.js";
import { validateSearchQuery } from "../src/lib/security.js";

test("Arabic normalization removes presentation marks without collapsing legal letters", () => {
  assert.equal(normalizeArabic("إعــــلانٌ"), "اعلان");
  assert.equal(normalizeArabic("مسئولية / مسؤولية"), "مسءولية مسءولية");
  assert.equal(normalizeArabic("فتى فتي"), "فتي فتي");
  assert.equal(normalizeArabic("رحمة رحمه"), "رحمة رحمه");
});

test("FTS query parser supports phrase, OR, exclusion and bounded expressions", () => {
  const phrase = buildFts5Query('"بطلان الإعلان"');
  assert.equal(phrase.mode, "normal");
  assert.equal(phrase.units[0].type, "phrase");

  const parsed = buildFts5Query("شيك OR مسئولية -تقادم");
  assert.equal(parsed.mode, "or");
  assert.equal(parsed.positiveQueries.length, 2);
  assert.equal(parsed.excludedQueries.length, 1);
  assert.ok(parsed.positiveQueries.join(" ").length < 2048);
});

test("highlighting is escaped and does not use substring false positives", () => {
  const highlighted = extractSnippetAndHighlight("تعليم علم <script>alert(1)</script>", "علم");
  assert.match(highlighted, /تعليم/);
  assert.match(highlighted, /<mark class="search-hit">علم<\/mark>/);
  assert.doesNotMatch(highlighted, /<mark class="search-hit">تعليم<\/mark>/);
  assert.match(highlighted, /&lt;script&gt;/);
});

test("JSON-LD and query validation reject script and cursor injection", () => {
  assert.doesNotMatch(safeJsonForHtml({ value: "</script><img>" }), /<\/script>/i);
  const invalidSort = validateSearchQuery(new URL("https://ahkam.app/api/search?q=شيك&sort=drop%20table"));
  assert.equal(invalidSort.valid, false);
  const invalidCursor = validateSearchQuery(new URL("https://ahkam.app/api/search?q=شيك&cursor=' OR 1=1 --"));
  assert.equal(invalidCursor.valid, false);
});
