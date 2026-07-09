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
  Sparkles, 
  Clock, 
  StickyNote
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";

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

  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const requireAuth = (callback: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    callback();
  };

  // --- Pomodoro Focus States ---
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // --- To-Do List States (Start clean without dummy examples) ---
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>("");
  const [newTodoSubject, setNewTodoSubject] = useState<string>("Général");

  // --- Post-its / Notes Rapides (Start clean without dummy examples) ---
  const [notes, setNotes] = useState<PostItNote[]>([]);
  const [showNewNoteModal, setShowNewNoteModal] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>("");
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const [newNoteColor, setNewNoteColor] = useState<"yellow" | "pink" | "mint" | "orange">("yellow");

  // Load persistence for Todos, Notes, and Pomodoro
  useEffect(() => {
    // Todos & Notes
    const savedTodosClean = localStorage.getItem("gama_student_todos_clean") || localStorage.getItem("gama_student_todos");
    if (savedTodosClean) {
      try { setTodos(JSON.parse(savedTodosClean)); } catch (e) {}
    }
    const savedNotesClean = localStorage.getItem("gama_student_notes_clean") || localStorage.getItem("gama_student_notes");
    if (savedNotesClean) {
      try { setNotes(JSON.parse(savedNotesClean)); } catch (e) {}
    }

    // Pomodoro Persistence across page navigation / refresh
    const savedMode = localStorage.getItem("gama_pomo_mode") as "focus" | "break" | null;
    if (savedMode === "focus" || savedMode === "break") {
      setTimerMode(savedMode);
    }
    const savedRunning = localStorage.getItem("gama_pomo_is_running");
    if (savedRunning === "true") {
      const targetTime = Number(localStorage.getItem("gama_pomo_target_time") || 0);
      const rem = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
      if (rem > 0) {
        setIsRunning(true);
        setTimeLeft(rem);
      } else {
        setIsRunning(false);
        setTimeLeft(savedMode === "break" ? 5 * 60 : 25 * 60);
        localStorage.setItem("gama_pomo_is_running", "false");
      }
    } else {
      const savedPaused = Number(localStorage.getItem("gama_pomo_paused_time"));
      if (savedPaused > 0) setTimeLeft(savedPaused);
    }
  }, []);

  const saveTodos = (nextTodos: TodoItem[]) => {
    setTodos(nextTodos);
    localStorage.setItem("gama_student_todos_clean", JSON.stringify(nextTodos));
    localStorage.setItem("gama_student_todos", JSON.stringify(nextTodos));
  };

  const saveNotes = (nextNotes: PostItNote[]) => {
    setNotes(nextNotes);
    localStorage.setItem("gama_student_notes_clean", JSON.stringify(nextNotes));
    localStorage.setItem("gama_student_notes", JSON.stringify(nextNotes));
  };

  // Pomodoro Interval Effect with timestamp precision
  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        const targetTime = Number(localStorage.getItem("gama_pomo_target_time") || 0);
        if (targetTime > 0) {
          const rem = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
          if (rem <= 0) {
            setIsRunning(false);
            localStorage.setItem("gama_pomo_is_running", "false");
            if (timerMode === "focus") {
              alert("🎯 Session de concentration terminée ! Prenez une pause.");
              setTimerMode("break");
              setTimeLeft(5 * 60);
              localStorage.setItem("gama_pomo_mode", "break");
              localStorage.setItem("gama_pomo_paused_time", (5 * 60).toString());
            } else {
              alert("☕ Pause terminée ! Prêt pour un nouveau cycle de concentration ?");
              setTimerMode("focus");
              setTimeLeft(25 * 60);
              localStorage.setItem("gama_pomo_mode", "focus");
              localStorage.setItem("gama_pomo_paused_time", (25 * 60).toString());
            }
          } else {
            setTimeLeft(rem);
          }
        }
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isRunning, timerMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Todo Handlers
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!newTodoText.trim()) return;
    const newTodo: TodoItem = {
      id: "todo-" + Date.now(),
      text: newTodoText.trim(),
      subject: newTodoSubject.trim() || "Général",
      completed: false
    };
    saveTodos([newTodo, ...todos]);
    setNewTodoText("");
  };

  const handleToggleTodo = (id: string) => {
    const nextTodos = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTodos(nextTodos);
  };

  const handleDeleteTodo = (id: string) => {
    const nextTodos = todos.filter((t) => t.id !== id);
    saveTodos(nextTodos);
  };

  // Post-it Handlers
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const rotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-0"];
    const randomRot = rotations[Math.floor(Math.random() * rotations.length)];

    const newNote: PostItNote = {
      id: "note-" + Date.now(),
      title: newNoteTitle.trim() || "Note rapide",
      content: newNoteContent.trim(),
      color: newNoteColor,
      rotation: randomRot
    };

    saveNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNewNoteModal(false);
  };

  const handleDeleteNote = (id: string) => {
    const nextNotes = notes.filter((n) => n.id !== id);
    saveNotes(nextNotes);
  };

  const getPostItClass = (color: PostItNote["color"]) => {
    switch (color) {
      case "pink":
        return "bg-[#FFD1E8]";
      case "mint":
        return "bg-[#D1FFE4]";
      case "orange":
        return "bg-[#FFE1C2]";
      case "yellow":
      default:
        return "bg-[#FFF4B8]";
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FFFBF5]">
        <div className="p-4 md:p-8 flex flex-col max-w-7xl mx-auto gap-8 w-full">
          {/* Top Header Banner */}
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
                  Votre espace d'hyper-concentration : Cahier de Post-its, Chrono Pomodoro et Tâches du jour.
                </p>
              </div>
            </div>
          </div>

          {/* TOP SECTION: Cahier de Brouillon & Post-its (EN HAUT) */}
          <div className="bg-[#FFFDF9] border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000]">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <StickyNote size={22} className="text-[#FF5500]" />
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  Cahier de Brouillon & Post-its
                </h2>
              </div>
              <button
                onClick={() => requireAuth(() => setShowNewNoteModal(true))}
                className="bg-black text-white hover:bg-[#FF5500] font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouveau Post-it</span>
              </button>
            </div>

            {notes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                          className="text-black/40 hover:text-red-600 cursor-pointer"
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
                      <span>Note Bureau</span>
                      <span>📌 PING</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-black/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <StickyNote size={36} className="text-black/30" />
                <h3 className="text-sm font-black uppercase text-black/70">Aucun Post-it pour le moment</h3>
                <p className="text-xs font-bold text-black/50 max-w-sm">
                  Collez un post-it pour noter vos formules importantes, dates d'examens ou idées éclair.
                </p>
                <button
                  onClick={() => requireAuth(() => setShowNewNoteModal(true))}
                  className="mt-2 bg-[#FF5500] text-white hover:bg-black font-extrabold px-4 py-2 rounded-xl text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  + Ajouter un Post-it
                </button>
              </div>
            )}
          </div>

          {/* BOTTOM SECTION: Grid - Pomodoro Focus Timer & Interactive To-Do List (EN BAS) */}
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
                      localStorage.setItem("gama_pomo_is_running", "false");
                      localStorage.setItem("gama_pomo_mode", "focus");
                      localStorage.setItem("gama_pomo_paused_time", (25 * 60).toString());
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
                      localStorage.setItem("gama_pomo_is_running", "false");
                      localStorage.setItem("gama_pomo_mode", "break");
                      localStorage.setItem("gama_pomo_paused_time", (5 * 60).toString());
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
                  onClick={() => requireAuth(() => {
                    const nextRunning = !isRunning;
                    setIsRunning(nextRunning);
                    if (nextRunning) {
                      const targetTime = Date.now() + timeLeft * 1000;
                      localStorage.setItem("gama_pomo_is_running", "true");
                      localStorage.setItem("gama_pomo_target_time", targetTime.toString());
                      localStorage.setItem("gama_pomo_mode", timerMode);
                    } else {
                      localStorage.setItem("gama_pomo_is_running", "false");
                      localStorage.setItem("gama_pomo_paused_time", timeLeft.toString());
                    }
                  })}
                  className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer transition-all ${
                    isRunning ? "bg-black text-white" : "bg-[#FF5500] text-white hover:bg-black"
                  }`}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isRunning ? "Mettre en pause" : "Lancer le chrono"}</span>
                </button>
                <button
                  onClick={() => {
                    const defaultSecs = timerMode === "focus" ? 25 * 60 : 5 * 60;
                    setIsRunning(false);
                    setTimeLeft(defaultSecs);
                    localStorage.setItem("gama_pomo_is_running", "false");
                    localStorage.setItem("gama_pomo_paused_time", defaultSecs.toString());
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
                  <span className="text-xs font-black bg-black/5 px-2.5 py-1 rounded-full">
                    {todos.filter((t) => t.completed).length} / {todos.length}
                  </span>
                </div>

                {/* Add Todo Form */}
                <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    placeholder="Ajouter un devoir ou objectif à faire..."
                    className="flex-1 p-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white transition-all"
                  />
                  <input
                    type="text"
                    value={newTodoSubject}
                    onChange={(e) => setNewTodoSubject(e.target.value)}
                    placeholder="Matière"
                    className="w-24 md:w-32 p-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-xs outline-none focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-black text-white hover:bg-[#FF5500] font-extrabold px-4 py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000] cursor-pointer transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </form>

                {/* Todos List */}
                <div className="flex flex-col gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {todos.length === 0 ? (
                    <div className="py-8 text-center text-black/50 font-bold text-xs">
                      Aucune tâche dans votre liste. Ajoutez votre premier objectif !
                    </div>
                  ) : (
                    todos.map((todo) => (
                      <div
                        key={todo.id}
                        onClick={() => handleToggleTodo(todo.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-black cursor-pointer transition-all ${
                          todo.completed
                            ? "bg-[#FAFAFA] text-black/40 line-through border-black/30"
                            : "bg-white hover:bg-[#FFFBF5] shadow-[2px_2px_0px_0px_#000000]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-lg border-2 border-black flex items-center justify-center ${
                              todo.completed ? "bg-[#FF5500] text-white border-[#FF5500]" : "bg-white"
                            }`}
                          >
                            {todo.completed && <span className="text-xs font-black">✓</span>}
                          </div>
                          <span className="font-extrabold text-sm">{todo.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2.5 py-0.5 rounded-md">
                            {todo.subject}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTodo(todo.id);
                            }}
                            className="text-black/30 hover:text-red-500 p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                    placeholder="Notez votre formule, idée ou rappel rapide ici..."
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-sm outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-2">
                    Couleur du Post-it
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "yellow", bg: "bg-[#FFF4B8]", label: "Jaune" },
                      { id: "pink", bg: "bg-[#FFD1E8]", label: "Rose" },
                      { id: "mint", bg: "bg-[#D1FFE4]", label: "Menthe" },
                      { id: "orange", bg: "bg-[#FFE1C2]", label: "Orange" }
                    ].map((col) => (
                      <button
                        type="button"
                        key={col.id}
                        onClick={() => setNewNoteColor(col.id as any)}
                        className={`w-10 h-10 rounded-xl border-2 border-black ${col.bg} ${
                          newNoteColor === col.id ? "ring-4 ring-black shadow-[2px_2px_0px_0px_#000000]" : ""
                        }`}
                        title={col.label}
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

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
