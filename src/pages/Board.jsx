import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import api from "../services/api";
import { Kanban, LogOut, Plus, User as UserIcon, ArrowLeft, Trash2, Loader2, AlertCircle } from "lucide-react";

// Imports pour le Drag & Drop dnd-kit
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 1. Composant Enfant de tâche triable (Draggable & Sortable)
function SortableTask({ task, onDelete }) {
  const taskId = task._id || task.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-slate-950/40 border border-white/5 hover:border-indigo-500/20 p-4 rounded-lg shadow-sm hover:shadow-indigo-500/5 transition-colors duration-200 cursor-grab active:cursor-grabbing group ${
        isDragging ? "border-indigo-500/30 shadow-md shadow-indigo-500/5" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors mb-1 flex-1 break-words">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mt-1">
          {task.description}
        </p>
      )}
    </div>
  );
}

// 2. Conteneur de tâches d'une colonne (Droppable)
function ColumnTasksContainer({ colId, children }) {
  const { setNodeRef } = useDroppable({ id: colId });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
      {children}
    </div>
  );
}

// 3. Composant Principal du Tableau Kanban
export default function Board() {
  const { boardId } = useParams();
  const { user, logout } = useAuth();

  const [boardTitle, setBoardTitle] = useState("Chargement...");
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // États pour la création de colonne
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  // États pour la création de tâche
  const [activeAddTaskColumnId, setActiveAddTaskColumnId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Configuration des capteurs dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Exige un déplacement de 8px pour activer le drag (permet le clic normal)
      },
    })
  );

  // Charger le tableau, les colonnes et leurs tâches
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Récupérer les détails du tableau pour son titre
        try {
          const boardRes = await api.get(`/boards/${boardId}`);
          setBoardTitle(boardRes.data.title);
        } catch (e) {
          console.error("Impossible de charger les infos du tableau", e);
          setBoardTitle("Tableau Kanban");
        }

        // Récupérer les colonnes du tableau
        const columnsRes = await api.get(`/boards/${boardId}/columns`);
        const columnsData = Array.isArray(columnsRes.data) ? columnsRes.data : [];

        // Récupérer les tâches en parallèle pour chaque colonne
        const columnsWithTasks = await Promise.all(
          columnsData.map(async (col) => {
            const colId = col._id || col.id;
            try {
              const tasksRes = await api.get(
                `/boards/${boardId}/columns/${colId}/tasks`
              );
              return {
                ...col,
                tasks: Array.isArray(tasksRes.data) ? tasksRes.data : [],
              };
            } catch (err) {
              console.error(`Erreur tâches colonne ${colId}:`, err);
              return { ...col, tasks: [] };
            }
          })
        );

        setColumns(columnsWithTasks);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données de votre tableau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (boardId) {
      loadBoardData();
    }
  }, [boardId]);

  // Fonction utilitaire pour trouver la colonne d'une tâche
  const findColumnOfTask = (taskId) => {
    // Si c'est l'ID d'une colonne (cas d'un drop sur zone vide)
    if (columns.some((col) => (col._id || col.id) === taskId)) {
      return taskId;
    }
    // Sinon chercher dans les tâches
    const col = columns.find((col) =>
      col.tasks.some((task) => (task._id || task.id) === taskId)
    );
    return col ? (col._id || col.id) : null;
  };

  // Gérer le survol pendant le drag (Drag Over) pour déplacer visuellement les cartes à la volée
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColId = findColumnOfTask(activeId);
    const overColId = findColumnOfTask(overId);

    if (!activeColId || !overColId) return;

    if (activeColId !== overColId) {
      setColumns((prev) => {
        const activeCol = prev.find((c) => (c._id || c.id) === activeColId);
        const activeTask = activeCol.tasks.find((t) => (t._id || t.id) === activeId);

        const overCol = prev.find((c) => (c._id || c.id) === overColId);
        
        // Calculer l'index d'insertion
        const isOverATask = overCol.tasks.some((t) => (t._id || t.id) === overId);
        let newIndex = overCol.tasks.length;
        if (isOverATask) {
          newIndex = overCol.tasks.findIndex((t) => (t._id || t.id) === overId);
        }

        return prev.map((col) => {
          const colId = col._id || col.id;
          if (colId === activeColId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => (t._id || t.id) !== activeId),
            };
          }
          if (colId === overColId) {
            const newTasks = [...col.tasks];
            // Éviter les duplications accidentelles
            if (!newTasks.some((t) => (t._id || t.id) === activeId)) {
              newTasks.splice(newIndex, 0, activeTask);
            }
            return {
              ...col,
              tasks: newTasks,
            };
          }
          return col;
        });
      });
    }
  };

  // Gérer la fin du drag (Drag End) pour sauvegarder dans la base de données
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColId = findColumnOfTask(activeId);
    const overColId = findColumnOfTask(overId);

    if (!activeColId || !overColId) return;

    // Récupérer la colonne cible finale
    const col = columns.find((c) => (c._id || c.id) === overColId);
    const finalIndex = col.tasks.findIndex((t) => (t._id || t.id) === activeId);

    if (activeColId === overColId) {
      const oldIndex = col.tasks.findIndex((t) => (t._id || t.id) === activeId);
      const newIndex = col.tasks.findIndex((t) => (t._id || t.id) === overId);

      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        // Réordonner localement
        setColumns((prev) =>
          prev.map((c) => {
            const cId = c._id || c.id;
            if (cId === overColId) {
              const newTasks = [...c.tasks];
              const [movedTask] = newTasks.splice(oldIndex, 1);
              newTasks.splice(newIndex, 0, movedTask);
              return { ...c, tasks: newTasks };
            }
            return c;
          })
        );

        // Sauvegarder dans le backend
        try {
          await api.patch(`/boards/${boardId}/tasks/${activeId}/move`, {
            newColumnId: overColId,
            newPosition: newIndex,
          });
        } catch (err) {
          console.error("Erreur de déplacement de tâche:", err);
          setError("Impossible de sauvegarder l'ordre des tâches.");
        }
      }
    } else {
      // Déplacement inter-colonnes déjà effectué localement lors du dragOver.
      // Il suffit de propager le déplacement au backend à la position finale calculée.
      try {
        await api.patch(`/boards/${boardId}/tasks/${activeId}/move`, {
          newColumnId: overColId,
          newPosition: finalIndex === -1 ? 0 : finalIndex,
        });
      } catch (err) {
        console.error("Erreur de déplacement inter-colonnes:", err);
        setError("Impossible de sauvegarder le changement de colonne.");
      }
    }
  };

  // Créer une nouvelle colonne
  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    setIsCreatingColumn(true);
    setError("");

    try {
      const { data } = await api.post(`/boards/${boardId}/columns`, {
        title: newColumnTitle.trim(),
      });
      if (data) {
        setColumns((prev) => [...prev, { ...data, tasks: [] }]);
        setNewColumnTitle("");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de la colonne.");
    } finally {
      setIsCreatingColumn(false);
    }
  };

  // Créer une tâche dans une colonne
  const handleCreateTask = async (columnId) => {
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    setError("");

    try {
      const { data } = await api.post(
        `/boards/${boardId}/columns/${columnId}/tasks`,
        {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
        }
      );

      if (data) {
        setColumns((prevColumns) =>
          prevColumns.map((col) => {
            const colId = col._id || col.id;
            if (colId === columnId) {
              return { ...col, tasks: [...col.tasks, data] };
            }
            return col;
          })
        );

        setNewTaskTitle("");
        setNewTaskDescription("");
        setActiveAddTaskColumnId(null);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de la tâche.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Supprimer une colonne (avec ses tâches associées)
  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette colonne et toutes ses tâches ?")) return;

    setError("");
    try {
      await api.delete(`/boards/${boardId}/columns/${columnId}`);
      setColumns((prev) => prev.filter((col) => (col._id || col.id) !== columnId));
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la colonne.");
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    setError("");
    try {
      await api.delete(`/boards/${boardId}/tasks/${taskId}`);
      // Mettre à jour l'état local en filtrant la tâche
      setColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((task) => (task._id || task.id) !== taskId),
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la tâche.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grille de fond */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* En-tête (Header) */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Kanban className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {boardTitle}
            </span>
          </div>
        </div>

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

      {/* Zone principale */}
      <main className="flex-1 flex flex-col relative z-10 px-6 py-8 overflow-hidden">
        
        {/* Messages d'erreur */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-slate-400">Chargement de votre espace de travail...</p>
          </div>
        ) : (
          // Conteneur DndContext global pour le Drag & Drop
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-start scrollbar-thin">
              
              {/* Rendu des colonnes */}
              {columns.map((col) => {
                const colId = col._id || col.id;
                return (
                  <div
                    key={colId}
                    className="w-80 shrink-0 bg-slate-900/30 border border-white/5 rounded-xl flex flex-col max-h-[calc(100vh-180px)] overflow-hidden shadow-xl"
                  >
                    {/* Entête Colonne */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm tracking-tight truncate max-w-[180px]">
                          {col.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-slate-400">
                          {col.tasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteColumn(colId)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Liste des tâches avec contexte de tri local */}
                    <SortableContext
                      items={col.tasks.map((task) => task._id || task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ColumnTasksContainer colId={colId}>
                        {col.tasks.map((task) => (
                          <SortableTask
                            key={task._id || task.id}
                            task={task}
                            onDelete={() => handleDeleteTask(task._id || task.id)}
                          />
                        ))}
                        
                        {col.tasks.length === 0 && (
                          <div className="py-8 text-center pointer-events-none">
                            <p className="text-xs text-slate-500">Aucune tâche</p>
                          </div>
                        )}
                      </ColumnTasksContainer>
                    </SortableContext>

                    {/* Formulaire ou bouton d'ajout de tâche */}
                    <div className="p-3 bg-slate-950/20 border-t border-white/5">
                      {activeAddTaskColumnId === colId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Titre de la tâche..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs text-white glass-input placeholder:text-slate-500"
                            disabled={isCreatingTask}
                          />
                          <textarea
                            placeholder="Description (optionnelle)..."
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            className="w-full px-3 py-1.5 rounded text-xs text-white glass-input placeholder:text-slate-500 resize-none h-16"
                            disabled={isCreatingTask}
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleCreateTask(colId)}
                              disabled={isCreatingTask || !newTaskTitle.trim()}
                              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-xs px-3 py-1.5 rounded hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {isCreatingTask ? "Ajout..." : "Ajouter"}
                            </button>
                            <button
                              onClick={() => {
                                setActiveAddTaskColumnId(null);
                                setNewTaskTitle("");
                                setNewTaskDescription("");
                              }}
                              className="text-slate-400 hover:text-white text-xs px-2 py-1.5 cursor-pointer"
                              disabled={isCreatingTask}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveAddTaskColumnId(colId);
                            setNewTaskTitle("");
                            setNewTaskDescription("");
                          }}
                          className="w-full text-left py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Ajouter une tâche
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Ajouter une nouvelle colonne */}
              <div className="w-80 shrink-0 glass-panel p-4 rounded-xl border border-dashed border-white/10 hover:border-indigo-500/20 transition-all duration-300">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                  Nouvelle étape
                </span>
                <h3 className="text-sm font-bold text-white mb-4">Créer une colonne</h3>
                
                <form onSubmit={handleCreateColumn} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Nom de la colonne..."
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white glass-input placeholder:text-slate-500 pr-9"
                      disabled={isCreatingColumn}
                    />
                    <button
                      type="submit"
                      disabled={isCreatingColumn || !newColumnTitle.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCreatingColumn ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </DndContext>
        )}
      </main>
    </div>
  );
}
