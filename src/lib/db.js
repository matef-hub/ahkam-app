import { buildFts5Query, extractSnippetAndHighlight } from "./arabic.js";

const MAX_SNIPPETS_PER_JUDGMENT = 3;

export async function searchJudgments(db, { query, courtId, page, pageSize }) {
  const ftsQuery = buildFts5Query(query);
  if (!ftsQuery) {
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

  // Phase 1: حصر إجمالي الأحكام والفقرات وتحديد صفحة الأحكام مرتبة بالصلة
  let countSql = "";
  const countBinds = [ftsQuery];

  let pagedSql = "";
  const pagedBinds = [ftsQuery];

  if (courtId) {
    countSql = `
      SELECT 
        COUNT(DISTINCT f.Master_ID) AS total_judgments,
        COUNT(f.Fakra_ID) AS total_matches
      FROM FTS_Judgments f
      JOIN Judgments_Master m ON m.Master_ID = f.Master_ID
      WHERE FTS_Judgments MATCH ? AND m.Court_ID = ?
    `;
    countBinds.push(courtId);

    // best_rank هو MIN(f.rank)، مع تقييد أثر match_count بما لا يتجاوز 10 لمنع تغلب الأحكام الطويلة
    pagedSql = `
      SELECT 
        f.Master_ID,
        MIN(f.rank) AS best_rank,
        MIN(COUNT(f.Fakra_ID), 10) AS bounded_match_count,
        COUNT(f.Fakra_ID) AS actual_match_count,
        m.Case_Year,
        m.Case_No
      FROM FTS_Judgments f
      JOIN Judgments_Master m ON m.Master_ID = f.Master_ID
      WHERE FTS_Judgments MATCH ? AND m.Court_ID = ?
      GROUP BY f.Master_ID
      ORDER BY best_rank ASC, bounded_match_count DESC, m.Case_Year DESC, m.Case_No DESC
      LIMIT ? OFFSET ?
    `;
    pagedBinds.push(courtId, pageSize, offset);
  } else {
    countSql = `
      SELECT 
        COUNT(DISTINCT f.Master_ID) AS total_judgments,
        COUNT(f.Fakra_ID) AS total_matches
      FROM FTS_Judgments f
      WHERE FTS_Judgments MATCH ?
    `;

    pagedSql = `
      SELECT 
        f.Master_ID,
        MIN(f.rank) AS best_rank,
        MIN(COUNT(f.Fakra_ID), 10) AS bounded_match_count,
        COUNT(f.Fakra_ID) AS actual_match_count,
        m.Case_Year,
        m.Case_No
      FROM FTS_Judgments f
      JOIN Judgments_Master m ON m.Master_ID = f.Master_ID
      WHERE FTS_Judgments MATCH ?
      GROUP BY f.Master_ID
      ORDER BY best_rank ASC, bounded_match_count DESC, m.Case_Year DESC, m.Case_No DESC
      LIMIT ? OFFSET ?
    `;
    pagedBinds.push(pageSize, offset);
  }

  // تنفيذ المرحلة الأولى في طلب ذري واحد عبر batch() لتقليص Network Latency
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
      d1_metrics: { rows_read: totalRowsRead, duration_ms: totalDuration }
    };
  }

  const masterIds = matchedMasters.map((r) => r.Master_ID);
  const inPlaceholders = masterIds.map(() => "?").join(",");

  // Phase 2: جلب بيانات Master والمقتطفات للأحكام العشرين فقط في الصفحة
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

  const snippetsSql = `
    SELECT 
      f.Master_ID,
      f.Fakra_ID,
      f.Fakra_Text,
      t.Fakra_No,
      f.rank AS p_rank
    FROM FTS_Judgments f
    JOIN Judgments_Text t ON t.Fakra_ID = f.Fakra_ID
    WHERE FTS_Judgments MATCH ? AND f.Master_ID IN (${inPlaceholders})
    ORDER BY f.Master_ID, p_rank ASC
  `;

  const [detailsBatch, snippetsBatch] = await db.batch([
    db.prepare(masterDetailsSql).bind(...masterIds),
    db.prepare(snippetsSql).bind(ftsQuery, ...masterIds),
  ]);

  totalRowsRead += (detailsBatch?.meta?.rows_read || 0) + (snippetsBatch?.meta?.rows_read || 0);
  totalDuration += (detailsBatch?.meta?.duration || 0) + (snippetsBatch?.meta?.duration || 0);

  const masterDetailsRows = detailsBatch?.results || [];
  const snippetsRows = snippetsBatch?.results || [];

  const masterMap = new Map();
  for (const m of masterDetailsRows) {
    masterMap.set(m.Master_ID, m);
  }

  const snippetsMap = new Map();
  for (const s of snippetsRows) {
    if (!snippetsMap.has(s.Master_ID)) {
      snippetsMap.set(s.Master_ID, []);
    }
    const list = snippetsMap.get(s.Master_ID);
    if (list.length < MAX_SNIPPETS_PER_JUDGMENT) {
      list.push(s);
    }
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
      Court_Name: master.Court_Name || "محكمة النقض",
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
  // Master_ID معروف مسبقاً: نجمع كل الاستعلامات في batch ذري واحد
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

  // استدعاء المبادئ بـ JOIN مباشر يعتمد على Master_ID
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
  if (!master) {
    return { found: false };
  }

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
  // Master_ID غير معروف: ننفذ خطوة البحث أولاً لتفادي قراءة نصوص ومبادئ لأحكام غير موجودة
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

  if (rows.length === 0) {
    return { found: false };
  }

  if (rows.length === 1) {
    const singleMaster = rows[0];
    const masterId = singleMaster.Master_ID;

    // استدعاء نصوص ومبادئ الحكم المطابق في batch ذري واحد
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

  // حالة تعدد الدوائر للرقم نفسه
  return {
    found: true,
    multiple: true,
    judgments: rows,
    d1_metrics: { rows_read: lookupResult?.meta?.rows_read || 0 }
  };
}