-- Two indexes from 0001/0002 are redundant:
--  * idx_master_case_lookup (Case_No, Case_Year, Court_ID) is a left prefix of
--    idx_master_case_year_court (Case_No, Case_Year, Court_ID, Master_ID).
--  * idx_principles_links_composite and idx_links_fakra_mogz cover the same
--    columns (Fakra_ID, Mogz_ID).
-- Dropping duplicates saves storage and speeds up ingestion writes.
DROP INDEX IF EXISTS idx_master_case_lookup;
DROP INDEX IF EXISTS idx_principles_links_composite;
