import { ShieldAlert, FileText, Info } from "lucide-react";
import type { FormData } from "../types";

interface ActionSelectorProps {
  actionType: "modify" | "delete";
  modifyField: FormData["modifyField"];
  modifyNewValue: string;
  onChangeAction: (action: "modify" | "delete") => void;
  onChangeModifyField: (field: FormData["modifyField"]) => void;
  onChangeModifyValue: (value: string) => void;
}

const MODIFY_FIELDS = [
  "Nombre completo",
  "DNI/NIE",
  "Email",
  "Teléfono",
  "Dirección",
];

export default function ActionSelector({
  actionType,
  modifyField,
  modifyNewValue,
  onChangeAction,
  onChangeModifyField,
  onChangeModifyValue,
}: ActionSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Paso 2: Acción deseada</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChangeAction("delete")}
          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all min-h-[4.5rem] active:scale-[0.97] ${
            actionType === "delete"
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500 ring-offset-1"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert size={20} className="shrink-0" />
          <span className="text-center leading-tight">Eliminar mis datos</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeAction("modify")}
          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all min-h-[4.5rem] active:scale-[0.97] ${
            actionType === "modify"
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500 ring-offset-1"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText size={20} className="shrink-0" />
          <span className="text-center leading-tight">Modificar mis datos</span>
        </button>
      </div>

      {actionType === "modify" && (
        <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Dato a modificar
            </label>
            <select
              value={modifyField}
              onChange={(e) => onChangeModifyField(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              style={{ fontSize: "16px" }}
            >
              {MODIFY_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Dato corregido
            </label>
            <input
              type="text"
              value={modifyNewValue}
              onChange={(e) => onChangeModifyValue(e.target.value)}
              placeholder="Introduzca el dato correcto"
              autoComplete="off"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-base placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              style={{ fontSize: "16px" }}
            />
          </div>

          {modifyField === "DNI/NIE" && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex gap-2 items-start">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>
                Recuerde adjuntar copia por ambas caras del documento antiguo y nuevo al enviar el correo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
