import { Github } from "lucide-react";

interface FooterProps {
  onOpenPrivacy: () => void;
}

export default function Footer({ onOpenPrivacy }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/60 bg-slate-50/80">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/elianurl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-900 transition-colors p-2.5 rounded-full hover:bg-white hover:shadow-sm"
            title="GitHub"
            aria-label="Ver proyecto en GitHub"
          >
            <Github size={22} />
          </a>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm text-slate-500">
            Herramienta no oficial.{" "}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="underline hover:text-slate-800 transition-colors"
            >
              Aviso Legal y Privacidad
            </button>
          </p>
          <p className="text-sm font-medium text-slate-700">
            Desarrollada por Elian De Valois
          </p>
        </div>
      </div>
    </footer>
  );
}
