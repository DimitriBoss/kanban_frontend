import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function ToastItem({ toast, onClose }) {
  const { id, message, type } = toast;
  const [isLeaving, setIsLeaving] = useState(false);

  // Déclenche l'animation de sortie puis retire le toast
  const startLeave = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 280); // légèrement sous les 300ms de l'animation
  };

  // Auto-fermeture après 2,5 secondes (ordre FIFO naturel grâce aux timers individuels)
  useEffect(() => {
    const timer = setTimeout(startLeave, 2500);
    return () => clearTimeout(timer);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Styles spécifiques selon le type
  const config = {
    success: {
      borderColor: "border-emerald-500/20",
      bgColor: "bg-slate-900/90",
      shadowGlow: "shadow-emerald-500/5",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      borderColor: "border-red-500/20",
      bgColor: "bg-slate-900/90",
      shadowGlow: "shadow-red-500/5",
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    },
    info: {
      borderColor: "border-indigo-500/20",
      bgColor: "bg-slate-900/90",
      shadowGlow: "shadow-indigo-500/5",
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />,
    },
  };

  const { borderColor, bgColor, shadowGlow, icon } = config[type] || config.info;

  return (
    <div className={`w-full max-w-sm glass-panel p-3 md:p-4 rounded-xl border flex items-start gap-2.5 md:gap-3 shadow-xl ${borderColor} ${bgColor} ${shadowGlow} ${isLeaving ? "animate-slide-out" : "animate-slide-in"} pointer-events-auto overflow-hidden`}>
      {icon}
      <div className="flex-1">
        <p className="text-xs md:text-sm text-slate-100 font-medium leading-relaxed">
          {message}
        </p>
      </div>
      <button
        onClick={startLeave}
        className="text-slate-500 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-full md:max-w-sm z-50 flex flex-col gap-2 md:gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}
