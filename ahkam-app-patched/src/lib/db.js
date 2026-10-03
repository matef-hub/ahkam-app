import { buildFts5Query, extractSnippetAndHighlight } from "./arabic.js";

const MAX_SNIPPETS_PER_JUDGMENT = 3;

function buildHitCte(ftsSpec) {
  return ftsSpec.queries.map((_, index) => `
    SELECT Master_ID, Fakra_ID, rank AS p_rank, ${index} AS term_no
    FROM FTS_Judgments
    WHERE FTS_Judgments MATCH ?
  `).join(" UNION ALL ");
}

function buildJudgmentAggregationSql(ftsSpec) {
  const hitCte = buildHitCte(ftsSpec);
  return `
    WITH hits AS (
      ${hitCte}
    ),
    by_judgment AS (
      SELECT
        h.Master_ID,
        COUNT(DISTINCT h.term_no) AS matched_terms,
        MIN(h.p_rank) AS best_rank,
        COUNT(DISTINCT h.Fakra_ID) AS actual_match_count
      FROM hits h
      GROUP BY h.Master_ID
    )
  `;
}

export async function searchJudgments(db, { query, courtId, page, pageSize }) {
  const ftsSpec = buildFts5Query(query);
  if (!ftsSpec) {
    return {
      found: false,
      page,
      page_size: pageSize,
      total_matches: 0,
      total_judgments: 0,
      has_more: false,
      results: [],
      d1_metrics: { rows_read: 0, duration_ms: 0 }
    };
  }

  const offset = (page - 1) * pageSize;
  const unitBinds = [...ftsSpec.queries];

  const baseCte = buildJudgmentAggregationSql(ftsSpec);

  let countSql = `${baseCte}
    SELECT
      COUNT(*) AS total_judgments,
      COALESCE(SUM(actual_match_count), 0) AS total_matches
    FROM by_judgment b
    JOIN Judgments_Master m ON m.Master_ID = b.Master_ID
    WHERE b.matched_terms = ?`;
  const countBinds = [...unitBinds, ftsSpec.unit_count];

  if (courtId) {
    countSql += ` AND m.Court_ID = ?`;
    countBinds.push(courtId);
  }

  let pagedSql = `${baseCte}
    SELECT
      b.Master_ID,
      b.best_rank,
      b.actual_match_count,
      b.matched_terms,
      m.Case_Year,
      m.Case_No
    FROM by_judgment b
    JOIN Judgments_Master m ON m.Master_ID = b.Master_ID
    WHERE b.matched_terms = ?`;
  const pagedBinds = [...unitBinds, ftsSpec.unit_count];

  if (courtId) {
    pagedSql += ` AND m.Court_ID = ?`;
    pagedBinds.push(courtId);
  }

  pagedSql += `
    ORDER BY
      b.best_rank ASC,
      b.actual_match_count DESC,
      m.Case_Year DESC,
      m.Case_No DESC,
      m.Master_ID ASC
    LIMIT ? OFFSET ?`;
  pagedBinds.push(pageSize, offset);

  const [countResult, pagedResult] = await db.batch([
    db.prepare(countSql).bind(...countBinds),
    db.prepare(pagedSql).bind(...pagedBinds),
  ]);

  let totalRowsRead = (countResult?.meta?.rows_read || 0) + (pagedResult?.meta?.rows_read || 0);
  let totalDuration = (countResult?.meta?.duration || 0) + (pagedResult?.meta?.duration || 0);

  const countRow = countResult?.results?.[0] || {};
  const totalJudgments = Number(countRow.total_judgments || 0);
  const totalMatches = Number(countRow.total_matches || 0);
  const matchedMasters = pagedResult?.results || [];

  if (!matchedMasters.length) {
    return {
      found: false,
      page,
      page_size: pageSize,
      total_matches: totalMatches,
      total_judgments: totalJudgments,
      has_more: false,
      results: [],
      d1_metrics: {
        rows_read: totalRowsRead,
        duration_ms: Math.round(totalDuration * 100) / 100
      }
    };
  }

  const masterIds = matchedMasters.map((r) => r.Master_ID);
  const inPlaceholders = masterIds.map(() => "?").join(",");

  const masterDetailsSql = `
    SELECT
      m.Master_ID,
      m.Case_No,
      m.Case_Year,
      m.Case_Date,
      m.Office_Year,
      c.Court_Name
    FROM Judgments_Master m
    LEFT JOIN Courts c ON c.Court_ID = m.Court_ID
    WHERE m.Master_ID IN (${inPlaceholders})
  `;

  // Get only the top three matching paragraphs per judgment inside SQL.
  // A paragraph matching several search units is de-duplicated first.
  const snippetsCte = buildHitCte(ftsSpec);
  const snippetBinds = [
    ...ftsSpec.queries,
    ...masterIds,
    MAX_SNIPPETS_PER_JUDGMENT
  ];

  // Rebuild the SQL placeholder order so the IN (...) filter appears inside deduped
  // after the FTS MATCH parameters.
  const orderedSnippetSql = `
    WITH hits AS (
      ${snippetsCte}
    ),
    deduped AS (
      SELECT
        Master_ID,
        Fakra_ID,
        MIN(p_rank) AS p_rank
      FROM hits
      WHERE Master_ID IN (${inPlaceholders})
      GROUP BY Master_ID, Fakra_ID
    ),
    ranked AS (
      SELECT
        d.Master_ID,
        d.Fakra_ID,
        d.p_rank,
        ROW_NUMBER() OVER (
          PARTITION BY d.Master_ID
          ORDER BY d.p_rank ASC, d.Fakra_ID ASC
        ) AS rn
      FROM deduped d
    )
    SELECT
      r.Master_ID,
      r.Fakra_ID,
      t.Fakra_Text,
      t.Fakra_No,
      r.p_rank
    FROM ranked r
    JOIN Judgments_Text t ON t.Fakra_ID = r.Fakra_ID
    WHERE r.rn <= ?
    ORDER BY r.Master_ID ASC, r.p_rank ASC, r.Fakra_ID ASC
  `;

  const [detailsBatch, snippetsBatch] = await db.batch([
    db.prepare(masterDetailsSql).bind(...masterIds),
    db.prepare(orderedSnippetSql).bind(...snippetBinds),
  ]);

  totalRowsRead += (detailsBatch?.meta?.rows_read || 0) + (snippetsBatch?.meta?.rows_read || 0);
  totalDuration += (detailsBatch?.meta?.duration || 0) + (snippetsBatch?.meta?.duration || 0);

  const masterDetailsRows = detailsBatch?.results || [];
  const snippetsRows = snippetsBatch?.results || [];

  const masterMap = new Map(masterDetailsRows.map((m) => [m.Master_ID, m]));
  const snippetsMap = new Map();
  for (const s of snippetsRows) {
    if (!snippetsMap.has(s.Master_ID)) snippetsMap.set(s.Master_ID, []);
    snippetsMap.get(s.Master_ID).push(s);
  }

  const results = [];
  for (const row of matchedMasters) {
    const mId = row.Master_ID;
    const master = masterMap.get(mId);
    if (!master) continue;

    const rawSnippets = snippetsMap.get(mId) || [];
    const formattedMatches = rawSnippets.map((snip) => {
      let label = `مبدأ رقم ${snip.Fakra_No}`;
      if (snip.Fakra_No === 0) label = "هيئة المحكمة والديباجة";
      else if (snip.Fakra_No === -2) label = "أسباب ومنطوق الحكم";
      else if (snip.Fakra_No === -50) label = "منطوق الحكم المستخلص";

      return {
        Fakra_No: snip.Fakra_No,
        fakraLabel: label,
        snippet: extractSnippetAndHighlight(snip.Fakra_Text, query),
      };
    });

    results.push({
      Master_ID: mId,
      Case_No: master.Case_No,
      Case_Year: master.Case_Year,
      Case_Date: master.Case_Date,
      Office_Year: master.Office_Year,
      Court_Name: master.Court_Name || "المحكمة غير محددة",
      best_rank: row.best_rank,
      match_count: row.actual_match_count,
      matches: formattedMatches,
    });
  }

  return {
    found: results.length > 0,
    page,
    page_size: pageSize,
    total_matches: totalMatches,
    total_judgments: totalJudgments,
    has_more: offset + results.length < totalJudgments,
    results,
    d1_metrics: {
      rows_read: totalRowsRead,
      duration_ms: Math.round(totalDuration * 100) / 100
    }
  };
}

export async function getJudgmentById(db, masterId) {
  const masterStmt = db.prepare(`
    SELECT m.Master_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, m.Master_Text, c.Court_Name
    FROM Judgments_Master m
    LEFT JOIN Courts c ON c.Court_ID = m.Court_ID
    WHERE m.Master_ID = ?
    LIMIT 1
  `).bind(masterId);

  const textsStmt = db.prepare(`
    SELECT Fakra_ID, Fakra_No, Fakra_Text
    FROM Judgments_Text
    WHERE Master_ID = ?
    ORDER BY
      CASE
        WHEN Fakra_No = 0 THEN 1
        WHEN Fakra_No = -2 THEN 2
        WHEN Fakra_No = -50 THEN 3
        WHEN Fakra_No > 0 THEN 4
        ELSE 5
      END ASC,
      Fakra_No ASC
  `).bind(masterId);

  const principlesStmt = db.prepare(`
    SELECT DISTINCT p.Mogz_ID, p.Mogz_Text
    FROM Judgments_Principles p
    JOIN Judgments_Principles_Links l ON l.Mogz_ID = p.Mogz_ID
    JOIN Judgments_Text t ON t.Fakra_ID = l.Fakra_ID
    WHERE t.Master_ID = ?
    ORDER BY p.Mogz_ID ASC
  `).bind(masterId);

  const batchResults = await db.batch([masterStmt, textsStmt, principlesStmt]);

  const master = batchResults[0]?.results?.[0] || null;
  if (!master) return { found: false };

  const texts = batchResults[1]?.results || [];
  const principles = batchResults[2]?.results || [];

  const rowsRead = (batchResults[0]?.meta?.rows_read || 0) +
                   (batchResults[1]?.meta?.rows_read || 0) +
                   (batchResults[2]?.meta?.rows_read || 0);

  return {
    found: true,
    master,
    principles,
    texts,
    d1_metrics: { rows_read: rowsRead }
  };
}

export async function getJudgmentByCase(db, { caseNo, caseYear, courtId }) {
  let sql = `
    SELECT m.Master_ID, m.Case_No, m.Case_Year, m.Office_Year, m.Case_Date, m.Master_Text, c.Court_Name
    FROM Judgments_Master m
    LEFT JOIN Courts c ON c.Court_ID = m.Court_ID
    WHERE m.Case_No = ? AND m.Case_Year = ?
  `;
  const binds = [caseNo, caseYear];

  if (courtId) {
    sql += ` AND m.Court_ID = ? `;
    binds.push(courtId);
  }

  const lookupResult = await db.prepare(sql).bind(...binds).all();
  const rows = lookupResult.results || [];

  if (rows.length === 0) return { found: false };

  if (rows.length === 1) {
    const singleMaster = rows[0];
    const masterId = singleMaster.Master_ID;

    const textsStmt = db.prepare(`
      SELECT Fakra_ID, Fakra_No, Fakra_Text
      FROM Judgments_Text
      WHERE Master_ID = ?
      ORDER BY
        CASE
          WHEN Fakra_No = 0 THEN 1
          WHEN Fakra_No = -2 THEN 2
          WHEN Fakra_No = -50 THEN 3
          WHEN Fakra_No > 0 THEN 4
          ELSE 5
        END ASC,
        Fakra_No ASC
    `).bind(masterId);

    const principlesStmt = db.prepare(`
      SELECT DISTINCT p.Mogz_ID, p.Mogz_Text
      FROM Judgments_Principles p
      JOIN Judgments_Principles_Links l ON l.Mogz_ID = p.Mogz_ID
      JOIN Judgments_Text t ON t.Fakra_ID = l.Fakra_ID
      WHERE t.Master_ID = ?
      ORDER BY p.Mogz_ID ASC
    `).bind(masterId);

    const [textsBatch, principlesBatch] = await db.batch([textsStmt, principlesStmt]);

    return {
      found: true,
      master: singleMaster,
      texts: textsBatch?.results || [],
      principles: principlesBatch?.results || [],
      d1_metrics: {
        rows_read: (lookupResult?.meta?.rows_read || 0) +
                   (textsBatch?.meta?.rows_read || 0) +
                   (principlesBatch?.meta?.rows_read || 0)
      }
    };
  }

  return {
    found: true,
    multiple: true,
    judgments: rows,
    d1_metrics: { rows_read: lookupResult?.meta?.rows_read || 0 }
  };
}
