import { SECURITY_HEADERS } from "../lib/security.js";
import { matchCache, storeInCache } from "../lib/cache.js";

function xmlResponse(xml, ttl = 86400) {
  return new Response(xml, {
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=86400`,
    },
  });
}

export function handleRobotsTxt() {
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://ahkam.app/sitemap.xml
`;

  return new Response(body, {
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

export async function handleSitemap(request, env, url, ctx) {
  const cached = await matchCache(request);
  if (cached) return cached;

  try {
    const countRes = await env.DB.prepare("SELECT COUNT(*) AS total FROM Judgments_Master").first();
    const totalJudgments = Number(countRes?.total || 0);
    const pageSize = 5000;
    const pageMatch = url.pathname.match(/^\/sitemap-(\d+)\.xml$/);

    if (pageMatch) {
      const page = Number(pageMatch[1]);
      const totalPages = Math.max(1, Math.ceil(totalJudgments / pageSize));

      if (!Number.isSafeInteger(page) || page < 1 || page > totalPages) {
        return new Response("Sitemap page not found", {
          status: 404,
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }

      const offset = (page - 1) * pageSize;
      const rowsRes = await env.DB.prepare(
        "SELECT Master_ID FROM Judgments_Master ORDER BY Master_ID ASC LIMIT ? OFFSET ?"
      ).bind(pageSize, offset).all();

      const rows = rowsRes.results || [];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      if (page === 1) {
        xml += `  <url>\n    <loc>https://ahkam.app/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      }
      for (const row of rows) {
        xml += `  <url>\n    <loc>https://ahkam.app/judgment/${row.Master_ID}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
      xml += `</urlset>`;

      const resp = xmlResponse(xml);
      return await storeInCache(request, resp, 86400, ctx);
    }

    if (totalJudgments > pageSize) {
      const totalPages = Math.ceil(totalJudgments / pageSize);
      let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (let p = 1; p <= totalPages; p++) {
        indexXml += `  <sitemap>\n    <loc>https://ahkam.app/sitemap-${p}.xml</loc>\n  </sitemap>\n`;
      }
      indexXml += `</sitemapindex>`;

      const resp = xmlResponse(indexXml);
      return await storeInCache(request, resp, 86400, ctx);
    }

    const rowsRes = await env.DB.prepare(
      "SELECT Master_ID, Case_Date FROM Judgments_Master ORDER BY Master_ID ASC LIMIT 5000"
    ).all();
    const rows = rowsRes.results || [];

    const courtSlugs = ["cassation-civil", "cassation-criminal", "constitutional", "administrative-high", "administrative"];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>https://ahkam.app/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    for (const slug of courtSlugs) {
      xml += `  <url>\n    <loc>https://ahkam.app/courts/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    }

    for (const row of rows) {
      const lastmod = row.Case_Date ? `\n    <lastmod>${row.Case_Date}</lastmod>` : "";
      xml += `  <url>\n    <loc>https://ahkam.app/judgment/${row.Master_ID}</loc>${lastmod}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    const resp = xmlResponse(xml);
    return await storeInCache(request, resp, 86400, ctx);
  } catch (err) {
    console.error("Sitemap Generation Failure:", err);
    return new Response("Sitemap generation error", {
      status: 500,
      headers: {
        ...SECURITY_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
