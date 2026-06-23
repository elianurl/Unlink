import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { isValidEmail, extractEmailsFromText } from "./src/utils/email";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Solo permitimos rastrear dominios p\u00fablicos con TLD alfab\u00e9tico. Esto evita
// SSRF: que un nombre de empresa manipulado fuerce peticiones a localhost,
// IPs literales o hosts de red interna (.local, .internal, metadata, etc.).
function isPublicDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false;
  if (domain.length > 253 || /\s/.test(domain)) return false;
  if (!/^[a-z0-9.-]+\.[a-z]{2,24}$/i.test(domain)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false; // IPv4 literal
  if (domain.includes(":")) return false; // IPv6 / puerto
  const lower = domain.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".lan") ||
    lower.endsWith(".home") ||
    lower.endsWith(".corp")
  ) {
    return false;
  }
  return true;
}

const dataDir = path.join(process.cwd(), "data");
const PENDING_PATH = path.join(dataDir, "pending.json");
const APPROVED_PATH = path.join(dataDir, "approved.json");
const AUDIT_PATH = path.join(dataDir, "audit.log");
const STATS_PATH = path.join(dataDir, "stats.json");

async function ensureDataStore() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      await fs.access(PENDING_PATH);
    } catch {
      await fs.writeFile(PENDING_PATH, "[]", "utf-8");
    }
    try {
      await fs.access(APPROVED_PATH);
    } catch {
      await fs.writeFile(APPROVED_PATH, "[]", "utf-8");
    }
    try {
      await fs.access(AUDIT_PATH);
    } catch {
      await fs.writeFile(AUDIT_PATH, "", "utf-8");
    }
    try {
      await fs.access(STATS_PATH);
    } catch {
      await fs.writeFile(STATS_PATH, JSON.stringify(emptyStats(), null, 2), "utf-8");
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// Estadísticas de uso (anónimas, agregadas, sin datos personales ni IPs)
// ---------------------------------------------------------------------------
type UsageStats = {
  totals: { pageViews: number; generations: number; emailSearches: number };
  actions: { delete: number; modify: number };
  companies: Record<string, number>;
  daily: Record<string, { views: number; generations: number }>;
  startedAt: string;
  updatedAt: string;
};

function emptyStats(): UsageStats {
  const now = new Date().toISOString();
  return {
    totals: { pageViews: 0, generations: 0, emailSearches: 0 },
    actions: { delete: 0, modify: 0 },
    companies: {},
    daily: {},
    startedAt: now,
    updatedAt: now,
  };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

async function loadStats(): Promise<UsageStats> {
  try {
    const raw = await fs.readFile(STATS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const base = emptyStats();
    return {
      totals: { ...base.totals, ...(parsed?.totals || {}) },
      actions: { ...base.actions, ...(parsed?.actions || {}) },
      companies: parsed?.companies && typeof parsed.companies === "object" ? parsed.companies : {},
      daily: parsed?.daily && typeof parsed.daily === "object" ? parsed.daily : {},
      startedAt: parsed?.startedAt || base.startedAt,
      updatedAt: parsed?.updatedAt || base.updatedAt,
    };
  } catch {
    return emptyStats();
  }
}

async function readJsonArray(filePath: string): Promise<any[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filePath: string, arr: any[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(arr, null, 2), "utf-8");
}

async function writeJsonRaw(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

async function appendAudit(event: string, payload: any) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...payload,
    }) + "\n";
    await fs.appendFile(AUDIT_PATH, line, "utf-8");
  } catch {}
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": USER_AGENT,
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function googleSearchEmails(companyName: string): Promise<string[]> {
  // Free approach without external APIs:
  // 1) Infer likely corporate domains from known mappings and slug.
  // 2) Try to fetch common privacy/legal pages and extract emails.
  // 3) Fall back to generating common mailbox patterns on inferred domains.

  const toSlugDomain = (s: string) => normalizeName(s).replace(/[^a-z0-9]+/g, "");

  const nameKey = normalizeName(companyName);
  const KNOWN_DOMAINS: Record<string, string[]> = {
    "vodafone": ["vodafone.es", "vodafone.com", "lowi.es"],
    "lowi": ["lowi.es", "vodafone.com"],
    "jazztel": ["jazztel.com", "orange.com"],
    "securitas direct": ["securitasdirect.es"],
    "linea directa": ["lineadirecta.es"],
    "iberdrola": ["iberdrola.es", "iberdrola.com"],
    "orange": ["orange.com", "orange.es"],
    "movistar": ["movistar.es", "telefonica.com"],
    "o2": ["o2online.es", "telefonica.com"],
    "endesa": ["endesa.es"],
    "naturgy": ["naturgy.com", "naturgy.es"],
    "cofidis": ["cofidis.es", "cofidis.com"],
    "wizink": ["wizink.es", "wizink.com"],
  };

  const tlds = ["es", "com"];
  const base = toSlugDomain(companyName);
  const guessed = tlds.map((t) => `${base}.${t}`);
  const mapped = KNOWN_DOMAINS[nameKey] || [];
  const domainCandidates = Array.from(new Set([...mapped, ...guessed]))
    .filter(Boolean)
    .filter(isPublicDomain);

  const paths = [
    "/proteccion-de-datos",
    "/protecciondatos",
    "/proteccion-de-datos-personales",
    "/privacidad",
    "/politica-de-privacidad",
    "/politica-privacidad",
    "/aviso-legal",
    "/legal/privacidad",
    "/es/privacidad",
    "/rgpd",
    "/gdpr",
    "/lopd",
    "/contacto",
  ];

  const emails: Set<string> = new Set();
  const keywordLocal = /(proteccion|protección|privacidad|privacy|dpo|dpd|lopd|rgpd|datos)/i;
  const freeMail = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com"];

  // robots.txt minimal compliance for User-agent: *
  type Robots = { disallow: string[]; fetchedAt: number };
  const robotsCache = new Map<string, Robots>();
  async function loadRobots(domain: string): Promise<Robots | null> {
    if (robotsCache.has(domain)) return robotsCache.get(domain)!;
    const urls = [`https://${domain}/robots.txt`, `http://${domain}/robots.txt`];
    for (const u of urls) {
      try {
        const r = await fetchWithTimeout(u, { method: "GET" }, 5000);
        if (!r.ok) continue;
        const text = await r.text();
        const lines = text.split(/\r?\n/);
        let inStar = false;
        const disallow: string[] = [];
        for (const raw of lines) {
          const line = raw.trim();
          if (!line || line.startsWith("#")) continue;
          const mUA = /^User-agent:\s*(.+)$/i.exec(line);
          if (mUA) {
            inStar = mUA[1].trim() === "*";
            continue;
          }
          if (!inStar) continue;
          const mDis = /^Disallow:\s*(.*)$/i.exec(line);
          if (mDis) {
            const p = (mDis[1] || "").trim();
            if (p) disallow.push(p);
            continue;
          }
        }
        const rob: Robots = { disallow, fetchedAt: Date.now() };
        robotsCache.set(domain, rob);
        return rob;
      } catch {}
    }
    const rob: Robots = { disallow: [], fetchedAt: Date.now() };
    robotsCache.set(domain, rob);
    return rob;
  }

  async function isAllowed(domain: string, p: string): Promise<boolean> {
    try {
      const rob = await loadRobots(domain);
      if (!rob) return true;
      for (const d of rob.disallow) {
        if (d === "/") return false;
        if (d && p.startsWith(d)) return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  // Try to crawl a few likely pages per domain
  for (const domain of domainCandidates.slice(0, 4)) {
    for (const p of paths.slice(0, 6)) {
      const urls = [`https://${domain}${p}`, `http://${domain}${p}`];
      for (const url of urls) {
        try {
          const u = new URL(url);
          if (!(await isAllowed(domain, u.pathname))) continue;
          const r = await fetchWithTimeout(url, { method: "GET" }, 7000);
          if (!r.ok) continue;
          const ct = r.headers.get("content-type") || "";
          if (!ct.includes("text/html")) continue;
          const html = await r.text();
          const found = extractEmailsFromText(html)
            .map((e) => e.toLowerCase())
            .filter((e) => e.endsWith(`@${domain}`) || keywordLocal.test(e));
          for (const e of found) emails.add(e);
          if (emails.size >= 5) break;
        } catch {}
      }
      if (emails.size >= 5) break;
    }
    if (emails.size >= 5) break;
  }

  // Filter out obvious personal providers
  for (const e of Array.from(emails)) {
    if (freeMail.some((d) => e.endsWith(`@${d}`))) emails.delete(e);
  }

  // If nothing was found by crawling, return empty to let the UI guide the user
  return Array.from(emails).slice(0, 8);
}

async function startServer() {
  await ensureDataStore();
  const app = express();
  const PORT = 3000;

  // Detrás de un proxy (Render, Railway, Vercel) para que req.ip sea fiable.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Límite de tamaño del cuerpo: estos endpoints solo reciben JSON pequeño.
  // Bloquea payloads gigantes pensados para agotar memoria/CPU.
  app.use(express.json({ limit: "16kb" }));

  // Cabeceras de seguridad básicas (sin dependencias externas).
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  const clientIp = (req: express.Request): string =>
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";

  // Fábrica de limitadores de tasa por IP con ventana deslizante en memoria.
  // Cada limitador limpia entradas caducas periódicamente y acota el tamaño
  // del mapa para que un atacante no pueda agotar memoria con muchas IPs.
  function createRateLimiter(opts: { windowMs: number; max: number; message?: string }) {
    const { windowMs, max } = opts;
    const message = opts.message || "Demasiadas solicitudes. Inténtelo más tarde.";
    const store = new Map<string, number[]>();

    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [ip, arr] of store) {
        const recent = arr.filter((t) => now - t < windowMs);
        if (recent.length === 0) store.delete(ip);
        else store.set(ip, recent);
      }
    }, windowMs);
    cleanup.unref?.();

    const middleware: express.RequestHandler = (req, res, next) => {
      try {
        const ip = clientIp(req);
        const now = Date.now();
        const recent = (store.get(ip) || []).filter((t) => now - t < windowMs);
        if (recent.length >= max) {
          res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
          return res.status(429).json({ error: message });
        }
        recent.push(now);
        store.set(ip, recent);
        // Salvaguarda anti-saturación de memoria: si el mapa crece demasiado,
        // se purga por completo (el peor caso es reiniciar las ventanas).
        if (store.size > 20000) store.clear();
      } catch {}
      next();
    };
    return middleware;
  }

  // Límite global a toda la API para amortiguar avalanchas de peticiones (DoS).
  const apiLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
  // El registro de eventos/estadísticas es barato pero frecuente.
  const trackLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60 });
  // La búsqueda DPO dispara peticiones salientes: límite estricto por IP.
  const crawlLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 15,
    message: "Demasiadas búsquedas seguidas. Espere un momento antes de reintentar.",
  });

  app.use("/api/", apiLimiter);

  // Admin auth middleware
  const adminAuth: express.RequestHandler = (req, res, next) => {
    const token = (req.headers["x-admin-token"] as string) || (req.query?.token as string) || "";
    const expected = process.env.ADMIN_TOKEN || "";
    if (expected && token === expected) return next();
    return res.status(401).json({ error: "Unauthorized" });
  };

  // Estadísticas en memoria, persistidas a disco con escritura diferida para
  // no castigar el disco en cada petición.
  const stats = await loadStats();
  let statsDirty = false;
  const markStats = () => {
    stats.updatedAt = new Date().toISOString();
    statsDirty = true;
  };
  const flush = setInterval(() => {
    if (!statsDirty) return;
    statsDirty = false;
    writeJsonRaw(STATS_PATH, stats).catch(() => {});
  }, 5000);
  flush.unref?.();

  // Registro de eventos de uso anónimos (visitas y generaciones).
  app.post("/api/track", trackLimiter, (req, res) => {
    const event = String(req.body?.event || "");
    const day = todayKey();
    if (!stats.daily[day]) stats.daily[day] = { views: 0, generations: 0 };

    if (event === "pageview") {
      stats.totals.pageViews += 1;
      stats.daily[day].views += 1;
      markStats();
    } else if (event === "generation") {
      stats.totals.generations += 1;
      stats.daily[day].generations += 1;
      const action = req.body?.actionType === "modify" ? "modify" : "delete";
      stats.actions[action] += 1;
      markStats();
    }
    res.status(204).end();
  });

  app.post("/api/empresas/stats", trackLimiter, (req, res) => {
    const { company, customCompany, newEmails } = req.body;
    const suggestedEmails = Array.isArray(req.body?.suggestedEmails)
      ? req.body.suggestedEmails.filter(isValidEmail)
      : [];

    // Contabiliza la generación y la acción elegida para las estadísticas.
    const day = todayKey();
    if (!stats.daily[day]) stats.daily[day] = { views: 0, generations: 0 };
    stats.totals.generations += 1;
    stats.daily[day].generations += 1;
    const action = req.body?.actionType === "modify" ? "modify" : "delete";
    stats.actions[action] += 1;

    if (company === "Otro (especificar)" && customCompany) {
      const label = String(customCompany).slice(0, 120);
      stats.companies[label] = (stats.companies[label] || 0) + 1;
      const validEmails = Array.isArray(newEmails) ? newEmails.filter(isValidEmail) : [];
      if (validEmails.length > 0) {
        (async () => {
          const pending = await readJsonArray(PENDING_PATH);
          pending.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: label,
            emails: validEmails,
            createdAt: new Date().toISOString(),
            source: "manual",
          });
          await writeJsonArray(PENDING_PATH, pending);
        })().catch(() => {});
      }
    } else if (company) {
      const label = String(company).slice(0, 120);
      stats.companies[label] = (stats.companies[label] || 0) + 1;

      if (suggestedEmails.length > 0) {
        (async () => {
          const pending = await readJsonArray(PENDING_PATH);
          pending.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: label,
            emails: suggestedEmails,
            createdAt: new Date().toISOString(),
            source: "suggestion",
          });
          await writeJsonArray(PENDING_PATH, pending);
        })().catch(() => {});
      }
    }

    markStats();
    res.status(200).json({ status: "ok" });
  });

  // Estadísticas agregadas para el panel de administración.
  app.get("/api/admin/stats", adminAuth, (_req, res) => {
    const topCompanies = Object.entries(stats.companies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([name, count]) => ({ name, count }));
    const recentDays = Object.entries(stats.daily)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30)
      .map(([date, v]) => ({ date, ...v }));
    res.json({
      totals: stats.totals,
      actions: stats.actions,
      topCompanies,
      recentDays,
      startedAt: stats.startedAt,
      updatedAt: stats.updatedAt,
    });
  });

  // API route to search for DPO emails
  const SERVER_COMPANY_EMAIL_MAP: Record<string, string[]> = {
    "Vodafone": ["derechosprotecciondatos@vodafone.es"],
    "Lowi": ["peticiones@lowi.es"],
    "Jazztel": ["orangeproteccion.datos@orange.com"],
    "Securitas Direct": ["dpo@securitasdirect.es"],
    "Linea Directa": ["dpo@lineadirectaaseguradora.com"],
    "Iberdrola": ["protecciondatos.comercial@iberdrola.es"],
    "Orange": ["orangeproteccion.datos@orange.com"],
    "Movistar": ["DPO_telefonicasa@telefonica.com"],
    "Endesa": ["dpo@endesa.es"],
    "Naturgy": ["dpo@naturgy.com"],
    "Cofidis": ["dpocofidis@cofidis.es"],
    "Wizink": ["mb.esp.protecciondedatos@wizink.es"],
  };

  // Caché de rastreos para no repetir peticiones salientes caras por la misma
  // empresa (reduce coste y mitiga abuso por amplificación).
  const crawlCache = new Map<string, { emails: string[]; at: number }>();
  const CRAWL_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas
  // Tope de rastreos simultáneos: protege al servidor de quedarse sin recursos
  // si llegan muchas búsquedas nuevas a la vez.
  let activeCrawls = 0;
  const MAX_CONCURRENT_CRAWLS = 4;

  app.post("/api/dpo-email", crawlLimiter, async (req, res) => {
    const companyName = typeof req.body?.companyName === "string" ? req.body.companyName.trim() : "";
    try {
      if (!companyName) {
        return res.status(400).json({ error: "Company name is required." });
      }
      if (companyName.length > 120) {
        return res.status(400).json({ error: "Nombre de empresa demasiado largo." });
      }

      const key = normalizeName(companyName);
      const result = new Set<string>();

      // 1. Check hardcoded server map
      for (const [name, emails] of Object.entries(SERVER_COMPANY_EMAIL_MAP)) {
        if (normalizeName(name) === key) {
          for (const e of emails) if (isValidEmail(e)) result.add(e.toLowerCase());
        }
      }

      // 2. Check approved directory (fast, local file)
      const approved = await readJsonArray(APPROVED_PATH);
      for (const item of approved) {
        if (item && normalizeName(item.name) === key && Array.isArray(item.emails)) {
          for (const e of item.emails) if (isValidEmail(e)) result.add(String(e).toLowerCase());
        }
      }

      // 3. If we already have emails, return immediately (no slow crawling needed)
      if (result.size > 0) {
        return res.json({ emails: Array.from(result) });
      }

      // 4. Resultado de rastreo cacheado, si está vigente.
      const cached = crawlCache.get(key);
      if (cached && Date.now() - cached.at < CRAWL_TTL_MS) {
        return res.json({ emails: cached.emails });
      }

      // 5. Solo rastreamos si hay capacidad; si no, pedimos reintento.
      if (activeCrawls >= MAX_CONCURRENT_CRAWLS) {
        return res.status(503).json({
          error: "El buscador está ocupado en este momento. Inténtelo de nuevo en unos segundos o introduzca el correo manualmente.",
        });
      }

      stats.totals.emailSearches += 1;
      markStats();

      activeCrawls += 1;
      let crawled: string[];
      try {
        crawled = await googleSearchEmails(companyName);
      } finally {
        activeCrawls -= 1;
      }
      for (const e of crawled) if (isValidEmail(e)) result.add(e.toLowerCase());

      const emails = Array.from(result);
      crawlCache.set(key, { emails, at: Date.now() });
      if (crawlCache.size > 5000) crawlCache.clear();

      res.json({ emails });
    } catch (error: any) {
      const errorString = error?.toString() || JSON.stringify(error) || "";
      const isRateLimit = error?.status === 429 || errorString.includes("429") || errorString.includes("Too Many Requests");

      if (isRateLimit) {
        console.warn(`[API Límite Excedido] No se pudo buscar emails para "${companyName}" por límite de la API de búsqueda.`);
        return res.status(429).json({ error: "El servicio de búsqueda ha excedido el límite temporal. Por favor, introduzca el correo manualmente." });
      }

      console.error("Error fetching DPO email:", error);
      res.status(500).json({ error: "Ocurrió un error al buscar los correos. Inténtelo más tarde o añádalos manualmente." });
    }
  });

  // Admin endpoints to review and approve suggestions
  app.get("/api/admin/pending", adminAuth, async (req, res) => {
    const pending = await readJsonArray(PENDING_PATH);
    res.json({ pending });
  });

  app.post("/api/admin/approve", adminAuth, async (req, res) => {
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : req.body?.id ? [req.body.id] : [];
    if (ids.length === 0) return res.status(400).json({ error: "No ids provided" });

    const pending = await readJsonArray(PENDING_PATH);
    const approved = await readJsonArray(APPROVED_PATH);

    const move: any[] = [];
    const remain = pending.filter((it) => {
      if (ids.includes(it?.id)) {
        move.push(it);
        return false;
      }
      return true;
    });

    // Merge into approved, dedupe by name+email
    const byKey = new Map<string, Set<string>>();
    for (const a of approved) {
      const nm = a?.name;
      const key = normalizeName(String(nm || ""));
      if (!byKey.has(key)) byKey.set(key, new Set<string>());
      for (const e of Array.isArray(a?.emails) ? a.emails : []) byKey.get(key)!.add(String(e).toLowerCase());
    }

    for (const m of move) {
      const key = normalizeName(String(m?.name || ""));
      if (!byKey.has(key)) byKey.set(key, new Set<string>());
      for (const e of Array.isArray(m?.emails) ? m.emails : []) byKey.get(key)!.add(String(e).toLowerCase());
    }

    const mergedApproved = Array.from(byKey.entries()).map(([k, set]) => ({
      name: k,
      emails: Array.from(set),
    }));

    await writeJsonArray(PENDING_PATH, remain);
    await writeJsonArray(APPROVED_PATH, mergedApproved);

    await appendAudit("approve", {
      ids,
      admin: (req.headers["x-admin-user"] as string) || "admin",
      countMoved: move.length,
    });

    res.json({ approved: mergedApproved });
  });

  app.post("/api/admin/reject", adminAuth, async (req, res) => {
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : req.body?.id ? [req.body.id] : [];
    if (ids.length === 0) return res.status(400).json({ error: "No ids provided" });
    const pending = await readJsonArray(PENDING_PATH);
    const remain = pending.filter((it) => !ids.includes(it?.id));
    await writeJsonArray(PENDING_PATH, remain);
    res.json({ pending: remain });
  });

  // Public endpoint to expose approved directory
  app.get("/api/approved", async (req, res) => {
    const approved = await readJsonArray(APPROVED_PATH);
    res.json({ approved });
  });

  // Minimal admin UI page
  app.get("/admin", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Panel de Revisión</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0f172a}
    .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:12px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    button{background:#1675bb;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer}
    button.secondary{background:#f3f4f6;color:#111827}
    input,textarea{border:1px solid #e2e8f0;border-radius:8px;padding:8px}
    code{background:#f8fafc;padding:2px 6px;border-radius:6px}
    .badge{display:inline-block;background:#edf7fd;color:#155f99;border:1px solid #a8d9f6;border-radius:9999px;padding:2px 8px;font-size:12px;margin-right:6px}
    h1{color:#163f63}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
    .metric{background:#edf7fd;border:1px solid #a8d9f6;border-radius:12px;padding:14px}
    .metric .num{font-size:26px;font-weight:700;color:#1675bb}
    .metric .lbl{font-size:12px;color:#475569;margin-top:2px}
    .barrow{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:13px}
    .bar{height:8px;border-radius:9999px;background:#1675bb;min-width:4px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td,th{text-align:left;padding:4px 6px;border-bottom:1px solid #f1f5f9}
  </style>
  </head>
  <body>
    <h1>Panel de Administración Unlink</h1>
    <div class="card">
      <div class="row">
        <label>Token admin:</label>
        <input id="token" type="password" placeholder="ADMIN_TOKEN" />
        <button id="load">Cargar pendientes</button>
        <button id="loadStats" class="secondary">Ver estadísticas</button>
      </div>
    </div>

    <div id="stats"></div>
    <div id="list"></div>

    <script>
    const elStats = document.getElementById('stats');
    const fmt = function(n){ return (n||0).toLocaleString('es-ES'); };
    function metric(num, lbl){ return '<div class="metric"><div class="num">' + fmt(num) + '</div><div class="lbl">' + lbl + '</div></div>'; }
    document.getElementById('loadStats').onclick = async () => {
      const token = document.getElementById('token').value.trim();
      if (!token) return alert('Introduzca el token');
      const r = await fetch('/api/admin/stats', { headers: { 'x-admin-token': token } });
      if (!r.ok) return alert('Error al cargar estadísticas');
      const s = await r.json();
      const top = Array.isArray(s.topCompanies) ? s.topCompanies : [];
      const maxC = top.reduce(function(m,c){ return Math.max(m, c.count); }, 1);
      const days = Array.isArray(s.recentDays) ? s.recentDays : [];
      elStats.innerHTML =
        '<div class="card">' +
          '<h2 style="margin-top:0">Estadísticas de uso</h2>' +
          '<div class="grid">' +
            metric(s.totals && s.totals.pageViews, 'Visitas') +
            metric(s.totals && s.totals.generations, 'Solicitudes generadas') +
            metric(s.totals && s.totals.emailSearches, 'Búsquedas de email') +
            metric(s.actions && s.actions.delete, 'Supresiones') +
            metric(s.actions && s.actions.modify, 'Rectificaciones') +
          '</div>' +
          '<h3>Empresas más solicitadas</h3>' +
          (top.length ? top.map(function(c){
            var w = Math.round((c.count / maxC) * 220) + 4;
            return '<div class="barrow"><span style="width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + c.name + '</span>' +
                   '<span class="bar" style="width:' + w + 'px"></span><strong>' + c.count + '</strong></div>';
          }).join('') : '<p style="color:#64748b">Sin datos todavía.</p>') +
          '<h3>Actividad reciente</h3>' +
          (days.length ? '<table><tr><th>Día</th><th>Visitas</th><th>Solicitudes</th></tr>' +
            days.map(function(d){ return '<tr><td>' + d.date + '</td><td>' + fmt(d.views) + '</td><td>' + fmt(d.generations) + '</td></tr>'; }).join('') + '</table>'
            : '<p style="color:#64748b">Sin actividad registrada.</p>') +
          '<p style="font-size:12px;color:#94a3b8;margin-bottom:0">Actualizado: ' + (s.updatedAt || '-') + '</p>' +
        '</div>';
    };

    const elList = document.getElementById('list');
    document.getElementById('load').onclick = async () => {
      const token = document.getElementById('token').value.trim();
      if (!token) return alert('Introduzca el token');
      const r = await fetch('/api/admin/pending', { headers: { 'x-admin-token': token } });
      if (!r.ok) return alert('Error al cargar');
      const data = await r.json();
      const items = Array.isArray(data.pending) ? data.pending : [];
      elList.innerHTML = '';
      if (items.length === 0) {
        elList.innerHTML = '<div class="card">No hay elementos pendientes.</div>';
        return;
      }
      for (const it of items) {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML =
          '<div class="row" style="justify-content:space-between">' +
            '<div>' +
              '<div><strong>Empresa:</strong> <code>' + ((it.name||'').toString()) + '</code></div>' +
              '<div><strong>Emails:</strong> ' + ((Array.isArray(it.emails)?it.emails:[]).map(function(e){return '<span class="badge">' + e + '</span>';}).join(' ')) + '</div>' +
              '<div style="font-size:12px;color:#475569"><strong>Fuente:</strong> ' + (it.source||'n/a') + ' &middot; <strong>Creado:</strong> ' + (it.createdAt||'') + '</div>' +
            '</div>' +
            '<div class="row">' +
              '<button class="secondary" data-act="reject" data-id="' + it.id + '">Rechazar</button>' +
              '<button data-act="approve" data-id="' + it.id + '">Aprobar</button>' +
            '</div>' +
          '</div>';
        elList.appendChild(div);
      }
      elList.onclick = async (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const act = btn.getAttribute('data-act');
        const token = document.getElementById('token').value.trim();
        if (!id) return;
        const url = act === 'approve' ? '/api/admin/approve' : '/api/admin/reject';
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ id })
        });
        if (!r.ok) return alert('Operación fallida');
        alert('Hecho');
        document.getElementById('load').click();
      };
    };
    </script>
  </body>
</html>`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
