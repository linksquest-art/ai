"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { 
  FileText, 
  Video, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Play, 
  Brain, 
  Trash2, 
  Clock, 
  ArrowRight, 
  Layers, 
  Wand2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Lock
} from "lucide-react";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

interface SavedSummary {
  id: string;
  type: "youtube" | "course";
  title: string;
  source: string;
  format: string;
  content: string;
  createdAt: number;
}

export default function SummaryPage() {
  const [activeTab, setActiveTab] = useState<"youtube" | "course">("youtube");
  
  // YouTube Tab State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeNotes, setYoutubeNotes] = useState("");
  const [youtubeFormat, setYoutubeFormat] = useState("Synthèse Exécutive (5 points clés & TL;DR)");
  
  // Course Tab State
  const [courseTitle, setCourseTitle] = useState("");
  const [courseContent, setCourseContent] = useState("");
  const [courseFormat, setCourseFormat] = useState("Fiche de Révision Académique structurée");
  
  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState<SavedSummary[]>([]);
  
  // Flashcard Modal
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardText, setFlashcardText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = user?.user_metadata?.is_pro === true || user?.user_metadata?.plan === "pro";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Extract YouTube ID helper
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = extractVideoId(youtubeUrl);

  // Load Saved Summaries
  useEffect(() => {
    const local = localStorage.getItem("gama_saved_summaries");
    if (local) {
      try {
        setSavedSummaries(JSON.parse(local));
      } catch (e) {}
    }
  }, []);

  const saveNewSummary = (summary: SavedSummary) => {
    const updated = [summary, ...savedSummaries];
    setSavedSummaries(updated);
    localStorage.setItem("gama_saved_summaries", JSON.stringify(updated));

    // Optional Supabase cloud sync
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.auth.updateUser({
          data: { saved_summaries: updated.slice(0, 20) }
        });
      }
    });
  };

  const deleteSummary = (id: string) => {
    const updated = savedSummaries.filter(s => s.id !== id);
    setSavedSummaries(updated);
    localStorage.setItem("gama_saved_summaries", JSON.stringify(updated));
  };

  // Generate YouTube Summary
  const handleGenerateYoutube = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!youtubeUrl.trim()) return;
    if (!isPro) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const storedDate = localStorage.getItem("gama_free_summary_date");
      let count = Number(localStorage.getItem("gama_free_summary_count") || 0);
      if (storedDate !== todayStr) {
        count = 0;
        localStorage.setItem("gama_free_summary_date", todayStr);
      }
      if (count >= 3) {
        setShowUpgradeModal(true);
        return;
      }
      localStorage.setItem("gama_free_summary_count", String(count + 1));
    }
    setIsGenerating(true);
    setSummaryResult(null);

    const vidId = extractVideoId(youtubeUrl);

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
          format: youtubeFormat,
          notes: youtubeNotes
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la génération");
      const data = await res.json();
      const generated = data.content || "Aucun résumé généré.";
      setSummaryResult(generated);

      saveNewSummary({
        id: "yt_" + Date.now(),
        type: "youtube",
        title: data.title ? `${data.title}` : (vidId ? `Vidéo YouTube (${vidId})` : "Résumé Vidéo YouTube"),
        source: youtubeUrl,
        format: youtubeFormat,
        content: generated,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error(err);
      setSummaryResult("⚠️ Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Course Summary
  const handleGenerateCourse = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!courseContent.trim()) return;
    setIsGenerating(true);
    setSummaryResult(null);

    const prompt = `Tu es un professeur et concepteur pédagogique d'élite.
L'utilisateur veut synthétiser le cours ou document suivant :
${courseTitle ? `Titre du cours : ${courseTitle}\n` : ""}
Contenu / Notes à analyser :
"""
${courseContent.substring(0, 8000)}
"""

Format de synthèse demandé : "${courseFormat}".

INSTRUCTIONS STRICTES :
1. Organise la réponse en Markdown clair et hiérarchisé (Titres #, sous-titres ##, listes à puces).
2. Mets en évidence les définitions clés en gras, les concepts importants, et les idées fondamentales à retenir.
3. Sois pédagogique, ultra-précis et complet afin que ce résumé serve de fiche de révision parfaite.`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "deepseek/deepseek-chat"
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la génération");
      const data = await res.json();
      const generated = data.content || "Aucun résumé généré.";
      setSummaryResult(generated);

      saveToHistory({
        id: "cours_" + Date.now(),
        type: "course",
        title: courseTitle.trim() || "Fiche de Cours",
        source: "Texte de cours",
        format: courseFormat,
        content: generated,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error(err);
      setSummaryResult("⚠️ Une erreur est survenue lors de la synthèse. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summaryResult) return;
    const blob = new Blob([summaryResult], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Resume_Gama_Studio_${Date.now()}.md`;
    link.click();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FFFBF5] text-black">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="px-6 md:px-10 py-6 border-b-[3px] border-black bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FF4500]/10 text-[#FF4500] border-2 border-black px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest mb-2 shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles size={14} />
              <span>Studio d'Analyse & Synthèse IA</span>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Résumés YouTube & Fiches de Cours
            </h1>
            <p className="text-xs font-bold text-black/60 mt-0.5">
              Analysez instantanément des vidéos YouTube ou vos cours universitaires pour en extraire l'essentiel.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-2xl border-2 border-black">
            <button
              onClick={() => setActiveTab("youtube")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "youtube"
                  ? "bg-[#FF0000] text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Video size={16} strokeWidth={2.5} />
              <span>Vidéo YouTube</span>
            </button>
            <button
              onClick={() => setActiveTab("course")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                activeTab === "course"
                  ? "bg-[#FF4500] text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <BookOpen size={16} strokeWidth={2.5} />
              <span>Synthèse de Cours</span>
            </button>
          </div>
        </header>

        {/* Workspace Grid */}
        <div className="max-w-7xl w-full mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {activeTab === "youtube" ? (
              <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center text-red-600 shadow-[2px_2px_0px_0px_#000000]">
                    <Video size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-black">Analyseur de Vidéo YouTube</h2>
                    <p className="text-xs font-bold text-black/60">Collez un lien pour extraire un résumé exécutif complet</p>
                  </div>
                </div>

                {/* YouTube URL input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Lien de la Vidéo YouTube
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full h-12 px-4 rounded-xl border-2 border-black font-bold text-sm bg-black/[0.02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                {/* Live YouTube Thumbnail Card */}
                {youtubeId && (
                  <div className="bg-black/5 rounded-2xl border-2 border-black p-4 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                      alt="Miniature de la vidéo"
                      className="w-36 h-24 object-cover rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000]"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full">
                        Vidéo Détectée
                      </span>
                      <p className="text-xs font-black text-black mt-2 truncate">
                        ID YouTube : {youtubeId}
                      </p>
                      <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-black/60 hover:text-black flex items-center gap-1 mt-1 underline"
                      >
                        Ouvrir sur YouTube <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Format selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Format du Résumé
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "Synthèse Exécutive (5 points clés & TL;DR)",
                      "Résumé Horodaté & Chapitres détaillés",
                      "Fiche Conceptuelle & Définitions essentielles",
                      "Plan d'Action Pratique & Applications"
                    ].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setYoutubeFormat(fmt)}
                        className={`p-3 rounded-xl border-2 font-black text-xs text-left transition-all ${
                          youtubeFormat === fmt
                            ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                            : "bg-white text-black border-black/20 hover:border-black"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Focus ou Notes Complémentaires (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={youtubeNotes}
                    onChange={(e) => setYoutubeNotes(e.target.value)}
                    placeholder="Ex: Concentre-toi sur l'architecture et les algorithmes..."
                    className="w-full h-11 px-4 rounded-xl border-2 border-black font-bold text-xs bg-black/[0.02] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerateYoutube}
                  disabled={isGenerating || !youtubeUrl.trim()}
                  className="w-full h-14 rounded-2xl bg-[#FF0000] hover:bg-[#D00000] text-white border-2 border-black font-black text-sm flex items-center justify-center gap-3 shadow-[5px_5px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles size={18} />
                  <span>{isGenerating ? "Analyse de la Vidéo en cours..." : "Analyser & Résumer la Vidéo"}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-black/10">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 border-2 border-black flex items-center justify-center text-[#FF4500] shadow-[2px_2px_0px_0px_#000000]">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-black">Synthèse de Cours & Document</h2>
                    <p className="text-xs font-bold text-black/60">Collez votre cours pour obtenir une fiche de révision haute précision</p>
                  </div>
                </div>

                {/* Course Title */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Titre du Cours / Matière
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Ex: Chapitre 4 : Neurobiologie & Plasticité Cérébrale"
                    className="w-full h-11 px-4 rounded-xl border-2 border-black font-bold text-sm bg-black/[0.02] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Course Content */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Contenu ou Notes de Cours à Synthétiser
                  </label>
                  <textarea
                    rows={8}
                    value={courseContent}
                    onChange={(e) => setCourseContent(e.target.value)}
                    placeholder="Collez ici le texte de votre cours, vos notes ou votre transcription de cours magistral..."
                    className="w-full p-4 rounded-xl border-2 border-black font-medium text-sm bg-black/[0.02] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Format selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                    Format de Synthèse
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      "Fiche de Révision Académique structurée",
                      "Extraction de Concepts & Formules clés",
                      "Résumé Express en 1 Minute (TL;DR)"
                    ].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setCourseFormat(fmt)}
                        className={`p-3 rounded-xl border-2 font-black text-xs text-left transition-all ${
                          courseFormat === fmt
                            ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_#FF5500]"
                            : "bg-white text-black border-black/20 hover:border-black"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateCourse}
                  disabled={isGenerating || !courseContent.trim()}
                  className="w-full h-14 rounded-2xl bg-[#FF4500] hover:bg-[#E03E00] text-white border-2 border-black font-black text-sm flex items-center justify-center gap-3 shadow-[5px_5px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Wand2 size={18} />
                  <span>{isGenerating ? "Synthèse en cours..." : "Générer la Fiche de Cours"}</span>
                </button>
              </div>
            )}

            {/* History Card */}
            {savedSummaries.length > 0 && (
              <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
                <h3 className="text-xs font-black uppercase tracking-wider text-black/40 mb-4 flex items-center gap-2">
                  <Clock size={14} />
                  <span>Historique des Résumés ({savedSummaries.length})</span>
                </h3>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {savedSummaries.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSummaryResult(s.content)}
                      className="p-3.5 rounded-2xl border-2 border-black/15 hover:border-black hover:bg-black/[0.02] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.type === "youtube" ? "bg-red-100 text-red-700" : "bg-orange-100 text-[#FF4500]"}`}>
                          {s.type === "youtube" ? "YouTube" : "Cours"}
                        </span>
                        <span className="text-xs font-black text-black truncate">{s.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSummary(s.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1.5 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: AI Output Viewer (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
            <div className="bg-white border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] min-h-[480px] flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-4 border-b-2 border-black/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="text-[#FF4500]" size={20} />
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Résultat de la Synthèse IA
                    </h3>
                  </div>

                  {summaryResult && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        title="Copier le texte"
                      >
                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        title="Télécharger .md"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-[#FF4500] border-t-transparent animate-spin"></div>
                    <p className="text-sm font-black text-black">
                      Analyse approfondie par l'IA en cours...
                    </p>
                  </div>
                ) : summaryResult ? (
                  user ? (
                    <div className="prose prose-sm max-w-none text-black font-medium leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
                      {summaryResult}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* Teaser Preview of Summary */}
                      <div className="prose prose-sm max-w-none text-black font-medium leading-relaxed whitespace-pre-wrap select-none opacity-85 max-h-[200px] overflow-hidden">
                        {summaryResult.substring(0, 480) + "..."}
                      </div>

                      {/* Paywall / Blurred Overlay */}
                      <div className="relative mt-[-70px] pt-24 pb-6 px-4 bg-gradient-to-b from-transparent via-white/95 to-white flex flex-col items-center justify-center text-center">
                        <div className="bg-black text-white p-5 rounded-2xl shadow-[6px_6px_0px_0px_#FF5500] max-w-sm w-full flex flex-col items-center gap-3 border-2 border-black animate-in fade-in duration-300">
                          <div className="w-10 h-10 rounded-full bg-[#FF5500]/20 flex items-center justify-center text-[#FF5500]">
                            <Lock size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-wider">Synthèse Prête & Détectée</h4>
                            <p className="text-xs text-white/80 mt-1 leading-tight">
                              Connectez-vous ou créez un compte gratuit pour lire l&apos;intégralité du résumé, des chapitres et convertir en fiches de révision.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAuthModal(true)}
                            className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-[#FF5500] hover:text-white font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_#FF5500]"
                          >
                            🔐 S&apos;inscrire / Voir la suite gratuite
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-black/40 space-y-3">
                    <FileText size={48} strokeWidth={1.5} />
                    <p className="text-sm font-bold max-w-[240px]">
                      Entrez un lien YouTube ou collez votre cours à gauche pour obtenir votre résumé instantané.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Banner: Convert to Flashcards */}
              {summaryResult && (
                <div className="mt-8 pt-6 border-t-2 border-black/10">
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                        return;
                      }
                      setFlashcardText(summaryResult);
                      setShowFlashcardModal(true);
                    }}
                    className="w-full h-12 rounded-2xl bg-black hover:bg-primary text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#FF5500] transition-all cursor-pointer"
                  >
                    <span>{user ? "🃏 Convertir en Deck Flashcards 3D" : "🔐 S'inscrire pour Convertir en Flashcards"}</span>
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* 3D Flashcard Modal integration */}
      <FlashcardModal
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        topic="Résumé IA"
        initialText={flashcardText}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        user={user}
      />
    </div>
  );
}
