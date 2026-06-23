import { useState } from "react";
import { Loader2, Mail, X, ExternalLink } from "lucide-react";
import { isValidEmail, normalizeEmail } from "../utils/email";

interface EmailManagerProps {
  companyName: string;
  emails: string[];
  onChangeEmails: (emails: string[]) => void;
  isSearching: boolean;
  onClearError: () => void;
}

export default function EmailManager({
  companyName,
  emails,
  onChangeEmails,
  isSearching,
  onClearError,
}: EmailManagerProps) {
  const [inputValue, setInputValue] = useState("");

  const addEmail = (val: string) => {
    const normalized = normalizeEmail(val);
    if (normalized && isValidEmail(normalized) && !emails.includes(normalized)) {
      onChangeEmails([...emails, normalized]);
      onClearError();
      return true;
    }
    return false;
  };

  const removeEmail = (email: string) => {
    onChangeEmails(emails.filter((e) => e !== email));
  };

  if (!companyName) return null;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
      <p className="text-sm font-medium text-slate-700 mb-3 leading-relaxed">
        Verifique que el email es correcto y corresponde a la entidad.{" "}
        <span className="font-normal text-slate-500">Si conoce uno más actualizado, añádalo y elimine el anterior.</span>
      </p>

      {isSearching && emails.length === 0 ? (
        <div className="text-sm text-slate-500 flex items-center gap-2 py-2">
          <Loader2 className="animate-spin h-4 w-4 shrink-0" />
          Buscando email oficial en internet…
        </div>
      ) : emails.length > 0 ? (
        <div className="flex flex-col gap-2 mb-3">
          {emails.map((em) => (
            <div
              key={em}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-indigo-100 shadow-sm"
            >
              <Mail size={15} className="text-indigo-500 shrink-0" />
              <span className="text-sm text-slate-800 font-medium flex-1 min-w-0 truncate">
                {em}
              </span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(em)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-indigo-500 hover:text-indigo-700 transition-colors p-1"
                title="Verificar en Google"
                aria-label={`Verificar ${em} en Google`}
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => removeEmail(em)}
                className="shrink-0 text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Eliminar email"
                aria-label={`Eliminar ${em}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-3">
            <span className="leading-relaxed">
              No encontramos email oficial para <strong>{companyName}</strong>. Búscalo en Google y añádelo abajo.
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${companyName} "protección de datos"`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-orange-100 text-orange-800 font-medium px-3 py-2 rounded-lg transition-colors border border-orange-300 text-sm"
            >
              <ExternalLink size={14} />
              Buscar en Google
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <input
          type="email"
          placeholder="correo@empresa.es"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          inputMode="email"
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (addEmail(inputValue)) setInputValue("");
            }
          }}
          className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          style={{ fontSize: "16px" }}
        />
        <button
          type="button"
          className="shrink-0 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-colors border border-slate-200 text-sm"
          onClick={() => {
            if (addEmail(inputValue)) setInputValue("");
          }}
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
