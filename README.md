<div align="center">
  <img src="./public/logo.png" alt="Unlink Logo" width="500" />
  <h1>Unlink</h1>
  <p><strong>Ejercicio de Derechos de Protección de Datos</strong></p>

  <a href="https://unlink-data.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🔗_Abrir_App-unlink--data.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white" alt="Live App" />
  </a>

  <br /><br />

  <a href="https://github.com/elianurl/Unlink/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/Licencia-MIT-22c55e?style=flat-square" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/Tech-React_19_%2B_Vite_%2B_Node-3b82f6?style=flat-square" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/Privacidad-100%25_Local-a855f7?style=flat-square" alt="100% Private" />
  <img src="https://img.shields.io/badge/Datos-CC_BY_4.0-f97316?style=flat-square" alt="Open Data" />
</div>

---

<div align="center">

🔗 **[unlink-data.vercel.app](https://unlink-data.vercel.app)**

_Genera solicitudes legales de rectificación o supresión de datos personales en segundos._

</div>

---

## Qué es Unlink

Unlink es una herramienta de código abierto para ejercer tus **derechos ARCO** (Acceso, Rectificación, Cancelación y Oposición) ante cualquier entidad española.

**Sin registros. Sin datos enviados a servidores. Sin inteligencia artificial.** Todo el procesamiento ocurre en tu navegador. Solo tú y tu derecho a la protección de datos.

---

## Principios

- **Privacidad por diseño** — Tus datos personales nunca salen de tu dispositivo.
- **Transparencia total** — Código 100% auditable. Sin dependencias opacas.
- **Derechos reales** — No es una herramienta técnica. Es un activador ciudadano.

---

## Características

| Característica | Descripción |
|---------------|-------------|
| **Plantillas legales** | Correos conformes al RGPD y LOPDGDD, listos para enviar. |
| **Búsqueda DPO** | Rastreo ético de emails de protección de datos, respetando `robots.txt`. |
| **Directorio colaborativo** | Emails aportados por la comunidad, moderados antes de publicarse. |
| **Sin IA** | Sin modelos de lenguaje, sin tokens de API, sin costes ocultos. |
| **Panel de moderación** | Revisa y aprueba sugerencias con un token seguro. |

---

## Stack

**Frontend:** React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Lucide React

**Backend:** Node.js · Express · TypeScript · Heurística propia (sin APIs de terceros)

---

## Arquitectura

```
Frontend (React + Vite)
    |
    +-- /api/dpo-email      → Búsqueda de emails DPO
    +-- /api/approved       → Directorio público
    +-- /api/empresas/stats → Estadísticas anónimas
    +-- /admin              → Panel de moderación

Backend (Express)
    |
    +-- data/pending.json   → Sugerencias en revisión
    +-- data/approved.json  → Directorio aprobado
    +-- data/audit.log      → Auditoría de moderación
```

---

## Local

**Requisito:** Node.js 20+

```bash
npm install

# Crea un .env con ADMIN_TOKEN
echo "ADMIN_TOKEN=tu_token_seguro" > .env

npm run dev
```

App en **http://localhost:3000** · Panel en **http://localhost:3000/admin**

---

## Producción

**Frontend (Vercel):**
- Framework: `Other`
- Build: `vite build`
- Output: `dist`
- Env: `VITE_API_BASE` → URL del backend

**Backend (Render / Railway):**
- Start: `node dist/server.cjs`
- Env: `ADMIN_TOKEN`, `APP_URL`
- **Importante:** Requiere persistencia de disco para `data/`.

---

## Moderación

1. Accede a `/admin`.
2. Introduce tu `ADMIN_TOKEN`.
3. Revisa, aprueba o rechaza sugerencias.

---

## Contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md). Toda aportación pasa por revisión manual.

---

## Licencias

- **Código:** MIT ([LICENSE](./LICENSE))
- **Datos:** CC BY 4.0 ([DATA_LICENSE.md](./DATA_LICENSE.md))

---

<div align="center">

Desarrollada con compromiso por **[Elian De Valois](https://github.com/elianurl)**

> "La tecnología debe servir a los derechos de las personas, no al revés."

</div>
