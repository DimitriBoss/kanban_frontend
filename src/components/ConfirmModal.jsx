import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  type = "danger",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop (arrière-plan flouté) */}
      <div 
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Boîte de dialogue (Modal panel) */}
      <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative z-10 border border-white/10 shadow-2xl animate-scale-in">
        
        {/* En-tête avec bouton fermer */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              type === "danger" 
                ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message principal */}
        <div className="mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Pied de page avec boutons d'actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all transform active:scale-95 cursor-pointer shadow-lg ${
              type === "danger"
                ? "bg-red-600 hover:bg-red-500 shadow-red-500/10"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/10"
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
