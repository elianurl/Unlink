import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { promises as fs } from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const extractEmailsFromText = (text: string): string[] => {
  const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const matches = text.match(re) || [];
  return matches.filter(isValidEmail);
};

const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const dataDir = path.join(process.cwd(), "data");
const PENDING_PATH = path.join(dataDir, "pending.json");
const APPROVED_PATH = path.join(dataDir, "approved.json");
const AUDIT_PATH = path.join(dataDir, "audit.log");

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
  } catch {}
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
  const domainCandidates = Array.from(new Set([...mapped, ...guessed])).filter(Boolean);

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

  app.use(express.json());

  const companyStats = new Map<string, number>();
  const newCompanyEntries: Array<{ name: string; emails: string[] }> = [];

  // Admin auth middleware
  const adminAuth: express.RequestHandler = (req, res, next) => {
    const token = (req.headers["x-admin-token"] as string) || (req.query?.token as string) || "";
    const expected = process.env.ADMIN_TOKEN || "";
    if (expected && token === expected) return next();
    return res.status(401).json({ error: "Unauthorized" });
  };

  // Very simple rate limiter for stats endpoint (per IP)
  const rlWindowMs = 10 * 60 * 1000; // 10 minutes
  const rlMax = 30; // max requests per window
  const rlStore = new Map<string, number[]>();
  const statsRateLimit: express.RequestHandler = (req, res, next) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      const now = Date.now();
      const arr = rlStore.get(ip) || [];
      const recent = arr.filter((t) => now - t < rlWindowMs);
      if (recent.length >= rlMax) {
        return res.status(429).json({ error: "Demasiadas solicitudes. Inténtelo más tarde." });
      }
      recent.push(now);
      rlStore.set(ip, recent);
    } catch {}
    next();
  };

  app.post("/api/empresas/stats", statsRateLimit, (req, res) => {
    const { company, customCompany, newEmails } = req.body;
    const suggestedEmails = Array.isArray(req.body?.suggestedEmails)
      ? req.body.suggestedEmails.filter(isValidEmail)
      : [];

    if (company === "Otro (especificar)" && customCompany) {
      const validEmails = Array.isArray(newEmails) ? newEmails.filter(isValidEmail) : [];
      if (validEmails.length > 0) {
        newCompanyEntries.push({ name: customCompany, emails: validEmails });
        console.log(`[Stats] New manual company added: ${customCompany} with emails:`, validEmails);
        (async () => {
          const pending = await readJsonArray(PENDING_PATH);
          pending.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: customCompany,
            emails: validEmails,
            createdAt: new Date().toISOString(),
            source: "manual",
          });
          await writeJsonArray(PENDING_PATH, pending);
        })().catch(() => {});
      }
    } else if (company) {
      const count = companyStats.get(company) || 0;
      companyStats.set(company, count + 1);
      console.log(`[Stats] Company selected: ${company} (Total selections: ${count + 1})`);

      if (suggestedEmails.length > 0) {
        (async () => {
          const pending = await readJsonArray(PENDING_PATH);
          pending.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: company,
            emails: suggestedEmails,
            createdAt: new Date().toISOString(),
            source: "suggestion",
          });
          await writeJsonArray(PENDING_PATH, pending);
        })().catch(() => {});
      }
    }

    res.status(200).json({ status: "ok" });
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

  app.post("/api/dpo-email", async (req, res) => {
    const { companyName } = req.body;
    try {
      if (!companyName) {
        return res.status(400).json({ error: "Company name is required." });
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

      // 4. Only crawl if we have nothing yet
      const crawled = await googleSearchEmails(companyName);
      for (const e of crawled) if (isValidEmail(e)) result.add(e.toLowerCase());

      res.json({ emails: Array.from(result) });
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
    button{background:#111827;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer}
    button.secondary{background:#f3f4f6;color:#111827}
    input,textarea{border:1px solid #e2e8f0;border-radius:8px;padding:8px}
    code{background:#f8fafc;padding:2px 6px;border-radius:6px}
    .badge{display:inline-block;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:9999px;padding:2px 8px;font-size:12px;margin-right:6px}
  </style>
  </head>
  <body>
    <h1>Panel de Revisión de Sugerencias</h1>
    <div class="card">
      <div class="row">
        <label>Token admin:</label>
        <input id="token" type="password" placeholder="ADMIN_TOKEN" />
        <button id="load">Cargar pendientes</button>
      </div>
    </div>

    <div id="list"></div>

    <script>
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
