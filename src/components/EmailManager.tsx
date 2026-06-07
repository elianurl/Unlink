import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";

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

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const addEmail = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && isValidEmail(trimmed) && !emails.includes(trimmed)) {
      onChangeEmails([...emails, trimmed]);
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
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-4">
      <div className="text-sm font-medium text-slate-700 mb-3 leading-relaxed">
        Revise el email proporcionado de que corresponda y esté disponible. Si
        verifica uno nuevo, añádalo eliminando el existente.
      </div>

      {isSearching && emails.length === 0 ? (
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" /> Buscando por internet...
        </div>
      ) : emails.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {emails.map((em) => (
            <span
              key={em}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm border border-indigo-100"
            >
              <Mail size={14} />
              {em}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(em)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                comprobar
              </a>
              <button
                onClick={() => removeEmail(em)}
                className="ml-1 text-indigo-400 hover:text-red-500 transition-colors"
                title="Eliminar email"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md p-3 flex items-start justify-between gap-3">
            <span>
              No se han podido encontrar resultados automáticos para{" "}
              {companyName}. Puede usar la búsqueda en Google y copiar el correo
              correspondiente.
            </span>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${companyName} "protección de datos"`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 bg-white hover:bg-orange-100 text-orange-800 font-medium px-3 py-1.5 rounded-md transition-colors border border-orange-300"
            >
              Comprobar en Google
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="email"
          placeholder="Añadir un correo manualmente..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (addEmail(inputValue)) setInputValue("");
            }
          }}
          className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
        <button
          type="button"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-slate-200"
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
