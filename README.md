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