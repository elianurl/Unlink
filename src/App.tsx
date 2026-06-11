import React, { useState, useEffect } from "react";
import { FormData, COMMON_COMPANIES } from "./types";
import { ShieldAlert, Info, Mail } from "lucide-react";
import { motion } from "motion/react";
import CompanySelector from "./components/CompanySelector";
import EmailManager from "./components/EmailManager";
import ActionSelector from "./components/ActionSelector";
import UserDataForm from "./components/UserDataForm";
import Footer from "./components/Footer";
import PrivacyModal from "./components/PrivacyModal";
import ShareModal from "./components/ShareModal";
import ShareFab from "./components/ShareFab";
import { isValidDniNie } from "./utils/validators";

const SHARE_PROMPT_SEEN_KEY = "unlink-share-prompted";

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    company: "",
    customCompany: "",
    actionType: "delete",
    modifyField: "",
    modifyNewValue: "",
    fullName: "",
    dni: "",
    contactEmail: "",
    phoneNumber: "",
  });

  const [isSearching, setIsSearching] = useState(false);
  const [foundEmails, setFoundEmails] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCelebration, setShareCelebration] = useState(false);
  const [approvedCompanies, setApprovedCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/approved")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.approved)) {
          const names = data.approved.map((a: any) => a.name).filter(Boolean);
          setApprovedCompanies(names);
        }
      })
      .catch(() => {});
  }, []);

  const companyEmailMap: Record<string, string[]> = {
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

  const fetchEmails = async (name: string) => {
    if (!name.trim()) return;
    setIsSearching(true);
    setErrorMsg("");
    const localEmails = companyEmailMap[name] || [];
    setFoundEmails(localEmails);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch("/api/dpo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let msg = "No se pudo contactar con el servidor. Inténtelo de nuevo.";
        try {
          const errData = await response.json();
          if (errData.error) msg = errData.error;
        } catch {}
        throw new Error(msg);
      }
      const data = await response.json();
      if (data.emails && data.emails.length > 0) {
        setFoundEmails(Array.from(new Set([...localEmails, ...data.emails])));
      } else if (localEmails.length === 0) {
        setErrorMsg("No se encontraron emails oficiales. Por favor, especifíquelos manualmente si los conoce.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        if (localEmails.length === 0) {
          setErrorMsg("La búsqueda tardó demasiado. No se encontraron resultados automáticos.");
        }
      } else if (localEmails.length === 0) {
        setErrorMsg(err.message || "Ocurrió un error al buscar.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (formData.company !== "Otro (especificar)") {
      fetchEmails(formData.company);
    } else {
      setFoundEmails([]);
      setErrorMsg("");
    }
  }, [formData.company]);

  const handleCustomCompanyBlur = () => {
    if (formData.company === "Otro (especificar)" && formData.customCompany) {
      fetchEmails(formData.customCompany);
    }
  };

  const currentCompanyName = formData.company === "Otro (especificar)" ? formData.customCompany : formData.company;

  const updateForm = (partial: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const generateEmailTemplate = () => {
    const isDelete = formData.actionType === "delete";
    const actionText = isDelete ? "Cancelación y Supresión" : "Rectificación";
    let content = "";
    if (isDelete) {
      content = "Solicito que procedan a la ELIMINACIÓN Y SUPRESIÓN completa de todos mis datos personales de sus bases de datos, listas de distribución, promociones comerciales (como llamadas, SMS o emails), así como la cesión de mis datos a terceros.";
    } else {
      content = `Solicito que procedan a la RECTIFICACIÓN de mis datos personales que obran en su poder para asegurar que sean exactos y estén al día. En concreto, solicito la modificación del dato: ${formData.modifyField}.\nEl nuevo dato correcto a registrar es: ${formData.modifyNewValue}.`;
      if (formData.modifyField === "DNI/NIE") {
        content += "\n\nSe adjunta a este correo copia del documento de identidad anterior y del nuevo documento por ambas caras para acreditar este cambio.";
      }
    }
    return `A la atención del Responsable de Protección de Datos de ${formData.company === "Otro (especificar)" ? formData.customCompany : formData.company},\n\nPor la presente, yo, ${formData.fullName.toUpperCase()}, con documento de identidad número ${formData.dni.toUpperCase()}, correo electrónico ${formData.contactEmail.toLowerCase()} y teléfono ${formData.phoneNumber}, me dirijo a ustedes para ejercer mi derecho de ${actionText.toLowerCase()} de datos personales, conforme a lo establecido en el Reglamento General de Protección de Datos (RGPD) y en la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).\n\n${content}\n\nRuego que la confirmación de este trámite se comunique al siguiente correo electrónico: ${formData.contactEmail.toLowerCase()}\n\nSi es necesario aportar alguna documentación adicional para procesar esta solicitud, les ruego me lo notifiquen a la mayor brevedad al correo indicado.\n\nAtentamente,\n${formData.fullName}`;
  };

  const handleGenerate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!formData.company) {
      setErrorMsg("Debe seleccionar una empresa.");
      return;
    }
    if (!formData.fullName || !formData.dni || !formData.contactEmail || !formData.phoneNumber) {
      setErrorMsg("Es necesario completar todos los campos obligatorios.");
      return;
    }
    if (formData.company === "Otro (especificar)" && !formData.customCompany) {
      setErrorMsg("Debe especificar el nombre de la empresa.");
      return;
    }
    if (foundEmails.length === 0) {
      setErrorMsg("No tenemos el email de destino. No se puede generar la solicitud.");
      return;
    }
    if (formData.dni && !isValidDniNie(formData.dni)) {
      setErrorMsg("El DNI/NIE introducido no es válido.");
      return;
    }
    if (formData.actionType === "modify" && !formData.modifyNewValue) {
      setErrorMsg("Debe especificar el nuevo valor correcto a modificar.");
      return;
    }

    setErrorMsg("");

    fetch("/api/empresas/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: formData.company,
        customCompany: formData.company === "Otro (especificar)" ? formData.customCompany : "",
        newEmails: formData.company === "Otro (especificar)" ? foundEmails : [],
        suggestedEmails: foundEmails,
      }),
    }).catch(() => {});

    const subject = encodeURIComponent(`Ejercicio de Derecho de ${formData.actionType === "delete" ? "Supresión" : "Rectificación"} de Datos - ${formData.fullName} - ${formData.dni}`);
    const body = encodeURIComponent(generateEmailTemplate());
    const to = encodeURIComponent(foundEmails.join(","));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    // Momento ideal para invitar a compartir: la app acaba de ayudar al usuario.
    // Solo se muestra automáticamente la primera vez para no resultar intrusivo.
    let alreadyPrompted = false;
    try {
      alreadyPrompted = !!localStorage.getItem(SHARE_PROMPT_SEEN_KEY);
      if (!alreadyPrompted) localStorage.setItem(SHARE_PROMPT_SEEN_KEY, "1");
    } catch {}
    if (!alreadyPrompted) {
      setTimeout(() => {
        setShareCelebration(true);
        setShowShareModal(true);
      }, 1800);
    }
  };

  const companyOptions = [
    ...Array.from(new Set([...COMMON_COMPANIES, ...approvedCompanies])).filter(
      (c) => c !== "Otro (especificar)"
    ),
    "Otro (especificar)",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-full mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Ejerce tu derecho a la Protección de Datos
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto text-lg leading-relaxed">
            Genera de forma rápida y sencilla una solicitud legal para ejercer tu derecho a la rectificación o supresión de tus datos ante cualquier entidad.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 overflow-hidden"
        >
          <div className="p-6 sm:p-8 space-y-8">
            <CompanySelector
              company={formData.company}
              customCompany={formData.customCompany}
              options={companyOptions}
              onChangeCompany={(val) => updateForm({ company: val })}
              onChangeCustomCompany={(val) => updateForm({ customCompany: val })}
              onBlurCustom={handleCustomCompanyBlur}
              onEnterCustom={() => {
                if (formData.customCompany) fetchEmails(formData.customCompany);
              }}
              isSearching={isSearching}
            />

            <EmailManager
              companyName={currentCompanyName}
              emails={foundEmails}
              onChangeEmails={setFoundEmails}
              isSearching={isSearching}
              onClearError={() => setErrorMsg("")}
            />

            <hr className="border-slate-100" />

            <ActionSelector
              actionType={formData.actionType}
              modifyField={formData.modifyField}
              modifyNewValue={formData.modifyNewValue}
              onChangeAction={(action) => updateForm({ actionType: action, modifyField: action === "modify" ? "Nombre completo" : "", modifyNewValue: "" })}
              onChangeModifyField={(field) => updateForm({ modifyField: field })}
              onChangeModifyValue={(value) => updateForm({ modifyNewValue: value })}
            />

            <hr className="border-slate-100" />

            <UserDataForm
              fullName={formData.fullName}
              dni={formData.dni}
              contactEmail={formData.contactEmail}
              phoneNumber={formData.phoneNumber}
              onChange={(field, value) => updateForm({ [field]: value })}
            />

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="pt-4 pb-2">
              <div className="bg-indigo-50/50 p-4 rounded-xl mb-6 flex items-start gap-3 border border-indigo-100">
                <Info className="text-indigo-600 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-indigo-900 leading-relaxed">
                  <strong className="block font-semibold mb-1">¿Cómo funciona?</strong>
                  Al hacer click en Generar y Solicitar, su app o proveedor de correo electrónico se abrirá automáticamente con un borrador de email completamente legal, pendiente de enviarse y adjuntando los datos correspondientes a la solicitud.
                  <br /><br />
                  Procure enviar el correo desde el mismo que introdujo anteriormente para mayor aceptación legal.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isSearching || !formData.fullName || !formData.dni || !formData.contactEmail}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-medium py-4 px-6 rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
              >
                <Mail size={20} />
                Generar y Solicitar
              </button>
              <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed font-medium px-4">
                Tus datos personales se procesan localmente en su dispositivo y nunca se envían a nuestros servidores. Solo registramos de forma anónima la empresa seleccionada y sus datos para mejorar nuestro directorio. Al generar el correo, aceptas nuestros{" "}
                <button type="button" onClick={() => setShowPrivacyModal(true)} className="underline hover:text-slate-700 transition-colors">
                  Términos de Privacidad
                </button>.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer onOpenPrivacy={() => setShowPrivacyModal(true)} />

      <ShareFab
        onClick={() => {
          setShareCelebration(false);
          setShowShareModal(true);
        }}
      />

      {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      {showShareModal && (
        <ShareModal celebration={shareCelebration} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
