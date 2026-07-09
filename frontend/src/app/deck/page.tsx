"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  Brain, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  HelpCircle
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

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

const DEFAULT_DECKS: Deck[] = [
  {
    id: "deck-droit",
    name: "Droit Constitutionnel — L1",
    description: "Principes fondateurs, séparation des pouvoirs et jurisprudence constitutionnelle.",
    color: "#FF5500",
    cards: [
      {
        id: "c1",
        recto: "Qu'est-ce que le bloc de constitutionnalité ?",
        verso: "Ensemble des textes et principes à valeur constitutionnelle que les lois doivent respecter (Constitution de 1958, DDHC 1789, Préambule de 1946, Charte de l'environnement de 2004).",
        category: "Droit Constitutionnel",
        status: "mastered",
        intervalDays: 3
      },
      {
        id: "c2",
        recto: "Quelle est la différence entre souveraineté nationale et souveraineté populaire ?",
        verso: "La souveraineté nationale appartient à la Nation (entité abstraite exercée par des représentants), tandis que la souveraineté populaire appartient au peuple (chaque citoyen détient une fraction de souveraineté).",
        category: "Droit Constitutionnel",
        status: "learning",
        intervalDays: 1
      },
      {
        id: "c3",
        recto: "Qu'est-ce que l'article 49.3 de la Constitution de 1958 ?",
        verso: "Article permettant au Premier ministre d'engager la responsabilité du Gouvernement sur le vote d'un projet de loi de finances ou de financement de la sécurité sociale sans vote parlementaire.",
        category: "Droit Constitutionnel",
        status: "new",
        intervalDays: 0
      }
    ]
  },
  {
    id: "deck-maths",
    name: "Algèbre Linéaire & Matrices",
    description: "Espaces vectoriels, déterminants, valeurs propres et diagonalisation.",
    color: "#10B981",
    cards: [
      {
        id: "c4",
        recto: "Quelle est la condition nécessaire et suffisante pour qu'une matrice soit inversible ?",
        verso: "Son déterminant doit être non nul (det(A) ≠ 0).",
        category: "Mathématiques",
        status: "mastered",
        intervalDays: 7
      },
      {
        id: "c5",
        recto: "Qu'est-ce que le théorème du rang ?",
        verso: "Pour une application linéaire f : E -> F (E de dimension finie) : dim(E) = dim(Ker(f)) + rg(f).",
        category: "Mathématiques",
        status: "learning",
        intervalDays: 1
      }
    ]
  },
  {
    id: "deck-anglais",
    name: "Anglais Universitaire & TOEFL",
    description: "Vocabulaire académique avancé, connecteurs logiques et nuances idiomatiques.",
    color: "#3B82F6",
    cards: [
      {
        id: "c6",
        recto: "Que signifie 'Notwithstanding' dans un essai académique ?",
        verso: "Néanmoins / Nonobstant / En dépit de.",
        category: "Anglais",
        status: "mastered",
        intervalDays: 5
      }
    ]
  }
];

export default function DeckPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>(DEFAULT_DECKS);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("deck-droit");
  const [studyCardIndex, setStudyCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // AI Generation States
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>("");
  const [aiCount, setAiCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // New Deck Modal
  const [showNewDeckModal, setShowNewDeckModal] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>("");
  const [newDeckDesc, setNewDeckDesc] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("gama_student_decks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDecks(parsed);
          setSelectedDeckId(parsed[0].id);
        }
      } catch (e) {}
    }
  }, []);

  const saveDecks = (nextDecks: Deck[]) => {
    setDecks(nextDecks);
    localStorage.setItem("gama_student_decks", JSON.stringify(nextDecks));
  };

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];
  const currentCard = activeDeck?.cards[studyCardIndex];

  // Spaced Repetition Grading (Anki style)
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
      description: newDeckDesc.trim() || "Révisions universitaires et fiches d'étude",
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
    if (decks.length <= 1) {
      alert("Vous devez conserver au moins un Deck d'étude.");
      return;
    }
    const nextDecks = decks.filter((d) => d.id !== id);
    saveDecks(nextDecks);
    if (selectedDeckId === id) {
      setSelectedDeckId(nextDecks[0].id);
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
          category: activeDeck?.name || "Université"
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
        category: c.category || activeDeck.name,
        status: "new",
        intervalDays: 0
      }));

      const updatedDecks = decks.map((d) => {
        if (d.id === activeDeck.id) {
          return {
            ...d,
            cards: [...d.cards, ...generatedCards]
          };
        }
        return d;
      });

      saveDecks(updatedDecks);
      setAiSource("");
      setShowAiModal(false);
      alert(`✅ ${generatedCards.length} Flashcards ajoutées avec succès à « ${activeDeck.name} » !`);
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
                  Révisez selon la courbe de l'oubli avec notre algorithme intelligent et générez vos fiches instantanément par IA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowNewDeckModal(true)}
                className="bg-white text-black hover:bg-black hover:text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouveau Deck</span>
              </button>
              <button
                onClick={() => setShowAiModal(true)}
                className="bg-[#FF5500] hover:bg-black text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Générer Flashcards par IA</span>
              </button>
            </div>
          </div>

          {/* Deck Selector Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {decks.map((deck) => {
              const isActive = deck.id === selectedDeckId;
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
                  {decks.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                      className="ml-1 text-red-500 hover:text-red-600 p-1"
                      title="Supprimer ce deck"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Flashcard Studio Arena */}
          {activeDeck ? (
            <div className="flex flex-col gap-6">
              {activeDeck.cards.length > 0 ? (
                <>
                  {/* Card Counter & Study Bar */}
                  <div className="flex items-center justify-between bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000000]">
                    <div className="flex items-center gap-3">
                      <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-black">
                        Carte {studyCardIndex + 1} / {activeDeck.cards.length}
                      </span>
                      <span className="text-xs font-bold text-black/60">
                        {activeDeck.description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setStudyCardIndex((prev) => (prev > 0 ? prev - 1 : activeDeck.cards.length - 1));
                        }}
                        className="p-2 bg-[#FAFAFA] border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all cursor-pointer"
                        title="Carte précédente"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setStudyCardIndex((prev) => (prev < activeDeck.cards.length - 1 ? prev + 1 : 0));
                        }}
                        className="p-2 bg-[#FAFAFA] border-2 border-black rounded-xl hover:bg-black hover:text-white transition-all cursor-pointer"
                        title="Carte suivante"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Flip Card (Recto / Verso) */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="min-h-[280px] md:min-h-[320px] bg-white border-4 border-black rounded-3xl p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-[8px_8px_0px_0px_#000000] hover:shadow-[10px_10px_0px_0px_#FF5500] transition-all cursor-pointer select-none relative group"
                  >
                    <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-black/50">
                      <span>{activeDeck.name}</span>
                      <span className="bg-black/10 text-black px-3 py-1 rounded-full">
                        {isFlipped ? "VERSO — RÉPONSE" : "RECTO — QUESTION (Cliquez pour retourner)"}
                      </span>
                    </div>

                    <div className="my-auto py-8 px-4 max-w-3xl">
                      <p className="text-xl md:text-2xl font-black leading-relaxed text-black">
                        {isFlipped ? currentCard?.verso : currentCard?.recto}
                      </p>
                    </div>

                    <div className="w-full flex items-center justify-center text-xs font-extrabold text-black/40 group-hover:text-[#FF5500] transition-colors">
                      <span>Appuyez ou cliquez pour retourner la carte</span>
                    </div>
                  </div>

                  {/* Anki Spaced Repetition Grading Buttons */}
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
                    Générez automatiquement des fiches de révision à partir de vos cours grâce à notre IA ou créez votre propre sélection.
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
          ) : null}
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
                Collez votre cours, vos définitions ou un thème précis pour générer instantanément des Flashcards de révision dans le deck « {activeDeck?.name} ».
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
    </main>
  );
}
