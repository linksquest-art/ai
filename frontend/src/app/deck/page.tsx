"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Brain, 
  ArrowRight, 
  ArrowLeft
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";

interface Flashcard {
  id: string;
  recto: string;
  verso: string;
  category: string;
  nextReviewDate?: string;
  intervalDays?: number;
  status: "new" | "learning" | "mastered";
}

interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  cards: Flashcard[];
}

const DEFAULT_DECKS: Deck[] = [];

export default function DeckPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>(DEFAULT_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const syncDecksFromUser = (u: any) => {
    if (u && u.user_metadata?.student_decks && Array.isArray(u.user_metadata.student_decks)) {
      setDecks(u.user_metadata.student_decks);
      if (u.user_metadata.student_decks.length > 0) {
        setSelectedDeckId(u.user_metadata.student_decks[0].id);
      }
    } else if (u) {
      // Logged in but no cloud decks yet -> check localStorage
      const saved = localStorage.getItem("gama_student_decks_clean");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDecks(parsed);
            setSelectedDeckId(parsed[0].id);
          }
        } catch (e) {}
      }
    } else {
      // Logged out -> clean blank session
      setDecks([]);
      setSelectedDeckId("");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      syncDecksFromUser(u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      syncDecksFromUser(u);
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

  // AI Generation States
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>("");
  const [aiCount, setAiCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // New Deck Modal
  const [showNewDeckModal, setShowNewDeckModal] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [newDeckDesc, setNewDeckDesc] = useState<string>("");

  const saveDecks = (nextDecks: Deck[]) => {
    setDecks(nextDecks);
    localStorage.setItem("gama_student_decks_clean", JSON.stringify(nextDecks));
    if (user) {
      supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          student_decks: nextDecks
        }
      }).catch(() => {});
    }
  };

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];
  const currentCard = activeDeck?.cards[studyCardIndex];

  // Spaced Repetition Grading
  const handleGrade = (grade: "again" | "hard" | "good" | "easy") => {
    if (!currentCard || !activeDeck) return;

    let nextInterval = 0;
    let nextStatus: "new" | "learning" | "mastered" = "learning";

    if (grade === "again") {
      nextInterval = 0;
      nextStatus = "learning";
    } else if (grade === "hard") {
      nextInterval = 1;
      nextStatus = "learning";
    } else if (grade === "good") {
      nextInterval = 3;
      nextStatus = "mastered";
    } else if (grade === "easy") {
      nextInterval = 7;
      nextStatus = "mastered";
    }

    const updatedCards = activeDeck.cards.map((c, i) => {
      if (i === studyCardIndex) {
        return {
          ...c,
          intervalDays: nextInterval,
          status: nextStatus
        };
      }
      return c;
    });

    const updatedDecks = decks.map((d) => {
      if (d.id === activeDeck.id) {
        return { ...d, cards: updatedCards };
      }
      return d;
    });

    saveDecks(updatedDecks);
    setIsFlipped(false);

    if (studyCardIndex < activeDeck.cards.length - 1) {
      setStudyCardIndex(studyCardIndex + 1);
    } else {
      setStudyCardIndex(0);
    }
  };

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const newDeck: Deck = {
      id: "deck-" + Date.now(),
      name: newDeckName.trim(),
      description: newDeckDesc.trim() || "Fiches d'étude personnelles",
      color: "#FF5500",
      cards: []
    };
    const nextDecks = [...decks, newDeck];
    saveDecks(nextDecks);
    setSelectedDeckId(newDeck.id);
    setNewDeckName("");
    setNewDeckDesc("");
    setShowNewDeckModal(false);
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDecks = decks.filter((d) => d.id !== id);
    saveDecks(nextDecks);
    if (selectedDeckId === id) {
      setSelectedDeckId(nextDecks[0]?.id || "");
      setStudyCardIndex(0);
    }
  };

  const handleGenerateCards = async () => {
    if (!aiSource.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: aiSource,
          cardCount: aiCount,
          category: activeDeck?.name || "Révision IA"
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert("⚠️ " + (data.error || "Erreur lors de la génération IA."));
        return;
      }

      const generatedCards: Flashcard[] = (data.cards || []).map((c: any, idx: number) => ({
        id: "card-" + Date.now() + "-" + idx,
        recto: c.recto || "Concept clé",
        verso: c.verso || "Explication détaillée",
        category: c.category || (activeDeck?.name || "Révision IA"),
        status: "new",
        intervalDays: 0
      }));

      let updatedDecks: Deck[];
      if (!activeDeck) {
        const autoDeck: Deck = {
          id: "deck-" + Date.now(),
          name: "Deck IA — Révision",
          description: "Généré par intelligence artificielle",
          color: "#FF5500",
          cards: generatedCards
        };
        updatedDecks = [autoDeck];
        setSelectedDeckId(autoDeck.id);
      } else {
        updatedDecks = decks.map((d) => {
          if (d.id === activeDeck.id) {
            return {
              ...d,
              cards: [...d.cards, ...generatedCards]
            };
          }
          return d;
        });
      }

      saveDecks(updatedDecks);
      setAiSource("");
      setShowAiModal(false);
    } catch (err: any) {
      alert("⚠️ Erreur lors de la communication avec l'IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FFFBF5]">
        <div className="p-4 md:p-8 flex flex-col max-w-6xl mx-auto gap-6 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-black pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#FF5500]">
                <Brain size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
                  Decks IA & Répétition Espacée
                </h1>
                <p className="text-xs md:text-sm font-bold text-black/60">
                  Révisez selon la courbe de l'oubli avec notre algorithme intelligent et générez vos fiches par IA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => requireAuth(() => setShowNewDeckModal(true))}
                className="bg-white text-black hover:bg-black hover:text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouveau Deck</span>
              </button>
              <button
                onClick={() => requireAuth(() => setShowAiModal(true))}
                className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Générer par IA</span>
              </button>
            </div>
          </div>

          {/* Deck Selector Tabs */}
          {decks.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {decks.map((deck) => {
                const isActive = deck.id === (activeDeck?.id || "");
                const masteredCount = deck.cards.filter((c) => c.status === "mastered").length;
                return (
                  <div
                    key={deck.id}
                    onClick={() => {
                      setSelectedDeckId(deck.id);
                      setStudyCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`px-4 py-3 rounded-2xl border-2 border-black font-extrabold text-xs flex items-center gap-3 cursor-pointer shrink-0 transition-all ${
                      isActive
                        ? "bg-black text-white shadow-[4px_4px_0px_0px_#FF5500]"
                        : "bg-white text-black hover:bg-black/5 shadow-[2px_2px_0px_0px_#000000]"
                    }`}
                  >
                    <BookOpen size={16} className={isActive ? "text-[#FF5500]" : "text-black/60"} />
                    <div className="flex flex-col">
                      <span className="font-black text-sm">{deck.name}</span>
                      <span className="text-[10px] opacity-70">
                        {deck.cards.length} cartes • {masteredCount} maîtrisées
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                      className="ml-1 text-red-500 hover:text-red-600 p-1"
                      title="Supprimer ce deck"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Flashcard Studio Arena */}
          {activeDeck ? (
            <div className="flex flex-col gap-6">
              {activeDeck.cards.length > 0 ? (
                <>
                  {/* Interactive Flip Card (Recto / Verso) without top counter box */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="min-h-[300px] md:min-h-[340px] bg-white border-4 border-black rounded-3xl p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-[8px_8px_0px_0px_#000000] hover:shadow-[10px_10px_0px_0px_#FF5500] transition-all cursor-pointer select-none relative group"
                  >
                    <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-black/50">
                      <span>{activeDeck.name}</span>
                      <span className="bg-black/10 text-black px-3 py-1 rounded-full">
                        {isFlipped ? "VERSO — RÉPONSE" : `RECTO — QUESTION ${studyCardIndex + 1} / ${activeDeck.cards.length}`}
                      </span>
                    </div>

                    <div className="my-auto py-8 px-4 max-w-3xl">
                      <p className="text-xl md:text-2xl font-black leading-relaxed text-black">
                        {isFlipped ? currentCard?.verso : currentCard?.recto}
                      </p>
                    </div>

                    <div className="w-full flex items-center justify-between text-xs font-extrabold text-black/40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setStudyCardIndex((prev) => (prev > 0 ? prev - 1 : activeDeck.cards.length - 1));
                        }}
                        className="p-2 bg-[#FAFAFA] border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all cursor-pointer text-black"
                        title="Carte précédente"
                      >
                        <ArrowLeft size={16} />
                      </button>

                      <span className="group-hover:text-[#FF5500] transition-colors">
                        Cliquez sur la carte pour {isFlipped ? "voir la question" : "révéler la réponse"}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                          setStudyCardIndex((prev) => (prev < activeDeck.cards.length - 1 ? prev + 1 : 0));
                        }}
                        className="p-2 bg-[#FAFAFA] border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all cursor-pointer text-black"
                        title="Carte suivante"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Spaced Repetition Grading Buttons */}
                  {isFlipped && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <button
                        onClick={() => handleGrade("again")}
                        className="bg-red-100 hover:bg-red-500 hover:text-white border-2 border-black rounded-2xl p-4 flex flex-col items-center gap-1 shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                      >
                        <span className="font-black text-sm">🔴 À revoir</span>
                        <span className="text-[11px] font-bold opacity-70">&lt; 10 min</span>
                      </button>

                      <button
                        onClick={() => handleGrade("hard")}
                        className="bg-amber-100 hover:bg-amber-500 hover:text-white border-2 border-black rounded-2xl p-4 flex flex-col items-center gap-1 shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                      >
                        <span className="font-black text-sm">🟠 Difficile</span>
                        <span className="text-[11px] font-bold opacity-70">1 jour</span>
                      </button>

                      <button
                        onClick={() => handleGrade("good")}
                        className="bg-blue-100 hover:bg-blue-500 hover:text-white border-2 border-black rounded-2xl p-4 flex flex-col items-center gap-1 shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                      >
                        <span className="font-black text-sm">🟢 Bon</span>
                        <span className="text-[11px] font-bold opacity-70">3 jours</span>
                      </button>

                      <button
                        onClick={() => handleGrade("easy")}
                        className="bg-emerald-100 hover:bg-emerald-500 hover:text-white border-2 border-black rounded-2xl p-4 flex flex-col items-center gap-1 shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                      >
                        <span className="font-black text-sm">🔵 Facile</span>
                        <span className="text-[11px] font-bold opacity-70">7 jours</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border-3 border-black rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 shadow-[6px_6px_0px_0px_#000000]">
                  <Layers size={48} className="text-[#FF5500]" />
                  <h3 className="text-xl font-black uppercase">Ce Deck est vide</h3>
                  <p className="text-sm font-bold text-black/60 max-w-md">
                    Générez automatiquement des fiches de révision à partir de vos cours grâce à notre IA.
                  </p>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="bg-[#FF5500] text-white hover:bg-black font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                  >
                    + Générer des Flashcards IA
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border-3 border-black rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-5 shadow-[8px_8px_0px_0px_#000000]">
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#FF5500]">
                <Layers size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase">Aucun Deck créé</h3>
              <p className="text-sm font-bold text-black/60 max-w-md">
                Créez votre propre Deck de révision ou laissez notre IA générer vos fiches à partir de vos notes de cours.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => requireAuth(() => setShowNewDeckModal(true))}
                  className="bg-white text-black hover:bg-black hover:text-white font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  + Créer un Deck
                </button>
                <button
                  onClick={() => requireAuth(() => setShowAiModal(true))}
                  className="bg-[#FF5500] text-white hover:bg-black font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  ✨ Générer par IA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: New Deck */}
        {showNewDeckModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#FF5500] flex flex-col gap-5">
              <h3 className="text-xl font-black uppercase">Créer un nouveau Deck</h3>
              <form onSubmit={handleCreateDeck} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1">
                    Nom du Deck / Matière
                  </label>
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="ex: Droit Administratif L2"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-[#FFFBF5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1">
                    Description rapide
                  </label>
                  <input
                    type="text"
                    value={newDeckDesc}
                    onChange={(e) => setNewDeckDesc(e.target.value)}
                    placeholder="ex: Actes administratifs et recours"
                    className="w-full p-3 border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-[#FFFBF5]"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewDeckModal(false)}
                    className="px-4 py-2 font-black text-xs hover:underline cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-5 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer"
                  >
                    Créer le Deck
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI Flashcards Generator */}
        {showAiModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_#FF5500] flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase flex items-center gap-2">
                  <Sparkles className="text-[#FF5500]" />
                  <span>Générateur IA de Flashcards</span>
                </h3>
              </div>
              <p className="text-xs font-bold text-black/60">
                Collez votre cours, vos définitions ou un thème précis pour générer instantanément des Flashcards de révision.
              </p>

              <textarea
                rows={6}
                value={aiSource}
                onChange={(e) => setAiSource(e.target.value)}
                placeholder="Collez ici votre chapitre, vos notes ou votre résumé de cours..."
                className="w-full p-4 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white transition-all resize-none"
              />

              <div className="flex items-center justify-between bg-[#FAFAFA] border-2 border-black rounded-xl p-3">
                <span className="text-xs font-black uppercase">Nombre de cartes : {aiCount}</span>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-40 h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 font-black text-xs hover:underline cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleGenerateCards}
                  disabled={isGenerating || !aiSource.trim()}
                  className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>{isGenerating ? "Génération en cours..." : "Générer les cartes"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
