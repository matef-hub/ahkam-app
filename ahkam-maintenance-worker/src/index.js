/**
 * Standalone Maintenance Worker for Ahkam.app
 * 
 * Absolute isolation:
 * - NO D1 databases or queries.
 * - NO search indexing or FTS.
 * - NO authentication, OAuth, or sessions.
 * - Serves HTTP 503 Service Unavailable for all incoming requests.
 * - Proper caching headers (no-store) and Retry-After header.
 * - Serves embedded branding SVG icon for /favicon.ico and /logo.svg.
 */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; base-uri 'self'; form-action 'self';",
};

const OFFICIAL_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <!-- Egyptian Judicial Encyclopedia Official Emblem -->
  <defs>
    <style>
      .navy-fill { fill: #0B2545; }
      .gold-fill { fill: #C49A45; }
      .gold-stroke { stroke: #C49A45; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
    </style>
  </defs>
  <rect x="136" y="58" width="328" height="28" rx="14" class="navy-fill" />
  <rect x="165" y="98" width="270" height="22" rx="5" class="navy-fill" />
  <path d="M 228 140 C 224 152 230 168 244 178 L 244 416 L 292 446 L 292 140 Z" class="navy-fill" />
  <path d="M 372 140 C 376 152 370 168 356 178 L 356 416 L 308 446 L 308 140 Z" class="navy-fill" />
  <circle cx="132" cy="166" r="14" class="gold-fill" />
  <line x1="132" y1="178" x2="54" y2="308" class="gold-stroke" />
  <line x1="132" y1="178" x2="210" y2="308" class="gold-stroke" />
  <path d="M 43 308 C 43 376 221 376 221 308 Z" class="gold-fill" />
  <circle cx="468" cy="166" r="14" class="gold-fill" />
  <line x1="468" y1="178" x2="390" y2="308" class="gold-stroke" />
  <line x1="468" y1="178" x2="546" y2="308" class="gold-stroke" />
  <path d="M 379 308 C 379 376 557 376 557 308 Z" class="gold-fill" />
  <rect x="180" y="444" width="240" height="22" rx="6" class="navy-fill" />
  <path d="M 148 480 L 452 480 L 472 522 L 128 522 Z" class="navy-fill" />
</svg>`;

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أحكام — النظام في وضع الصيانة والتحديث المجدول</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #faf8f5;
      --bg-pattern: radial-gradient(#c59b2718 1px, transparent 1px);
      --surface: #ffffff;
      --surface-muted: #f4efe6;
      --border: #e6dfd3;
      --border-subtle: #efeae1;
      --primary: #0a192f;
      --primary-light: #162a45;
      --gold: #b38728;
      --gold-dark: #8c6819;
      --gold-border: #dfc882;
      --text-main: #0f172a;
      --text-muted: #526075;
      --text-sub: #334155;
      --font-sans: 'Cairo', system-ui, -apple-system, sans-serif;
      --shadow-sm: 0 1px 3px rgba(10, 25, 47, 0.05);
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

    .maintenance-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .maintenance-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 620px;
      width: 100%;
      padding: 48px 36px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .maintenance-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--gold), var(--primary), var(--gold));
    }

    .brand-emblem {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-muted);
      border: 1.5px solid var(--border);
      border-radius: 50%;
      box-shadow: var(--shadow-sm);
    }

    .maintenance-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(179, 135, 40, 0.12);
      color: var(--gold-dark);
      border: 1px solid var(--gold-border);
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .pulsing-dot {
      width: 8px;
      height: 8px;
      background-color: var(--gold);
      border-radius: 50%;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    .maintenance-title {
      color: var(--primary);
      font-size: 1.75rem;
      font-weight: 900;
      margin: 0 0 14px 0;
      line-height: 1.35;
    }

    .maintenance-desc {
      color: var(--text-sub);
      font-size: 1.02rem;
      line-height: 1.8;
      margin-bottom: 28px;
    }

    .maintenance-details-box {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      text-align: right;
      margin-bottom: 28px;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 0.92rem;
      color: var(--text-muted);
    }

    .detail-item:last-child {
      margin-bottom: 0;
    }

    .detail-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
    }

    .maintenance-footer {
      font-size: 0.85rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .contact-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
    }

    .contact-link:hover {
      text-decoration: underline;
    }

    .retry-btn {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }

    .retry-btn:hover {
      background: var(--primary-light);
    }
  </style>
</head>
<body>
  <div class="maintenance-wrapper">
    <div class="maintenance-card">
      <div class="brand-emblem">
        <img src="/logo.svg" alt="شعار أحكام" width="46" height="46">
      </div>

      <div class="maintenance-status-badge">
        <span class="pulsing-dot"></span>
        <span>صيانة وتحديث مجدول للنظام</span>
      </div>

      <h1 class="maintenance-title">نعمل على تحسين وتطوير منصة أحكام</h1>
      
      <p class="maintenance-desc">
        تخضع منصة أحكام القضائية حالياً لعملية صيانة وتحديثات مجدولة للبنية التحتية لضمان أعلى مستويات الأداء والأمان.
      </p>

      <div class="maintenance-details-box">
        <div class="detail-item">
          <span class="detail-icon">🛡️</span>
          <span><strong>حماية البيانات:</strong> تم فصل واستقرار قواعد البيانات بأمان كامل أثناء أعمال الترقية الدورية.</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">⚡</span>
          <span><strong>تحسين البنية التحتية:</strong> تطوير سرعة الاستجابة وفهارس المبادئ القانونية.</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">🕒</span>
          <span><strong>الوقت المتوقع:</strong> سنعود للعمل بكامل طاقتنا في أقرب وقت ممكن.</span>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <button type="button" class="retry-btn" onclick="window.location.reload()">
          <span>🔄 إعادة المحاولة</span>
        </button>
      </div>

      <div class="maintenance-footer">
        <span>موسوعة الأحكام القضائية المصرية © 2026</span>
        <span>للاستفسارات العاجلة: <a href="mailto:support@ahkam.app" class="contact-link">support@ahkam.app</a></span>
      </div>
    </div>
  </div>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Static branding icon assets (fast-path for favicon and logo)
    if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg" || url.pathname === "/logo.svg") {
      return new Response(OFFICIAL_SVG_ICON, {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // API requests receive clean 503 JSON response
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({
        error: "service_unavailable",
        message: "النظام في وضع الصيانة والتحديث المجدول حالياً. يرجى المحاولة لاحقاً.",
      }), {
        status: 503,
        headers: {
          ...SECURITY_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Retry-After": "3600",
        },
      });
    }

    // All pages and routes return the responsive maintenance HTML page with HTTP 503
    return new Response(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Retry-After": "3600",
      },
    });
  },
};
