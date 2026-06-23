// Validación y extracción de correos compartida entre el cliente (Vite) y el
// servidor (Express). Mantener una única fuente evita que la comprobación de
// emails diverja entre frontend y backend.

// Caracteres permitidos en la parte local según RFC 5321 (formato práctico,
// sin comentarios ni comillas, que no se usan en correos corporativos reales).
const LOCAL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
// Cada etiqueta del dominio: letras/números, guiones internos, 1-63 chars.
const LABEL_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

// Patrón para localizar correos dentro de texto HTML arbitrario.
const EXTRACT_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
// Extensiones de recursos que generan falsos positivos (sprite@2x.png, etc.).
const ASSET_EXT = /\.(png|jpe?g|gif|webp|svg|css|js|mjs|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|pdf|json|xml)$/i;

/**
 * Comprueba si una cadena es una dirección de correo válida y plausible.
 * Más estricta que un simple `algo@algo.algo`: valida longitudes, etiquetas de
 * dominio, TLD alfabético y descarta puntos consecutivos o mal colocados.
 */
export function isValidEmail(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const email = input.trim();
  if (email.length < 6 || email.length > 254) return false;

  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (local.length > 64) return false;
  if (!LOCAL_RE.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;

  if (domain.length > 253) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  const tld = labels[labels.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) return false;

  return labels.every((label) => LABEL_RE.test(label));
}

/**
 * Normaliza un correo: recorta espacios y pasa a minúsculas.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Extrae correos válidos de un bloque de texto/HTML, descartando recursos
 * estáticos (imágenes, scripts) y deduplicando en minúsculas.
 */
export function extractEmailsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(EXTRACT_RE) || [];
  const out = new Set<string>();
  for (const raw of matches) {
    // Limpia puntuación de cierre pegada al correo (p. ej. "dpo@x.es.").
    const cleaned = normalizeEmail(raw.replace(/[.,;:)\]}>'"]+$/, ""));
    if (ASSET_EXT.test(cleaned)) continue;
    if (isValidEmail(cleaned)) out.add(cleaned);
  }
  return Array.from(out);
}
