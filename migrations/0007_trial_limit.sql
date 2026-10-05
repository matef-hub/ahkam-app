-- Migration 0007: Trial Search Limit to single search
-- In SQLite / D1, adding columns with default values is fully supported
ALTER TABLE sessions ADD COLUMN search_count INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN is_trial INTEGER DEFAULT 0;
