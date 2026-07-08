"use client";

import React, { useState, useEffect } from "react";
import { CheckSquare, Upload, Video, FileText, Sparkles, Play, Award, RotateCcw, CheckCircle2, XCircle, ArrowRight, HelpCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { StudyStreakCard } from "@/components/StudyStreakCard";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
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

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function QuizPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sourceType, setSourceType] = useState<"text" | "youtube" | "pdf">("text");
  const [sourceInput, setSourceInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile({ name: file.name, size: file.size });
    setPdfBase64(null);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceInput(ev.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Str = ev.target?.result as string;
        setPdfBase64(base64Str);
        setSourceInput(`[Fichier PDF importé : ${file.name}] Prêt à être analysé en profondeur.`);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem("gama_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const isPro = user?.user_metadata?.plan === "pro" || user?.user_metadata?.is_pro === true;

  const handleGenerate = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!isPro) {
      const todayStr = new Date().toISOString().split("T")[0];
      const storedQuizDate = localStorage.getItem("gama_free_quiz_date");
      let count = Number(localStorage.getItem("gama_free_quiz_count") || 0);
      if (storedQuizDate !== todayStr) {
        count = 0;
        localStorage.setItem("gama_free_quiz_date", todayStr);
      }
      if (count >= 3) {
        setShowUpgradeModal(true);
        return;
      }
      localStorage.setItem("gama_free_quiz_count", String(count + 1));
    }

    if (!sourceInput.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceInput,
          sourceType: sourceType,
          pdfBase64: pdfBase64,
          questionCount: isPro ? 10 : 5
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        alert("⚠️ " + (data.error || "Erreur lors de la génération du QCM depuis cette source."));
        return;
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        alert("⚠️ Impossible d'extraire des questions QCM à partir de cette source.");
        return;
      }

      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setScore(0);
      setIsCompleted(false);
    } catch (err: any) {
      console.error(err);
      alert("⚠️ Erreur réseau lors de la communication avec l'API QCM.");
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
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FFFBF5]">
        {/* Top Header parfaitement aligné au style Devoirs IA / Résumés */}
        <header className="w-full flex flex-col md:flex-row md:items-center justify-between px-6 md:px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 border-2 border-[#FF5500] flex items-center justify-center text-[#FF5500] shadow-[3px_3px_0px_0px_#000000]">
              <CheckSquare size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                Quiz & QCM IA Interactif
              </h1>
              <p className="text-xs font-bold text-black/50">
                Générez des QCM d'entraînement à partir de n'importe quel cours, PDF ou vidéo YouTube
              </p>
            </div>
          </div>

          {/* Toggle Type de Source */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-2xl border border-black/10">
            <button
              onClick={() => setSourceType("text")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                sourceType === "text"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF5500]"
                  : "text-black/70 hover:text-black"
              }`}
            >
              <FileText size={14} />
              <span>Texte / Cours</span>
            </button>
            <button
              onClick={() => setSourceType("youtube")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                sourceType === "youtube"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF5500]"
                  : "text-black/70 hover:text-black"
              }`}
            >
              <Video size={14} className="text-red-500" />
              <span>Vidéo YouTube</span>
            </button>
            <button
              onClick={() => setSourceType("pdf")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                sourceType === "pdf"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF5500]"
                  : "text-black/70 hover:text-black"
              }`}
            >
              <Upload size={14} />
              <span>Fichier PDF</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-6 md:px-8 py-8 flex flex-col gap-8">
          {/* Study Streak Gamification Banner */}
          <StudyStreakCard />

          {/* 2-Column Split Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Source Input */}
            <div className="lg:col-span-5 bg-white border-[3px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b-2 border-black/10 pb-3">
                <Sparkles size={18} className="text-[#FF5500]" />
                <h2 className="text-base font-black uppercase tracking-tight text-black">
                  Source & Contenu
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-black/70">
                  {sourceType === "youtube"
                    ? "Lien de la vidéo YouTube"
                    : sourceType === "pdf"
                    ? "Importer ou décrire le PDF"
                    : "Coller votre chapitre ou résumé de cours"}
                </label>

                {sourceType === "youtube" ? (
                  <input
                    type="text"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#FF5500] transition-all"
                  />
                ) : sourceType === "pdf" ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="quiz-pdf-upload"
                    />
                    <label
                      htmlFor="quiz-pdf-upload"
                      className="border-2 border-dashed border-black/30 hover:border-black rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-[#FAFAFA] hover:bg-[#FFFBF5] transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-black/5 group-hover:bg-[#FF5500]/10 flex items-center justify-center text-black/60 group-hover:text-[#FF5500] transition-colors">
                        <Upload size={24} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase text-black block">
                          Cliquez pour importer un fichier PDF
                        </span>
                        <span className="text-[11px] font-bold text-black/50 block mt-0.5">
                          PDF, TXT, DOCX pris en charge (extraction instantanée)
                        </span>
                      </div>
                    </label>

                    {uploadedFile && (
                      <div className="bg-[#FFFBF5] border-2 border-black rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={18} className="text-[#FF5500] shrink-0" />
                          <span className="text-xs font-black truncate">{uploadedFile.name}</span>
                          <span className="text-[10px] font-bold text-black/50">
                            ({(uploadedFile.size / 1024).toFixed(1)} Ko)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            setSourceInput("");
                          }}
                          className="text-xs font-extrabold text-red-500 hover:underline shrink-0"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}

                    <textarea
                      rows={4}
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder="Notes complémentaires ou extrait spécifique du PDF à cibler..."
                      className="w-full p-3.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-xs outline-none focus:bg-white focus:shadow-[3px_3px_0px_0px_#FF5500] transition-all resize-none"
                    />
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="Collez ici vos notes, définitions ou chapitre de cours pour générer les questions QCM..."
                    className="w-full p-4 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold text-sm outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#FF5500] transition-all resize-none"
                  />
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !sourceInput.trim()}
                className="bg-[#FF5500] hover:bg-black text-white font-extrabold py-3.5 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={18} />
                <span>{isLoading ? "Génération des QCM..." : "Générer le QCM Interactif"}</span>
              </button>
            </div>

            {/* Right Column: QCM Interactive Player */}
            <div className="lg:col-span-7 bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_#000000] min-h-[380px] flex flex-col justify-center">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-black/5 border-2 border-black/15 flex items-center justify-center text-black/30">
                    <HelpCircle size={32} />
                  </div>
                  <h3 className="text-lg font-black uppercase text-black/60">
                    Aucun Quiz en Cours
                  </h3>
                  <p className="text-xs font-bold text-black/40 max-w-sm leading-relaxed">
                    Collez votre cours ou une URL YouTube à gauche pour lancer un QCM interactif avec corrections détaillées.
                  </p>
                </div>
              ) : !isCompleted ? (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
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
                          className={`p-4 rounded-xl border-2 font-bold text-sm text-left transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {selectedOption !== null && isCorrect && <CheckCircle2 size={18} className="shrink-0" />}
                          {selectedOption !== null && isSelected && !isCorrect && <XCircle size={18} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

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
              ) : (
                <div className="text-center flex flex-col items-center gap-5 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000000]">
                    <Award size={36} />
                  </div>
                  <h3 className="text-2xl font-black uppercase text-black">
                    Quiz Terminé ! Score : {score} / {questions.length}
                  </h3>
                  <p className="text-sm font-bold text-black/60 max-w-md">
                    Excellent travail ! Votre session de révision active a été comptabilisée.
                  </p>
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
                    <span>Recommencer un Quiz</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} user={user} />
    </main>
  );
}
