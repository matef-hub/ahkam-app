import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { searchJudgments, getJudgmentById, getCourtLandingData, COURT_SLUGS } from "../src/lib/db.js";
import { renderJudgmentPageHtml } from "../src/ui/judgment-page.js";

function d1Adapter(sqlite) {
  return {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        execute() {
          const statement = sqlite.prepare(sql);
          if (/^\s*(SELECT|WITH)/i.test(sql)) return { results: statement.all(...this.args), meta: { rows_read: 0, duration: 0 } };
          statement.run(...this.args);
          return { results: [], meta: { rows_read: 0, duration: 0 } };
        },
        all() { return this.execute(); },
        run() { return this.execute(); },
        first() { const res = this.execute(); return res.results[0] || null; },
      };
    },
    batch(statements) { return statements.map((statement) => statement.execute()); },
  };
}

function createFixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE Courts (Court_ID INTEGER PRIMARY KEY, Court_Name TEXT);
    CREATE TABLE Judgments_Master (Master_ID INTEGER PRIMARY KEY, Court_ID INTEGER, Case_No INTEGER, Case_Year INTEGER, Office_Year INTEGER, Case_Date TEXT, Master_Text TEXT);
    CREATE TABLE Judgments_Text (Fakra_ID INTEGER PRIMARY KEY, Master_ID INTEGER, Fakra_No INTEGER, Fakra_Text TEXT);
    CREATE TABLE Judgments_Principles (Mogz_ID INTEGER PRIMARY KEY, Parent_ID INTEGER, Court_ID INTEGER, Mogz_Text TEXT);
    CREATE TABLE Judgments_Principles_Links (Mogz_ID INTEGER, Fakra_ID INTEGER);
  `);
  sqlite.exec("INSERT INTO Courts VALUES (1, 'محكمة النقض')");
  sqlite.exec("INSERT INTO Judgments_Master VALUES (1, 1, 11, 50, NULL, '2020-01-01', 'ملخص الحكم الأول')");
  sqlite.exec("INSERT INTO Judgments_Master VALUES (2, 1, 12, 51, NULL, '2021-01-01', 'ملخص الحكم الثاني')");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (101, 1, 1, 'شيك صادر من الساحب')");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (102, 1, 2, 'تثبت مسئولية الساحب عن الوفاء')");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (201, 2, 1, 'بطلان الإعلان يترتب عليه الأثر القانوني')");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (202, 2, 2, 'شيك تقادم المطالبة به')");
  for (const migration of ["0001_indexes.sql", "0002_search_indexes.sql", "0003_drop_duplicate_indexes.sql", "0004_normalized_judgment_fts.sql", "0005_search_metadata_and_integrity.sql"]) {
    sqlite.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  }
  return sqlite;
}

test("full-judgment AND search groups FTS hits by judgment", async () => {
  const sqlite = createFixture();
  const result = await searchJudgments(d1Adapter(sqlite), {
    query: "شيك مسئولية", mode: "normal", scope: "full", sort: "relevance", page: 1, pageSize: 20, courtIds: [],
  });
  assert.equal(result.found, true);
  assert.deepEqual(result.results.map((item) => item.Master_ID), [1]);
  assert.equal(result.results[0].match_count, 2);
  sqlite.close();
});

test("full scope searches the imported master summary as well as paragraphs", async () => {
  const sqlite = createFixture();
  const result = await searchJudgments(d1Adapter(sqlite), {
    query: "الثاني", mode: "normal", scope: "full", sort: "relevance", page: 1, pageSize: 20, courtIds: [],
  });
  assert.deepEqual(result.results.map((item) => item.Master_ID), [2]);
  assert.equal(result.results[0].matches[0].Fakra_No, -100);
  sqlite.close();
});

test("phrase, exclusion, scope and keyset cursor preserve search semantics", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);
  const phrase = await searchJudgments(db, {
    query: '"بطلان الإعلان"', mode: "normal", scope: "principles", sort: "relevance", page: 1, pageSize: 20, courtIds: [],
  });
  assert.deepEqual(phrase.results.map((item) => item.Master_ID), [2]);

  const excluded = await searchJudgments(db, {
    query: "شيك -تقادم", mode: "normal", scope: "full", sort: "relevance", page: 1, pageSize: 20, courtIds: [],
  });
  assert.deepEqual(excluded.results.map((item) => item.Master_ID), [1]);
  sqlite.close();
});

test("normalized FTS migration can be replayed without duplicating index rows", () => {
  const sqlite = createFixture();
  const migration = readFileSync(new URL("../migrations/0004_normalized_judgment_fts.sql", import.meta.url), "utf8");
  sqlite.exec(migration);
  const count = sqlite.prepare("SELECT COUNT(*) AS total FROM FTS_Judgments_Normalized").get().total;
  assert.equal(count, 6);
  sqlite.close();
});

test("court landing page data is retrieved accurately for valid judicial slugs", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);
  const data = await getCourtLandingData(db, "cassation-civil");
  assert.ok(data);
  assert.equal(data.slug, "cassation-civil");
  assert.equal(data.totalJudgments, 2);
  assert.ok(Array.isArray(data.judgments));
  assert.ok(Array.isArray(data.allCourts));
  assert.equal(data.allCourts.length, 5);

  const invalid = await getCourtLandingData(db, "unknown-court");
  assert.equal(invalid, null);
  sqlite.close();
});

test("OR mode search with court filtering executes without syntax errors", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);
  const result = await searchJudgments(db, {
    query: "شيك بدون رصيد",
    mode: "or",
    scope: "principles",
    sort: "newest",
    page: 1,
    pageSize: 20,
    courtIds: [1, 29],
  });
  assert.ok(result);
  assert.equal(result.page, 1);
  assert.ok(result.total_judgments >= 1);
  sqlite.close();
});

test("Phase 5: Master_Text-only hit returns found=true, match_count > 0, total_matches > 0 without double counting", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);
  // "الثاني" only exists in Master_Text of judgment 2
  const result = await searchJudgments(db, {
    query: "الثاني",
    mode: "normal",
    scope: "full",
  });
  assert.equal(result.found, true);
  assert.equal(result.total_judgments, 1);
  assert.equal(result.total_matches, 1, "total_matches must count master-level hit");
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].Master_ID, 2);
  assert.equal(result.results[0].match_count, 1, "match_count must be 1 for master-level hit");
  assert.equal(result.results[0].matches.length, 1);
  assert.equal(result.results[0].matches[0].Fakra_No, -100);
  assert.equal(result.results[0].matches[0].fakraLabel, "ملخص الحكم والوقائع");
  sqlite.close();
});

test("Phase 5: Broad search with more than 1000 candidate rows does not silently lose valid results", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE Courts (Court_ID INTEGER PRIMARY KEY, Court_Name TEXT);
    CREATE TABLE Judgments_Master (Master_ID INTEGER PRIMARY KEY, Court_ID INTEGER, Case_No INTEGER, Case_Year INTEGER, Office_Year INTEGER, Case_Date TEXT, Master_Text TEXT);
    CREATE TABLE Judgments_Text (Fakra_ID INTEGER PRIMARY KEY, Master_ID INTEGER, Fakra_No INTEGER, Fakra_Text TEXT);
    CREATE TABLE Judgments_Principles (Mogz_ID INTEGER PRIMARY KEY, Parent_ID INTEGER, Court_ID INTEGER, Mogz_Text TEXT);
    CREATE TABLE Judgments_Principles_Links (Mogz_ID INTEGER, Fakra_ID INTEGER);
  `);
  for (const m of ["0001_indexes.sql", "0002_search_indexes.sql", "0003_drop_duplicate_indexes.sql", "0004_normalized_judgment_fts.sql", "0005_search_metadata_and_integrity.sql"]) {
    sqlite.exec(readFileSync(new URL(`../migrations/${m}`, import.meta.url), "utf8"));
  }

  sqlite.exec("BEGIN TRANSACTION;");
  for (let i = 1; i <= 1050; i++) {
    const courtId = i === 1050 ? 99 : 1;
    sqlite.exec(`INSERT INTO Judgments_Master VALUES (${i}, ${courtId}, ${i}, 50, NULL, '2020-01-01', 'ملخص حكم قانوني شامل');`);
    sqlite.exec(`INSERT INTO Judgments_Text VALUES (${i}, ${i}, 1, 'نص قاعدة قانونية عامة');`);
  }
  sqlite.exec("COMMIT;");

  const db = d1Adapter(sqlite);
  // 1. Broad search without filters must reflect all 1050 candidates without arbitrary LIMIT 1000 cutoff
  const broadRes = await searchJudgments(db, { query: "قانونية", pageSize: 20 });
  assert.equal(broadRes.found, true);
  assert.equal(broadRes.total_judgments, 1050, "Total candidate count must not be capped at 1000");

  // 2. Filter on courtId 99 (which only exists at row #1050): must NOT be lost due to candidate truncation
  const filteredRes = await searchJudgments(db, { query: "قانونية", courtIds: [99] });
  assert.equal(filteredRes.found, true);
  assert.equal(filteredRes.total_judgments, 1);
  assert.equal(filteredRes.results[0].Master_ID, 1050, "Candidate #1050 must not be discarded before filters");

  sqlite.close();
});

test("Phase 5: Scope filtering correctly isolates principles vs reasons", async () => {
  const sqlite = createFixture();
  sqlite.exec("INSERT INTO Judgments_Master VALUES (30, 1, 30, 50, NULL, '2022-01-01', 'ملخص حكم دعوى الإيجار');");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (301, 30, 1, 'مبدأ استقرار المعاملات في الإيجار');"); // Fakra_No > 0 (principle)
  sqlite.exec("INSERT INTO Judgments_Text VALUES (302, 30, -2, 'أسباب وحيثيات ثبوت الإيجار');");     // Fakra_No = -2 (reasons)
  const db = d1Adapter(sqlite);

  // Search in principles scope: only paragraph 301 should match
  const princRes = await searchJudgments(db, { query: "الإيجار", scope: "principles" });
  assert.equal(princRes.found, true);
  assert.deepEqual(princRes.results.map(r => r.Master_ID), [30]);
  assert.equal(princRes.results[0].matches.length, 1);
  assert.equal(princRes.results[0].matches[0].Fakra_No, 1);

  // Search in reasons scope: only paragraph 302 should match
  const reasonRes = await searchJudgments(db, { query: "الإيجار", scope: "reasons" });
  assert.equal(reasonRes.found, true);
  assert.deepEqual(reasonRes.results.map(r => r.Master_ID), [30]);
  assert.equal(reasonRes.results[0].matches.length, 1);
  assert.equal(reasonRes.results[0].matches[0].Fakra_No, -2);

  sqlite.close();
});

test("Phase 5: Cursor pagination preserves result order without duplicates", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);

  // Search "الساحب" matching judgments 1 and 2 (or insert 3rd)
  sqlite.exec("INSERT INTO Judgments_Master VALUES (3, 1, 13, 52, NULL, '2022-01-01', 'ملخص الحكم الثالث');");
  sqlite.exec("INSERT INTO Judgments_Text VALUES (301, 3, 1, 'مسئولية الساحب المشددة');");

  const page1 = await searchJudgments(db, { query: "الساحب", pageSize: 1, sort: "relevance" });
  assert.equal(page1.found, true);
  assert.equal(page1.results.length, 1);
  assert.ok(page1.has_more, "Must have more results");
  assert.ok(page1.next_cursor, "Must provide next_cursor");

  const page2 = await searchJudgments(db, { query: "الساحب", pageSize: 1, sort: "relevance", cursor: page1.next_cursor });
  assert.equal(page2.found, true);
  assert.equal(page2.results.length, 1);
  assert.notEqual(page2.results[0].Master_ID, page1.results[0].Master_ID, "Page 2 must not repeat Page 1 result");

  sqlite.close();
});

test("Phase 7: Fallback to same court latest judgments uses honest wording without claiming legal relation", async () => {
  const sqlite = createFixture();
  const db = d1Adapter(sqlite);

  // Judgment 1 has no records in Judgment_Relations
  const data = await getJudgmentById(db, 1);
  assert.equal(data.found, true);
  assert.equal(data.relation_mode, "court_peer_latest");
  assert.equal(data.related.length, 1);
  assert.equal(data.related[0].Master_ID, 2);

  // Render HTML
  const html = renderJudgmentPageHtml(data);
  assert.ok(html.includes("أحدث أحكام من المحكمة نفسها"), "Must use honest fallback heading");
  assert.ok(!html.includes("أحكام ذات صلة"), "Must NOT claim arbitrary judgments are related");
  assert.ok(!html.includes("أحكام وسوابق ذات صلة موثقة"), "Must NOT claim relations are verified when none exist");

  sqlite.close();
});

test("Phase 7: Explicit Judgment_Relations are correctly queried, preferred, and labeled with legal relation type", async () => {
  const sqlite = createFixture();
  // Insert third judgment in different court and an explicit relation
  sqlite.exec("INSERT INTO Courts VALUES (2, 'مجلس الدولة')");
  sqlite.exec("INSERT INTO Judgments_Master VALUES (3, 2, 99, 60, NULL, '2023-01-01', 'ملخص حكم مجلس الدولة')");
  sqlite.exec("INSERT INTO Judgment_Relations (From_Master_ID, To_Master_ID, Relation_Type, Relation_Source, Weight) VALUES (1, 3, 'cites', 'editorial', 2.5)");

  const db = d1Adapter(sqlite);
  const data = await getJudgmentById(db, 1);
  assert.equal(data.found, true);
  assert.equal(data.relation_mode, "verified_relation");
  assert.equal(data.related.length, 1);
  assert.equal(data.related[0].Master_ID, 3);
  assert.equal(data.related[0].Relation_Type, "cites");

  // Render HTML
  const html = renderJudgmentPageHtml(data);
  assert.ok(html.includes("أحكام وسوابق ذات صلة موثقة"), "Must render verified relation heading");
  assert.ok(html.includes("يستشهد به"), "Must render explicit relation type label");
  assert.ok(!html.includes("أحدث أحكام من المحكمة نفسها"), "Must not show fallback heading when verified relations exist");

  sqlite.close();
});


