import { motion } from "motion/react";
import { X } from "lucide-react";

interface PrivacyModalProps {
  onClose: () => void;
}

export default function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-xl w-full max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-100 p-6 md:p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Aviso Legal y Transparencia
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full p-2"
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
              Esta herramienta ha sido desarrollada con un enfoque de "Privacidad
              por Diseño". Todos los datos personales introducidos (nombre, DNI,
              detalles de la solicitud) se procesan exclusivamente en tu navegador
              (lado del cliente) para generar la plantilla de correo. Esta
              información no se recopila, no se almacena ni se transmite a ninguna
              base de datos o servidor externo.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              2. Recopilación de datos corporativos y analíticas
            </h3>
            <p>
              Con el objetivo de mejorar la herramienta, registramos de forma
              estrictamente anónima qué empresas son seleccionadas. Si introduces
              manualmente los datos de contacto de una nueva entidad (nombre y
              correo corporativo), estos podrán ser revisados y almacenados en
              nuestro directorio público. En ningún caso se vinculan estas acciones
              a direcciones IP u otros identificadores personales.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              3. Exención de responsabilidad
            </h3>
            <p>
              Esta aplicación es un proyecto de código abierto sin ánimo de lucro
              diseñado para facilitar el ejercicio de los derechos de protección de
              datos. El uso de la herramienta no constituye asesoramiento jurídico.
              El creador no asume responsabilidad sobre la respuesta de las empresas
              destinatarias, los plazos de resolución, ni posibles incompatibilidades
              técnicas con gestores de correo de terceros.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-1">
              4. Código Abierto
            </h3>
            <p>
              Puedes auditar el código fuente de este proyecto y comprobar el
              manejo de la información en el repositorio oficial de GitHub{" "}
              <a
                href="https://github.com/elianurl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                elianurl
              </a>
              .<br />
              Creado por Elian De Valois.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
