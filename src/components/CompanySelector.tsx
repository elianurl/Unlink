import { Loader2, Info } from "lucide-react";

interface CompanySelectorProps {
  company: string;
  customCompany: string;
  options: string[];
  onChangeCompany: (val: string) => void;
  onChangeCustomCompany: (val: string) => void;
  onBlurCustom: () => void;
  onEnterCustom: () => void;
  isSearching: boolean;
}

export default function CompanySelector({
  company,
  customCompany,
  options,
  onChangeCompany,
  onChangeCustomCompany,
  onBlurCustom,
  onEnterCustom,
  isSearching,
}: CompanySelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
        Paso 1: Entidad de destino
      </h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Seleccionar Empresa
        </label>
        {/* font-size >= 16px en todos los select para evitar el auto-zoom de iOS Safari */}
        <select
          value={company}
          onChange={(e) => onChangeCompany(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
          style={{ fontSize: "16px" }}
        >
          <option value="" disabled>
            Seleccione una empresa
          </option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {company === "Otro (especificar)" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-medium text-slate-700">
            Nombre de la Empresa
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej. Sanitas"
              value={customCompany}
              onChange={(e) => onChangeCustomCompany(e.target.value)}
              onBlur={onBlurCustom}
              onKeyDown={(e) => e.key === "Enter" && onEnterCustom()}
              autoComplete="organization"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              style={{ fontSize: "16px" }}
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-slate-400" size={18} />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-start gap-1.5">
            <Info size={14} className="shrink-0 mt-0.5" />
            Al salir del campo buscaremos los emails de protección de datos en internet.
          </p>
        </div>
      )}
    </div>
  );
}
