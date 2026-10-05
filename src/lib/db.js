import { buildFts5Query, extractSnippetAndHighlight, normalizeArabic } from "./arabic.js";

const MAX_SNIPPETS_PER_JUDGMENT = 3;
const NORMALIZED_FTS_TABLE = "FTS_Judgments_Normalized";
const SEARCH_CURSOR_VERSION = 1;

function scopePredicate(scope, textAlias = "t", ftsAlias = "f") {
  switch (scope) {
    case "principles": return `${ftsAlias}.Section_Kind = 'text' AND ${textAlias}.Fakra_No > 0`;
    case "reasons": return `${ftsAlias}.Section_Kind = 'text' AND ${textAlias}.Fakra_No IN (-2, -50)`;
    default: return "1 = 1";
  }
}

function buildHitSelects(queries, scope, termOffset = 0) {
  const scopeSql = scopePredicate(scope, "t", "f");
  return queries.map((_, index) => `
    SELECT f.Master_ID, f.Fakra_ID, rank AS p_rank, ${index + termOffset} AS term_no, COALESCE(t.Fakra_No, -100) AS Fakra_No
    FROM ${NORMALIZED_FTS_TABLE} AS f
    LEFT JOIN Judgments_Text AS t ON t.Fakra_ID = f.Fakra_ID
    WHERE ${NORMALIZED_FTS_TABLE} MATCH ? AND ${scopeSql}
  `).join(" UNION ALL ");
}

function dateSortExpression(alias = "m") {
  return `
    CASE
      WHEN ${alias}.Case_Date GLOB '[0-9][0-9][0-9][0-9]-[0-9]*-[0-9]*'
      THEN CAST(substr(${alias}.Case_Date, 1, 4) AS INTEGER) * 10000 +
        CAST(substr(${alias}.Case_Date, 6, instr(substr(${alias}.Case_Date, 6), '-') - 1) AS INTEGER) * 100 +
        CAST(substr(${alias}.Case_Date, 6 + instr(substr(${alias}.Case_Date, 6), '-')) AS INTEGER)
      ELSE 0
    END`;
}

function appendFilters(filters, binds) {
  const clauses = [];
  if (filters.courtIds?.length) {
    // دعم فلتر مجلس الدولة المشترك (3 و 31) أو أي قائمة محاكم
    clauses.push(`m.Court_ID IN (${filters.courtIds.map(() => "?").join(",")})`);
    binds.push(...filters.courtIds);
  }
  if (filters.caseNo !== null && filters.caseNo !== undefined) { clauses.push("m.Case_No = ?"); binds.push(filters.caseNo); }
  if (filters.caseYear !== null && filters.caseYear !== undefined) { clauses.push("m.Case_Year = ?"); binds.push(filters.caseYear); }
  if (filters.dateFrom) { clauses.push("m.Case_Date >= ?"); binds.push(filters.dateFrom); }
  if (filters.dateTo) { clauses.push("m.Case_Date <= ?"); binds.push(filters.dateTo); }

  for (const field of ["chamber", "type", "category"]) {
    if (!filters[field]) continue;
    clauses.push(`EXISTS (SELECT 1 FROM Judgment_Metadata AS md
      WHERE md.Master_ID = m.Master_ID AND md.Field_Name = '${field}' AND md.Field_Value = ?)`);
    binds.push(filters[field]);
  }
  return clauses;
}

function buildSearchCte(ftsSpec, scope) {
  const positiveHits = buildHitSelects(ftsSpec.positiveQueries, scope);
  const excludedHits = ftsSpec.excludedQueries.length
    ? buildHitSelects(ftsSpec.excludedQueries, scope)
    : "SELECT NULL AS Master_ID WHERE 0";
  const phraseTerms = ftsSpec.units.map((unit, index) => unit.type === "phrase" ? index : null).filter((index) => index !== null);
  const phrasePredicate = phraseTerms.length ? `CASE WHEN h.term_no IN (${phraseTerms.join(",")}) THEN 1 ELSE 0 END` : "0";
  
  return `
    WITH hits AS (${positiveHits}),
    excluded_masters AS (SELECT DISTINCT Master_ID FROM (${excludedHits})),
    by_judgment AS (
      SELECT h.Master_ID,
        COUNT(DISTINCT h.term_no) AS matched_terms,
        MIN(h.p_rank) AS best_rank,
        COUNT(DISTINCT h.Fakra_ID) AS actual_match_count,
        SUM(${phrasePredicate}) AS phrase_hits,
        SUM(CASE WHEN h.Fakra_No > 0 THEN 1 ELSE 0 END) AS principle_hits
      FROM hits AS h 
      GROUP BY h.Master_ID
      LIMIT 1000
    ),
    ranked AS (
      SELECT b.Master_ID, b.matched_terms, b.best_rank, b.actual_match_count, b.phrase_hits, b.principle_hits,
        m.Case_No, m.Case_Year, m.Case_Date, m.Office_Year, m.Court_ID,
        ${dateSortExpression("m")} AS case_date_sort
      FROM by_judgment AS b JOIN Judgments_Master AS m ON m.Master_ID = b.Master_ID
      WHERE b.matched_terms ${ftsSpec.mode === "or" ? ">= 1" : "="} ?
        AND NOT EXISTS (SELECT 1 FROM excluded_masters AS x WHERE x.Master_ID = b.Master_ID)`;
}

function orderBy(sort, reversed = false) {
  const down = reversed ? "ASC" : "DESC";
  const up = reversed ? "DESC" : "ASC";
  if (sort === "newest") return `case_date_sort ${down}, Case_Year ${down}, Case_No ${down}, Master_ID ${down}`;
  if (sort === "oldest") return `case_date_sort ${up}, Case_Year ${up}, Case_No ${up}, Master_ID ${up}`;
  return `phrase_hits ${down}, matched_terms ${down}, actual_match_count ${down}, best_rank ${up}, principle_hits ${down}, case_date_sort ${down}, Master_ID ${down}`;
}

function cursorFields(row, sort) {
  if (sort === "newest" || sort === "oldest") return [row.case_date_sort, row.Case_Year ?? 0, row.Case_No ?? 0, row.Master_ID];
  return [row.phrase_hits ?? 0, row.matched_terms ?? 0, row.actual_match_count ?? 0, Number(row.best_rank ?? 0), row.principle_hits ?? 0, row.case_date_sort ?? 0, row.Master_ID];
}

function keysetPredicate(sort, cursor, binds) {
  if (!cursor?.values?.length) return "";
  const fields = sort === "relevance"
    ? ["phrase_hits", "matched_terms", "actual_match_count", "best_rank", "principle_hits", "case_date_sort", "Master_ID"]
    : ["case_date_sort", "Case_Year", "Case_No", "Master_ID"];
  if (cursor.values.length !== fields.length) return "";
  const ascending = sort === "oldest";
  const branches = fields.map((field, index) => {
    const equal = fields.slice(0, index).map((prior) => `${prior} = ?`);
    const isRank = sort === "relevance" && field === "best_rank";
    binds.push(...cursor.values.slice(0, index), cursor.values[index]);
    return `(${[...equal, `${field}${ascending || isRank ? ">" : "<"} ?`].join(" AND ")})`;
  });
  return ` AND (${branches.join(" OR ")})`;
}

export function encodeSearchCursor(row, sort) {
  const json = JSON.stringify({ v: SEARCH_CURSOR_VERSION, sort, values: cursorFields(row, sort) });
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function labelForParagraph(number) {
  if (number === -100) return "ملخص الحكم والوقائع";
  if (number === 0) return "هيئة المحكمة والديباجة";
  if (number === -2) return "الوقائع والأسباب والمنطوق";
  if (number === -50) return "منطوق الحكم المستخلص";
  return `المبدأ / الفقرة (${number})`;
}

export async function searchJudgments(db, options) {
  const { query, mode = "normal", scope = "full", sort = "relevance", page = 1, pageSize = 20, cursor = null } = options;
  const ftsSpec = buildFts5Query(query, mode);
  if (!ftsSpec) return { found: false, page, page_size: pageSize, total_matches: 0, total_judgments: 0, has_more: false, results: [] };

  const baseCte = buildSearchCte(ftsSpec, scope);
  const searchBinds = [...ftsSpec.positiveQueries, ...ftsSpec.excludedQueries, ftsSpec.mode === "or" ? 1 : ftsSpec.unit_count];
  const filterBinds = [];
  const filterClauses = appendFilters(options, filterBinds);
  const closedCte = `${baseCte}${filterClauses.length ? ` AND ${filterClauses.join(" AND ")}` : ""}\n    )`;
  const countSql = `${closedCte} SELECT COUNT(*) AS total_judgments, COALESCE(SUM(actual_match_count), 0) AS total_matches FROM ranked`;

  const cursorBinds = [];
  const cursorSql = keysetPredicate(sort, cursor, cursorBinds);
  const pagedSql = `${closedCte}
    SELECT r.*, c.Court_Name FROM ranked AS r LEFT JOIN Courts AS c ON c.Court_ID = r.Court_ID
    WHERE 1 = 1${cursorSql} ORDER BY ${orderBy(sort)} LIMIT ?${cursor ? "" : " OFFSET ?"}`;
  const offset = cursor ? 0 : (page - 1) * pageSize;
  const pagedBinds = [...searchBinds, ...filterBinds, ...cursorBinds, pageSize + 1];
  if (!cursor) pagedBinds.push(offset);

  const [countResult, pagedResult] = await db.batch([
    db.prepare(countSql).bind(...searchBinds, ...filterBinds),
    db.prepare(pagedSql).bind(...pagedBinds),
  ]);
  const count = countResult?.results?.[0] || {};
  const totalJudgments = Number(count.total_judgments || 0);
  const totalMatches = Number(count.total_matches || 0);
  const allMasters = pagedResult?.results || [];
  const matchedMasters = allMasters.slice(0, pageSize);

  if (!matchedMasters.length) {
    return {
      found: false, page, page_size: pageSize, total_matches: totalMatches, total_judgments: totalJudgments,
      has_more: false, next_cursor: null, results: []
    };
  }

  const masterIds = matchedMasters.map((row) => row.Master_ID);
  const idPlaceholders = masterIds.map(() => "?").join(",");
  const snippetsSql = `
    WITH hits AS (${buildHitSelects(ftsSpec.positiveQueries, scope)}),
    deduped AS (
      SELECT Master_ID, Fakra_ID, MIN(p_rank) AS p_rank FROM hits
      WHERE Master_ID IN (${idPlaceholders}) GROUP BY Master_ID, Fakra_ID
    ), ranked_snippets AS (
      SELECT d.Master_ID, d.Fakra_ID, d.p_rank,
        ROW_NUMBER() OVER (PARTITION BY d.Master_ID ORDER BY d.p_rank ASC, d.Fakra_ID ASC) AS rn FROM deduped AS d
    )
    SELECT r.Master_ID, COALESCE(t.Fakra_No, -100) AS Fakra_No,
      COALESCE(t.Fakra_Text, m.Master_Text) AS Fakra_Text, r.p_rank FROM ranked_snippets AS r
    JOIN Judgments_Master AS m ON m.Master_ID = r.Master_ID
    LEFT JOIN Judgments_Text AS t ON t.Fakra_ID = r.Fakra_ID WHERE r.rn <= ?
    ORDER BY r.Master_ID ASC, r.p_rank ASC, r.Fakra_ID ASC`;
  const snippetsResult = await db.prepare(snippetsSql).bind(...ftsSpec.positiveQueries, ...masterIds, MAX_SNIPPETS_PER_JUDGMENT).all();

  const snippetsByMaster = new Map();
  for (const snippet of snippetsResult?.results || []) {
    if (!snippetsByMaster.has(snippet.Master_ID)) snippetsByMaster.set(snippet.Master_ID, []);
    snippetsByMaster.get(snippet.Master_ID).push({
      Fakra_No: snippet.Fakra_No,
      fakraLabel: labelForParagraph(snippet.Fakra_No),
      snippet: extractSnippetAndHighlight(snippet.Fakra_Text, query),
    });
  }
  const results = matchedMasters.map((row) => ({
    Master_ID: row.Master_ID, Case_No: row.Case_No, Case_Year: row.Case_Year, Case_Date: row.Case_Date,
    Office_Year: row.Office_Year, Court_Name: row.Court_Name || "المحكمة غير محددة",
    match_count: row.actual_match_count, matched_terms: row.matched_terms, matches: snippetsByMaster.get(row.Master_ID) || [],
  }));
  const hasMore = allMasters.length > pageSize;
  return {
    found: true, page, page_size: pageSize, total_matches: totalMatches, total_judgments: totalJudgments,
    has_more: hasMore, next_cursor: hasMore ? encodeSearchCursor(matchedMasters.at(-1), sort) : null, results
  };
}

export async function getJudgmentById(db, masterId) {
  const masterStmt = db.prepare(`SELECT m.Master_ID, m.Court_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, m.Master_Text, c.Court_Name
    FROM Judgments_Master AS m LEFT JOIN Courts AS c ON c.Court_ID = m.Court_ID WHERE m.Master_ID = ? LIMIT 1`).bind(masterId);
  const textsStmt = db.prepare(`SELECT Fakra_ID, Fakra_No, Fakra_Text FROM Judgments_Text WHERE Master_ID = ?
    ORDER BY CASE WHEN Fakra_No = 0 THEN 1 WHEN Fakra_No = -2 THEN 2 WHEN Fakra_No = -50 THEN 3 WHEN Fakra_No > 0 THEN 4 ELSE 5 END, Fakra_No ASC, Fakra_ID ASC`).bind(masterId);
  const principlesStmt = db.prepare(`SELECT DISTINCT p.Mogz_ID, p.Mogz_Text FROM Judgments_Principles AS p
    JOIN Judgments_Principles_Links AS l ON l.Mogz_ID = p.Mogz_ID JOIN Judgments_Text AS t ON t.Fakra_ID = l.Fakra_ID
    WHERE t.Master_ID = ? ORDER BY p.Mogz_ID ASC`).bind(masterId);
  const relatedStmt = db.prepare(`SELECT peer.Master_ID, peer.Case_No, peer.Case_Year, peer.Case_Date, c.Court_Name
    FROM Judgments_Master AS current JOIN Judgments_Master AS peer ON peer.Court_ID = current.Court_ID AND peer.Master_ID <> current.Master_ID
    LEFT JOIN Courts AS c ON c.Court_ID = peer.Court_ID WHERE current.Master_ID = ?
    ORDER BY ${dateSortExpression("peer")} DESC, peer.Master_ID DESC LIMIT 5`).bind(masterId);
  const batch = await db.batch([masterStmt, textsStmt, principlesStmt, relatedStmt]);
  const master = batch[0]?.results?.[0] || null;
  if (!master) return { found: false };
  return {
    found: true, master, texts: batch[1]?.results || [], principles: batch[2]?.results || [], related: batch[3]?.results || []
  };
}

export async function getJudgmentByCase(db, { caseNo, caseYear, courtId, courtIds }) {
  let sql = `SELECT m.Master_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, c.Court_Name
    FROM Judgments_Master AS m LEFT JOIN Courts AS c ON c.Court_ID = m.Court_ID WHERE m.Case_No = ? AND m.Case_Year = ?`;
  const binds = [caseNo, caseYear];
  
  const ids = courtIds && courtIds.length ? courtIds : (courtId ? [courtId] : []);
  if (ids.length) {
    sql += ` AND m.Court_ID IN (${ids.map(() => "?").join(",")})`;
    binds.push(...ids);
  }
  
  sql += " ORDER BY m.Court_ID ASC, m.Master_ID ASC";
  const result = await db.prepare(sql).bind(...binds).all();
  const rows = result.results || [];
  if (!rows.length) return { found: false };
  if (rows.length === 1) return getJudgmentById(db, rows[0].Master_ID);
  return { found: true, multiple: true, judgments: rows };
}

export async function getCourts(db) {
  const result = await db.prepare(`SELECT c.Court_ID, c.Court_Name, COUNT(m.Master_ID) AS judgment_count
    FROM Courts AS c LEFT JOIN Judgments_Master AS m ON m.Court_ID = c.Court_ID
    GROUP BY c.Court_ID, c.Court_Name ORDER BY c.Court_Name COLLATE NOCASE, c.Court_ID`).all();
  return result.results || [];
}

export async function getHomeStats(db) {
  const courtGroupSql = `SELECT COUNT(DISTINCT CASE 
      WHEN Court_ID IN (1, 29) THEN 1 
      WHEN Court_ID IN (2, 30) THEN 2 
      WHEN Court_ID IN (4, 21, 25) THEN 4 
      WHEN Court_ID IN (3, 37) THEN 3 
      WHEN Court_ID IN (31, 36, 47) THEN 5 
      ELSE Court_ID 
    END) AS total FROM Courts WHERE Court_ID IN (1, 29, 2, 30, 4, 21, 25, 3, 37, 31, 36, 47)`;

  const courtCountsSql = `SELECT 
    COALESCE(SUM(CASE WHEN Court_ID IN (1, 29) THEN 1 ELSE 0 END), 0) AS civil,
    COALESCE(SUM(CASE WHEN Court_ID IN (2, 30) THEN 1 ELSE 0 END), 0) AS criminal,
    COALESCE(SUM(CASE WHEN Court_ID IN (4, 21, 25) THEN 1 ELSE 0 END), 0) AS constitutional,
    COALESCE(SUM(CASE WHEN Court_ID IN (3, 37) THEN 1 ELSE 0 END), 0) AS supreme_admin,
    COALESCE(SUM(CASE WHEN Court_ID IN (31, 36, 47) THEN 1 ELSE 0 END), 0) AS admin_court
    FROM Judgments_Master`;

  const result = await db.batch([
    db.prepare("SELECT COUNT(*) AS total FROM Judgments_Master"),
    db.prepare("SELECT COUNT(*) AS total FROM Judgments_Principles"),
    db.prepare(courtGroupSql),
    db.prepare("SELECT MAX(Case_Date) AS latest FROM Judgments_Master"),
    db.prepare(courtCountsSql),
  ]);

  const counts = result[4]?.results?.[0] || {};
  return {
    judgments: Number(result[0]?.results?.[0]?.total || 0),
    principles: Number(result[1]?.results?.[0]?.total || 0),
    courts: Number(result[2]?.results?.[0]?.total || 5),
    latest: result[3]?.results?.[0]?.latest || null,
    civilCount: Number(counts.civil || 0),
    criminalCount: Number(counts.criminal || 0),
    constitutionalCount: Number(counts.constitutional || 0),
    supremeAdminCount: Number(counts.supreme_admin || 0),
    adminCourtCount: Number(counts.admin_court || 0),
  };
}

export async function getJudgmentsByCourt(db, { courtIds = [], page = 1, pageSize = 20, sort = "newest" } = {}) {
  let countSql = "SELECT COUNT(*) AS total FROM Judgments_Master AS m";
  let sql = `SELECT m.Master_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, m.Court_ID, m.Master_Text, c.Court_Name
    FROM Judgments_Master AS m LEFT JOIN Courts AS c ON c.Court_ID = m.Court_ID`;
  const binds = [];
  const countBinds = [];

  if (courtIds?.length) {
    const placeholders = courtIds.map(() => "?").join(",");
    countSql += ` WHERE m.Court_ID IN (${placeholders})`;
    sql += ` WHERE m.Court_ID IN (${placeholders})`;
    countBinds.push(...courtIds);
    binds.push(...courtIds);
  }

  const orderDirection = sort === "oldest" ? "ASC" : "DESC";
  sql += ` ORDER BY m.Case_Year ${orderDirection}, m.Case_No ${orderDirection} LIMIT ? OFFSET ?`;
  binds.push(pageSize, (page - 1) * pageSize);

  const [countResult, rowsResult] = await Promise.all([
    db.prepare(countSql).bind(...countBinds).first(),
    db.prepare(sql).bind(...binds).all(),
  ]);

  const total = Number(countResult?.total || 0);
  const rows = rowsResult.results || [];

  const results = rows.map((r) => ({
    Master_ID: r.Master_ID,
    Case_No: r.Case_No,
    Case_Year: r.Case_Year,
    Office_Year: r.Office_Year,
    Case_Date: r.Case_Date,
    Court_ID: r.Court_ID,
    Court_Name: r.Court_Name,
    matches: r.Master_Text ? [{ fakraLabel: "ملخص / وقائع الدعوى", snippet: r.Master_Text.slice(0, 300) + (r.Master_Text.length > 300 ? "..." : "") }] : []
  }));

  return {
    found: total > 0,
    page,
    page_size: pageSize,
    total_judgments: total,
    total_matches: total,
    has_more: total > page * pageSize,
    results,
  };
}

export async function recordSearchAnalytics(db, search, resultCount) {
  try {
    await db.prepare(`INSERT INTO Search_Analytics (Query_Text, Normalized_Query, Court_Filter, Result_Count, Created_At)
      VALUES (?, ?, ?, ?, datetime('now'))`).bind(search.query, normalizeArabic(search.query), search.courtIds?.join(",") || null, resultCount).run();
  } catch (error) {
    console.warn("Search analytics write skipped", error?.message || error);
  }
}

export const COURT_SLUGS = {
  "cassation-civil": {
    slug: "cassation-civil",
    name: "محكمة النقض - الدائرة المدنية والتجارية",
    shortName: "النقض المدني والتجاري",
    courtIds: [1, 29],
    badge: "⚖️ قضاء مدني وتجاري",
    description: "أحكام وقرارات محكمة النقض المصرية الصادرة عن الدوائر المدنية، التجارية، العمالية، والأحوال الشخصية، متضمنة المبادئ المستقرة والقواعد القضائية الملزمة.",
  },
  "cassation-criminal": {
    slug: "cassation-criminal",
    name: "محكمة النقض - الدائرة الجنائية",
    shortName: "النقض الجنائي",
    courtIds: [2, 30],
    badge: "📜 قضاء جنائي",
    description: "أحكام وقرارات محكمة النقض المصرية الصادرة عن الدوائر الجنائية في الطعون وقضايا الجنايات والجنح وإرساء المبادئ القانونية الجنائية.",
  },
  "constitutional": {
    slug: "constitutional",
    name: "المحكمة الدستورية العليا",
    shortName: "المحكمة الدستورية العليا",
    courtIds: [4, 21, 25],
    badge: "⚖️ رقابة دستورية",
    description: "أحكام وقرارات المحكمة الدستورية العليا في الدعاوى الدستورية، والرقابة القضائية على دستورية القوانين واللوائح، وتنازع الاختصاص وتفسير النصوص التشريعية.",
  },
  "administrative-high": {
    slug: "administrative-high",
    name: "المحكمة الإدارية العليا - مجلس الدولة",
    shortName: "المحكمة الإدارية العليا",
    courtIds: [3, 37],
    badge: "🏛️ قضاء إداري أعلى",
    description: "أحكام وقرارات المحكمة الإدارية العليا بمجلس الدولة في الطعون الإدارية والقرارات السيادية والمنازعات الإدارية والتأديبية الكبرى.",
  },
  "administrative": {
    slug: "administrative",
    name: "محكمة القضاء الإداري - مجلس الدولة",
    shortName: "محكمة القضاء الإداري",
    courtIds: [31, 36, 47],
    badge: "⚖️ مجلس الدولة",
    description: "أحكام محكمة القضاء الإداري بمجلس الدولة ومحاكم القضاء الإداري الإقليمية في دعاوى إلغاء القرارات الإدارية ومنازعات العقود الإدارية والتعويضات.",
  },
};

export async function getCourtLandingData(db, slug) {
  const courtInfo = COURT_SLUGS[slug];
  if (!courtInfo) return null;

  const placeholders = courtInfo.courtIds.map(() => "?").join(",");
  const [countMaster, countPrinciples, judgmentsRes, principlesRes] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS total FROM Judgments_Master WHERE Court_ID IN (${placeholders})`).bind(...courtInfo.courtIds).first(),
    db.prepare(`SELECT COUNT(*) AS total FROM Judgments_Principles WHERE Court_ID IN (${placeholders})`).bind(...courtInfo.courtIds).first(),
    db.prepare(`SELECT m.Master_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, m.Court_ID, m.Master_Text, c.Court_Name
      FROM Judgments_Master m LEFT JOIN Courts c ON c.Court_ID = m.Court_ID
      WHERE m.Court_ID IN (${placeholders})
      ORDER BY m.Case_Year DESC, m.Case_No DESC LIMIT 20`).bind(...courtInfo.courtIds).all(),
    db.prepare(`SELECT Mogz_ID, Mogz_Text FROM Judgments_Principles WHERE Court_ID IN (${placeholders}) ORDER BY Mogz_ID ASC LIMIT 6`).bind(...courtInfo.courtIds).all(),
  ]);

  return {
    ...courtInfo,
    totalJudgments: Number(countMaster?.total || 0),
    totalPrinciples: Number(countPrinciples?.total || 0),
    judgments: judgmentsRes?.results || [],
    principles: principlesRes?.results || [],
    allCourts: Object.values(COURT_SLUGS),
  };
}