"use client";

import React, { useState, useEffect } from "react";
import { X, RotateCw, Check, Sparkles, Plus, ArrowRight, ArrowLeft, HelpCircle, Lightbulb, Trophy, Brain, Award, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  known?: boolean;
}

const DEFAULT_FLASHCARDS_BY_TOPIC: Record<string, Flashcard[]> = {
  default: [
    {
      id: "fc1",
      question: "Qu'est-ce que le Prompt Engineering en Intelligence Artificielle ?",
      answer: "C'est l'art de structurer et d'optimiser les instructions (prompts) données à un modèle linguistique pour obtenir des réponses précises, fiables et adaptées.",
      category: "IA & Prompts"
    },
    {
      id: "fc2",
      question: "Quelle est la différence fondamentale entre le Frontend et le Backend ?",
      answer: "Le Frontend désigne l'interface visuelle et interactive vue par l'utilisateur (HTML, CSS, React), tandis que le Backend gère la logique serveur, les bases de données et la sécurité (Node.js, Python, SQL).",
      category: "Architecture Web"
    },
    {
      id: "fc3",
      question: "Pourquoi est-il important de spécifier un rôle (ex: 'Tu es un expert en...') à l'IA ?",
      answer: "Définir un rôle active les poids neuronaux et le vocabulaire spécialisé associés à ce domaine, ce qui améliore considérablement la rigueur et la profondeur de l'analyse.",
      category: "IA & Prompts"
    },
    {
      id: "fc4",
      question: "Qu'est-ce que la méthode socratique dans l'apprentissage ?",
      answer: "C'est une méthode pédagogique basée sur le questionnement actif pour stimuler la réflexion critique plutôt que de donner directement des réponses passives.",
      category: "Pédagogie"
    },
    {
      id: "fc5",
      question: "Quel est l'avantage principal d'un composant React 'Client' vs 'Server' ?",
      answer: "Un composant Client permet l'interactivité en temps réel (useState, useEffect, onClick) dans le navigateur, alors qu'un composant Server est pré-rendu sur le serveur pour une vitesse et un SEO optimaux.",
      category: "React & Next.js"
    }
  ]
};

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
  initialCards?: Flashcard[];
  initialText?: string;
}

export function FlashcardModal({ isOpen, onClose, topic = "Espace de Travail", initialCards, initialText }: FlashcardModalProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialText && initialText.trim()) {
        setCards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
        handleGenerateAI(initialText);
      } else if (initialCards && initialCards.length > 0) {
        setCards(initialCards.map(c => ({ ...c, known: undefined })));
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
      } else {
        // Find matching topic or load default cards
        const matchedTopic = Object.keys(DEFAULT_FLASHCARDS_BY_TOPIC).find(k => 
          topic.toLowerCase().includes(k.toLowerCase())
        );
        const loadCards = matchedTopic ? DEFAULT_FLASHCARDS_BY_TOPIC[matchedTopic] : DEFAULT_FLASHCARDS_BY_TOPIC.default;
        
        // Customize first card category to current topic
        const customized = loadCards.map((c, i) => ({
          ...c,
          category: i === 0 ? topic : c.category,
          known: undefined
        }));
        setCards(customized);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
      }
    }
  }, [isOpen, topic, initialCards, initialText]);

  // Keyboard navigation support (UI/UX Pro Max Accessibility & Interaction)
  useEffect(() => {
    if (!isOpen || isFinished || isAddingCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === "1" || e.code === "ArrowLeft") {
        if (isFlipped) {
          e.preventDefault();
          handleRate(false);
        }
      } else if (e.key === "2" || e.code === "ArrowRight") {
        if (isFlipped) {
          e.preventDefault();
          handleRate(true);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFinished, isAddingCard, isFlipped, currentIndex, cards]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const masteredCount = cards.filter(c => c.known === true).length;
  const reviewCount = cards.filter(c => c.known === false).length;
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex) / totalCards) * 100) : 0;

  const handleRate = (known: boolean) => {
    const updated = [...cards];
    if (updated[currentIndex]) {
      updated[currentIndex].known = known;
    }
    setCards(updated);
    setIsFlipped(false);

    if (currentIndex + 1 < totalCards) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      setTimeout(() => {
        setIsFinished(true);
      }, 150);
    }
  };

  const handleRestart = (onlyReview = false) => {
    if (onlyReview) {
      const reviewCards = cards.filter(c => c.known === false).map(c => ({ ...c, known: undefined }));
      if (reviewCards.length > 0) {
        setCards(reviewCards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
        return;
      }
    }
    setCards(cards.map(c => ({ ...c, known: undefined })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newCard: Flashcard = {
      id: "custom_" + Math.random().toString(36).substr(2, 9),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory.trim() || topic || "Sur mesure",
      known: undefined
    };
    setCards([...cards, newCard]);
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setIsAddingCard(false);
    if (isFinished) {
      setCurrentIndex(cards.length);
      setIsFinished(false);
    }
  };

  const handleGenerateAI = async (customText?: any) => {
    const textToUse = typeof customText === "string" ? customText : undefined;
    setIsGeneratingAI(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const promptContent = textToUse 
        ? `Génère exactement 5 flashcards de révision (Questions/Réponses) très pertinentes et pédagogiques à partir de ce texte/cours :\n\n${textToUse.substring(0, 1800)}` 
        : `Génère exactement 5 flashcards de niveau universitaire et expertes pour tester et maîtriser le sujet : "${topic}".`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authSession?.access_token ? `Bearer ${authSession.access_token}` : ""
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptContent }],
          model: "deepseek/deepseek-chat",
          systemPrompt: "Tu es un professeur et concepteur pédagogique d'élite. Tu DOIS répondre UNIQUEMENT et STRICTEMENT par un tableau JSON valide contenant exactement 5 objets flashcards. Aucun texte autour, aucune introduction, aucune conclusion, pas de balises markdown ```json. Le format strict de chaque objet est : {\"question\": \"La question précise\", \"answer\": \"La réponse détaillée et claire\", \"category\": \"Le sous-thème\"}"
        })
      });

      if (!res.ok) throw new Error("Erreur de génération IA");
      const data = await res.json();
      
      let jsonStr = (data.content || "").trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const newCards: Flashcard[] = parsed.map((item: any, idx: number) => ({
          id: "ai_" + Date.now() + "_" + idx,
          question: item.question || "Question IA",
          answer: item.answer || "Réponse détaillée",
          category: item.category || topic || "IA Générative",
          known: undefined
        }));
        
        setCards(prev => {
          // If previous cards were only defaults or empty, replace them with real AI cards
          if (prev.length === 0 || textToUse) return newCards;
          return [...prev, ...newCards];
        });
        if (isFinished) {
          setCurrentIndex(cards.length);
          setIsFinished(false);
        }
      } else {
        throw new Error("Format JSON invalide");
      }
    } catch (e) {
      console.error("Erreur flashcards IA:", e);
      // Fallback
      const fallback: Flashcard[] = [
        {
          id: "ai_" + Math.random().toString(36).substr(2, 5),
          question: `Quels sont les concepts fondamentaux à retenir sur "${topic}" ?`,
          answer: `L'assimilation des principes de base, l'application concrète par des exercices pratiques et l'auto-évaluation régulière.`,
          category: topic
        },
        {
          id: "ai_" + Math.random().toString(36).substr(2, 5),
          question: `Comment vérifier sa maîtrise de "${topic}" ?`,
          answer: `En expliquant le concept avec ses propres mots à quelqu'un d'autre sans consulter ses notes (méthode Feynman).`,
          category: topic
        }
      ];
      setCards(prev => (prev.length === 0 ? fallback : [...prev, ...fallback]));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border-[3px] border-black rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-[10px_10px_0px_0px_#000000] overflow-hidden relative">
        
        {/* Top Bar */}
        <div className="px-6 py-4 bg-[#FFFBF5] border-b-[3px] border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/15 border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500] shrink-0 shadow-[2px_2px_0px_0px_#000000]">
              <Brain size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-black uppercase tracking-tight truncate flex items-center gap-2">
                <span>🃏 Flashcards Pro Max</span>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md uppercase font-extrabold shrink-0">
                  {topic}
                </span>
              </h2>
              <p className="text-[11px] font-bold text-black/60 truncate">
                Révisez et testez vos connaissances en mode interactif 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleGenerateAI()}
              disabled={isGeneratingAI}
              className="bg-[#FFFBF5] hover:bg-[#FF5500] text-black hover:text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer disabled:opacity-50"
              title="Générer 5 cartes en direct avec l'IA"
            >
              <Sparkles size={14} className={isGeneratingAI ? "animate-spin text-[#FF5500]" : "text-[#FF5500] group-hover:text-white"} />
              <span className="hidden sm:inline">{isGeneratingAI ? "Génération..." : "✨ IA Générateur"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCard(!isAddingCard)}
              className="bg-black text-white hover:bg-[#FF5500] font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer"
              title="Ajouter une carte manuellement"
            >
              <Plus size={14} strokeWidth={3} />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border-2 border-black/10 hover:border-black hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              title="Fermer (Échap)"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Add Card Form Drawer */}
        {isAddingCard && (
          <form onSubmit={handleAddCard} className="p-6 bg-[#FAFAFA] border-b-[3px] border-black flex flex-col gap-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-black uppercase flex items-center gap-2">
                <Plus size={16} className="text-[#FF5500]" />
                <span>Créer une nouvelle Flashcard</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="text-xs font-bold text-black/50 hover:text-red-500"
              >
                Annuler
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase text-black/70 mb-1">Question (Recto)</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ex: Qu'est-ce qu'une promesse en JavaScript ?"
                  required
                  className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5500] shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-black/70 mb-1">Catégorie / Tag</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={topic}
                  className="w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5500] shadow-[2px_2px_0px_0px_#000000]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-black/70 mb-1">Réponse (Verso)</label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Ex: C'est un objet représentant la complétion ou l'échec éventuel d'une opération asynchrone."
                required
                rows={2}
                className="w-full bg-white border-2 border-black rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5500] shadow-[2px_2px_0px_0px_#000000]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-[#FF5500] text-white hover:bg-black font-extrabold px-5 py-2 rounded-xl text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={3} />
                <span>Enregistrer dans le deck</span>
              </button>
            </div>
          </form>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[#FFFFFF]">
          
          {isGeneratingAI ? (
            <div className="my-auto py-12 flex flex-col items-center justify-center text-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-3xl bg-[#FF5500]/15 border-[3px] border-black flex items-center justify-center text-[#FF5500] shadow-[4px_4px_0px_0px_#000000] animate-spin">
                <Loader2 size={32} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">
                  Le Professeur IA génère vos Flashcards...
                </h3>
                <p className="text-xs font-bold text-black/50 mt-1">
                  Analyse du sujet et création de 5 Q&A interactives en cours via OpenRouter
                </p>
              </div>
            </div>
          ) : isFinished ? (
            /* FINISHED / CELEBRATION SCREEN */
            <div className="my-auto py-6 flex flex-col items-center justify-center text-center gap-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-[#FF5500]/15 border-[3px] border-black flex items-center justify-center text-4xl shadow-[5px_5px_0px_0px_#FF5500] animate-bounce">
                🏆
              </div>
              
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight mb-2">
                  Session de Révision Terminée !
                </h3>
                <p className="text-sm font-bold text-black/60 max-w-md mx-auto">
                  Excellent travail ! Vous avez parcouru les {totalCards} cartes du deck de révision pour <span className="text-[#FF5500] underline">{topic}</span>.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-[#F0FDF4] border-[3px] border-black rounded-2xl p-4 flex flex-col items-center shadow-[4px_4px_0px_0px_#16A34A]">
                  <span className="text-2xl font-black text-[#16A34A]">{masteredCount}</span>
                  <span className="text-xs font-extrabold text-black/70 uppercase mt-0.5">Parfaitement su</span>
                </div>
                <div className="bg-[#FEF2F2] border-[3px] border-black rounded-2xl p-4 flex flex-col items-center shadow-[4px_4px_0px_0px_#DC2626]">
                  <span className="text-2xl font-black text-[#DC2626]">{reviewCount}</span>
                  <span className="text-xs font-extrabold text-black/70 uppercase mt-0.5">À Revoir</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
                {reviewCount > 0 && (
                  <button
                    onClick={() => handleRestart(true)}
                    className="w-full sm:w-auto bg-[#DC2626] text-white hover:bg-black font-extrabold px-5 py-3 rounded-2xl text-xs border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={15} strokeWidth={2.5} />
                    <span>Rejouer les {reviewCount} cartes ratées</span>
                  </button>
                )}
                <button
                  onClick={() => handleRestart(false)}
                  className="w-full sm:w-auto bg-black text-white hover:bg-[#FF5500] font-extrabold px-5 py-3 rounded-2xl text-xs border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCw size={15} strokeWidth={2.5} />
                  <span>Recommencer tout le deck ({totalCards})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateAI()}
                disabled={isGeneratingAI}
                className="mt-2 text-xs font-extrabold text-[#FF5500] hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>+ Générer 5 nouvelles cartes IA pour cet Espace</span>
              </button>
            </div>
          ) : (
            /* ACTIVE CARD DISPLAY */
            <>
              {/* Progress & Stats Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-black text-black/70">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-black/5 px-2.5 py-1 rounded-lg border border-black/10">
                      Carte {currentIndex + 1} / {totalCards}
                    </span>
                    {currentCard?.category && (
                      <span className="bg-[#FF5500]/10 text-[#FF5500] px-2.5 py-1 rounded-lg font-extrabold uppercase">
                        🎓 {currentCard.category}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-[#16A34A]">✓ {masteredCount} su</span>
                    <span className="text-[#DC2626]">✗ {reviewCount} à revoir</span>
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden border border-black/20">
                  <div 
                    className="h-full bg-[#FF5500] transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
                  />
                </div>
              </div>

              {/* 3D INTERACTIVE CARD */}
              <div 
                className="relative w-full my-auto min-h-[280px] sm:min-h-[340px] cursor-pointer select-none group"
                style={{ perspective: "1200px" }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className="w-full h-full min-h-[280px] sm:min-h-[340px] relative transition-all duration-500"
                  style={{ 
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                  }}
                >
                  {/* RECTO (QUESTION / FRONT) */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-[#FFFBF5] border-[3px] border-black rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-center text-center shadow-[8px_8px_0px_0px_#000000] group-hover:shadow-[10px_10px_0px_0px_#FF5500] transition-all"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-black/5 text-black/60 px-3 py-1 rounded-xl border border-black/10 flex items-center gap-1.5">
                        <HelpCircle size={14} className="text-[#FF5500]" />
                        <span>Question (Recto)</span>
                      </span>
                      <span className="text-[10px] font-bold text-black/40 hidden sm:inline">
                        Raccourci : Espace ␣
                      </span>
                    </div>

                    <div className="my-auto py-6 flex items-center justify-center">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-black leading-snug tracking-tight">
                        {currentCard?.question}
                      </h3>
                    </div>

                    <div className="w-full pt-4 border-t-2 border-black/10 flex items-center justify-center">
                      <span className="text-xs font-extrabold text-[#FF5500] flex items-center gap-2 bg-[#FF5500]/10 px-4 py-2 rounded-xl border-2 border-[#FF5500]/30 group-hover:bg-[#FF5500] group-hover:text-white transition-all">
                        <RotateCw size={14} strokeWidth={2.5} />
                        <span>Cliquez ou appuyez sur Espace pour retourner</span>
                      </span>
                    </div>
                  </div>

                  {/* VERSO (ANSWER / BACK) */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-[#F0FDF4] border-[3px] border-black rounded-3xl p-6 sm:p-10 flex flex-col justify-between items-center text-center shadow-[8px_8px_0px_0px_#16A34A] transition-all"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-[#16A34A]/15 text-[#16A34A] px-3 py-1 rounded-xl border border-[#16A34A]/30 flex items-center gap-1.5">
                        <Lightbulb size={14} />
                        <span>Réponse & Explication (Verso)</span>
                      </span>
                      <span className="text-[10px] font-bold text-black/40 hidden sm:inline">
                        1 : À revoir • 2 : Su !
                      </span>
                    </div>

                    <div className="my-auto py-6 flex items-center justify-center overflow-y-auto max-h-[180px]">
                      <p className="text-base sm:text-lg md:text-xl font-bold text-black/90 leading-relaxed">
                        {currentCard?.answer}
                      </p>
                    </div>

                    <div 
                      className="w-full pt-4 border-t-2 border-black/10 flex items-center justify-between gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRate(false)}
                        className="flex-1 bg-[#FEF2F2] hover:bg-[#DC2626] text-[#DC2626] hover:text-white font-black py-3 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X size={16} strokeWidth={3} />
                        <span>À Revoir (1)</span>
                      </button>
                      <button
                        onClick={() => handleRate(true)}
                        className="flex-1 bg-[#16A34A] hover:bg-black text-white font-black py-3 px-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check size={16} strokeWidth={3} />
                        <span>Parfaitement Su ! (2)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Instructions / Keyboard shortcuts banner */}
              <div className="flex items-center justify-between text-[11px] font-bold text-black/50 px-2 pt-1">
                <span className="flex items-center gap-1">
                  💡 Astuce : Testez-vous régulièrement pour la mémoire à long terme
                </span>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="hover:text-black underline sm:hidden font-extrabold text-[#FF5500]"
                >
                  Retourner la carte
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFA] border-t-2 border-black/10 flex items-center justify-between shrink-0 text-xs font-bold text-black/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>Mode Auto-Évaluation Socratique</span>
          </div>
          <button
            onClick={() => handleRestart(false)}
            className="hover:text-black transition-colors flex items-center gap-1"
          >
            <RotateCw size={12} />
            <span>Réinitialiser la session</span>
          </button>
        </div>

      </div>
    </div>
  );
}
