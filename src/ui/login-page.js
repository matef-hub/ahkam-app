import { escapeHtml } from "../lib/arabic.js";
import { SHARED_STYLES } from "./styles.js";
import { renderTopDevBar, renderSiteFooter, FONT_LINKS } from "./components.js";

export function renderLoginPageHtml({ returnTo = "/", error = "", isDev = false } = {}) {
  const safeReturn = escapeHtml(returnTo || "/");
  const loginUrl = `/auth/google/login?return_to=${encodeURIComponent(returnTo || "/")}`;
  const devLoginUrl = `/auth/dev/login?return_to=${encodeURIComponent(returnTo || "/")}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تسجيل الدخول | موسوعة الأحكام القضائية المصرية</title>
<meta name="description" content="تسجيل الدخول السريع بحساب Google للوصول إلى مكنز الأحكام القضائية المصرية ومزامنة أبحاثك القانونية.">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" href="/favicon.ico">
${FONT_LINKS}

<style>
${SHARED_STYLES}

.auth-wrapper {
  min-height: calc(100vh - 280px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.auth-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-top: 5px solid var(--gold);
  border-radius: var(--radius-lg);
  padding: 40px 36px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 20px 45px -10px rgba(10, 25, 47, 0.15), 0 0 0 1px rgba(179, 135, 40, 0.18);
  text-align: center;
  position: relative;
}

.auth-emblem {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  background: #fdfaf2;
  border: 1.5px solid var(--gold-border);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(179, 135, 40, 0.15);
}

.auth-title {
  font-size: 1.55rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 8px;
  line-height: 1.3;
}

.auth-subtitle {
  color: var(--gold-dark);
  font-size: 0.92rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.auth-desc {
  color: var(--text-muted);
  font-size: 0.94rem;
  line-height: 1.8;
  margin-bottom: 30px;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  padding: 14px 24px;
  background: #ffffff;
  color: #1f2937;
  border: 1.5px solid #d1d5db;
  border-radius: 12px;
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.google-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.google-btn:focus-visible {
  outline: 3px solid rgba(66, 133, 244, 0.3);
}

.google-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.dev-bypass-box {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed var(--border);
}

.dev-bypass-btn {
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--primary);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 8px 18px;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.dev-bypass-btn:hover {
  background: #e2e8f0;
}

.auth-features-list {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.86rem;
  color: var(--text-sub);
  font-weight: 600;
}

.auth-feature-icon {
  color: var(--gold);
  font-size: 1rem;
}

.auth-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: right;
}
</style>
</head>
<body>

${renderTopDevBar()}

<div class="auth-wrapper">
  <div class="auth-card">
    <div class="auth-emblem">
      <img src="/favicon.svg" alt="شعار الموسوعة" width="48" height="48">
    </div>

    <h1 class="auth-title">موسوعة الأحكام القضائية المصرية</h1>
    <div class="auth-subtitle">المكنز القضائي الموحد • وصول حصري للأعضاء</div>

    ${error ? `<div class="auth-error-banner">⚠️ ${escapeHtml(error)}</div>` : ""}

    <p class="auth-desc">
      للوصول إلى مكنز أحكام محكمة النقض والدستورية العليا ومجلس الدولة، وحفظ ومزامنة استشهاداتك القضائية سحابياً، يُرجى تسجيل الدخول المباشر بحسابك.
    </p>

    <a href="${loginUrl}" class="google-btn" title="تسجيل الدخول الفوري بحساب Google">
      <svg class="google-icon" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>الدخول السريع باستخدام Google</span>
    </a>

    <div class="dev-bypass-box">
      <a href="${devLoginUrl}" class="dev-bypass-btn" title="دخول تجريبي فوري للمطورين">
        <span>⚡ دخول فوري تجريبي (للتجربة والتحقق)</span>
      </a>
    </div>

    <div class="auth-features-list">
      <div class="auth-feature-item">
        <span class="auth-feature-icon">🔒</span>
        <span>تسجيل فوري مشفر بنقرة واحدة دون الحاجة لكلمة مرور.</span>
      </div>
      <div class="auth-feature-item">
        <span class="auth-feature-icon">📑</span>
        <span>مزامنة سحابية خاصة للمفضلة والأحكام المحفوظة عبر جميع أجهزتك.</span>
      </div>
      <div class="auth-feature-item">
        <span class="auth-feature-icon">🏛️</span>
        <span>وصول غير محدود لمحرك بحث الدوائر والقرارات الصادرة.</span>
      </div>
    </div>
  </div>
</div>

${renderSiteFooter()}

</body>
</html>`;
}
