export const SHARED_STYLES = `
:root {
  --bg: #faf8f5;
  --bg-pattern: radial-gradient(#c59b2718 1px, transparent 1px);
  --surface: #ffffff;
  --surface-muted: #f4efe6;
  --surface-card: #ffffff;
  --border: #e6dfd3;
  --border-subtle: #efeae1;
  --border-focus: #c59b27;

  --primary: #0a192f;
  --primary-light: #162a45;
  --primary-accent: #f0f4f9;
  --primary-border: #cbd5e1;

  --gold: #b38728;
  --gold-dark: #8c6819;
  --gold-light: #fdfaf2;
  --gold-border: #dfc882;
  --gold-glow: rgba(179, 135, 40, 0.2);

  --text-main: #0f172a;
  --text-muted: #526075;
  --text-sub: #334155;
  --text-legal: #141b26;

  --success: #15803d;
  --success-bg: #f0fdf4;
  --success-border: #bbf7d0;

  --font-sans: 'Cairo', system-ui, -apple-system, sans-serif;
  --font-legal: 'Amiri', 'Traditional Arabic', serif;

  --shadow-sm: 0 1px 3px rgba(10, 25, 47, 0.05);
  --shadow-md: 0 4px 16px -2px rgba(10, 25, 47, 0.08);
  --shadow-lg: 0 16px 36px -8px rgba(10, 25, 47, 0.12), 0 0 0 1px rgba(179, 135, 40, 0.14);
  --radius-lg: 16px;
  --radius-md: 10px;
  --radius-sm: 6px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background-color: var(--bg);
  background-image: 
    radial-gradient(at 0% 0%, rgba(197, 155, 39, 0.05) 0px, transparent 40%),
    radial-gradient(at 100% 100%, rgba(10, 25, 47, 0.04) 0px, transparent 50%),
    var(--bg-pattern);
  background-size: 100% 100%, 100% 100%, 28px 28px;
  color: var(--text-main);
  font-family: var(--font-sans);
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.container {
  width: min(1180px, calc(100% - 32px));
  margin: auto;
}

/* ==========================================================================
   Top Supervision Bar & Header
   ========================================================================== */
.top-dev-bar {
  background: linear-gradient(90deg, #0a192f 0%, #162a45 100%);
  color: #e2e8f0;
  padding: 8px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(197, 155, 39, 0.35);
  box-shadow: 0 2px 8px rgba(10, 25, 47, 0.2);
}

.top-dev-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  text-align: center;
}

.dev-divider {
  color: var(--gold);
  opacity: 0.6;
}

.top-dev-bar span.dev-name {
  color: #facc15;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.top-dev-bar span.dev-role {
  color: #94a3b8;
  font-size: 0.78rem;
}

.header {
  padding: 24px 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
}

.brand-crest {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  border: 1.5px solid var(--gold-border);
  box-shadow: 0 4px 12px rgba(179, 135, 40, 0.15);
  padding: 4px;
}

.brand-title {
  font-size: 1.55rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.2px;
}

.brand-subtitle {
  color: var(--gold-dark);
  font-size: 0.86rem;
  font-weight: 700;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-saved-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid var(--gold-border);
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--gold-dark);
  text-decoration: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.header-saved-btn:hover {
  background: var(--gold-light);
  border-color: var(--gold);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--gold-glow);
}

.saved-count-pill {
  background: var(--gold);
  color: white;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.74rem;
  font-weight: 900;
  min-width: 18px;
  text-align: center;
  display: inline-block;
  line-height: 1.4;
}

.header-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--success);
  box-shadow: var(--shadow-sm);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.2);
}

.header-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1.5px solid var(--gold-border);
  padding: 4px 12px;
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.user-avatar-img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--gold);
}

.user-avatar-fallback {
  font-size: 1rem;
}

.user-profile-name {
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--primary);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-logout-link {
  font-size: 0.78rem;
  font-weight: 800;
  color: #dc2626;
  text-decoration: none;
  background: #fee2e2;
  padding: 3px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  margin-right: 4px;
}

.user-logout-link:hover {
  background: #fca5a5;
  color: #991b1b;
}

.trial-banner {
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  border: 1.5px solid #fde68a;
  border-right: 5px solid #b45309;
  border-radius: var(--radius-md);
  padding: 12px 18px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #92400e;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.08);
}

.trial-auth-btn {
  background: #b45309;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.trial-auth-btn:hover {
  background: #92400e;
  color: #ffffff;
}

.trial-lock-notice {
  background: #fff1f2;
  border: 1.5px solid #fecdd3;
  border-right: 5px solid #e11d48;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 20px;
  color: #9f1239;
  font-size: 0.96rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.trial-login-link {
  background: #e11d48;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 800;
  transition: background 0.2s;
}

.trial-login-link:hover {
  background: #be123c;
}

/* ==========================================================================
   Hero Judicial Plaques (Stats Bar)
   ========================================================================== */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin: 10px 0 24px;
}

.stat-item {
  background: white;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: right;
  position: relative;
}

.stat-item.interactive {
  cursor: pointer;
  user-select: none;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  outline: none;
  background: #ffffff;
}

.stat-item.interactive:hover {
  transform: translateY(-2px);
  border-color: var(--gold);
  box-shadow: 0 6px 20px rgba(10, 25, 47, 0.08), 0 0 0 1px rgba(179, 135, 40, 0.2);
}

.stat-item.interactive:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.stat-item.interactive.active {
  border-color: var(--gold);
  background: linear-gradient(135deg, #0a192f 0%, #162a45 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(10, 25, 47, 0.18), 0 0 0 2px var(--gold);
}

.stat-title {
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 700;
}

.stat-item.interactive.active .stat-title {
  color: #cbd5e1;
}

.stat-digit {
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--primary);
  margin: 4px 0;
  font-family: var(--font-sans);
}

.stat-item.interactive.active .stat-digit {
  color: #facc15;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--gold-dark);
}

.stat-item.interactive.active .stat-badge {
  color: #fef08a;
}

/* ==========================================================================
   The Grand Search Command Center
   ========================================================================== */
.search-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 26px;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.search-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 22px;
  border-bottom: 2px solid var(--surface-muted);
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.tab-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-muted);
  padding: 8px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--primary);
  background: var(--surface-muted);
}

.tab-btn:focus-visible {
  outline: 2px solid var(--gold);
}

.tab-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(10, 25, 47, 0.15);
}

.tab-btn.active svg {
  stroke: #facc15;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 14px;
  align-items: center;
}

.search-form:not(.case-form) .input-group {
  grid-column: span 3;
}

.search-form.case-form {
  grid-template-columns: minmax(240px, 280px) 1fr 1fr auto;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  right: 18px;
  color: var(--gold);
  width: 22px;
  height: 22px;
  pointer-events: none;
}

.search-kbd {
  position: absolute;
  left: 16px;
  background: white;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 5px;
  pointer-events: none;
  font-family: monospace;
}

select.form-select, input.form-input {
  width: 100%;
  padding: 14px 18px;
  background: var(--surface-muted);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

select.form-select {
  cursor: pointer;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-left: 28px;
}

input.form-input.has-icon {
  padding-right: 50px;
  padding-left: 45px;
  font-size: 1rem;
}

select.form-select:focus, input.form-input:focus {
  background: white;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(179, 135, 40, 0.15);
}

.submit-btn {
  background: linear-gradient(135deg, #0a192f 0%, #162a45 100%);
  color: white;
  border: 1px solid rgba(197, 155, 39, 0.3);
  border-radius: var(--radius-md);
  padding: 14px 28px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(10, 25, 47, 0.2);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #0f2444 0%, #1e3a63 100%);
  box-shadow: 0 6px 20px rgba(10, 25, 47, 0.28), 0 0 0 1px var(--gold);
}

/* ==========================================================================
   Quick Instant Topic Chips (موضوعات قانونية شائعة)
   ========================================================================== */
.quick-topics-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.topics-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--gold-dark);
  white-space: nowrap;
}

.topics-scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.topic-chip {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-sub);
  padding: 4px 12px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.topic-chip:hover {
  background: var(--gold-light);
  border-color: var(--gold);
  color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(179, 135, 40, 0.15);
}

.topic-chip:focus-visible {
  outline: 2px solid var(--gold);
}

/* ==========================================================================
   Advanced Filters
   ========================================================================== */
.advanced-filters {
  grid-column: 1 / -1;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
}

.advanced-filters summary {
  cursor: pointer;
  color: var(--primary);
  font-weight: 800;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.advanced-filters summary:hover {
  color: var(--gold-dark);
}

.advanced-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.advanced-filter-grid label {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.advanced-filter-grid input {
  width: 100%;
  margin-top: 5px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  background: white;
  font: inherit;
  transition: border-color 0.2s;
}

.advanced-filter-grid input:focus {
  border-color: var(--gold);
  outline: none;
  box-shadow: 0 0 0 2px rgba(179, 135, 40, 0.15);
}

/* ==========================================================================
   Results & Judicial Cards
   ========================================================================== */
.loading-box {
  display: none;
  text-align: center;
  padding: 48px;
  color: var(--text-muted);
  font-weight: 700;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3.5px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 14px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.results-container {
  margin: 26px 0 60px;
}

.results-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--border-subtle);
}

.results-header-info h2 {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0;
}

.judgment-card {
  background: white;
  border: 1px solid var(--border);
  border-right: 5px solid var(--gold);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.judgment-card:hover {
  border-color: var(--border);
  border-right-color: var(--gold-dark);
  box-shadow: 0 10px 28px -4px rgba(10, 25, 47, 0.1);
  transform: translateY(-2px);
}

.card-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.card-court-badge {
  background: #0a192f;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.card-date-meta {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-muted);
}

.card-title {
  font-size: 1.22rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 14px;
  line-height: 1.4;
}

.card-title a {
  color: inherit;
  text-decoration: none;
}

.card-title a:hover {
  color: var(--gold-dark);
}

.match-snippet-box {
  background: #fdfcf9;
  border-right: 3px solid var(--gold);
  border: 1px solid var(--border-subtle);
  border-right-width: 4px;
  border-right-color: var(--gold);
  border-radius: 8px;
  padding: 14px 18px;
  margin-top: 12px;
  font-family: var(--font-legal);
  font-size: 1.15rem;
  color: var(--text-legal);
  line-height: 2.1;
  text-align: justify;
}

.fakra-type-tag {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--gold-dark);
  background: var(--gold-light);
  border: 1px solid var(--gold-border);
  padding: 2px 9px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.search-hit {
  background: #fef08a;
  color: #78350f;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.card-actions {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.card-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.open-btn {
  background: linear-gradient(135deg, #0a192f 0%, #162a45 100%);
  border: 1px solid rgba(197, 155, 39, 0.3);
  color: white;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(10, 25, 47, 0.15);
}

.open-btn:hover {
  background: linear-gradient(135deg, #0f2444 0%, #1e3a63 100%);
  color: #facc15;
  transform: translateY(-1px);
}

/* ==========================================================================
   Saved Panel
   ========================================================================== */
.saved-panel {
  display: none;
  animation: fadeIn 0.2s ease;
}

.saved-card-item {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-right: 4px solid var(--gold);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.saved-card-item:hover {
  border-color: var(--gold-border);
  box-shadow: var(--shadow-md);
}

/* ==========================================================================
   Full Judgment Page
   ========================================================================== */
.full-judgment-view {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 34px;
  box-shadow: var(--shadow-md);
  margin-bottom: 40px;
}

.full-judgment-header {
  border-bottom: 2px solid var(--surface-muted);
  padding-bottom: 20px;
  margin-bottom: 22px;
}

.full-judgment-header h1 {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 12px;
  line-height: 1.35;
}

.judgment-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0;
  padding: 14px;
  background: var(--surface-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.tool-btn {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-sub);
  padding: 7px 16px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: var(--gold);
  color: var(--gold-dark);
  box-shadow: var(--shadow-sm);
}

.principles-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 18px 0 28px;
}

.principle-box {
  background: #fdfcf9;
  border: 1px solid var(--gold-border);
  border-right: 5px solid var(--gold);
  border-radius: 10px;
  padding: 16px 20px;
  color: var(--text-legal);
  font-family: var(--font-legal);
  font-size: 1.22rem;
  font-weight: 700;
  line-height: 2.1;
  text-align: justify;
  box-shadow: 0 2px 8px rgba(179, 135, 40, 0.06);
}

a.principle-box {
  display: block;
  text-decoration: none;
}

a.principle-box:hover, a.principle-box:focus-visible {
  border-color: var(--gold-dark);
  box-shadow: 0 4px 14px rgba(179, 135, 40, 0.14);
  outline: none;
}

.fakra-row {
  padding: 22px 0;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-legal);
  font-family: var(--font-legal);
  font-size: 1.2rem;
  line-height: 2.1;
  text-align: justify;
}

.fakra-row:last-child { border-bottom: none; }

.fakra-idx {
  margin-bottom: 10px;
  font-family: var(--font-sans);
}

.back-btn {
  background: white;
  border: 1px solid var(--border);
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  margin-bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--surface-muted);
  border-color: var(--gold);
}

.empty-state {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
  font-weight: 700;
}

.toast-msg {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0a192f;
  color: #fff;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 12px 30px rgba(10, 25, 47, 0.35);
  border-right: 4px solid var(--gold);
  z-index: 9999;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.toast-msg.show {
  opacity: 1;
  transform: translateY(0);
}

/* ==========================================================================
   Footer
   ========================================================================== */
.site-footer {
  margin-top: 80px;
  background: #0a192f;
  color: #94a3b8;
  border-top: 3px solid var(--gold);
  padding: 52px 0 26px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr 1.2fr;
  gap: 36px;
  margin-bottom: 40px;
}

.footer-col h3 {
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-desc {
  line-height: 2;
  font-size: 0.9rem;
  color: #cbd5e1;
  text-align: justify;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s, transform 0.2s;
}

.footer-links a:hover {
  color: #facc15;
  transform: translateX(-4px);
}

.disclaimer-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 4px solid var(--gold);
  border-radius: 8px;
  padding: 16px 18px;
  font-size: 0.84rem;
  line-height: 1.9;
  color: #cbd5e1;
  text-align: justify;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-bottom-copy {
  font-size: 0.86rem;
  color: #94a3b8;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media print {
  .top-dev-bar, .header, .search-card, .judgment-toolbar, .back-btn, .site-footer {
    display: none !important;
  }
  body {
    background: white !important;
    color: black !important;
  }
  .full-judgment-view {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}

@media (max-width: 820px) {
  .search-form, .search-form.case-form { grid-template-columns: 1fr; }
  .search-form:not(.case-form) .input-group { grid-column: auto; }
  .advanced-filter-grid { grid-template-columns: 1fr; }
  .stats-bar { grid-template-columns: 1fr 1fr; }
  .footer-grid { grid-template-columns: 1fr; gap: 30px; }
  .toast-msg { right: 16px; left: 16px; bottom: 16px; justify-content: center; }
}

@media (max-width: 520px) {
  .stats-bar { grid-template-columns: 1fr; }
  .card-top-meta { flex-direction: column; align-items: flex-start; }
}
`;
