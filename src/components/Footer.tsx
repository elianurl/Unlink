import { Github } from "lucide-react";

interface FooterProps {
  onOpenPrivacy: () => void;
}

export default function Footer({ onOpenPrivacy }: FooterProps) {
  return (
    <footer className="mt-2 border-t border-slate-200/60 bg-slate-50/50">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/elianurl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-white hover:shadow-sm"
            title="GitHub"
          >
            <Github size={22} />
          </a>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-500">
            Herramienta no oficial.
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="underline hover:text-slate-800 transition-colors ml-1"
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
