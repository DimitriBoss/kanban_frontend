import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  Kanban,
  ArrowRight,
  Activity,
  Layout,
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative font-sans">
      {/* Halos de lumière décoratifs (Glow effects) */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[300px] right-[-200px] w-[600px] h-[600px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grille de fond subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Barre de navigation (Navbar) */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md fixed top-0 left-0 right-0 z-50 w-screen">
        {/* Barre principale — pleine largeur viewport */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 md:max-w-7xl md:mx-auto">
          {/* Logo + Nom du site */}
          <Link
            to="/"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.history.pushState(
                  "",
                  document.title,
                  window.location.pathname + window.location.search,
                );
                window.scrollTo({ top: 0, behavior: "instant" });
              }
            }}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Kanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              KanbanFlow
            </span>
          </Link>

          {/* Liens nav — desktop uniquement, centre */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a
              href="#technologies"
              className="hover:text-white transition-colors"
            >
              Technologies
            </a>
            <div
              className="relative"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onMouseEnter={() => setIsDropdownOpen(true)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer focus:outline-none"
              >
                <span>Code Source</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-white/10 shadow-xl py-1.5 z-50 animate-scale-in text-left">
                  <a
                    href="https://github.com/DimitriBoss/kanban_frontend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>Client Frontend</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <div className="h-[1px] bg-white/5 mx-3 my-1" />
                  <a
                    href="https://github.com/DimitriBoss/kanban_backend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>Serveur Backend</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Zone droite */}
          <div className="flex items-center gap-2">
            {/* CTA auth — desktop uniquement */}
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all cursor-pointer"
              >
                Accéder à l'application
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Hamburger — mobile uniquement */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile — tous les liens */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-md px-4 pb-5 pt-2 flex flex-col gap-1">
            {/* Navigation */}
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg"
            >
              Fonctionnalités
            </a>
            <a
              href="#technologies"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg"
            >
              Technologies
            </a>

            {/* Code source */}
            <div className="h-[1px] bg-white/5 my-1.5" />
            <a
              href="https://github.com/DimitriBoss/kanban_frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg"
            >
              <span>Frontend — Code Source</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </a>
            <a
              href="https://github.com/DimitriBoss/kanban_backend"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg"
            >
              <span>Backend — Code Source</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </a>

            {/* Auth */}
            <div className="h-[1px] bg-white/5 my-1.5" />
            {user ? (
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-md shadow-indigo-500/15 transition-all cursor-pointer"
              >
                Accéder à l'application
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors px-3 py-2.5 rounded-lg text-center"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-all text-center shadow-md shadow-indigo-500/15"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-36 pb-20 text-center relative z-10 flex flex-col items-center">
        {/* Badge Nouveauté */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-6 animate-pulse">
          <Activity className="w-3.5 h-3.5" />
          <span>Nouveau : Version 1.0 disponible</span>
        </div>

        {/* Titre Principal */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
          Gérez vos projets à la vitesse de la lumière
        </h1>

        {/* Sous-titre */}
        <p className="text-slate-400 mt-6 text-base md:text-lg max-w-2xl leading-relaxed">
          Un espace de travail Kanban épuré, ultra-rapide et doté d'une
          interface en verre dépoli modernisée. Organisez vos tâches par simple
          glisser-déposer.
        </p>

        {/* Double CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all transform active:scale-95 cursor-pointer"
          >
            {user ? "Ouvrir mon tableau de bord" : "Commencer gratuitement"}
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold px-7 py-3.5 rounded-xl transition-all"
          >
            Découvrir l'outil
          </a>
        </div>

        {/* Faux Tableau Kanban Interactif en CSS (Visual Mockup) */}
        <div className="w-full max-w-5xl mt-20 p-4 rounded-2xl glass-panel relative border border-white/10 shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />

          {/* Header du mockup */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/20 text-left">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-slate-500 ml-4 font-mono select-none">
                app.kanbanflow.com/boards/projet-refonte
              </span>
            </div>
            <div className="h-4 w-24 bg-white/5 rounded-full animate-pulse" />
          </div>

          {/* Grille du Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 text-left select-none relative z-0">
            {/* Colonne 1 : À faire */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 space-y-3">
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  À Faire
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/5 text-slate-400 rounded-full">
                  3
                </span>
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg space-y-2">
                <h4 className="font-semibold text-xs text-slate-200">
                  Rédiger les spécifications
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Écrire l'architecture et les routes d'API.
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500/10 text-indigo-300 rounded">
                    Specs
                  </span>
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                    D
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg space-y-2 opacity-80">
                <h4 className="font-semibold text-xs text-slate-200">
                  Intégrer Google Fonts
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Charger Plus Jakarta Sans dans l'index.html.
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-300 rounded">
                    Design
                  </span>
                  <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[8px] font-bold text-white">
                    F
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2 : En cours */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 space-y-3">
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  En Cours
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/5 text-slate-400 rounded-full">
                  2
                </span>
              </div>

              <div className="bg-slate-950/40 border border-indigo-500/20 p-3 rounded-lg space-y-2 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <h4 className="font-semibold text-xs text-indigo-300">
                  Intégrer le Drag & Drop
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  Brancher dnd-kit sur les tâches et colonnes pour fluidifier le
                  glisser-déposer.
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500/20 text-indigo-300 rounded">
                    Core
                  </span>
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                    D
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg space-y-2 opacity-95">
                <h4 className="font-semibold text-xs text-slate-200">
                  Créer le ConfirmModal
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  Remplacer les window.confirm par une boîte de dialogue
                  stylisée.
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-fuchsia-500/10 text-fuchsia-300 rounded">
                    Modales
                  </span>
                  <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white">
                    A
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 3 : Terminé */}
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 space-y-3">
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Terminé
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/5 text-slate-400 rounded-full">
                  1
                </span>
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg space-y-2 opacity-70 line-through decoration-slate-600">
                <h4 className="font-semibold text-xs text-slate-400">
                  Créer la page de login
                </h4>
                <p className="text-[10px] text-slate-600 line-clamp-1">
                  Formulaire moderne en glassmorphism.
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-500/5 text-slate-500 rounded">
                    Login
                  </span>
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                    D
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Fonctionnalités (Features) */}
      <section
        id="features"
        className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-white/5 scroll-mt-24"
      >
        {/* Titre de section */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">
            Technologie & Confort
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Une expérience utilisateur simplifiée
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
            Nous avons conçu chaque interaction pour qu'elle soit intuitive,
            réactive et agréable.
          </p>
        </div>

        {/* Grille de 4 features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Drag & Drop Fluide
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Glissez et déposez vos tâches instantanément au sein des
                colonnes sans aucune saccade visuelle.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Toasts & Modales
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Remplacement complet des alertes par défaut par des dialogues en
                verre dépoli et des toasts animés.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Sécurité intégrée
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Session persistante sécurisée et routeur protégeant
                automatiquement vos espaces de travail.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Haute Performance
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Re-rendering optimisé, requêtes API parallélisées et base de
                données Prisma pour une rapidité absolue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Technologies */}
      <section
        id="technologies"
        className="max-w-7xl mx-auto w-full px-6 py-20 relative z-10 border-t border-white/5 scroll-mt-24"
      >
        {/* Titre de section */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-2">
            Notre Espace Technique
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Propulsé par les meilleurs frameworks
          </h2>
        </div>

        {/* Techno badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              React 19
            </span>
            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Frontend
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Tailwind v4
            </span>
            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Styles
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Prisma
            </span>
            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Database ORM
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Node.js
            </span>
            <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Backend API
            </span>
          </div>
        </div>
      </section>

      {/* Spacer pour pousser le footer en bas */}
      <div className="flex-1" />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 backdrop-blur-md px-6 py-8 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
              <Kanban className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-300">KanbanFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <span>
              © {new Date().getFullYear()} KanbanFlow. Tous droits réservés.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/DimitriBoss/kanban_backend.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
