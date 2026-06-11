import { motion } from "motion/react";
import { Share2 } from "lucide-react";

interface ShareFabProps {
  onClick: () => void;
}

export default function ShareFab({ onClick }: ShareFabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", delay: 1.2, bounce: 0.4 }}
      className="fixed bottom-5 right-5 z-40"
    >
      <motion.span
        aria-hidden="true"
        animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-indigo-500"
      />
      <button
        onClick={onClick}
        aria-label="Compartir Unlink"
        className="group relative flex items-center gap-0 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-full p-3.5 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
      >
        <Share2 size={20} className="shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-[7rem] group-hover:pl-2">
          Compartir
        </span>
      </button>
    </motion.div>
  );
}
