"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Calendar as CalendarIcon, Plus, Sparkles, Clock, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Tag, AlertCircle, X, Check, Copy, CalendarDays } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: "Études / Devoirs" | "Projet SaaS" | "Réunion" | "Personnel" | "Urgent";
  color: string;
  completed?: boolean;
}

const toLocalYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function CalendarPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Tous");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => toLocalYYYYMMDD(new Date()));
  const [newTime, setNewTime] = useState("09:00");
  const [newCategory, setNewCategory] = useState<CalendarEvent["category"]>("Études / Devoirs");
  const [isAiPlanning, setIsAiPlanning] = useState(false);

  useEffect(() => {
    const savedSessions = localStorage.getItem("gama_sessions");
    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    }

    const DEMO_TITLES = [
      "Rendu du Projet Algorithmique",
      "Réunion d'Équipe Architecture",
      "Session Révisions Intensives",
      "🧠 [IA] Session Deep Work Focus (2h)",
      "📚 [IA] Révision Fiches Synthèse & Mémorisation",
      "⚡ [IA] Veille Tech & Lecture Articles ArXiv"
    ];

    const cleanDemoEvents = (list: CalendarEvent[]) => {
      return list.filter(e => !DEMO_TITLES.includes(e.title));
    };

    const loadLocalOrDefaults = () => {
      const savedEvents = localStorage.getItem("gama_calendar_events");
      if (savedEvents) {
        try {
          const parsed = JSON.parse(savedEvents);
          const cleaned = cleanDemoEvents(parsed);
          setEvents(cleaned);
          if (cleaned.length !== parsed.length) {
            localStorage.setItem("gama_calendar_events", JSON.stringify(cleaned));
          }
          return;
        } catch (e) {}
      }
      setEvents([]);
    };

    const syncUserEvents = (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        const cloudEvents = currentUser.user_metadata?.calendar_events;
        if (cloudEvents && Array.isArray(cloudEvents) && cloudEvents.length > 0) {
          const cleaned = cleanDemoEvents(cloudEvents);
          setEvents(cleaned);
          localStorage.setItem("gama_calendar_events", JSON.stringify(cleaned));
          if (cleaned.length !== cloudEvents.length) {
            supabase.auth.updateUser({ data: { calendar_events: cleaned } });
          }
        } else {
          loadLocalOrDefaults();
        }
      } else {
        loadLocalOrDefaults();
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserEvents(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        loadLocalOrDefaults();
      } else {
        syncUserEvents(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveEvents = async (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem("gama_calendar_events", JSON.stringify(updated));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { calendar_events: updated }
        });
      }
    } catch (e) {
      console.warn("Erreur sauvegarde calendrier Supabase:", e);
    }
  };

  const handleAddEvent = () => {
    if (!newTitle.trim()) return;
    const colorMap: Record<string, string> = {
      "Études / Devoirs": "bg-blue-500",
      "Projet SaaS": "bg-amber-500",
      "Réunion": "bg-emerald-500",
      "Personnel": "bg-purple-500",
      "Urgent": "bg-red-500"
    };

    const newEv: CalendarEvent = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      category: newCategory,
      color: colorMap[newCategory] || "bg-orange-500",
      completed: false
    };

    const updated = [...events, newEv].sort((a, b) => a.time.localeCompare(b.time));
    saveEvents(updated);
    setNewTitle("");
    setShowModal(false);
  };

  const toggleComplete = (id: string) => {
    const updated = events.map(ev => ev.id === id ? { ...ev, completed: !ev.completed } : ev);
    saveEvents(updated);
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(ev => ev.id !== id));
  };

  const duplicateToNextDay = (ev: CalendarEvent) => {
    const parts = ev.date.split("-").map(Number);
    const nextD = new Date(parts[0], parts[1] - 1, parts[2] + 1, 12, 0, 0);
    const nextDateStr = toLocalYYYYMMDD(nextD);
    const duplicated: CalendarEvent = {
      ...ev,
      id: Math.random().toString(36).substring(2, 9),
      date: nextDateStr,
      completed: false
    };
    const updated = [...events, duplicated].sort((a, b) => a.time.localeCompare(b.time));
    saveEvents(updated);
  };

  const handleAiAutoSchedule = () => {
    setIsAiPlanning(true);
    setTimeout(() => {
      const targetDate = toLocalYYYYMMDD(currentDate);
      const aiSuggestions: CalendarEvent[] = [
        { id: "ai_" + Math.random().toString(36).substr(2, 5), title: "✨ Session de Travail & Objectifs prioritaires", date: targetDate, time: "09:30", category: "Projet SaaS", color: "bg-amber-500" },
        { id: "ai_" + Math.random().toString(36).substr(2, 5), title: "📌 Point d'Avancement & Synthèse", date: targetDate, time: "16:00", category: "Études / Devoirs", color: "bg-blue-500" }
      ];
      const updated = [...events, ...aiSuggestions].sort((a, b) => a.time.localeCompare(b.time));
      saveEvents(updated);
      setIsAiPlanning(false);
      alert(`✨ Planification générée avec succès pour le ${new Date(targetDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} !`);
    }, 1000);
  };

  // Calendar calculations
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday as 0
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 15, 12, 0, 0));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 15, 12, 0, 0));
  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
  };

  const selectedDateStr = toLocalYYYYMMDD(currentDate);
  const todayStr = toLocalYYYYMMDD(new Date());
  const todaysEvents = events
    .filter(e => e.date === selectedDateStr)
    .filter(e => selectedCategoryFilter === "Tous" || e.category === selectedCategoryFilter);

  const completedCount = todaysEvents.filter(e => e.completed).length;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-600 shadow-[3px_3px_0px_0px_#000000]">
              <CalendarIcon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black uppercase tracking-tight">Calendrier & Organisation IA</h1>
              <p className="text-xs font-bold text-black/50">Planifiez vos projets, examens et sessions avec l'assistance IA Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleAiAutoSchedule}
              disabled={isAiPlanning}
              className="bg-amber-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer hover:bg-black transition-all disabled:opacity-50"
            >
              <Sparkles size={16} className={isAiPlanning ? "animate-spin" : ""} />
              <span>{isAiPlanning ? "L'IA planifie..." : "✨ Planification IA Idéale"}</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer hover:bg-black transition-all"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Ajouter un événement</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="max-w-7xl w-full mx-auto px-6 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Monthly Calendar Grid */}
          <div className="lg:col-span-2 bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
              <h2 className="text-2xl font-black uppercase text-black">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={jumpToToday}
                  className="px-3 py-1.5 rounded-xl border-2 border-black/20 hover:border-black font-extrabold text-xs bg-[#FAFAFA] hover:bg-black hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarDays size={13} />
                  <span>Aujourd'hui</span>
                </button>
                <button onClick={prevMonth} className="p-2 rounded-xl border-2 border-black/10 hover:border-black transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl border-2 border-black/10 hover:border-black transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-black/50">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => (
                <div key={idx} className="py-2">{day}</div>
              ))}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-black/[0.02] border border-black/5" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(year, month, dayNum, 12, 0, 0);
                const dateStr = toLocalYYYYMMDD(cellDate);
                const dayEvents = events.filter(e => e.date === dateStr);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setCurrentDate(cellDate);
                      setNewDate(dateStr);
                    }}
                    className={`h-20 sm:h-24 rounded-2xl p-2 border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative ${
                      isSelected
                        ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                        : isToday
                        ? "bg-amber-500/10 border-amber-500 font-extrabold"
                        : "bg-[#FAFAFA] border-black/15 hover:border-black hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-black ${isToday && !isSelected ? "text-amber-600" : ""}`}>
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-black/10 text-black"
                        }`}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-white ${ev.color}`}
                        >
                          {ev.time} {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className={`text-[8px] font-black pl-1 ${isSelected ? "text-white/70" : "text-black/50"}`}>
                          +{dayEvents.length - 2} autre(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Selected Day Schedule & Tasks */}
          <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-6">
              <div className="border-b-2 border-black/10 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-primary tracking-wider">
                    Planning de la journée
                  </span>
                  {todaysEvents.length > 0 && (
                    <span className="text-xs font-extrabold bg-black/5 px-2.5 py-1 rounded-lg">
                      {completedCount}/{todaysEvents.length} fait{completedCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-black uppercase mt-1 capitalize">
                  {currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["Tous", "Études / Devoirs", "Projet SaaS", "Réunion", "Urgent"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500]"
                          : "bg-[#FAFAFA] text-black/70 border-black/15 hover:border-black"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {todaysEvents.length === 0 ? (
                <div className="bg-[#FAFAFA] border-2 border-dashed border-black/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 my-4">
                  <Clock size={28} className="text-black/30" />
                  <p className="text-xs font-bold text-black/60">
                    Aucun événement prévu {selectedCategoryFilter !== "Tous" ? `pour la catégorie "${selectedCategoryFilter}"` : "pour cette journée"}.
                  </p>
                  <button
                    onClick={() => {
                      setNewDate(selectedDateStr);
                      setShowModal(true);
                    }}
                    className="mt-2 text-xs font-extrabold bg-black text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-primary transition-colors cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span>Planifier un créneau le {currentDate.getDate()}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {todaysEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${
                        ev.completed
                          ? "bg-black/5 border-black/10 opacity-60 line-through"
                          : "bg-white border-black shadow-[3px_3px_0px_0px_#000000]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleComplete(ev.id)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                            ev.completed ? "bg-green-600 border-green-600 text-white" : "border-black hover:bg-black/10"
                          }`}
                        >
                          {ev.completed && <Check size={12} strokeWidth={3} />}
                        </button>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-black leading-snug">{ev.title}</span>
                          <div className="flex items-center gap-2 text-xs font-bold text-black/60">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{ev.time}</span>
                            </span>
                            <span>•</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded text-white ${ev.color}`}>
                              {ev.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => duplicateToNextDay(ev)}
                          className="text-black/40 hover:text-black p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-black/5"
                          title="Dupliquer au lendemain (+1 jour)"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => deleteEvent(ev.id)}
                          className="text-black/40 hover:text-red-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#FFFBF5] ink-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase">
                <Sparkles size={15} />
                <span>Assistant de Productivité</span>
              </div>
              <p className="text-xs font-bold text-black/70">
                Vous avez un examen ou un lancement SaaS proche ? L'IA peut décomposer votre charge de travail en sous-tâches automatiques.
              </p>
              <Link
                href="/?q=Propose-moi un planning de révision et de travail efficace pour cette semaine en fonction de mon calendrier."
                className="bg-black text-white font-extrabold px-4 py-2 rounded-xl text-xs text-center hover:bg-primary transition-colors shadow-[2px_2px_0px_0px_#000000]"
              >
                Discuter avec le Coach IA
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Add Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white ink-border ink-shadow rounded-3xl p-6 md:p-8 max-w-md w-full flex flex-col gap-5 relative shadow-[8px_8px_0px_0px_#000000]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl border-2 border-black/10 hover:border-black hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border-2 border-primary flex items-center justify-center text-primary shadow-[3px_3px_0px_0px_#000000]">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">Nouvel Événement</h3>
                <p className="text-xs font-bold text-black/60">Ajoutez un créneau à votre emploi du temps</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black uppercase text-black/70 mb-1 block">Titre de l'événement *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: Rendu Devoir Algorithmique, Call Client..."
                  className="w-full px-4 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-black uppercase text-black/70 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-xs"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-xs font-black uppercase text-black/70 mb-1 block">Heure</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black/70 mb-1 block">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-xs"
                >
                  <option value="Études / Devoirs">🎓 Études / Devoirs</option>
                  <option value="Projet SaaS">🚀 Projet SaaS</option>
                  <option value="Réunion">🤝 Réunion</option>
                  <option value="Personnel">🏠 Personnel</option>
                  <option value="Urgent">⚠️ Urgent / Deadline</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black/10">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 font-bold text-xs hover:bg-black/5 rounded-xl border border-black/20"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newTitle.trim()}
                className="bg-black text-white hover:bg-primary font-extrabold px-6 py-2.5 rounded-xl text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-colors disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
