-- Supporting indexes for case lookup, text retrieval and principle joins.
-- Safe to run more than once.

CREATE INDEX IF NOT EXISTS idx_master_case_year_court
ON Judgments_Master (Case_No, Case_Year, Court_ID, Master_ID);

CREATE INDEX IF NOT EXISTS idx_text_master_fakra
ON Judgments_Text (Master_ID, Fakra_ID);

CREATE INDEX IF NOT EXISTS idx_links_fakra_mogz
ON Judgments_Principles_Links (Fakra_ID, Mogz_ID);
