export async function getUserSavedJudgments(db, userId) {
  const query = `
    SELECT id, master_id as masterId, court_name as courtName,
           case_no as caseNo, case_year as caseYear, case_date as caseDate,
           saved_at as savedAt
    FROM user_saved_judgments
    WHERE user_id = ?
    ORDER BY id DESC
  `;
  const res = await db.prepare(query).bind(userId).all();
  return res.results || [];
}

export async function saveUserJudgment(db, userId, { masterId, courtName = "", caseNo = "", caseYear = "", caseDate = "" }) {
  const mId = Number(masterId);
  if (!Number.isSafeInteger(mId) || mId <= 0) {
    throw new Error("معرف الحكم غير صالح");
  }

  const nowIso = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO user_saved_judgments (user_id, master_id, court_name, case_no, case_year, case_date, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, master_id) DO UPDATE SET
         court_name = excluded.court_name,
         case_no = excluded.case_no,
         case_year = excluded.case_year,
         case_date = excluded.case_date,
         saved_at = excluded.saved_at`
    )
    .bind(userId, mId, String(courtName || ""), String(caseNo || ""), String(caseYear || ""), String(caseDate || ""), nowIso)
    .run();

  return { success: true, masterId: mId };
}

export async function removeUserSavedJudgment(db, userId, masterId) {
  const mId = Number(masterId);
  if (!Number.isSafeInteger(mId) || mId <= 0) {
    throw new Error("معرف الحكم غير صالح");
  }

  await db
    .prepare("DELETE FROM user_saved_judgments WHERE user_id = ? AND master_id = ?")
    .bind(userId, mId)
    .run();

  return { success: true, masterId: mId };
}

export async function batchSyncSavedJudgments(db, userId, items = []) {
  if (!Array.isArray(items) || items.length === 0) return { synced: 0 };

  let count = 0;
  for (const item of items) {
    const mId = Number(item.masterId || item.id);
    if (!Number.isSafeInteger(mId) || mId <= 0) continue;
    try {
      await saveUserJudgment(db, userId, {
        masterId: mId,
        courtName: item.courtName || "",
        caseNo: item.caseNo || "",
        caseYear: item.caseYear || "",
        caseDate: item.caseDate || "",
      });
      count++;
    } catch (e) {
      console.warn("Failed to sync item:", mId, e.message);
    }
  }
  return { synced: count };
}
