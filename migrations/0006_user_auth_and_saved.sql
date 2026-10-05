-- Migration 0006: User Authentication, Sessions, and Cloud Saved Judgments

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture_url TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'active_trial',
  subscription_tier TEXT DEFAULT 'standard',
  subscription_expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  search_count INTEGER DEFAULT 0,
  is_trial INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_saved_judgments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  master_id INTEGER NOT NULL,
  court_name TEXT,
  case_no TEXT,
  case_year TEXT,
  case_date TEXT,
  saved_at TEXT NOT NULL,
  UNIQUE(user_id, master_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_user ON user_saved_judgments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_master ON user_saved_judgments(master_id);
