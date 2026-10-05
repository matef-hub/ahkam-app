/**
 * UI Templates and Components Hub
 * Modularized for high maintainability and ease of control:
 * - styles.js: Global shared CSS styles and design tokens
 * - components.js: Reusable layout partials (dev bar, header, footer, helpers)
 * - home-page.js: Full-featured search and research workspace view
 * - judgment-page.js: Judgment detail viewer with legal principles and text
 * - court-page.js: Dedicated judicial landing pages
 */

export { SHARED_STYLES } from "./styles.js";
export { renderHomePageHtml } from "./home-page.js";
export { renderJudgmentPageHtml } from "./judgment-page.js";
export { renderCourtLandingPageHtml } from "./court-page.js";
export { renderLoginPageHtml } from "./login-page.js";
export {
  renderTopDevBar,
  renderHeader,
  renderSiteFooter,
  toIsoDate
} from "./components.js";
