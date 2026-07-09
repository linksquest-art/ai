"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { GraduationCap, Sparkles, ArrowRight, BookOpen, Calculator, PenTool, Globe, CheckCircle2, HelpCircle, FileText, Zap, Brain, Lightbulb, Lock, Copy, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthModal } from "@/components/AuthModal";
import { StudyStreakCard } from "@/components/StudyStreakCard";
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

export default function HomeworkPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeTool, setActiveTool] = useState<"socratic" | "math" | "essay" | "flashcards" | "science">("socratic");
  const [inputSubject, setInputSubject] = useState("");
  const [inputLevel, setInputLevel] = useState("Lycée / Bac");
  const [inputContent, setInputContent] = useState("");
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{ role: "user" | "assistant", content: string }>>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [autoGenFlashcards, setAutoGenFlashcards] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedSessions = localStorage.getItem("gama_sessions");
    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isPro = user?.user_metadata?.plan === "pro" || user?.user_metadata?.is_pro === true;

  const tools = [
    {
      id: "stepbystep",
      title: "Professeur IA Interactif (Pas-à-Pas)",
      subtitle: "Guidance progressive et claire pour comprendre le raisonnement",
      icon: GraduationCap,
      color: "bg-[#FF5500]",
      placeholder: "Quel concept, exercice ou devoir voulez-vous résoudre guidé étape par étape ?",
      promptPrefix: "Agis comme un Professeur IA bienveillant et pédagogue. RÈGLE D'OR : NE DONNE PAS LA RÉPONSE FINALE D'UN COUP. Guide l'étudiant pas à pas en expliquant le raisonnement avec clarté : \n\n"
    },
    {
      id: "math",
      title: "Résolveur & Logique Mathématique",
      subtitle: "Explications pas à pas, théorèmes et démonstrations",
      icon: Calculator,
      color: "bg-blue-500",
      placeholder: "Saisissez votre équation, système linéaire, intégrale ou problème géométrique...",
      promptPrefix: "Résous et explique pas à pas en détaillant chaque étape, le théorème utilisé et la logique de calcul pour le problème suivant :\n\n"
    },
    {
      id: "essay",
      title: "Plan de Dissertation & Style",
      subtitle: "Thèse, antithèse, synthèse et enrichissement littéraire",
      icon: PenTool,
      color: "bg-purple-500",
      placeholder: "Quel est votre sujet de philosophie, d'histoire ou de littérature ? Ou collez votre brouillon...",
      promptPrefix: "Agis comme un professeur de lettres et philosophie. Propose une analyse rigoureuse du sujet, une problématique percutante, un plan détaillé en 3 parties et des arguments clés pour :\n\n"
    },
    {
      id: "flashcards",
      title: "Générateur de Fiches & Flashcards",
      subtitle: "Synthèse active, mots-clés et mémorisation rapide",
      icon: Brain,
      color: "bg-emerald-500",
      placeholder: "Collez votre chapitre de cours ou indiquez le thème (ex: La mitose cellulaire, La Guerre Froide...)...",
      promptPrefix: "Crée une fiche de révision ultra-synthétique avec 5 points clés à retenir absolument, 3 définitions essentielles et 5 flashcards (Question / Réponse) pour mémoriser ce cours :\n\n"
    },
    {
      id: "science",
      title: "Sciences & Physique-Chimie",
      subtitle: "Lois physiques, réactions chimiques et analogies concrètes",
      icon: Lightbulb,
      color: "bg-amber-500",
      placeholder: "Quel phénomène scientifique ou exercice de mécanique/thermodynamique souhaitez-vous comprendre ?",
      promptPrefix: "Explique de manière limpide avec des analogies concrètes, les formules physiques/chimiques en jeu et la méthode de résolution pour :\n\n"
    }
  ];

  const currentToolObj = tools.find(t => t.id === activeTool) || tools[0];

  const handleLaunchAi = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!inputContent.trim()) return;
    setIsGenerating(true);
    setAiResult(null);
    setConversation([]);

    const fullPrompt = `[Niveau : ${inputLevel}] ${inputSubject ? `[Matière : ${inputSubject}] ` : ""}\n\n${currentToolObj.promptPrefix}${inputContent.trim()}`;
    const systemContext = "Tu es un Professeur IA d'élite pédagogique et patient. SUR CETTE PAGE DE DEVOIRS ET RÉVISIONS : explique clairement les étapes, guide l'étudiant dans sa réflexion, en expliquant le 'pourquoi' et le 'comment' avec clarté et bienveillance.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: fullPrompt }],
          model: "gpt-4o-mini",
          systemPrompt: systemContext
        })
      });

      const data = await response.json();
      if (data.content) {
        setAiResult(data.content);
        setConversation([
          { role: "user", content: inputContent.trim() },
          { role: "assistant", content: data.content }
        ]);
      } else {
        setAiResult("⚠️ Impossible de générer la résolution. Veuillez réessayer.");
      }
    } catch (err) {
      setAiResult("⚠️ Erreur de connexion au serveur IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!followUpInput.trim() || isSendingFollowUp) return;
    const userMsg = { role: "user" as const, content: followUpInput.trim() };
    const updatedHistory = [...conversation, userMsg];
    setConversation(updatedHistory);
    setFollowUpInput("");
    setIsSendingFollowUp(true);

    const systemContext = "Tu es un Professeur IA d'élite pédagogique et patient. SUR CETTE PAGE DE DEVOIRS ET RÉVISIONS : explique clairement les étapes, guide l'étudiant dans sa réflexion, en expliquant le 'pourquoi' et le 'comment' avec clarté et bienveillance. Tiens compte de tout l'historique pour poursuivre la discussion de manière interactive.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          model: "gpt-4o-mini",
          systemPrompt: systemContext
        })
      });

      const data = await response.json();
      if (data.content) {
        setConversation([...updatedHistory, { role: "assistant" as const, content: data.content }]);
        setAiResult(data.content);
      }
    } catch (err) {
      alert("⚠️ Erreur de connexion au serveur IA.");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <FlashcardModal
        isOpen={showFlashcardsModal}
        onClose={() => {
          setShowFlashcardsModal(false);
          setAutoGenFlashcards(false);
        }}
        topic={inputSubject || "Révision Académique"}
        autoGenerate={autoGenFlashcards}
        initialText={
          aiResult
            ? `Sujet: ${inputSubject || "Cours"} (${inputLevel})\n\nLeçon détaillée:\n${aiResult}`
            : inputContent.trim()
            ? `Sujet/Matière: ${inputSubject || "Révision"} (${inputLevel})\n\nContenu:\n${inputContent.trim()}`
            : inputSubject.trim()
            ? `Sujet de révision: ${inputSubject} (${inputLevel})`
            : undefined
        }
      />
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="w-full flex items-center justify-between px-6 md:px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border-2 border-blue-500 flex items-center justify-center text-blue-600 shadow-[3px_3px_0px_0px_#000000]">
              <GraduationCap size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black uppercase tracking-tight">Devoirs IA & Académie Pro</h1>
              <p className="text-xs font-bold text-black/50">Outils spécialisés pour étudiants : mathématiques, dissertation, sciences et mémorisation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-xl border border-black/10">
            <Sparkles size={16} className="text-primary animate-pulse" />
            <span className="text-xs font-extrabold text-black/80">Méthode Pédagogique Pas-à-Pas</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-6 md:px-8 py-8 flex flex-col gap-8">
          
          {/* Study Streak Gamification Banner */}
          <StudyStreakCard />

          {/* Tool Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`p-5 rounded-3xl border-[3px] text-left flex flex-col justify-between gap-4 transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-black text-white border-black shadow-[6px_6px_0px_0px_#FF5500] translate-y-[-2px]"
                      : "bg-white text-black border-black/20 hover:border-black hover:shadow-[4px_4px_0px_0px_#000000]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${tool.color} border border-black shadow-sm`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-md">
                        Sélectionné
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-snug">{tool.title}</h3>
                    <p className={`text-xs font-bold mt-1 leading-relaxed ${isSelected ? "text-white/70" : "text-black/60"}`}>
                      {tool.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tool Workplace Card */}
          <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-black/10 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${currentToolObj.color} border-2 border-black shadow-[3px_3px_0px_0px_#000000]`}>
                  <currentToolObj.icon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight">{currentToolObj.title}</h2>
                  <p className="text-xs font-bold text-black/60">Saisissez vos paramètres et laissez l'IA vous guider étape par étape</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col flex-1 md:w-36">
                  <label className="text-[10px] font-black uppercase text-black/50 mb-1">Niveau d'études</label>
                  <select
                    value={inputLevel}
                    onChange={(e) => setInputLevel(e.target.value)}
                    className="bg-[#FAFAFA] border-2 border-black rounded-xl px-3 py-1.5 font-bold text-xs outline-none focus:bg-white"
                  >
                    <option value="Collège">Collège</option>
                    <option value="Lycée / Bac">Lycée / Bac</option>
                    <option value="Licence / Supérieur">Licence / Supérieur</option>
                    <option value="Master / Concours">Master / Concours</option>
                  </select>
                </div>
                <div className="flex flex-col flex-1 md:w-44">
                  <label className="text-[10px] font-black uppercase text-black/50 mb-1">Matière / Thème</label>
                  <input
                    type="text"
                    value={inputSubject}
                    onChange={(e) => setInputSubject(e.target.value)}
                    placeholder="ex: Maths, Philo..."
                    className="bg-[#FAFAFA] border-2 border-black rounded-xl px-3 py-1.5 font-bold text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase text-black/80 flex items-center justify-between">
                <span>Énoncé, Question ou Chapitre à analyser :</span>
                <span className="text-[10px] text-black/40 font-normal">Vous pourrez joindre des photos ou PDF dans le chat</span>
              </label>
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={currentToolObj.placeholder}
                rows={6}
                className="w-full bg-[#FAFAFA] border-2 border-black rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-primary resize-none leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-black/60">
                <Zap size={16} className="text-amber-500 shrink-0" />
                <span>L'IA fournira la méthode détaillée de résolution en priorité.</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {activeTool === "flashcards" && (
                  <button
                    type="button"
                    onClick={() => setShowFlashcardsModal(true)}
                    className="w-full sm:w-auto bg-[#FFFBF5] hover:bg-[#FF5500] text-black hover:text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer shrink-0"
                  >
                    <span>🃏</span>
                    <span>Lancer le Deck 3D</span>
                  </button>
                )}
                <button
                  onClick={handleLaunchAi}
                  disabled={!inputContent.trim() || isGenerating}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer ${
                    inputContent.trim() && !isGenerating
                      ? "bg-primary text-white hover:bg-black hover:translate-y-[-2px]"
                      : "bg-black/10 text-black/40 border-black/20 shadow-none cursor-not-allowed"
                  }`}
                >
                  <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? "Génération de la résolution..." : "Générer avec le Professeur IA"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* AI PROFESSOR GENERATING STATE */}
          {isGenerating && (
            <div className="bg-amber-50/80 border-[3px] border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_#000000] flex flex-col items-center justify-center gap-4 text-center animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5500] text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                <Sparkles size={28} className="animate-spin" />
              </div>
              <h3 className="text-xl font-black text-black">👨‍🏫 Le Professeur IA analyse votre énoncé...</h3>
              <p className="text-xs font-bold text-black/70 max-w-md">
                Nous préparons la méthode détaillée, les formules essentielles et l'explication pas à pas pour vous aider à comprendre parfaitement.
              </p>
            </div>
          )}

          {/* AI PROFESSOR RESULT DISPLAY */}
          {aiResult && !isGenerating && (
            <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#FF5500] flex flex-col gap-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black/10 pb-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#FF5500] text-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black uppercase tracking-tight">Résolution & Explications du Professeur IA</h3>
                    <p className="text-xs font-bold text-black/50">Méthode complète — Prêt pour vos révisions et flashcards</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiResult);
                      alert("✅ Résolution copiée dans le presse-papier !");
                    }}
                    className="px-4 py-2 bg-black/5 hover:bg-black hover:text-white text-black font-extrabold text-xs rounded-xl border border-black/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📋 Copier</span>
                  </button>
                  <button
                    onClick={() => setShowFlashcardsModal(true)}
                    className="px-4 py-2 bg-[#FF5500] hover:bg-black text-white font-extrabold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🃏</span>
                    <span>Créer des Flashcards 3D</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#FAFAFA] border-2 border-black/15 rounded-2xl p-6 md:p-8 text-black font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap select-text">
                {aiResult}
              </div>
            </div>
          )}

          {/* Quick Study Tips / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-[#FFFBF5] border-2 border-black/15 rounded-2xl p-5 flex flex-col gap-2">
              <span className="text-xs font-black text-amber-600 uppercase flex items-center gap-1.5">
                💡 Astuce Méthodologique
              </span>
              <h4 className="font-extrabold text-sm text-black">Méthode Feynman</h4>
              <p className="text-xs font-bold text-black/60 leading-relaxed">
                Si vous ne pouvez pas expliquer un concept simplement à un enfant, c'est que vous ne l'avez pas totalement maîtrisé. Demandez à l'IA de simplifier !
              </p>
            </div>

            <div className="bg-[#F0FDF4] border-2 border-black/15 rounded-2xl p-5 flex flex-col gap-2">
              <span className="text-xs font-black text-emerald-600 uppercase flex items-center gap-1.5">
                🧠 Astuce Mémorisation
              </span>
              <h4 className="font-extrabold text-sm text-black">Répétition Espacée</h4>
              <p className="text-xs font-bold text-black/60 leading-relaxed">
                Générez des flashcards avec notre outil et révisez-les à intervalles réguliers (J+1, J+3, J+7) pour ancrer l'information dans votre mémoire à long terme.
              </p>
            </div>

            <div className="bg-[#FAF5FF] border-2 border-black/15 rounded-2xl p-5 flex flex-col gap-2">
              <span className="text-xs font-black text-purple-600 uppercase flex items-center gap-1.5">
                ✍️ Astuce Rédaction
              </span>
              <h4 className="font-extrabold text-sm text-black">Structure d'Argumentation</h4>
              <p className="text-xs font-bold text-black/60 leading-relaxed">
                Un bon argument en dissertation suit la règle : Affirmation, Explication, Exemple précis et Transition vers l'idée suivante.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
