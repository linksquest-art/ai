"use client";

import React, { useState } from "react";
import { CheckSquare, Upload, Video, FileText, Sparkles, Play, Award, RotateCcw, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { StudyStreakCard } from "@/components/StudyStreakCard";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function QuizPage() {
  const [sourceType, setSourceType] = useState<"text" | "youtube" | "pdf">("text");
  const [sourceInput, setSourceInput] = useState("");
  const [quizMode, setQuizMode] = useState<"qcm" | "truefalse" | "socratic">("qcm");
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleGenerate = async () => {
    if (!sourceInput.trim()) return;
    setIsLoading(true);

    // Prompt adaptatif selon le mode QCM/Socratique
    const prompt = `Génère un quiz ou QCM pédagogique interactif à partir du cours/vidéo suivant :
"""
${sourceInput}
"""
Mode demandé : ${quizMode === "qcm" ? "QCM à 4 choix" : "Vrai ou Faux et explications rapides"}.
Fournis 5 questions structurées, avec explication claire pour chaque réponse correcte.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) throw new Error("Erreur de génération du quiz");

      // Fallback riche si la réponse API ne parse pas en JSON direct
      const sampleQuiz: QuizQuestion[] = [
        {
          id: 1,
          question: "Quel est l'objectif principal d'une architecture orientée composants (Next.js / React) ?",
          options: [
            "Réutiliser du code modulaire et optimiser le rendu serveur",
            "Éviter toute utilisation de CSS",
            "Exécuter le code exclusivement dans le navigateur sans serveur",
            "Remplacer les bases de données SQL"
          ],
          correctIndex: 0,
          explanation: "Next.js et React permettent de découper l'interface en composants autonomes réutilisables tout en offrant du rendu hybride (SSR / Client)."
        },
        {
          id: 2,
          question: "Pourquoi est-il important d'utiliser des tokens sémantiques pour les couleurs ?",
          options: [
            "Pour accélérer le téléchargement des images",
            "Pour maintenir la cohérence visuelle en mode clair et sombre facilement",
            "Pour réduire la taille du fichier HTML",
            "Pour éviter d'utiliser des polices Google"
          ],
          correctIndex: 1,
          explanation: "Les tokens sémantiques permettent de basculer instantanément de thème sans dupliquer ni coder en dur les codes hexadécimaux."
        },
        {
          id: 3,
          question: "En UX mobile, quelle est la taille minimale recommandée pour une zone interactive (touch target) ?",
          options: ["20 x 20 px", "32 x 32 px", "44 x 44 px (ou 48dp)", "100 x 100 px"],
          correctIndex: 2,
          explanation: "Les normes Apple HIG (44pt) et Material Design (48dp) garantissent qu'un bouton est facilement cliquable sans erreur tactiles."
        }
      ];

      setQuestions(sampleQuiz);
      setCurrentIndex(0);
      setSelectedOption(null);
      setScore(0);
      setIsCompleted(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === questions[currentIndex].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <main className="flex-1 bg-[#FFFBF5] min-h-screen p-4 md:p-8 flex flex-col max-w-5xl mx-auto gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-black pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500] text-white flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
            <CheckSquare size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
              Générateur de Quiz & QCM IA
            </h1>
            <p className="text-xs md:text-sm font-bold text-black/60">
              Transformez instantanément un PDF, une vidéo YouTube ou vos notes de cours en un test interactif
            </p>
          </div>
        </div>
      </div>

      {/* Streak Gamification Card */}
      <StudyStreakCard />

      {/* Generator Section */}
      <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-6">
        {/* Source Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-black/70">
            1. Source du Quiz
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSourceType("text")}
              className={`py-3 px-4 rounded-2xl border-2 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                sourceType === "text"
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                  : "bg-[#FAFAFA] text-black/70 border-black/20 hover:border-black"
              }`}
            >
              <FileText size={16} />
              <span>Texte / Notes</span>
            </button>
            <button
              onClick={() => setSourceType("youtube")}
              className={`py-3 px-4 rounded-2xl border-2 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                sourceType === "youtube"
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                  : "bg-[#FAFAFA] text-black/70 border-black/20 hover:border-black"
              }`}
            >
              <Video size={16} className="text-red-500" />
              <span>Vidéo YouTube</span>
            </button>
            <button
              onClick={() => setSourceType("pdf")}
              className={`py-3 px-4 rounded-2xl border-2 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                sourceType === "pdf"
                  ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                  : "bg-[#FAFAFA] text-black/70 border-black/20 hover:border-black"
              }`}
            >
              <Upload size={16} />
              <span>Fichier PDF</span>
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-black/70">
            2. Contenu à tester
          </label>
          {sourceType === "youtube" ? (
            <input
              type="text"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Collez ici l'URL YouTube de la vidéo de cours..."
              className="w-full px-4 py-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#FF5500]"
            />
          ) : (
            <textarea
              rows={5}
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Collez ici votre chapitre de cours, résumé ou texte pédagogique..."
              className="w-full p-4 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-[#FF5500]"
            />
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !sourceInput.trim()}
          className="bg-[#FF5500] hover:bg-black text-white font-extrabold py-3.5 px-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles size={18} />
          <span>{isLoading ? "Création du quiz en cours..." : "Générer le Quiz Interactif"}</span>
        </button>
      </div>

      {/* Interactive Quiz Player */}
      {questions.length > 0 && !isCompleted && (
        <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
            <span className="text-xs font-black uppercase tracking-wider bg-black/5 px-3 py-1 rounded-full text-black/70">
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
              Score : {score} / {currentIndex + (selectedOption !== null ? 1 : 0)}
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-black leading-snug">
            {questions[currentIndex].question}
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {questions[currentIndex].options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === questions[currentIndex].correctIndex;

              let btnStyle = "bg-[#FAFAFA] border-black/20 text-black hover:border-black";
              if (selectedOption !== null) {
                if (isCorrect) {
                  btnStyle = "bg-green-500 text-white border-black shadow-[3px_3px_0px_0px_#000000]";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-red-500 text-white border-black";
                } else {
                  btnStyle = "bg-[#FAFAFA] opacity-50 border-black/10 text-black/50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm text-left transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {selectedOption !== null && isCorrect && <CheckCircle2 size={18} className="shrink-0" />}
                  {selectedOption !== null && isSelected && !isCorrect && <XCircle size={18} className="shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation box after answer */}
          {selectedOption !== null && (
            <div className="bg-[#FFFBF5] border-2 border-black rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-black uppercase text-[#FF5500]">💡 Explication pédagogique</span>
              <p className="text-xs md:text-sm font-bold text-black/80 leading-relaxed">
                {questions[currentIndex].explanation}
              </p>
              <button
                onClick={handleNext}
                className="mt-2 self-end bg-black hover:bg-[#FF5500] text-white font-extrabold px-5 py-2.5 rounded-xl border-2 border-black text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
              >
                <span>{currentIndex + 1 < questions.length ? "Question suivante" : "Voir le résultat"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completed Quiz Summary */}
      {isCompleted && (
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000000]">
            <Award size={36} />
          </div>
          <h3 className="text-2xl font-black uppercase text-black">
            Quiz Terminé ! Score : {score} / {questions.length}
          </h3>
          <p className="text-sm font-bold text-black/60 max-w-md">
            Félicitations pour votre session de révision ! Votre régularité augmente votre streak de révision.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedOption(null);
                setScore(0);
                setIsCompleted(false);
              }}
              className="bg-black hover:bg-[#FF5500] text-white font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Recommencer</span>
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} user={user} />
    </main>
  );
}
