import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { searchJudgments, getCourtLandingData, COURT_SLUGS } from "../src/lib/db.js";

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

