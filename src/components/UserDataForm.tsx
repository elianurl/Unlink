import { isValidDniNie } from "../utils/validators";

interface UserDataFormProps {
  fullName: string;
  dni: string;
  contactEmail: string;
  phoneNumber: string;
  onChange: (field: "fullName" | "dni" | "contactEmail" | "phoneNumber", value: string) => void;
}

export default function UserDataForm({
  fullName,
  dni,
  contactEmail,
  phoneNumber,
  onChange,
}: UserDataFormProps) {
  const dniValid = dni ? isValidDniNie(dni) : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Paso 3: Sus datos</h2>
      <p className="text-sm text-slate-500">
        Observación: Los datos introducidos aquí son sus datos{" "}
        <span className="font-semibold text-slate-700">actuales/antiguos</span>{" "}
        que la entidad tiene registrados para poder identificarle de manera
        inequívoca en su sistema.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nombre y Apellido
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              DNI/NIE
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => onChange("dni", e.target.value.toUpperCase())}
              className={`w-full bg-slate-50 border text-slate-900 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ${
                dniValid === false
                  ? "border-red-300 focus:border-red-400"
                  : dniValid === true
                  ? "border-green-300 focus:border-green-400"
                  : "border-slate-200 focus:border-indigo-500"
              }`}
            />
            {dniValid === false && (
              <p className="text-xs text-red-600 mt-1">Formato de DNI/NIE inválido</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Teléfono
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => onChange("phoneNumber", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => onChange("contactEmail", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
