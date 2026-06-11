/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useVersion } from "../context/versionContext";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import {
  Plus, Trash2, Loader2, X, ChevronDown,
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import ToastContainer from "../components/ToastContainer";
import gsap from "gsap";

const COLUMN_COLORS = [
  { name: "Indigo", value: "indigo", hex: "#6366f1", bg: "bg-indigo-500/5", border: "border-indigo-500/20", text: "text-indigo-400", badge: "bg-indigo-500/10 text-indigo-400", glow: "shadow-[0_0_20px_rgba(99,102,241,0.05)]" },
  { name: "Violet", value: "violet", hex: "#8b5cf6", bg: "bg-violet-500/5", border: "border-violet-500/20", text: "text-violet-400", badge: "bg-violet-500/10 text-violet-400", glow: "shadow-[0_0_20px_rgba(139,92,246,0.05)]" },
  { name: "Rose", value: "rose", hex: "#f43f5e", bg: "bg-rose-500/5", border: "border-rose-500/20", text: "text-rose-400", badge: "bg-rose-500/10 text-rose-400", glow: "shadow-[0_0_20px_rgba(244,63,94,0.05)]" },
  { name: "Amber", value: "amber", hex: "#f59e0b", bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-400", badge: "bg-amber-500/10 text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.05)]" },
  { name: "Emerald", value: "emerald", hex: "#10b981", bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.05)]" },
  { name: "Cyan", value: "cyan", hex: "#06b6d4", bg: "bg-cyan-500/5", border: "border-cyan-500/20", text: "text-cyan-400", badge: "bg-cyan-500/10 text-cyan-400", glow: "shadow-[0_0_20px_rgba(6,182,212,0.05)]" },
  { name: "Orange", value: "orange", hex: "#f97316", bg: "bg-orange-500/5", border: "border-orange-500/20", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-400", glow: "shadow-[0_0_20px_rgba(249,115,22,0.05)]" },
  { name: "Fuchsia", value: "fuchsia", hex: "#d946ef", bg: "bg-fuchsia-500/5", border: "border-fuchsia-500/20", text: "text-fuchsia-400", badge: "bg-fuchsia-500/10 text-fuchsia-400", glow: "shadow-[0_0_20px_rgba(217,70,239,0.05)]" },
  { name: "Pink", value: "pink", hex: "#ec4899", bg: "bg-pink-500/5", border: "border-pink-500/20", text: "text-pink-400", badge: "bg-pink-500/10 text-pink-400", glow: "shadow-[0_0_20px_rgba(236,72,153,0.05)]" },
  { name: "Teal", value: "teal", hex: "#14b8a6", bg: "bg-teal-500/5", border: "border-teal-500/20", text: "text-teal-400", badge: "bg-teal-500/10 text-teal-400", glow: "shadow-[0_0_20px_rgba(20,184,166,0.05)]" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const getTaskTag = (title) => {
  const t = title ? title.toLowerCase() : "";
  if (t.includes("bug") || t.includes("erreur") || t.includes("problème") || t.includes("fix")) {
    return { label: "Bug", bg: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
  }
  if (t.includes("feat") || t.includes("créer") || t.includes("implémenter") || t.includes("ajout") || t.includes("nouv")) {
    return { label: "Feature", bg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" };
  }
  if (t.includes("doc") || t.includes("rédiger") || t.includes("écrire") || t.includes("test") || t.includes("revoir")) {
    return { label: "Refacto/Test", bg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
  }
  return { label: "Tâche", bg: "bg-slate-500/10 text-slate-400 border border-slate-500/20" };
};

import {
  DndContext, useSensor, useSensors, MouseSensor, TouchSensor,
  closestCenter, pointerWithin, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, arrayMove,
  verticalListSortingStrategy, useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const isColumnDone = (col) => {
  if (!col) return false;
  const title = (col.title || "").toLowerCase();
  return col.category === "DONE" || 
         title.includes("terminé") || 
         title.includes("termine") || 
         (title.includes("a faire") === false && title.includes("à faire") === false && (
           title.includes("fait") || 
           title === "done" || 
           title === "completed"
         ));
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal d'édition de tâche
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Select Personnalisé (Dropdown) pour remplacer le select natif basique
// ─────────────────────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-white glass-input text-left cursor-pointer hover:border-white/10 active:scale-[0.99] transition-all"
      >
        <span>{selectedOption ? selectedOption.label : "Sélectionner..."}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          style={{ backgroundColor: "#0f172a" }}
          className="absolute z-50 w-full mt-1.5 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors cursor-pointer flex items-center justify-between
                ${opt.value === value ? "bg-indigo-600/30 text-indigo-200" : "text-slate-300"}`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal d'édition de tâche
// ─────────────────────────────────────────────────────────────────────────────
function TaskEditModal({ isOpen, task, currentColumnId, columns, boardId, onClose, onUpdated, onMoved, addToast }) {
  const modalRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setSelectedColumnId(currentColumnId || "");
    }
  }, [isOpen, task, currentColumnId]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const taskId = task._id || task.id;
  const columnChanged = selectedColumnId !== currentColumnId;
  const hasChanges = title.trim() !== task.title || description !== (task.description || "") || columnChanged;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      // 1. Mettre à jour titre / description si changé
      const titleChanged = title.trim() !== task.title;
      const descChanged = description !== (task.description || "");

      let updatedTask = task;
      if (titleChanged || descChanged) {
        updatedTask = await apiService.updateTask(boardId, taskId, title.trim(), description);
        onUpdated(updatedTask, currentColumnId);
      }

      // 2. Changer de colonne si changé
      if (columnChanged) {
        await apiService.moveTask(boardId, taskId, currentColumnId, selectedColumnId, 0, null, null);
        onMoved(taskId, currentColumnId, selectedColumnId, { ...updatedTask, title: title.trim(), description });
      }

      addToast("La tâche a été mise à jour !", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erreur lors de la mise à jour de la tâche.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      {/* Backdrop click → fermer */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-2xl"
      >
        {/* Halo décoratif */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

        {/* En-tête */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Modifier la tâche</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Colonne actuelle :{" "}
              <span className="text-indigo-400 font-medium">
                {columns.find((c) => (c._id || c.id) === currentColumnId)?.title || "—"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Champs */}
        <div className="space-y-4 relative z-20">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white glass-input"
              placeholder="Titre de la tâche..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-xs text-white glass-input resize-none h-28"
              placeholder="Description (optionnelle)..."
            />
          </div>

          {/* Sélecteur de colonne */}
          <div className="relative z-20">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Colonne
            </label>
            <CustomSelect
              value={selectedColumnId}
              onChange={setSelectedColumnId}
              options={columns.map((col) => {
                const colId = col._id || col.id;
                return {
                  value: colId,
                  label: col.title + (colId === currentColumnId ? " (actuelle)" : ""),
                };
              })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving || !hasChanges}
            className="bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-medium text-xs px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isSaving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Enregistrement...</span></>
              : <span>Enregistrer</span>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de création de tâche
// ─────────────────────────────────────────────────────────────────────────────
function TaskCreateModal({ isOpen, columnId, columns, boardId, onClose, onCreated, addToast }) {
  const modalRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTitle("");
      setDescription("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.95, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  if (!isOpen || !columnId) return null;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const data = await apiService.createTask(boardId, columnId, title.trim(), description.trim());
      if (data) {
        onCreated(data, columnId);
        addToast("La tâche a été créée avec succès !", "success");
        onClose();
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erreur lors de la création de la tâche.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const colTitle = columns.find((c) => (c._id || c.id) === columnId)?.title || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      {/* Backdrop click → fermer */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-2xl"
      >
        {/* Halo décoratif */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

        {/* En-tête */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Ajouter une tâche</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dans la colonne : <span className="text-indigo-400 font-medium">{colTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Champs */}
        <div className="space-y-4 relative z-20">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white glass-input"
              placeholder="Titre de la tâche..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-xs text-white glass-input resize-none h-28"
              placeholder="Description (optionnelle)..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-medium text-xs px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Création...</span>
              </>
            ) : (
              <span>Ajouter</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tâche triable (drag + click → modal)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Tâche triable (drag + click → modal)
// ─────────────────────────────────────────────────────────────────────────────
function SortableTask({ task, colColor, isCompleted, onToggleComplete, onDelete, onClick }) {
  const taskId = task._id || task.id;
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: taskId, data: { type: "task" } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    touchAction: "pan-y",
  };

  const colorObj = COLUMN_COLORS.find((c) => c.value === colColor) || COLUMN_COLORS[0];
  const tagInfo = getTaskTag(task.title);

  // local check state to allow delayed transitions (5 seconds completion delay)
  const [localChecked, setLocalChecked] = useState(isCompleted);
  const timeoutRef = useRef(null);

  // Sync state with parent props (e.g. on Drag & Drop)
  useEffect(() => {
    setLocalChecked(isCompleted);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isCompleted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCheckboxClick = () => {
    if (isCompleted) return; // Prevent changes if task is already in completed column

    const nextChecked = !localChecked;
    setLocalChecked(nextChecked);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (nextChecked !== isCompleted) {
      if (nextChecked) {
        // Delay complete transition for ~5 seconds
        timeoutRef.current = setTimeout(() => {
          onToggleComplete();
          timeoutRef.current = null;
        }, 5000);
      } else {
        // Move back instantly
        onToggleComplete();
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: colorObj.hex,
      }}
      {...attributes}
      {...listeners}
      onClick={isCompleted ? undefined : onClick}
      className={`bg-slate-950/40 border border-white/5 border-l-2 hover:border-r-indigo-500/10 p-4 rounded-lg shadow-sm
        hover:shadow-indigo-500/5 transition-all duration-200 group flex flex-col gap-2
        ${isDragging ? "border-indigo-500/30 shadow-md shadow-indigo-500/5" : ""}
        ${isCompleted ? "cursor-default select-none" : "cursor-pointer"}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className={`self-start px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${tagInfo.bg}`}>
            {tagInfo.label}
          </span>
          <div className="flex items-center gap-2 mt-1">
            {/* Custom Checkbox */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!isCompleted) {
                  handleCheckboxClick();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0
                ${localChecked 
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]" 
                  : "bg-slate-950/60 border-white/10 hover:border-indigo-500/40 text-transparent"}
                ${isCompleted ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              title={isCompleted ? "Tâche finalisée (non modifiable)" : "Marquer comme terminée"}
            >
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className={`font-semibold text-sm group-hover:text-indigo-300 transition-colors break-words
              ${localChecked ? "text-slate-500 line-through decoration-slate-600" : "text-slate-100"}`}
            >
              {task.title}
            </h4>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4.5 h-4.5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-indigo-400 uppercase">
            {task.title ? task.title.charAt(0) : "T"}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Assigné</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(task.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// Ghost tâche (DragOverlay)
function TaskGhost({ task }) {
  const tagInfo = getTaskTag(task.title);
  return (
    <div className="bg-slate-950/80 border border-indigo-500/30 p-4 rounded-lg shadow-xl shadow-indigo-500/10 opacity-95 rotate-1 w-72 flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <span className={`self-start px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${tagInfo.bg}`}>
          {tagInfo.label}
        </span>
        <h4 className="font-semibold text-sm text-indigo-300 break-words">{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone conteneur de tâches (simple div sans useDroppable pour éviter les conflits d'ID)
// ─────────────────────────────────────────────────────────────────────────────
function ColumnTasksContainer({ children }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colonne triable — tout l'en-tête est la poignée de drag
// ─────────────────────────────────────────────────────────────────────────────
function SortableColumn({
  col, onAddTaskClick, onDeleteColumn, onDeleteTask, onTaskClick,
  onUpdateColumn, canDelete, onToggleComplete, isTabActive, isMobile,
}) {
  const colId = col._id || col.id;
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: colId, data: { type: "column" } });

  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };
  const colColor = COLUMN_COLORS.find((c) => c.value === col.color) || COLUMN_COLORS[0];
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(col.title);
  const [editColor, setEditColor] = useState(col.color || "indigo");
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    setEditTitle(col.title);
    setEditColor(col.color || "indigo");
  }, [col.title, col.color]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    const titleChanged = editTitle.trim() !== col.title;
    if (isColumnDone(col) && titleChanged) {
      setShowWarningModal(true);
    } else {
      onUpdateColumn(colId, editTitle.trim(), editColor);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(col.title);
    setEditColor(col.color || "indigo");
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: `${colColor.hex}2b`,     // ~17% color tint border
      }}
      className={`${isMobile ? (isTabActive ? "flex w-full animate-fade-in" : "hidden") : "flex w-80 shrink-0"} glass-panel border rounded-xl flex-col max-h-[70vh] overflow-hidden shadow-xl transition-all duration-300 ${colColor.glow} ${isDragging ? "border-indigo-500/40" : ""}`}
    >
      {/* Barre de couleur supérieure */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: colColor.hex }} />
      {isEditing ? (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-4 border-b border-white/5 bg-slate-950/40 space-y-3"
        >
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nom de la colonne
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white glass-input placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Couleur de la colonne</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setEditColor(c.value)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90
                    ${editColor === c.value ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110" : "opacity-60"}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={!editTitle.trim() || (editTitle.trim() === col.title && editColor === col.color)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-white text-[10px] px-2 py-1.5 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        /* En-tête — toute la zone est la poignée de drag et déclenche l'édition sur click simple */
        <div
          {...attributes}
          {...listeners}
          onClick={() => setIsEditing(true)}
          className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20
            cursor-grab active:cursor-grabbing select-none hover:bg-slate-950/40 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3
              className="font-bold text-white text-sm tracking-tight truncate max-w-[140px]"
              title="Cliquez pour modifier"
            >
              {col.title}
            </h3>
            {isColumnDone(col) && (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium shrink-0" title="Cette colonne est la destination finale obligatoire">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                🔒 Terminé
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colColor.badge} shrink-0`}>
              {col.tasks.length}
            </span>
          </div>
          {/* Bouton supprimer — stoppe la propagation pour ne pas déclencher le drag ou l'édition */}
          {canDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteColumn(colId); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer shrink-0 ml-2"
              title="Supprimer la colonne"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              onPointerDown={(e) => e.stopPropagation()}
              className="text-slate-600 opacity-30 p-1 rounded shrink-0 ml-2 cursor-not-allowed"
              title={isColumnDone(col) ? "Colonne finale obligatoire" : "Dernière colonne restante"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Liste des tâches */}
      <SortableContext
        items={col.tasks.map((task) => task._id || task.id)}
        strategy={verticalListSortingStrategy}
      >
        <ColumnTasksContainer>
          {col.tasks.map((task) => (
            <SortableTask
              key={task._id || task.id}
              task={task}
              colColor={col.color}
              isCompleted={isColumnDone(col)}
              onToggleComplete={() => onToggleComplete(task, colId)}
              onDelete={() => onDeleteTask(task._id || task.id)}
              onClick={() => onTaskClick(task, colId)}
            />
          ))}
          {col.tasks.length === 0 && (
            <div className="py-8 text-center pointer-events-none">
              <p className="text-xs text-slate-500">Aucune tâche</p>
            </div>
          )}
        </ColumnTasksContainer>
      </SortableContext>

      {/* Bouton d'ajout de tâche */}
      <div className="p-3 bg-slate-950/20 border-t border-white/5">
        <button
          onClick={() => onAddTaskClick(colId)}
          className={`w-full text-left py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:bg-white/5 hover:${colColor.text} transition-all flex items-center gap-1.5 cursor-pointer`}
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter une tâche
        </button>
      </div>

      {showWarningModal && (
        <ConfirmModal
          isOpen={showWarningModal}
          title="⚠️ Attention — Colonne Sensible"
          message="Vous modifiez le nom de la destination finale de vos tâches. Assurez-vous de garder un nom clair (ex: Fait, Terminé, Validé) pour votre équipe."
          onConfirm={() => {
            onUpdateColumn(colId, editTitle.trim(), editColor);
            setShowWarningModal(false);
            setIsEditing(false);
          }}
          onCancel={() => {
            setShowWarningModal(false);
          }}
          confirmText="Valider le changement"
          cancelText="Annuler"
          type="info"
        />
      )}
    </div>
  );
}

// Ghost colonne (DragOverlay)
function ColumnGhost({ col }) {
  const colColor = COLUMN_COLORS.find((c) => c.value === col.color) || COLUMN_COLORS[0];
  return (
    <div
      style={{
        borderColor: `${colColor.hex}40`,     // ~25% color tint border
      }}
      className={`w-80 shrink-0 glass-panel border rounded-xl flex flex-col shadow-2xl ${colColor.glow} opacity-95 rotate-1 max-h-64 overflow-hidden`}
    >
      {/* Barre de couleur supérieure */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: colColor.hex }} />
      <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-slate-950/40 select-none">
        <h3 className="font-bold text-indigo-300 text-sm tracking-tight truncate">{col.title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colColor.badge}`}>
          {col.tasks.length}
        </span>
      </div>
      <div className="p-3 space-y-2 overflow-hidden">
        {col.tasks.slice(0, 3).map((task) => (
          <div key={task._id || task.id} className="bg-slate-950/40 border border-white/5 p-2.5 rounded-lg">
            <p className="text-xs text-slate-300 truncate">{task.title}</p>
          </div>
        ))}
        {col.tasks.length > 3 && (
          <p className="text-xs text-slate-500 text-center">+{col.tasks.length - 3} tâche(s)…</p>
        )}
      </div>
    </div>
  );
}

// Onglet triable (mobile DND)
function SortableTab({ col, isSelected, onClick }) {
  const colId = col._id || col.id;
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: colId, data: { type: "column-tab" } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    touchAction: "pan-x",
  };

  const colColor = COLUMN_COLORS.find((c) => c.value === col.color) || COLUMN_COLORS[0];

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      id={`tab-${colId}`}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border cursor-pointer select-none
        ${isSelected 
          ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.15)]" 
          : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200"}
        ${isDragging ? "border-indigo-500/40" : ""}`}
    >
      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: colColor.hex }} />
      <span>{col.title}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"}`}>
        {col.tasks.length}
      </span>
    </button>
  );
}

// Ghost onglet (DragOverlay)
function TabGhost({ col }) {
  const colColor = COLUMN_COLORS.find((c) => c.value === col.color) || COLUMN_COLORS[0];
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border bg-indigo-600/20 border-indigo-500/40 text-indigo-200 shadow-xl opacity-90 rotate-1"
    >
      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: colColor.hex }} />
      <span>{col.title}</span>
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300">
        {col.tasks.length}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Détection de collision personnalisée pour Kanban (distingue colonnes & tâches)
// ─────────────────────────────────────────────────────────────────────────────
const customCollisionDetection = (args) => {
  const { active, droppableContainers } = args;
  const activeType = active.data.current?.type;

  if (activeType === "column") {
    // Pour les colonnes, on ne collisionne qu'avec d'autres colonnes
    const columnContainers = droppableContainers.filter(
      (container) => container.data.current?.type === "column"
    );
    return closestCenter({
      ...args,
      droppableContainers: columnContainers,
    });
  }

  if (activeType === "column-tab") {
    // Pour les onglets de colonnes, on ne collisionne qu'avec d'autres onglets
    const tabContainers = droppableContainers.filter(
      (container) => container.data.current?.type === "column-tab"
    );
    return closestCenter({
      ...args,
      droppableContainers: tabContainers,
    });
  }

  // Pour les tâches :
  // 1. Chercher d'abord s'il y a des intersections sous le pointeur
  const pointerCollisions = pointerWithin(args);
  
  // Si on a des collisions sous le pointeur, on privilégie les tâches par rapport aux colonnes
  if (pointerCollisions.length > 0) {
    const taskCollision = pointerCollisions.find(
      (c) => c.data?.droppableContainer?.data?.current?.type === "task"
    );
    if (taskCollision) {
      return [taskCollision];
    }
    return pointerCollisions;
  }

  // 2. Si aucune intersection sous le pointeur, on utilise closestCenter
  const centerCollisions = closestCenter(args);
  if (centerCollisions.length > 0) {
    const taskCollision = centerCollisions.find(
      (c) => c.data?.droppableContainer?.data?.current?.type === "task"
    );
    if (taskCollision) {
      return [taskCollision];
    }
  }
  return centerCollisions;
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant Principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Board() {
  const { boardId } = useParams();
  const { user, logout } = useAuth();
  const { version } = useVersion();

  const [boardTitle, setBoardTitle] = useState("Chargement...");
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeColTab, setActiveColTab] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  // Modal d'édition de tâche
  const [taskModal, setTaskModal] = useState({ isOpen: false, task: null, columnId: null });

  const addToast = (message, type = "success") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); closeConfirmModal(); } });
  };
  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // Création colonne / tâche
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState("indigo");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [createTaskModal, setCreateTaskModal] = useState({ isOpen: false, columnId: null });
  const startColumnIdRef = useRef(null);
  const columnsContainerRef = useRef(null);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

   const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    const activeEl = e.target;
    if (
      activeEl.tagName === "INPUT" ||
      activeEl.tagName === "TEXTAREA" ||
      activeEl.closest("button") ||
      activeEl.closest("input") ||
      activeEl.closest("textarea")
    ) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXRef.current - touchEndX;
    const diffY = touchStartYRef.current - touchEndY;

    // Horizontal swipe threshold: 60px distance, vertical constraint: < 40px
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 40) {
      const allTabs = [...columns.map((c) => c._id || c.id), "create"];
      const currentIndex = allTabs.indexOf(activeColTab);

      if (diffX > 0) {
        // Swipe left -> Next tab
        if (currentIndex !== -1 && currentIndex < allTabs.length - 1) {
          setActiveColTab(allTabs[currentIndex + 1]);
        }
      } else {
        // Swipe right -> Previous tab
        if (currentIndex > 0) {
          setActiveColTab(allTabs[currentIndex - 1]);
        }
      }
    }
  };

  // Drag overlay
  const [activeDragItem, setActiveDragItem] = useState(null);

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

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadBoardData = useCallback(async () => {
    try {
      setIsLoading(true);
      try {
        const board = await apiService.getBoard(boardId);
        setBoardTitle(board.title);
      } catch {
        setBoardTitle("Tableau Kanban");
      }

      const columnsData = await apiService.getColumns(boardId);
      let columnsWithTasks = [];
      if (version === "v2") {
        columnsWithTasks = columnsData.map((col) => ({ ...col, tasks: col.tasks || [] }));
      } else {
        columnsWithTasks = await Promise.all(
          columnsData.map(async (col) => {
            try {
              const tasks = await apiService.getTasks(boardId, col._id || col.id);
              return { ...col, tasks };
            } catch {
              return { ...col, tasks: [] };
            }
          })
        );
      }
      setColumns(columnsWithTasks);
      if (columnsWithTasks.length > 0) {
        const firstId = columnsWithTasks[0]._id || columnsWithTasks[0].id;
        setActiveColTab((prev) => {
          const tabExists = columnsWithTasks.some((c) => (c._id || c.id) === prev) || prev === "create";
          return tabExists ? prev : firstId;
        });
      }
    } catch {
      addToast("Erreur lors du chargement des données de votre tableau.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [boardId, version]);

  useEffect(() => { if (boardId) loadBoardData(); }, [boardId, version, loadBoardData]);

  // Centrer l'onglet actif sur mobile
  useEffect(() => {
    if (isMobile && activeColTab) {
      const activeEl = document.getElementById(`tab-${activeColTab}`);
      if (activeEl) {
        const parent = activeEl.parentElement;
        if (parent && parent.tagName !== "HEADER") {
          const parentWidth = parent.clientWidth;
          const elementLeft = activeEl.offsetLeft;
          const elementWidth = activeEl.clientWidth;
          const targetScrollLeft = elementLeft - (parentWidth / 2) + (elementWidth / 2);
          
          parent.scrollTo({
            left: targetScrollLeft,
            behavior: "smooth"
          });
        }
      }
    }
    // Réinitialiser le décalage horizontal après la mise à jour du DOM pour éviter tout décalage d'affichage de la colonne active (mobile uniquement)
    const timer = setTimeout(() => {
      if (isMobile && columnsContainerRef.current) {
        columnsContainerRef.current.scrollLeft = 0;
      }
      // Sécurité anti-décalage horizontal global du viewport
      window.scrollTo(0, window.scrollY);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeColTab, isMobile]);

  // ── Utilitaires ─────────────────────────────────────────────────────────────
  const findColumnOfTask = (taskId) => {
    if (columns.some((col) => (col._id || col.id) === taskId)) return taskId;
    const col = columns.find((col) => col.tasks.some((t) => (t._id || t.id) === taskId));
    return col ? col._id || col.id : null;
  };

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    const type = active.data.current?.type;
    if (type === "column") {
      const col = columns.find((c) => (c._id || c.id) === active.id);
      setActiveDragItem({ type: "column", data: col });
    } else if (type === "column-tab") {
      const col = columns.find((c) => (c._id || c.id) === active.id);
      setActiveDragItem({ type: "column-tab", data: col });
    } else {
      const colId = findColumnOfTask(active.id);
      startColumnIdRef.current = colId;
      const col = columns.find((c) => (c._id || c.id) === colId);
      const task = col?.tasks.find((t) => (t._id || t.id) === active.id);
      setActiveDragItem({ type: "task", data: task });
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type;

    // ── Drag colonne ──
    if (activeType === "column") {
      let targetColId = null;
      if (over.data.current?.type === "column") {
        targetColId = over.id;
      } else {
        const parentCol = columns.find(
          (c) =>
            (c._id || c.id) === over.id ||
            c.tasks.some((t) => (t._id || t.id) === over.id)
        );
        targetColId = parentCol ? parentCol._id || parentCol.id : null;
      }

      if (!targetColId || targetColId === active.id) return;

      setColumns((prev) => {
        const oldIdx = prev.findIndex((c) => (c._id || c.id) === active.id);
        const newIdx = prev.findIndex((c) => (c._id || c.id) === targetColId);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
      return;
    }

    // ── Drag colonne-tab (mobile tabs) ──
    if (activeType === "column-tab") {
      let targetColId = null;
      if (over.data.current?.type === "column-tab") {
        targetColId = over.id;
      }

      if (!targetColId || targetColId === active.id) return;

      setColumns((prev) => {
        const oldIdx = prev.findIndex((c) => (c._id || c.id) === active.id);
        const newIdx = prev.findIndex((c) => (c._id || c.id) === targetColId);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
      return;
    }

    // ── Drag tâche ──
    if (activeType === "task") {
      const activeColId = findColumnOfTask(active.id);
      const overColId = findColumnOfTask(over.id);
      if (!activeColId || !overColId) return;

      if (activeColId !== overColId) {
        // Inter-colonnes : déplacement en temps réel
        setColumns((prev) => {
          const activeCol = prev.find((c) => (c._id || c.id) === activeColId);
          const activeTask = activeCol?.tasks.find((t) => (t._id || t.id) === active.id);
          if (!activeTask) return prev;

          const overCol = prev.find((c) => (c._id || c.id) === overColId);
          const overTaskIdx = overCol.tasks.findIndex((t) => (t._id || t.id) === over.id);
          const insertIdx = overTaskIdx >= 0 ? overTaskIdx : overCol.tasks.length;

          return prev.map((col) => {
            const colId = col._id || col.id;
            if (colId === activeColId)
              return { ...col, tasks: col.tasks.filter((t) => (t._id || t.id) !== active.id) };
            if (colId === overColId) {
              const newTasks = col.tasks.filter((t) => (t._id || t.id) !== active.id);
              newTasks.splice(insertIdx, 0, activeTask);
              return { ...col, tasks: newTasks };
            }
            return col;
          });
        });
      } else {
        // Même colonne : réordonner en temps réel
        setColumns((prev) => {
          const colIdx = prev.findIndex((c) => (c._id || c.id) === activeColId);
          if (colIdx === -1) return prev;
          
          const col = prev[colIdx];
          const oldIndex = col.tasks.findIndex((t) => (t._id || t.id) === active.id);
          const newIndex = col.tasks.findIndex((t) => (t._id || t.id) === over.id);
          
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
          
          const newTasks = arrayMove(col.tasks, oldIndex, newIndex);
          return prev.map((c, idx) => idx === colIdx ? { ...c, tasks: newTasks } : c);
        });
      }
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveDragItem(null);
    const activeType = active.data.current?.type;

    // ── Fin drag colonne : persister le nouvel ordre ──
    if (activeType === "column") {
      if (!over) {
        loadBoardData();
        return;
      }
      const finalIdx = columns.findIndex((c) => (c._id || c.id) === active.id);
      if (finalIdx === -1) return;
      const colBefore = finalIdx > 0 ? columns[finalIdx - 1] : null;
      const colAfter  = finalIdx < columns.length - 1 ? columns[finalIdx + 1] : null;
      const posBefore = colBefore ? (version === "v2" ? colBefore.positionV2 : colBefore.positionV1) ?? null : null;
      const posAfter  = colAfter  ? (version === "v2" ? colAfter.positionV2  : colAfter.positionV1)  ?? null : null;
      try {
        await apiService.moveColumn(boardId, active.id, posBefore, posAfter);
      } catch (err) {
        addToast(err.message || "Impossible de sauvegarder la position de la colonne.", "error");
        loadBoardData();
      }
      return;
    }

    // ── Fin drag colonne-tab (mobile tabs) : persister le nouvel ordre ──
    if (activeType === "column-tab") {
      if (!over) {
        loadBoardData();
        return;
      }
      const finalIdx = columns.findIndex((c) => (c._id || c.id) === active.id);
      if (finalIdx === -1) return;
      const colBefore = finalIdx > 0 ? columns[finalIdx - 1] : null;
      const colAfter  = finalIdx < columns.length - 1 ? columns[finalIdx + 1] : null;
      const posBefore = colBefore ? (version === "v2" ? colBefore.positionV2 : colBefore.positionV1) ?? null : null;
      const posAfter  = colAfter  ? (version === "v2" ? colAfter.positionV2  : colAfter.positionV1)  ?? null : null;
      try {
        await apiService.moveColumn(boardId, active.id, posBefore, posAfter);
      } catch (err) {
        addToast(err.message || "Impossible de sauvegarder la position de la colonne.", "error");
        loadBoardData();
      }
      return;
    }

    // ── Fin drag tâche ──
    const startColId = startColumnIdRef.current;
    startColumnIdRef.current = null; // reset

    const currentColId = findColumnOfTask(active.id);
    if (!startColId || !currentColId) {
      loadBoardData();
      return;
    }

    const targetCol = columns.find((c) => (c._id || c.id) === currentColId);
    if (!targetCol) {
      loadBoardData();
      return;
    }

    const finalIndex = targetCol.tasks.findIndex((t) => (t._id || t.id) === active.id);
    if (finalIndex === -1) {
      loadBoardData();
      return;
    }

    const taskBefore = finalIndex > 0 ? targetCol.tasks[finalIndex - 1] : null;
    const taskAfter  = finalIndex < targetCol.tasks.length - 1 ? targetCol.tasks[finalIndex + 1] : null;
    const positionBefore = taskBefore ? (version === "v2" ? taskBefore.positionV2 : taskBefore.positionV1) : null;
    const positionAfter  = taskAfter  ? (version === "v2" ? taskAfter.positionV2  : taskAfter.positionV1)  : null;

    try {
      await apiService.moveTask(boardId, active.id, startColId, currentColId, finalIndex, positionBefore, positionAfter);
    } catch (err) {
      addToast(err.message || "Impossible de sauvegarder le changement de position.", "error");
      loadBoardData();
    }
  };

  // ── CRUD Colonnes ────────────────────────────────────────────────────────────
  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    setIsCreatingColumn(true);
    try {
      const data = await apiService.createColumn(boardId, newColumnTitle.trim(), selectedColor);
      if (data) {
        setColumns((prev) => [...prev, { ...data, tasks: [] }]);
        setNewColumnTitle("");
        setSelectedColor("indigo");
        const newColId = data._id || data.id;
        setActiveColTab(newColId);
        addToast("La colonne a été créée avec succès !", "success");

        // Fait défiler le conteneur horizontal vers la droite pour afficher la nouvelle colonne (mode tablette / desktop)
        if (columnsContainerRef.current) {
          setTimeout(() => {
            if (columnsContainerRef.current) {
              columnsContainerRef.current.scrollTo({
                left: columnsContainerRef.current.scrollWidth,
                behavior: "smooth"
              });
            }
          }, 100);
        }
      }
    } catch (err) {
      addToast(err.message || "Erreur lors de la création de la colonne.", "error");
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleCancelCreateColumn = () => {
    if (columns.length > 0) {
      const firstColId = columns[0]._id || columns[0].id;
      setActiveColTab(firstColId);
    }
  };

  const handleDeleteColumn = (columnId) => {
    openConfirmModal(
      "Supprimer la colonne",
      "Voulez-vous vraiment supprimer cette colonne et toutes les tâches qu'elle contient ? Cette action est définitive.",
      async () => {
        try {
          await apiService.deleteColumn(boardId, columnId);
          setColumns((prev) => {
            const nextCols = prev.filter((col) => (col._id || col.id) !== columnId);
            if (activeColTab === columnId && nextCols.length > 0) {
              setActiveColTab(nextCols[0]._id || nextCols[0].id);
            }
            return nextCols;
          });
          addToast("La colonne a été supprimée !", "success");
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message || "Impossible de supprimer la colonne.";
          addToast(errMsg, "error");
        }
      }
    );
  };

  const handleUpdateColumn = async (columnId, title, color) => {
    try {
      const data = await apiService.updateColumn(boardId, columnId, title, color);
      if (data) {
        setColumns((prev) =>
          prev.map((col) =>
            (col._id || col.id) === columnId ? { ...col, title: data.title, color: data.color } : col
          )
        );
        addToast("La colonne a été mise à jour avec succès !", "success");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Erreur lors de la mise à jour de la colonne.";
      addToast(errMsg, "error");
    }
  };

  const handleToggleCompleteTask = async (task, sourceColId) => {
    const taskId = task._id || task.id;
    const doneCol = columns.find((c) => isColumnDone(c)) || 
                    columns[columns.length - 1];
                    
    const todoCol = columns.find((c) => c.category === "TO_DO") || 
                    columns.find((c) => c.title.toLowerCase().includes("à faire") || c.title.toLowerCase().includes("a faire")) ||
                    columns[0];

    const sourceCol = columns.find((c) => (c._id || c.id) === sourceColId);
    const currentIsDone = isColumnDone(sourceCol);
    const targetCol = currentIsDone ? todoCol : doneCol;
    
    if (!targetCol) {
      addToast("Colonne cible introuvable.", "error");
      return;
    }
    
    const targetColId = targetCol._id || targetCol.id;
    if (sourceColId === targetColId) return;
    
    try {
      await apiService.moveTask(boardId, taskId, sourceColId, targetColId, 0, null, null);
      
      setColumns((prevColumns) => {
        return prevColumns.map((col) => {
          const colId = col._id || col.id;
          if (colId === sourceColId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => (t._id || t.id) !== taskId),
            };
          }
          if (colId === targetColId) {
            return {
              ...col,
              tasks: [task, ...col.tasks],
            };
          }
          return col;
        });
      });
      
      addToast(
        currentIsDone 
          ? "Tâche marquée comme non terminée." 
          : "Tâche marquée comme terminée !", 
        "success"
      );
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || err.message || "Erreur lors du changement d'état de la tâche.", "error");
    }
  };

  // ── CRUD Tâches ─────────────────────────────────────────────────────────────
  const handleOpenCreateTaskModal = (columnId) => {
    setCreateTaskModal({ isOpen: true, columnId });
  };

  const handleDeleteTask = (taskId) => {
    const columnId = findColumnOfTask(taskId);
    openConfirmModal(
      "Supprimer la tâche",
      "Voulez-vous vraiment supprimer cette tâche ? Cette action est définitive.",
      async () => {
        try {
          await apiService.deleteTask(boardId, columnId, taskId);
          setColumns((prev) =>
            prev.map((col) => ({ ...col, tasks: col.tasks.filter((t) => (t._id || t.id) !== taskId) }))
          );
          addToast("La tâche a été supprimée !", "success");
        } catch (err) {
          addToast(err.message || "Impossible de supprimer la tâche.", "error");
        }
      }
    );
  };

  const handleTaskClick = (task, columnId) => {
    setTaskModal({ isOpen: true, task, columnId });
  };

  // Callback quand le modal met à jour titre/description
  const handleTaskUpdated = (updatedTask, columnId) => {
    const taskId = updatedTask._id || updatedTask.id;
    setColumns((prev) =>
      prev.map((col) =>
        (col._id || col.id) === columnId
          ? { ...col, tasks: col.tasks.map((t) => ((t._id || t.id) === taskId ? { ...t, ...updatedTask } : t)) }
          : col
      )
    );
  };

  // Callback quand le modal déplace vers une autre colonne
  const handleTaskMoved = (taskId, fromColId, toColId, updatedTask) => {
    setColumns((prev) =>
      prev.map((col) => {
        const colId = col._id || col.id;
        if (colId === fromColId) return { ...col, tasks: col.tasks.filter((t) => (t._id || t.id) !== taskId) };
        if (colId === toColId) return { ...col, tasks: [...col.tasks, updatedTask] };
        return col;
      })
    );
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header */}
      <Header boardTitle={boardTitle} />

      {/* Zone principale */}
      <main className="flex-1 flex flex-col relative z-10 px-6 py-8 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-sm text-slate-400">Chargement de votre espace de travail...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Barre d'onglets pour mobile */}
            {isMobile && (
              <div className="sticky top-0 z-30 pb-4 pt-1 mb-4 flex flex-col gap-3">
                {/* Bouton Ajouter une colonne en haut (seul sur sa ligne) */}
                <button
                  id="tab-create"
                  onClick={() => setActiveColTab("create")}
                  className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer
                    ${activeColTab === "create"
                      ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200"}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une colonne</span>
                </button>

                {/* Liste de sélection des colonnes (en bas, défilante, dans l'ordre naturel) */}
                {columns.length > 0 && (
                  <SortableContext
                    items={columns.map((c) => c._id || c.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className={`flex gap-2 overflow-x-auto scrollbar-none py-1 ${columns.length <= 3 ? "justify-center" : "justify-start"}`}>
                      {columns.map((col) => {
                        const colId = col._id || col.id;
                        return (
                          <SortableTab
                            key={colId}
                            col={col}
                            isSelected={activeColTab === colId}
                            onClick={() => setActiveColTab(colId)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                )}
              </div>
            )}

            <SortableContext
              items={columns.map((c) => c._id || c.id)}
              strategy={rectSortingStrategy}
            >
              {/* Conteneur horizontal défilant pour toutes les colonnes sur une seule ligne */}
              <div 
                ref={columnsContainerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex-1 overflow-y-hidden pb-6 scrollbar-none ${isMobile ? "overflow-x-hidden" : "overflow-x-auto"}`}
              >
                <div
                  className={`flex flex-row flex-nowrap gap-6 items-start h-full ${isMobile ? "w-full" : "w-max"}`}
                >
                  {/* ── Carte "Créer une colonne" en PREMIÈRE position ── */}
                  {(!isMobile || activeColTab === "create") && (
                    <div className={`${isMobile ? (activeColTab === "create" ? "block w-full animate-fade-in" : "hidden") : "block w-80 shrink-0"} glass-panel p-4 rounded-xl border border-dashed border-white/10 hover:border-indigo-500/20 transition-all duration-300`}>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">Nouvelle étape</span>
                      <h3 className="text-sm font-bold text-white mb-4">Créer une colonne</h3>
                      <form onSubmit={handleCreateColumn} className="space-y-4">
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
                            {isCreatingColumn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Sélecteur de couleur avec espacement et étiquette */}
                        <div className="space-y-2 mt-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Couleur de la colonne</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {COLUMN_COLORS.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setSelectedColor(c.value)}
                                style={{ backgroundColor: c.hex }}
                                className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90
                                  ${selectedColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110" : "opacity-60"}`}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {isMobile && (
                          <button
                            type="button"
                            onClick={handleCancelCreateColumn}
                            className="w-full mt-4 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
                          >
                            Annuler
                          </button>
                        )}
                      </form>
                    </div>
                  )}

                  {/* ── Colonnes triables ── */}
                  {columns.map((col) => {
                    const colId = col._id || col.id;
                    const isTabActive = activeColTab === colId;
                    if (isMobile && !isTabActive) return null;
                    return (
                      <SortableColumn
                        key={colId}
                        col={col}
                        onAddTaskClick={handleOpenCreateTaskModal}
                        onDeleteColumn={handleDeleteColumn}
                        onDeleteTask={handleDeleteTask}
                        onTaskClick={handleTaskClick}
                        onUpdateColumn={handleUpdateColumn}
                        canDelete={!isColumnDone(col) && columns.length > 1}
                        onToggleComplete={handleToggleCompleteTask}
                        isTabActive={isTabActive}
                        isMobile={isMobile}
                      />
                    );
                  })}
                </div>
              </div>
            </SortableContext>

            {/* Ghost visuel pendant le drag */}
            <DragOverlay dropAnimation={null}>
              {activeDragItem?.type === "column" && <ColumnGhost col={activeDragItem.data} />}
              {activeDragItem?.type === "column-tab" && <TabGhost col={activeDragItem.data} />}
              {activeDragItem?.type === "task" && <TaskGhost task={activeDragItem.data} />}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modal d'édition de tâche */}
      <TaskEditModal
        isOpen={taskModal.isOpen}
        task={taskModal.task}
        currentColumnId={taskModal.columnId}
        columns={columns}
        boardId={boardId}
        onClose={() => setTaskModal({ isOpen: false, task: null, columnId: null })}
        onUpdated={handleTaskUpdated}
        onMoved={handleTaskMoved}
        addToast={addToast}
      />

      {/* Modal de création de tâche */}
      <TaskCreateModal
        isOpen={createTaskModal.isOpen}
        columnId={createTaskModal.columnId}
        columns={columns}
        boardId={boardId}
        onClose={() => setCreateTaskModal({ isOpen: false, columnId: null })}
        onCreated={(newTask, columnId) => {
          setColumns((prev) =>
            prev.map((col) =>
              (col._id || col.id) === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
            )
          );
        }}
        addToast={addToast}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
