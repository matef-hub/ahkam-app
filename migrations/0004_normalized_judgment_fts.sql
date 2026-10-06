-- إنشاء جدول FTS5 فقط
CREATE VIRTUAL TABLE IF NOT EXISTS FTS_Judgments_Normalized USING fts5(
  Fakra_ID UNINDEXED,
  Master_ID UNINDEXED,
  Section_Kind UNINDEXED,
  Fakra_Text,
  tokenize = 'unicode61'
);

-- إنشاء الـ Triggers فقط
DROP TRIGGER IF EXISTS judgments_text_normalized_fts_insert;
CREATE TRIGGER IF NOT EXISTS judgments_text_normalized_fts_insert
AFTER INSERT ON Judgments_Text
BEGIN
  INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
  VALUES (
    NEW.Fakra_ID,
    NEW.Fakra_ID,
    NEW.Master_ID,
    'text',
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    NEW.Fakra_Text,
      'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
      'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
      '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
  );
END;

DROP TRIGGER IF EXISTS judgments_text_normalized_fts_delete;
CREATE TRIGGER IF NOT EXISTS judgments_text_normalized_fts_delete
AFTER DELETE ON Judgments_Text
BEGIN
  DELETE FROM FTS_Judgments_Normalized WHERE rowid = OLD.Fakra_ID;
END;

DROP TRIGGER IF EXISTS judgments_text_normalized_fts_update;
CREATE TRIGGER IF NOT EXISTS judgments_text_normalized_fts_update
AFTER UPDATE OF Fakra_ID, Master_ID, Fakra_Text ON Judgments_Text
BEGIN
  DELETE FROM FTS_Judgments_Normalized WHERE rowid = OLD.Fakra_ID;
  INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
  VALUES (
    NEW.Fakra_ID,
    NEW.Fakra_ID,
    NEW.Master_ID,
    'text',
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    NEW.Fakra_Text,
      'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
      'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
      '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
  );
END;

DROP TRIGGER IF EXISTS judgments_master_normalized_fts_insert;
CREATE TRIGGER IF NOT EXISTS judgments_master_normalized_fts_insert
AFTER INSERT ON Judgments_Master
WHEN NEW.Master_Text IS NOT NULL AND length(trim(NEW.Master_Text)) > 0
BEGIN
  INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
  VALUES (
    -NEW.Master_ID,
    NULL,
    NEW.Master_ID,
    'master',
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    NEW.Master_Text,
      'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
      'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
      '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
  );
END;

DROP TRIGGER IF EXISTS judgments_master_normalized_fts_delete;
CREATE TRIGGER IF NOT EXISTS judgments_master_normalized_fts_delete
AFTER DELETE ON Judgments_Master
BEGIN
  DELETE FROM FTS_Judgments_Normalized WHERE rowid = -OLD.Master_ID;
END;

DROP TRIGGER IF EXISTS judgments_master_normalized_fts_update;
CREATE TRIGGER IF NOT EXISTS judgments_master_normalized_fts_update
AFTER UPDATE OF Master_ID, Master_Text ON Judgments_Master
BEGIN
  DELETE FROM FTS_Judgments_Normalized WHERE rowid = -OLD.Master_ID;
  INSERT INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
  SELECT
    -NEW.Master_ID,
    NULL,
    NEW.Master_ID,
    'master',
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    NEW.Master_Text,
      'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
      'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
      '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
  WHERE NEW.Master_Text IS NOT NULL AND length(trim(NEW.Master_Text)) > 0;
END;

-- إدراج السجلات الموجودة مسبقاً مع دعم إعادة تشغيل الميجريشن بأمان
INSERT OR REPLACE INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
SELECT
  -Master_ID, NULL, Master_ID, 'master',
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
  replace(replace(replace(replace(replace(replace(replace(
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
  Master_Text,
    'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
    'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
    '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
FROM Judgments_Master
WHERE Master_Text IS NOT NULL AND length(trim(Master_Text)) > 0;

INSERT OR REPLACE INTO FTS_Judgments_Normalized (rowid, Fakra_ID, Master_ID, Section_Kind, Fakra_Text)
SELECT
  Fakra_ID, Fakra_ID, Master_ID, 'text',
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
  replace(replace(replace(replace(replace(replace(replace(
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
  Fakra_Text,
    'ـ', ''), 'ً', ''), 'ٌ', ''), 'ٍ', ''), 'َ', ''), 'ُ', ''), 'ِ', ''), 'ّ', ''), 'ْ', ''), 'ٰ', ''),
    'أ', 'ا'), 'إ', 'ا'), 'آ', 'ا'), 'ٱ', 'ا'), 'ى', 'ي'), 'ؤ', 'ء'), 'ئ', 'ء'),
    '٠', '0'), '١', '1'), '٢', '2'), '٣', '3'), '٤', '4'), '٥', '5'), '٦', '6'), '٧', '7'), '٨', '8'), '٩', '9')
FROM Judgments_Text;
