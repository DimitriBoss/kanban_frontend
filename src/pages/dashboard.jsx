/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useVersion } from "../context/versionContext";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import {
  Plus,
  ArrowRight,
  Loader2,
  Folder,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import gsap from "gsap";
import ToastContainer from "../components/ToastContainer";
import ConfirmModal from "../components/ConfirmModal";

// Imports pour le Drag & Drop dnd-kit
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

// Composant de carte de projet triable
function SortableBoardCard({ board, onNavigate, onEdit, onDelete }) {
  const boardId = board._id || board.id;
  const cardRef = useRef(null);
  const arrowRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: boardId });

  useEffect(() => {
    if (!cardRef.current) return;

    if (transform) {
      if (isDragging) {
        gsap.set(cardRef.current, {
          x: transform.x,
          y: transform.y,
          scale: 1.02,
          z: 10,
        });
      } else {
        gsap.to(cardRef.current, {
          x: transform.x,
          y: transform.y,
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    } else {
      gsap.to(cardRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, [transform, isDragging]);

  const handleMouseEnter = () => {
    if (isDragging || !cardRef.current) return;
    gsap.to(cardRef.current, {
      y: -6,
      boxShadow:
        "0 12px 32px -4px rgba(99,102,241,0.18), 0 4px 12px -2px rgba(99,102,241,0.10)",
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (arrowRef.current) {
      gsap.to(arrowRef.current, {
        x: 5,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: 0,
      boxShadow: "none",
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });
    if (arrowRef.current) {
      gsap.to(arrowRef.current, {
        x: 0,
        duration: 0.35,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
  };

  const style = {
    opacity: isDragging ? 0.35 : 1,
    touchAction: "none",
  };

  const setRefs = (node) => {
    setNodeRef(node);
    cardRef.current = node;
  };

  return (
    <div
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onNavigate}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group glass-panel project-card-animate p-6 rounded-xl min-h-[170px] flex flex-col justify-between cursor-grab active:cursor-grabbing border border-white/5 hover:border-indigo-500/25 transition-[border-color,opacity] duration-300 ${
        isDragging ? "border-indigo-500/30 shadow-md shadow-indigo-500/5" : ""
      }`}
    >
      <div className="flex justify-between items-start select-none mb-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 pointer-events-none">
          <Folder className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(board);
            }}
            className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(boardId);
            }}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none select-none flex-1 flex flex-col justify-end">
        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
          {board.title}
        </h3>
        {board.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
            {board.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 font-medium mt-3">
          <span>Ouvrir le tableau</span>
          <span ref={arrowRef} className="inline-flex">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// Modal unifié : formulaire + gestion des conflits + renommage
function BoardModal({
  isOpen,
  mode,
  boardId,
  initialTitle = "",
  initialDescription = "",
  conflictStart = false,
  onClose,
  onSuccess,
  addToast,
}) {
  const modalRef = useRef(null);
  const formInputRef = useRef(null);
  const renameInputRef = useRef(null);

  // step : "form" | "conflict" | "rename"
  const [step, setStep] = useState("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(conflictStart ? "conflict" : "form");
      setTitle(initialTitle);
      setDescription(initialDescription);
      setNewTitle(initialTitle);
      setIsSubmitting(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation GSAP à l'ouverture
  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" },
      );
    }
  }, [isOpen]);

  // Focus automatique selon l'étape
  useEffect(() => {
    if (step === "form" && formInputRef.current) formInputRef.current.focus();
    if (step === "rename" && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [step]);

  if (!isOpen) return null;

  const isConflictStep = step === "conflict" || step === "rename";

  // Soumettre le formulaire (étape form)
  const handleFormSubmit = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response =
        mode === "CREATE"
          ? await apiService.createBoard(title.trim(), description.trim())
          : await apiService.updateBoard(
              boardId,
              title.trim(),
              description.trim(),
            );

      if (response?.status === "EXIST") {
        setStep("conflict");
      } else if (response?.board) {
        onSuccess(response.board);
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Créer un doublon (forcer la création avec le nom en conflit)
  const handleForceDuplicate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response =
        mode === "CREATE"
          ? await apiService.createBoard(title.trim(), description.trim(), true)
          : await apiService.updateBoard(
              boardId,
              title.trim(),
              description.trim(),
              true,
            );

      if (response?.board) onSuccess(response.board);
    } catch (err) {
      console.error(err);
      addToast("Erreur lors de l'opération.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmer le renommage
  const handleConfirmRename = async () => {
    if (!newTitle.trim() || newTitle.trim() === title || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response =
        mode === "CREATE"
          ? await apiService.createBoard(newTitle.trim(), description.trim())
          : await apiService.updateBoard(
              boardId,
              newTitle.trim(),
              description.trim(),
            );

      if (response?.status === "EXIST") {
        // Le nouveau nom est encore en conflit
        addToast(
          `Le nom "${newTitle.trim()}" est aussi déjà pris. Choisissez un autre nom.`,
          "error",
        );
        setTitle(newTitle.trim());
        setNewTitle(newTitle.trim());
        setStep("conflict");
      } else if (response?.board) {
        onSuccess(response.board);
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erreur lors du renommage.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        {/* Halo d'arrière-plan */}
        <div
          className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[50px] pointer-events-none ${
            isConflictStep ? "bg-amber-500/5" : "bg-indigo-500/5"
          }`}
        />

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isConflictStep
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
            }`}
          >
            {isConflictStep ? (
              <AlertTriangle className="w-5 h-5" />
            ) : mode === "CREATE" ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Pencil className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {step === "form"
                ? mode === "CREATE"
                  ? "Nouveau projet"
                  : "Modifier le projet"
                : step === "conflict"
                  ? "Projet existant"
                  : "Renommer le projet"}
            </h3>
            {isConflictStep && (
              <p className="text-xs text-slate-500 mt-0.5">
                {step === "conflict"
                  ? "Conflit de nom détecté"
                  : "Saisir un nouveau nom"}
              </p>
            )}
          </div>
        </div>

        {/* ÉTAPE : Formulaire (CREATE ou UPDATE) */}
        {step === "form" && (
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Titre
              </label>
              <input
                ref={formInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFormSubmit()}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white glass-input"
                placeholder="Titre du projet..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs text-white glass-input resize-none h-24"
                placeholder="Description (optionnelle)..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={!title.trim() || isSubmitting}
                className="bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-medium text-xs px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{mode === "CREATE" ? "Créer" : "Sauvegarder"}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE : Conflit de nom */}
        {step === "conflict" && (
          <div className="relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Un projet nommé{" "}
              <span className="text-amber-400 font-semibold">
                &quot;{title}&quot;
              </span>{" "}
              existe déjà. Souhaitez-vous le renommer ou créer un doublon ?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setNewTitle(title);
                  setStep("rename");
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-white/5 rounded-lg transition-colors cursor-pointer"
              >
                Renommer
              </button>
              <button
                onClick={handleForceDuplicate}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-tr from-indigo-500 to-violet-600 hover:opacity-90 active:scale-95 rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-40 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <span>Créer un doublon</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE : Saisie du nouveau nom */}
        {step === "rename" && (
          <div className="relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Choisissez un nouveau nom pour votre projet.
            </p>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nouveau nom
              </label>
              <input
                ref={renameInputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white glass-input"
                placeholder="Nouveau titre du projet..."
              />
              {newTitle.trim() === title && newTitle.trim() !== "" && (
                <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Ce nom est identique au nom en conflit.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setStep("conflict")}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={
                  !newTitle.trim() || newTitle.trim() === title || isSubmitting
                }
                className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-tr from-indigo-500 to-violet-600 hover:opacity-90 active:scale-95 rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Confirmer le renommage</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // États pour les Toasts éphémères
  const [toasts, setToasts] = useState([]);

  // État du modal de suppression
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    boardId: null,
  });

  // État du modal unifié (création / modification / conflit / renommage)
  const [boardModal, setBoardModal] = useState({
    isOpen: false,
    mode: "CREATE", // "CREATE" | "UPDATE"
    boardId: null,
    initialTitle: "",
    initialDescription: "",
    conflictStart: false, // true = ouvrir directement à l'étape conflit
  });

  const closeBoardModal = () =>
    setBoardModal({
      isOpen: false,
      mode: "CREATE",
      boardId: null,
      initialTitle: "",
      initialDescription: "",
      conflictStart: false,
    });

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const { user, logout } = useAuth();
  const { version } = useVersion();
  const navigate = useNavigate();

  // Configuration des capteurs dnd-kit
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 8,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // 1. Récupération des tableaux au chargement
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const boardsData = await apiService.getBoards();

        // Trier les tableaux selon l'ordre sauvegardé localement
        const savedOrderStr = localStorage.getItem(
          `boards_order_${user?.id || "default"}`,
        );
        if (savedOrderStr) {
          const savedOrder = JSON.parse(savedOrderStr);
          boardsData.sort((a, b) => {
            const idA = a._id || a.id;
            const idB = b._id || b.id;
            const idxA = savedOrder.indexOf(idA);
            const idxB = savedOrder.indexOf(idB);

            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
        }

        setBoards(boardsData);
      } catch (err) {
        console.error(err);
        addToast(
          "Impossible de charger vos tableaux. Veuillez réessayer.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [version, user?.id]);

  // Animation d'entrée GSAP des cartes de projet
  useEffect(() => {
    if (!isLoading && boards.length > 0) {
      gsap.fromTo(
        ".project-card-animate",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }
  }, [isLoading, boards.length]);

  // 2. Création d'un nouveau tableau
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setIsCreating(true);

    try {
      const response = await apiService.createBoard(
        newBoardTitle.trim(),
        newBoardDescription.trim(),
      );
      if (response && response.status === "EXIST") {
        setBoardModal({
          isOpen: true,
          mode: "CREATE",
          boardId: null,
          initialTitle: newBoardTitle.trim(),
          initialDescription: newBoardDescription.trim(),
          conflictStart: true,
        });
      } else if (response && response.board) {
        const board = response.board;
        setBoards((prevBoards) => {
          const updated = [...prevBoards, board];
          const ids = updated.map((b) => b._id || b.id);
          localStorage.setItem(
            `boards_order_${user?.id || "default"}`,
            JSON.stringify(ids),
          );
          return updated;
        });
        setNewBoardTitle("");
        setNewBoardDescription("");
        addToast(
          `Le projet "${board.title}" a été créé avec succès !`,
          "success",
        );
      }
    } catch (err) {
      console.error(err);
      addToast(
        err.message ||
          "Erreur lors de la création du tableau. Veuillez réessayer.",
        "error",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Ouvrir le modal en mode modification
  const handleOpenEdit = (board) => {
    setBoardModal({
      isOpen: true,
      mode: "UPDATE",
      boardId: board._id || board.id,
      initialTitle: board.title || "",
      initialDescription: board.description || "",
      conflictStart: false,
    });
  };

  // Callback appelé par BoardModal quand la sauvegarde réussit
  const handleBoardSaved = (board) => {
    if (boardModal.mode === "CREATE") {
      setBoards((prevBoards) => {
        const updated = [...prevBoards, board];
        const ids = updated.map((b) => b._id || b.id);
        localStorage.setItem(
          `boards_order_${user?.id || "default"}`,
          JSON.stringify(ids),
        );
        return updated;
      });
      setNewBoardTitle("");
      setNewBoardDescription("");
      addToast(
        `Le projet "${board.title}" a été créé avec succès !`,
        "success",
      );
    } else {
      setBoards((prev) =>
        prev.map((b) =>
          (b._id || b.id) === (board._id || board.id) ? board : b,
        ),
      );
      addToast("Le projet a été modifié avec succès !", "success");
    }
    closeBoardModal();
  };

  // Handlers pour supprimer
  const handleOpenDelete = (boardId) => {
    setConfirmModal({
      isOpen: true,
      boardId,
    });
  };

  const handleConfirmDelete = async () => {
    const boardId = confirmModal.boardId;
    if (!boardId) return;
    try {
      await apiService.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => (b._id || b.id) !== boardId));
      addToast("Le projet a été supprimé !", "success");
    } catch (err) {
      console.error(err);
      addToast("Impossible de supprimer le projet.", "error");
    } finally {
      setConfirmModal({ isOpen: false, boardId: null });
    }
  };

  // 3. Fin de glissement pour réordonner les projets
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      setBoards((prev) => {
        const oldIndex = prev.findIndex((b) => (b._id || b.id) === activeId);
        const newIndex = prev.findIndex((b) => (b._id || b.id) === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = [...prev];
          const [moved] = reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, moved);

          const ids = reordered.map((b) => b._id || b.id);
          localStorage.setItem(
            `boards_order_${user?.id || "default"}`,
            JSON.stringify(ids),
          );
          return reordered;
        }
        return prev;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Halos de lumière décoratifs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grille d'arrière-plan */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* En-tête (Header) */}
      <Header />

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-10 pb-10 relative z-10 flex flex-col">
        {/* Titre & Accueil */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Bonjour, {user?.name || "collaborateur"} !
          </h1>
          <p className="text-slate-400 mt-1">
            Sélectionnez un espace de travail ou créez-en un nouveau pour
            commencer à organiser vos projets.
          </p>
        </div>

        {/* Grille des Tableaux */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Carte 1 : Formulaire de création intégré */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-dashed border-white/10 hover:border-indigo-500/30 transition-all duration-300">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                  Nouveau Projet
                </span>
                <h3 className="text-lg font-bold text-white mb-3">
                  Créer un tableau
                </h3>
              </div>

              <form onSubmit={handleCreateBoard} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Titre du tableau..."
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg text-sm text-white glass-input placeholder:text-slate-500"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Description du projet (optionnelle)..."
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg text-xs text-white glass-input placeholder:text-slate-500 resize-none h-16"
                    disabled={isCreating}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating || !newBoardTitle.trim()}
                  className="w-full py-2 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center gap-2 text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Créer le projet</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Squelette de chargement (Skeleton) */}
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="glass-panel p-6 rounded-xl min-h-[170px] flex flex-col justify-between animate-pulse"
                  >
                    <div className="space-y-3">
                      <div className="h-4 bg-white/5 rounded w-1/4" />
                      <div className="h-6 bg-white/5 rounded w-2/3" />
                    </div>
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                  </div>
                ))}
              </>
            ) : (
              <SortableContext
                items={boards.map((b) => b._id || b.id)}
                strategy={rectSortingStrategy}
              >
                {/* Liste des Boards réels */}
                {boards.map((board) => {
                  const boardId = board._id || board.id;
                  return (
                    <SortableBoardCard
                      key={boardId}
                      board={board}
                      onNavigate={() => navigate(`/boards/${boardId}`)}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  );
                })}

                {/* État vide si aucun tableau n'existe */}
                {!isLoading && boards.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center text-slate-500 border border-white/5 mb-4">
                      <Folder className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Aucun tableau trouvé
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                      Commencez par nommer et créer votre tout premier tableau
                      Kanban ci-dessus.
                    </p>
                  </div>
                )}
              </SortableContext>
            )}
          </div>
        </DndContext>
      </main>

      {/* Modal unifié : création / modification / conflit / renommage */}
      <BoardModal
        isOpen={boardModal.isOpen}
        mode={boardModal.mode}
        boardId={boardModal.boardId}
        initialTitle={boardModal.initialTitle}
        initialDescription={boardModal.initialDescription}
        conflictStart={boardModal.conflictStart}
        onClose={closeBoardModal}
        onSuccess={handleBoardSaved}
        addToast={addToast}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible et supprimera également toutes les colonnes et tâches associées."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, boardId: null })}
        type="danger"
      />

      {/* Conteneur de Notifications Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
