-- Additive support for rich filters, provenance, research relationships and
-- privacy-aware search-quality telemetry. Existing imported data is untouched.
CREATE INDEX IF NOT EXISTS idx_master_court_date_id
ON Judgments_Master (Court_ID, Case_Date, Master_ID);

CREATE INDEX IF NOT EXISTS idx_master_date_id
ON Judgments_Master (Case_Date, Master_ID);

CREATE INDEX IF NOT EXISTS idx_text_master_fakra_no_id
ON Judgments_Text (Master_ID, Fakra_No, Fakra_ID);

CREATE TABLE IF NOT EXISTS Judgment_Metadata (
  Master_ID INTEGER NOT NULL,
  Field_Name TEXT NOT NULL CHECK (Field_Name IN ('chamber', 'type', 'category', 'source', 'provenance')),
  Field_Value TEXT NOT NULL,
  Created_At TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (Master_ID, Field_Name, Field_Value)
);

CREATE INDEX IF NOT EXISTS idx_judgment_metadata_lookup
ON Judgment_Metadata (Field_Name, Field_Value, Master_ID);

CREATE TABLE IF NOT EXISTS Judgment_Relations (
  From_Master_ID INTEGER NOT NULL,
  To_Master_ID INTEGER NOT NULL,
  Relation_Type TEXT NOT NULL CHECK (Relation_Type IN ('same_case', 'same_principle', 'cites', 'cited_by', 'editorial')),
  Relation_Source TEXT NOT NULL DEFAULT 'editorial',
  Weight REAL NOT NULL DEFAULT 1 CHECK (Weight >= 0),
  Created_At TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (From_Master_ID, To_Master_ID, Relation_Type),
  CHECK (From_Master_ID <> To_Master_ID)
);

CREATE INDEX IF NOT EXISTS idx_judgment_relations_to
ON Judgment_Relations (To_Master_ID, Relation_Type, From_Master_ID);

CREATE TABLE IF NOT EXISTS Search_Analytics (
  Search_ID INTEGER PRIMARY KEY,
  Query_Text TEXT NOT NULL,
  Normalized_Query TEXT NOT NULL,
  Court_Filter TEXT,
  Result_Count INTEGER NOT NULL CHECK (Result_Count >= 0),
  Created_At TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_created
ON Search_Analytics (Created_At, Result_Count);
