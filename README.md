<div align="center">

# ⚖️ أحكام | Ahkam Engine

### **High-Performance Arabic Legal Search Engine & Edge Repository**

[![Platform](https://img.shields.io/badge/Platform-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](#)
[![Database](https://img.shields.io/badge/Database-Cloudflare%20D1%20(FTS5)-0051C3?style=for-the-badge&logo=sqlite&logoColor=white)](#)
[![Language](https://img.shields.io/badge/Language-JavaScript%20(ES2022)-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#)

<p align="center">
  <b>A lightweight, edge-native legal research platform tailored for Egyptian jurisprudence.</b><br>
  Built specifically to conquer Arabic orthographic complexities, clitic morphology, prefix-bound token boundaries, and high-concurrency Edge SQL caching.
</p>

[✨ Key Capabilities](#-key-capabilities) •
[🏛️ Supported Courts](#️-supported-courts) •
[📐 System Architecture](#-system-architecture) •
[🗄️ Database & Schema](#️-database--schema) •
[🚀 Quick Start](#-quick-start) •
[🔌 API Specification](#-api-specification) •
[🛡️ Security & Performance](#️-security--performance)

---

</div>

## 🌟 Overview

**أحكام (Ahkam)** delivers sub-millisecond retrieval and intelligent highlighting for Egyptian court rulings and legal maxims (*المبادئ القانونية*). Standard search engines struggle with Arabic clitics, where prepositions, conjunctions, and definite articles fuse directly with noun stems (e.g., `وبالإعلان` for query `إعلان`). 

**Ahkam** resolves this at the Edge by pairing custom morphological stemming and variant generation with an optimized **SQLite FTS5** backend deployed globally on **Cloudflare Workers** and **D1**.

---

## ✨ Key Capabilities

<table>
  <tr>
    <td width="50%">
      <h3>🔍 Morphology-Aware Search</h3>
      <ul>
        <li><b>Prefix-Stripping Engine</b>: Automatically handles clitics (<code>و</code>, <code>ف</code>, <code>ب</code>, <code>ك</code>, <code>ل</code>, <code>ال</code>, <code>بال</code>, <code>كال</code>, <code>لل</code>).</li>
        <li><b>Stem Variant Permutation</b>: Prioritizes Hamza (<code>أ</code>, <code>إ</code>, <code>آ</code>), Ta Marbuta / Ha (<code>ة</code>/<code>ه</code>), and Alef Maksura / Ya (<code>ى</code>/<code>ي</code>) before prefix application.</li>
        <li><b>Digit Normalization</b>: Transparently maps Eastern-Arabic (<code>٠-٩</code>) and Persian (<code>۰-۹</code>) numerals to ASCII.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>⚡ Edge-Native Performance</h3>
      <ul>
        <li><b>Bounded Full-Text Scans</b>: 2-tier search pipeline eliminates runaway full-table CTE scans with strict match limits and deterministic tiebreakers (<code>Fakra_No</code>, <code>Fakra_ID</code>).</li>
        <li><b>Deferred Edge Caching</b>: Cache persistence is offloaded via <code>ctx.waitUntil()</code> to eliminate worker response latency.</li>
        <li><b>Client Race-Condition Guards</b>: Unified <code>AbortController</code> and monotonic request sequence IDs kill stale asynchronous renders.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎯 Precision Highlighting</h3>
      <ul>
        <li><b>Token-Level Boundary Scanners</b>: Unicode-safe <code>\p{L}\p{N}_</code> token matching prevents mid-word corruption and broken HTML markup.</li>
        <li><b>Prefix-Preserved Highlighting</b>: Matches and renders <code>&lt;mark&gt;وبالإعلان&lt;/mark&gt;</code> even when searching for the bare stem <code>إعلان</code>.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🛡️ Enterprise Edge Hardening</h3>
      <ul>
        <li><b>Cache-Poisoning Defenses</b>: Explicit <code>ALLOWED_ORIGINS</code> gatekeeper prevents cache key inflation via arbitrary <code>Origin</code> headers.</li>
        <li><b>URL Sanitization</b>: Dynamic query strings are pruned from non-API page cache keys.</li>
        <li><b>Crawler Resiliency</b>: Symmetric <code>HEAD</code> request support across all public routes.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏛️ Supported Courts

| ID | Court Designation (Arabic) | Official English Name | Jurisdiction |
| :---: | :--- | :--- | :--- |
| `1` | **محكمة النقض** | Court of Cassation | Supreme Civil, Commercial & Criminal Appellate |
| `3` | **المحكمة الإدارية العليا** | Supreme Administrative Court | State Council (*مجلس الدولة*) Apex Court |
| `31` | **محكمة القضاء الإداري** | Administrative Judiciary Court | State Council (*مجلس الدولة*) First/Second Instance |

> 💡 *The State Council filter (`state_council` or `3,31`) automatically unions both Court `3` and Court `31`.*

---

## 📐 System Architecture

```mermaid
flowchart TD
    Client([🌐 Client Browser / Crawler]) -->|HTTP GET / HEAD| CF[⚡ Cloudflare Worker Edge]
    
    subgraph Edge Layer
        CF --> SEC{🛡️ Security & Route Guard}
        SEC -->|Allowed Origin / Clean URL| CACHE[(🗄️ Edge Cache API)]
        CACHE -->|Cache Hit| ReturnRes[🚀 Instant Response]
        
        CACHE -->|Cache Miss| Router{🔀 Route Dispatcher}
        
        Router -->|/api/search| SearchH[🔎 Search Handler]
        Router -->|/api/judgment| DetailH[📄 Judgment Handler]
        Router -->|/judgment/:id| SSRH[🖥️ SSR HTML Renderer]
        Router -->|/sitemap*.xml| SEOH[🗺️ SEO Engine]
    end

    subgraph Data & Morphology
        SearchH --> LING[📝 arabic.js: Normalize, Strip Clitics & Expand Variants]
        LING --> D1[(🗃️ Cloudflare D1 Database)]
        D1 -->|SQLite FTS5 MATCH| PrinciplesFTS[principles_fts]
        PrinciplesFTS -->|Bounded Hits| SearchH
        DetailH --> D1
        SSRH --> D1
    end

    SearchH -->|Async Save| BGWorker[ctx.waitUntil Cache Store]
    SSRH -->|Async Save| BGWorker
    🗄️ Database & SchemaThe underlying storage utilizes Cloudflare D1 structured with strict constraints and an auxiliary FTS5 virtual table:1. Master Records (judgments_master)SQLCREATE TABLE judgments_master (
  Master_ID    INTEGER PRIMARY KEY AUTOINCREMENT,
  Court_ID     INTEGER NOT NULL,
  Case_Number  INTEGER NOT NULL,
  Case_Year    INTEGER NOT NULL,
  Case_Date    TEXT,
  Master_Text  TEXT
);
CREATE INDEX idx_master_case_year_court ON judgments_master (Case_Number, Case_Year, Court_ID);
2. Legal Principles / Excerpts (principles)SQLCREATE TABLE principles (
  Fakra_ID     INTEGER PRIMARY KEY AUTOINCREMENT,
  Master_ID    INTEGER NOT NULL REFERENCES judgments_master(Master_ID),
  Fakra_No     INTEGER NOT NULL,
  Fakra_Text   TEXT NOT NULL
);
CREATE INDEX idx_links_fakra_mogz ON principles (Master_ID, Fakra_No);
3. FTS5 Virtual Table (principles_fts)SQLCREATE VIRTUAL TABLE principles_fts USING fts5(
  Fakra_Text,
  content='principles',
  content_rowid='Fakra_ID',
  tokenize='unicode61'
);
📁 Repository Structure.
├── 📂 migrations/
│   ├── 0001_indexes.sql             # Baseline schema and composite lookups
│   ├── 0002_search_indexes.sql      # FTS5 virtual tables and sync triggers
│   └── 0003_drop_dupes.sql          # Performance cleanup: drops redundant duplicate indexes
├── 📂 src/
│   ├── 📄 index.js                  # Worker entry point, HEAD support, security & cache router
│   ├── 📂 lib/
│   │   ├── 📄 arabic.js             # Morphological stemmer, clitic stripper, FTS5 builder & snippets
│   │   ├── 📄 cache.js              # Origin-hardened Cache API wrapper with waitUntil support
│   │   ├── 📄 db.js                 # D1 query execution, multi-court resolvers, and bounded scans
│   │   └── 📄 security.js           # Digit normalizer, int parser, CSP, and CORS validation
│   ├── 📂 routes/
│   │   ├── 📄 api.js                # RESTful API handlers (/api/search, /api/judgment)
│   │   └── 📄 seo.js                # Deterministic sitemap pagination and robots.txt generator
│   └── 📂 ui/
│       └── 📄 templates.js          # SSR layout, Accessible buttons, Toast alerts & Client App Shell
├── 📄 PATCH_NOTES.md                # Detailed audit log of bug resolutions and patches
├── 📄 wrangler.toml                 # Cloudflare Worker deployment configuration
└── 📄 README.md                     # Comprehensive project documentation
🚀 Quick StartPrerequisitesNode.js v18.0.0 or higherCloudflare Wrangler CLI1. InstallationBash# Clone the repository
git clone [https://github.com/your-username/ahkam-app.git](https://github.com/your-username/ahkam-app.git)
cd ahkam-app

# Install project dependencies
npm install
2. Local Database InitializationBash# Apply schema migrations to local D1 instance
npx wrangler d1 migrations apply DB --local
3. Start Local Edge EnvironmentBash# Launch development worker
npx wrangler dev
Navigate to http://localhost:8787 in your browser.🔌 API Specification🔎 Search PrinciplesHTTPGET /api/search?q={query}&courtId={courtId}&page={page}&pageSize={pageSize}
Query ParametersParameterTypeRequiredDefaultDescriptionqstringYes—Search keywords (e.g., مسئولية, تعويض)courtIdstringNonullTarget court: 1, state_council, or 3,31pagenumberNo1Pagination page indexpageSizenumberNo20Items per page (Max limit: 50)Sample Response (200 OK)JSON{
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "results": [
    {
      "masterId": 1042,
      "courtId": 1,
      "caseNumber": 125,
      "caseYear": 85,
      "caseDate": "2018-05-12",
      "fakraId": 4120,
      "snippet": "... المقرر في قضاء هذه المحكمة أن <mark>الإعلان</mark> بصحيفة الدعوى هو الأساس الذي يبنى عليه ..."
    }
  ]
}
📄 Retrieve Judgment DetailsHTTPGET /api/judgment?id={masterId}
GET /api/judgment?caseNumber={num}&caseYear={year}&courtId={courtId}
Sample Response (200 OK)JSON{
  "found": true,
  "judgment": {
    "Master_ID": 1042,
    "Court_ID": 1,
    "Case_Number": 125,
    "Case_Year": 85,
    "Case_Date": "2018-05-12",
    "Master_Text": "حكمت المحكمة بقبول الطعن شكلاً وفي الموضوع...",
    "principles": [
      {
        "Fakra_ID": 4120,
        "Fakra_No": 1,
        "Fakra_Text": "المقرر في قضاء هذه المحكمة أن الإعلان بصحيفة الدعوى..."
      }
    ]
  }
}
Sample Not Found (404 Not Found)JSON{
  "found": false,
  "error": "الحكم غير موجود"
}
🛡️ Security & Performance                                  [ Incoming Request ]
                                           │
                                ┌──────────┴──────────┐
                                ▼                     ▼
                       [ Origin Whitelisted ]  [ Origin Unknown ]
                                │                     │
                        Append to Cache Key     Drop from Cache
                                │                     │
                                └──────────┬──────────┘
                                           │
                                           ▼
                                 [ Match Cached Item ]
                                ┌──────────┴──────────┐
                                ▼                     ▼
                             (Hit)                 (Miss)
                        Return Instantly     Run Bounded FTS Query
                                                      │
                                                      ▼
                                            [ Background Persist ]
                                            (ctx.waitUntil Layer)
Strict Content Security Policy (CSP): Hardened headers prevent script injection without restricting necessary edge-delivered styles.Sitemap Protection: Enforces rigid regex ^/sitemap(?:-(\d+))?\.xml$ rejecting malformed crawler probes.Non-blocking Cache Writes: Background execution via ctx.waitUntil(storeInCache(...)) ensures serialization overhead never impedes client roundtrips.Payload Minimization: Ambiguous case lookups matching multiple courts defer fetching voluminous Master_Text fields until the client explicitly requests a specific Master_ID.🚢 Deployment1. Provision Production D1 DatabaseBashnpx wrangler d1 create ahkam-prod
Copy the returned database_id into your wrangler.toml.2. Apply Migrations to Remote EdgeBashnpx wrangler d1 migrations apply DB --remote
3. Deploy to Cloudflare WorkersBashnpx wrangler deploy
📄 LicenseThis repository and its source code are licensed under the MIT License.