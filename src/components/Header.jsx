import { useState } from "react";
import { Link } from "react-router-dom";
import { Kanban, ArrowLeft, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/authContext";
import VersionToggle from "./VersionToggle";

export default function Header({ boardTitle }) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fonction pour générer les initiales de l'utilisateur
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between relative z-40">
      {/* Côté gauche: Bouton retour et/ou Logo de l'application */}
      <div className="flex items-center gap-2.5 sm:gap-4 relative z-10">
        {boardTitle ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Retour au tableau de bord"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />

            <Link
              to="/dashboard"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Kanban className="w-4 h-4 text-white" />
              </div>
            </Link>
          </>
        ) : (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Kanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              KanbanFlow
            </span>
          </Link>
        )}
      </div>

      {/* Centre: Nom du projet / tableau en cours */}
      {boardTitle && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center max-w-[24%] sm:max-w-[35%] md:max-w-[45%] text-center">
          <span
            className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate block"
            title={boardTitle}
          >
            {boardTitle}
          </span>
        </div>
      )}

      {/* Côté droit: Toggle de Version et Info Utilisateur / Déconnexion */}
      <div className="flex items-center gap-2 sm:gap-4 relative z-10">
        <VersionToggle />

        {user && (
          <>
            {/* ──────── MODE DESKTOP (PC) ──────── */}
            {/* Nom de l'utilisateur (badge) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 shrink-0">
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">
                {user.name || user.email || "Utilisateur"}
              </span>
            </div>

            {/* Bouton de déconnexion direct */}
            <button
              onClick={logout}
              className="hidden lg:flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>

            {/* ──────── MODE MOBILE & TABLETTE ──────── */}
            <div className="lg:hidden relative">
              {/* Bouton Avatar cliquable */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer select-none focus:outline-none"
                title="Menu utilisateur"
              >
                {/* Rond d'avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20 border border-white/10 shrink-0">
                  {getInitials(user.name || user.email)}
                </div>
              </button>

              {/* Menu Dropdown Mobile/Tablette */}
              {isMenuOpen && (
                <>
                  {/* Backdrop invisible pour fermer le menu au clic à l'extérieur */}
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900/95 border border-white/10 shadow-2xl p-2 z-50 backdrop-blur-md animate-scale-in origin-top-right">
                    {/* Infos utilisateur */}
                    <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                      <p className="text-xs font-bold text-white truncate">
                        {user.name || "Utilisateur"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    {/* Option Déconnexion */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
