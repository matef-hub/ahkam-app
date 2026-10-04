import { execSync } from 'child_process';

const DB_NAME = 'egypt-judgments';
const CHUNK_SIZE = 1500; // حجم الدفعة المناسب لحدود معالج D1

function runD1(sql) {
  const singleLine = sql.replace(/\r?\n|\r/g, ' ').replace(/"/g, '\\"');
  const cmd = `wrangler d1 execute ${DB_NAME} --remote --command "${singleLine}" --json`;
  const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  return JSON.parse(output);
}

async function main() {
  console.log('🚀 بدء فهرسة نصوص ملخصات الأحكام (Judgments_Master)...');
  try {
    const masterSql = `
      INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
      SELECT
        -Master_ID, NULL, Master_ID, 'master',
        replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(Master_Text,
          'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
          'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء')
      FROM Judgments_Master
      WHERE Master_Text IS NOT NULL AND length(trim(Master_Text)) > 0;
    `;
    runD1(masterSql);
    console.log('✅ تم إدخال Master_Text بنجاح.');
  } catch (err) {
    console.error('⚠️ خطأ أو تجاوز في Master_Text (قد يحتاج تجزئة إذا كان ضخماً جداً):', err.message);
  }

  console.log('🔍 حساب نطاق Fakra_ID في جدول Judgments_Text...');
  const rangeRes = runD1('SELECT MIN(Fakra_ID) AS min_id, MAX(Fakra_ID) AS max_id FROM Judgments_Text;');
  const minId = rangeRes[0].results[0].min_id || 1;
  const maxId = rangeRes[0].results[0].max_id || 0;

  console.log(`📊 النطاق من Fakra_ID: ${minId} إلى ${maxId}`);

  for (let current = minId; current <= maxId; current += CHUNK_SIZE) {
    const nextLimit = current + CHUNK_SIZE - 1;
    process.stdout.write(`⏳ جاري فهرسة الفقرات من ${current} إلى ${nextLimit}... `);

    const chunkSql = `
      INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
      SELECT
        Fakra_ID, Fakra_ID, Master_ID, 'text',
        replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(Fakra_Text,
          'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
          'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء')
      FROM Judgments_Text
      WHERE Fakra_ID BETWEEN ${current} AND ${nextLimit};
    `;

    try {
      runD1(chunkSql);
      console.log('✅ تم');
    } catch (e) {
      console.log(`❌ فشل في الدفعة (${current}-${nextLimit}): ${e.message}`);
    }
  }

  console.log('🎉 اكتملت عملية الفهرسة بالكامل!');
  
  const countRes = runD1('SELECT count(*) AS total_fts FROM FTS_Judgments_Normalized;');
  console.log('📌 إجمالي السجلات المفهرسة الآن:', countRes[0].results[0].total_fts);
}

main().catch(console.error);