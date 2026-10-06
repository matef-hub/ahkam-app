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

test("Phase 5: Arabic normalization edge cases audit (Alef, Hamza, Maksura, Tatweel, Tashkeel, Digits, Prefixes)", () => {
  // Alef forms all map to bare Alef
  assert.equal(normalizeArabic("أحمد إبراهيم آمن ٱمرؤ"), "احمد ابراهيم امن امرء");

  // Hamza forms (waw with hamza, nabra hamza) map to standalone hamza
  assert.equal(normalizeArabic("مؤمن شئون بئر"), "مءمن شءون بءر");

  // Alef Maksura maps to Yaa
  assert.equal(normalizeArabic("مستشفى قضاء دعوى"), "مستشفي قضاء دعوي");

  // Ta Marbuta and Ha must NOT collapse
  assert.equal(normalizeArabic("قوة قوه"), "قوة قوه");
  assert.equal(normalizeArabic("عدالة عداله"), "عدالة عداله");
  assert.notEqual(normalizeArabic("محكمة"), normalizeArabic("محكمه"));

  // Tatweel and all 9 Tashkeel marks are removed
  assert.equal(normalizeArabic("شَـــــيْـــــكٌ مَـسْـؤُولِـيَّـةٌ"), "شيك مسءولية");
  assert.equal(normalizeArabic("هٰـذَا"), "هذا");

  // Arabic-Indic (٠-٩) and Persian (۰-۹) digits convert to ASCII (0-9)
  assert.equal(normalizeArabic("المادة ٢٩ لسنة ١٩٧٧"), "المادة 29 لسنة 1977");
  assert.equal(normalizeArabic("المادة ۲۹ لسنة ۱۹۷۷"), "المادة 29 لسنة 1977");

  // Punctuation is stripped/replaced with space
  assert.equal(normalizeArabic("عقد، باطل؛ هل يجوز؟ (نعم!)"), "عقد باطل هل يجوز نعم");
});

test("Phase 5: Arabic digits in numeric filters are correctly converted to ASCII numbers", () => {
  const url = new URL("https://ahkam.app/api/search?q=شيك&case_no=٩٥&case_year=١٨&page=٣&page_size=١٠");
  const parsed = validateSearchQuery(url);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.caseNo, 95);
  assert.equal(parsed.caseYear, 18);
  assert.equal(parsed.page, 3);
  assert.equal(parsed.pageSize, 10);
});
