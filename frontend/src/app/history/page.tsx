"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Award, 
  Sparkles, 
  BookOpen, 
  Clock, 
  FileText,
  StickyNote
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface TodoItem {
  id: string;
  text: string;
  subject: string;
  completed: boolean;
}

interface PostItNote {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "pink" | "mint" | "orange";
  rotation: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  // --- Pomodoro Focus States ---
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(3);

  // --- To-Do List States ---
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "t1", text: "Faire fiche de synthèse — Droit Administratif", subject: "Droit", completed: true },
    { id: "t2", text: "Réviser 15 Flashcards Droit Constitutionnel", subject: "Flashcards", completed: false },
    { id: "t3", text: "Résoudre QCM Algèbre Linéaire (Niveau Expert)", subject: "Maths", completed: false }
  ]);
  const [newTodoText, setNewTodoText] = useState<string>("");
  const [newTodoSubject, setNewTodoSubject] = useState<string>("Général");

  // --- Post-its / Notes Rapides ---
  const [notes, setNotes] = useState<PostItNote[]>([
    {
      id: "n1",
      title: "Théorème du Rang",
      content: "dim(E) = dim(Ker f) + rg(f). Toujours vérifier que E est de dimension finie !",
      color: "yellow",
      rotation: "-rotate-1"
    },
    {
      id: "n2",
      title: "Article 49.3",
      content: "Engagement responsabilité gouv. Pas de vote sauf motion de censure dans les 24h.",
      color: "mint",
      rotation: "rotate-1"
    },
    {
      id: "n3",
      title: "Rappel Examens",
      content: "Épreuve écrite le 14 mai. Penser à prendre la calculatrice non programmable.",
      color: "pink",
      rotation: "-rotate-2"
    }
  ]);

  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>("");
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const [newNoteColor, setNewNoteColor] = useState<"yellow" | "pink" | "mint" | "orange">("yellow");

  // Load persistence
  useEffect(() => {
    const savedTodos = localStorage.getItem("gama_student_todos");
    if (savedTodos) {
      try { setTodos(JSON.parse(savedTodos)); } catch (e) {}
    }
    const savedNotes = localStorage.getItem("gama_student_notes");
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch (e) {}
    }
  }, []);

  const saveTodos = (nextTodos: TodoItem[]) => {
    setTodos(nextTodos);
    localStorage.setItem("gama_student_todos", JSON.stringify(nextTodos));
  };

  const saveNotes = (nextNotes: PostItNote[]) => {
    setNotes(nextNotes);
    localStorage.setItem("gama_student_notes", JSON.stringify(nextNotes));
  };

  // Pomodoro Interval Effect
  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerMode === "focus") {
              setSessionsCompleted((s) => s + 1);
              setTimerMode("break");
              return 5 * 60;
            } else {
              setTimerMode("focus");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timerMode]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleTodo = (id: string) => {
    const next = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTodos(next);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const next = [
      ...todos,
      { id: "todo-" + Date.now(), text: newTodoText.trim(), subject: newTodoSubject, completed: false }
    ];
    saveTodos(next);
    setNewTodoText("");
  };

  const handleDeleteTodo = (id: string) => {
    saveTodos(todos.filter((t) => t.id !== id));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    const rotations = ["-rotate-2", "-rotate-1", "rotate-1", "rotate-2"];
    const randRot = rotations[Math.floor(Math.random() * rotations.length)];
    const next = [
      ...notes,
      {
        id: "note-" + Date.now(),
        title: newNoteTitle.trim() || "Note rapide",
        content: newNoteContent.trim(),
        color: newNoteColor,
        rotation: randRot
      }
    ];
    saveNotes(next);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNewNoteModal(false);
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const getPostItClass = (color: string) => {
    switch (color) {
      case "pink":
        return "bg-[#FFE4E6]";
      case "mint":
        return "bg-[#D1FAE5]";
      case "orange":
        return "bg-[#FFEDD5]";
      default:
        return "bg-[#FEF9C3]";
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FFFBF5]">
        <div className="p-4 md:p-8 flex flex-col max-w-6xl mx-auto gap-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-black pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#FF5500]">
                <LayoutDashboard size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
                  Bureau & Dashboard Étudiant
                </h1>
                <p className="text-xs md:text-sm font-bold text-black/60">
                  Votre espace d'hyper-concentration : Chrono Pomodoro, Tâches du jour et Post-its rapides.
                </p>
              </div>
            </div>
          </div>

          {/* Top Grid: Pomodoro & To-Do List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Pomodoro Focus Timer Card */}
            <div className="lg:col-span-5 bg-white border-3 border-black rounded-3xl p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_#000000]">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-[#FF5500]" />
                  <span className="font-black text-sm uppercase tracking-wide">Minuteur Focus Pomodoro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setTimerMode("focus");
                      setTimeLeft(25 * 60);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-black border border-black cursor-pointer ${
                      timerMode === "focus"
                        ? "bg-[#FF5500] text-white shadow-[2px_2px_0px_0px_#000000]"
                        : "bg-white text-black"
                    }`}
                  >
                    Focus 25'
                  </button>
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setTimerMode("break");
                      setTimeLeft(5 * 60);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-black border border-black cursor-pointer ${
                      timerMode === "break"
                        ? "bg-[#10B981] text-white shadow-[2px_2px_0px_0px_#000000]"
                        : "bg-white text-black"
                    }`}
                  >
                    Pause 5'
                  </button>
                </div>
              </div>

              {/* Big Timer Display */}
              <div className="my-8 flex flex-col items-center justify-center">
                <span className="text-6xl md:text-7xl font-black tracking-tighter text-black">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-black/50 mt-2">
                  {timerMode === "focus" ? "🔥 Session de concentration" : "☕ Pause récupération"}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer transition-all ${
                    isRunning ? "bg-black text-white" : "bg-[#FF5500] text-white hover:bg-black"
                  }`}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isRunning ? "Mettre en pause" : "Lancer le chrono"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    setTimeLeft(timerMode === "focus" ? 25 * 60 : 5 * 60);
                  }}
                  className="p-3 bg-white border-2 border-black rounded-2xl hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_#000000] cursor-pointer transition-all"
                  title="Réinitialiser"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* RIGHT: Interactive To-Do List */}
            <div className="lg:col-span-7 bg-white border-3 border-black rounded-3xl p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_#000000]">
              <div>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-[#FF5500]" />
                    <span className="font-black text-sm uppercase tracking-wide">Devoirs & Objectifs du Jour</span>
                  </div>
                  <span className="text-xs font-extrabold text-black/60">
                    {todos.filter((t) => t.completed).length}/{todos.length} accomplis
                  </span>
                </div>

                {/* Todo List Items */}
                <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => toggleTodo(todo.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 border-black cursor-pointer transition-all ${
                        todo.completed
                          ? "bg-black/5 opacity-60 line-through text-black/60"
                          : "bg-[#FAFAFA] hover:bg-white shadow-[2px_2px_0px_0px_#000000]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[#FF5500] cursor-pointer rounded"
                        />
                        <span className="font-extrabold text-xs md:text-sm">{todo.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                          {todo.subject}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTodo(todo.id);
                          }}
                          className="text-black/40 hover:text-red-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Todo Input */}
              <form onSubmit={handleAddTodo} className="mt-4 pt-3 border-t-2 border-black/10 flex items-center gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Ajouter une tâche ou un devoir..."
                  className="flex-1 p-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-xs outline-none focus:bg-white"
                />
                <select
                  value={newTodoSubject}
                  onChange={(e) => setNewTodoSubject(e.target.value)}
                  className="p-3 bg-white border-2 border-black rounded-xl font-black text-xs outline-none cursor-pointer"
                >
                  <option value="Général">Général</option>
                  <option value="Droit">Droit</option>
                  <option value="Maths">Maths</option>
                  <option value="Flashcards">Flashcards</option>
                  <option value="Anglais">Anglais</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-4 py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000] cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Section: Post-it Wall ("Cahier de Brouillon & Notes Rapides") */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote size={20} className="text-[#FF5500]" />
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  Cahier de Brouillon & Post-its
                </h2>
              </div>
              <button
                onClick={() => setShowNewNoteModal(true)}
                className="bg-black text-white hover:bg-[#FF5500] font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Coller un Post-it</span>
              </button>
            </div>

            {/* Post-it Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`${getPostItClass(
                    note.color
                  )} ${note.rotation} border-3 border-black rounded-2xl p-5 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between min-h-[160px] transition-transform hover:scale-102 relative`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm uppercase tracking-wide text-black">
                        {note.title}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-black/40 hover:text-red-600"
                        title="Détacher ce post-it"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-black/80 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-black/15 flex items-center justify-between text-[10px] font-black uppercase text-black/50">
                    <span>Gama Studio Note</span>
                    <span>📌 PING</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal: Add Post-it */}
        {showNewNoteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#FF5500] flex flex-col gap-5">
              <h3 className="text-xl font-black uppercase">Ajouter un Post-it</h3>
              <form onSubmit={handleAddNote} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1">
                    Titre du Post-it
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="ex: Formule Intégrale"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1">
                    Contenu ou Rappel
                  </label>
                  <textarea
                    rows={4}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Écrivez ici vos notes rapides ou rappels..."
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-sm outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-2">
                    Couleur du Post-it
                  </label>
                  <div className="flex items-center gap-3">
                    {(["yellow", "pink", "mint", "orange"] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewNoteColor(col)}
                        className={`w-9 h-9 rounded-xl border-2 border-black cursor-pointer ${getPostItClass(
                          col
                        )} ${newNoteColor === col ? "scale-110 shadow-[3px_3px_0px_0px_#000000]" : "opacity-60"}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewNoteModal(false)}
                    className="px-4 py-2 font-black text-xs hover:underline cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-5 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer"
                  >
                    Coller le Post-it
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
