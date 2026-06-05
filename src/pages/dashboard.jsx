import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { Kanban, Plus, LogOut, User as UserIcon, ArrowRight, Loader2, Folder, AlertCircle } from "lucide-react";
import ToastContainer from "../components/ToastContainer";

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // États pour les Toasts éphémères
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Récupération des tableaux au chargement
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get("/boards");
        setBoards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        addToast("Impossible de charger vos tableaux. Veuillez réessayer.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []);

  // 2. Création d'un nouveau tableau
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);

    try {
      const { data } = await api.post("/boards", { title: newBoardTitle.trim() });
      if (data) {
        setBoards((prevBoards) => [...prevBoards, data]);
        setNewBoardTitle("");
        addToast("Le tableau a été créé avec succès !", "success");
      }
    } catch (err) {
      console.error(err);
      addToast("Erreur lors de la création du tableau. Veuillez réessayer.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Halos de lumière décoratifs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grille d'arrière-plan */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* En-tête (Header) */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-10">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Kanban className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            KanbanFlow
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">
              {user?.name || user?.email || "Utilisateur"}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 relative z-10 flex flex-col">
        {/* Titre & Accueil */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Bonjour, {user?.name || "collaborateur"} !
          </h1>
          <p className="text-slate-400 mt-1">
            Sélectionnez un espace de travail ou créez-en un nouveau pour commencer à organiser vos projets.
          </p>
        </div>



        {/* Grille des Tableaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Carte 1 : Formulaire de création intégré */}
          <div className="glass-panel p-6 rounded-xl flex flex-col justify-between min-h-[170px] border-dashed border-white/10 hover:border-indigo-500/30 transition-all duration-300">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                Nouveau Projet
              </span>
              <h3 className="text-lg font-bold text-white mb-4">Créer un tableau</h3>
            </div>
            
            <form onSubmit={handleCreateBoard} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Titre du tableau..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg text-sm text-white glass-input placeholder:text-slate-500 pr-10"
                  disabled={isCreating}
                />
                <button
                  type="submit"
                  disabled={isCreating || !newBoardTitle.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Squelette de chargement (Skeleton) */}
          {isLoading ? (
            <>
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-xl min-h-[170px] flex flex-col justify-between animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-6 bg-white/5 rounded w-2/3" />
                  </div>
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Liste des Boards réels */}
              {boards.map((board) => {
                const boardId = board._id || board.id;
                return (
                  <div
                    key={boardId}
                    onClick={() => navigate(`/boards/${boardId}`)}
                    className="group glass-panel p-6 rounded-xl min-h-[170px] flex flex-col justify-between cursor-pointer border border-white/5 hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-500">
                        Kanban
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                        {board.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 font-medium">
                        <span>Ouvrir le tableau</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* État vide si aucun tableau n'existe */}
              {!isLoading && boards.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center text-slate-500 border border-white/5 mb-4">
                    <Folder className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Aucun tableau trouvé</h3>
                  <p className="text-slate-400 text-sm max-w-sm">
                    Commencez par nommer et créer votre tout premier tableau Kanban ci-dessus.
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Conteneur de Notifications Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
