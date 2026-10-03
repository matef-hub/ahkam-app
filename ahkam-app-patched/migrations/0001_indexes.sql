-- 1. تسريع استعلام رقم وسنة الطعن والمحكمة
CREATE INDEX IF NOT EXISTS idx_master_case_lookup 
ON Judgments_Master (Case_No, Case_Year, Court_ID);

-- 2. تسريع جلب فقرات الحكم مرتبة برقم الفقرة
CREATE INDEX IF NOT EXISTS idx_text_master_order 
ON Judgments_Text (Master_ID, Fakra_No);

-- 3. تسريع الربط بين الفقرات والمبادئ القانونية
CREATE INDEX IF NOT EXISTS idx_principles_links_composite 
ON Judgments_Principles_Links (Fakra_ID, Mogz_ID);