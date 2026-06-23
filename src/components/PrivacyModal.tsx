import { motion } from "motion/react";
import { X } from "lucide-react";

interface PrivacyModalProps {
  onClose: () => void;
}

export default function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
        className="bg-white w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-8"
      >
        {/* Pill handle solo en móvil */}
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 pr-4">
            Aviso Legal y Transparencia
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              1. Privacidad de tus datos personales
            </h3>
            <p>
              Esta herramienta ha sido desarrollada con un enfoque de "Privacidad por Diseño". Todos los datos personales introducidos (nombre, DNI, detalles de la solicitud) se procesan exclusivamente en tu navegador para generar la plantilla de correo. Esta información no se recopila, no se almacena ni se transmite a ningún servidor externo.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              2. Recopilación de datos corporativos y analíticas
            </h3>
            <p>
              Con el objetivo de mejorar la herramienta, registramos de forma estrictamente anónima qué empresas son seleccionadas. Si introduces manualmente los datos de contacto de una nueva entidad (nombre y correo corporativo), estos podrán ser revisados y almacenados en nuestro directorio público. En ningún caso se vinculan estas acciones a IPs u otros identificadores personales.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              3. Exención de responsabilidad
            </h3>
            <p>
              Esta aplicación es un proyecto de código abierto sin ánimo de lucro. El uso de la herramienta no constituye asesoramiento jurídico. El creador no asume responsabilidad sobre la respuesta de las empresas destinatarias ni los plazos de resolución.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              4. Código Abierto
            </h3>
            <p>
              Puedes auditar el código fuente en el repositorio oficial de GitHub{" "}
              <a
                href="https://github.com/elianurl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                elianurl
              </a>
              . Creado por Elian De Valois.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 active:scale-[0.97] text-white font-medium py-3 px-8 rounded-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
