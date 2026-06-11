import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { X, Heart, Share2, Link2, Check } from "lucide-react";

const SHARE_URL = "https://unlink-data.vercel.app";
const SHARE_TEXT =
  "Acabo de ejercer mis derechos de protección de datos en menos de un minuto con Unlink 🛡️ Elimina o corrige tus datos personales de cualquier empresa: gratis, sin registro y 100% privado.";

interface ShareModalProps {
  onClose: () => void;
  celebration?: boolean;
}

const CONFETTI_COLORS = ["#a5b4fc", "#c4b5fd", "#f9a8d4", "#fcd34d", "#6ee7b7", "#ffffff"];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function XLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

export default function ShareModal({ onClose, celebration = false }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 1.8 + Math.random() * 1.4,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  );

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: "Unlink", text: SHARE_TEXT, url: SHARE_URL });
    } catch {
      // El usuario canceló el diálogo nativo: no es un error.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia el enlace:", SHARE_URL);
    }
  };

  const encodedText = encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`);
  const socialLinks = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}`,
      icon: <WhatsAppIcon />,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
      icon: <TelegramIcon />,
      className: "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
      icon: <XLogoIcon />,
      className: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-6 pt-10 pb-8 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {confetti.map((c) => (
              <motion.span
                key={c.id}
                initial={{ y: -16, opacity: 0, rotate: 0 }}
                animate={{ y: 160, opacity: [0, 1, 1, 0], rotate: c.rotate }}
                transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: "linear" }}
                className="absolute rounded-sm"
                style={{ left: `${c.left}%`, width: c.size, height: c.size, backgroundColor: c.color }}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
          >
            <X size={18} />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.15, bounce: 0.55 }}
            className="relative inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4"
          >
            <Heart className="text-rose-500 fill-rose-500" size={30} />
          </motion.div>

          <h2 className="relative text-xl font-bold text-white">
            {celebration ? "¡Tu solicitud está en marcha!" : "Comparte Unlink"}
          </h2>
          <p className="relative text-indigo-100 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
            {celebration
              ? "Acabas de recuperar el control de tus datos. ¿Conoces a alguien que también debería hacerlo?"
              : "Ayuda a que más personas recuperen el control de sus datos personales."}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Share2 size={18} />
              Compartir con un toque
            </button>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <hr className="flex-1 border-slate-100" />
            {canNativeShare ? "o comparte en" : "Comparte en"}
            <hr className="flex-1 border-slate-100" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors ${link.className}`}
              >
                {link.icon}
                {link.name}
              </a>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              copied
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {copied ? <Check size={16} /> : <Link2 size={16} />}
            {copied ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>

          <p className="text-center text-xs text-slate-400 leading-relaxed pt-1">
            Unlink es gratuito, de código abierto y sin publicidad. Compartirlo es la mejor forma de apoyarlo. 💜
          </p>
        </div>
      </motion.div>
    </div>
  );
}
