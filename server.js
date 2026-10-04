import http from "node:http";
import { initDatabase } from "./src/lib/node-db.js";
import worker from "./src/index.js";

const PORT = 3000;
const HOST = "0.0.0.0";

// Provide in-memory caches.default for Node.js runtime
if (!globalThis.caches) {
  const cacheMap = new Map();
  globalThis.caches = {
    default: {
      async match(req) {
        try {
          const key = typeof req === "string" ? req : req.url;
          const entry = cacheMap.get(key);
          if (!entry) return null;
          if (Date.now() > entry.expires) {
            cacheMap.delete(key);
            return null;
          }
          return entry.response.clone();
        } catch {
          return null;
        }
      },
      async put(req, res) {
        try {
          const key = typeof req === "string" ? req : req.url;
          const cc = res.headers.get("Cache-Control") || "";
          const match = cc.match(/max-age=(\d+)/);
          const ttl = match ? parseInt(match[1], 10) * 1000 : 3600000;
          cacheMap.set(key, {
            response: res.clone(),
            expires: Date.now() + ttl,
          });
        } catch (e) {
          console.warn("Cache put failed:", e?.message);
        }
      },
      async delete(req) {
        const key = typeof req === "string" ? req : req.url;
        return cacheMap.delete(key);
      },
    },
  };
}

// In-memory rate limiter mock for SEARCH_LIMITER
const rateLimitStore = new Map();
const searchLimiter = {
  async limit({ key }) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxLimit = 120;
    let record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
      return { success: true };
    }
    if (record.count >= maxLimit) {
      return { success: false };
    }
    record.count++;
    return { success: true };
  },
};

// Initialize database
const db = initDatabase();

const env = {
  DB: db,
  SEARCH_LIMITER: searchLimiter,
};

const server = http.createServer(async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
    const fullUrl = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body = undefined;
    if (hasBody) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
      duplex: "half",
    });

    const ctx = {
      waitUntil(promise) {
        Promise.resolve(promise).catch((err) =>
          console.error("Background task error:", err)
        );
      },
    };

    const webResponse = await worker.fetch(webRequest, env, ctx);

    res.statusCode = webResponse.status;
    for (const [key, value] of webResponse.headers.entries()) {
      res.setHeader(key, value);
    }

    if (webResponse.body) {
      const arrayBuffer = await webResponse.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Server request error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("حدث خطأ في الخادم الداخلي");
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Ahkam Egyptian Legal Judgments portal running on http://${HOST}:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
