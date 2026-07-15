"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { 
  Sparkles, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Brain, 
  Trash2, 
  Clock, 
  ArrowRight, 
  Wand2, 
  Award, 
  Target, 
  HelpCircle,
  TrendingUp,
  Bookmark
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

interface SavedItem {
  id: string;
  type: "fiche" | "annales";
  title: string;
  subtitle: string;
  content: string;
  createdAt: number;
}

export default function RevisionProPage() {
  const [activeTab, setActiveTab] = useState<"fiche" | "annales">("fiche");
  
  // Fiche-Master State
  const [courseTitle, setCourseTitle] = useState("");
  const [courseContent, setCourseContent] = useState("");
  const [ficheLevel, setFicheLevel] = useState("Licence / Université (L1-L3)");
  const [ficheStyle, setFicheStyle] = useState("Fiche-Master complète (Définitions + Formules + Pièges)");
  
  // Annales & Corrigé State
  const [examSubject, setExamSubject] = useState("");
  const [subjectType, setSubjectType] = useState("Dissertation / Problématique");
  const [targetGrade, setTargetGrade] = useState("Objectif 18/20 (Corrigé académique d'élite & barème)");
  
  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  
  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Load saved items
    const saved = localStorage.getItem("gama_revision_pro_items");
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved revision items", e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const saveToHistory = (item: SavedItem) => {
    const next = [item, ...savedItems.filter(x => x.id !== item.id)].slice(0, 30);
    setSavedItems(next);
    localStorage.setItem("gama_revision_pro_items", JSON.stringify(next));
  };

  const deleteSavedItem = (id: string) => {
    const next = savedItems.filter(x => x.id !== id);
    setSavedItems(next);
    localStorage.setItem("gama_revision_pro_items", JSON.stringify(next));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (text: string, title: string) => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_") || "Fiche_Gama_Studio"}.md`;
    link.click();
  };

  const handleGenerateFiche = async () => {
    if (!courseContent.trim()) return;
    setIsGenerating(true);
    setResultText(null);

    const prompt = `Tu es un Professeur Universitaire d'Élite et Expert en pédagogie de haut niveau.
Ton objectif : Créer la FICHE-MASTER DE RÉVISION définitive pour un étudiant en ${ficheLevel} sur la matière "${courseTitle || "Cours général"}".

Format demandé (${ficheStyle}) :
1. **📌 SYNTHÈSE EXÉCUTIVE DU COURS** (Les 5 concepts fondamentaux à retenir par cœur).
2. **📖 DÉFINITIONS CLÉS & VOCABULAIRE** (Chaque terme technique avec sa définition précise en gras).
3. **⚡ FORMULES, LOIS & PRINCIPES INCONTOURNABLES** (Ce qui tombe à chaque partiel / examen).
4. **⚠️ PIÈGES & ERREURS À ÉVITER ABSOLUMENT** (Les fautes qui font perdre des points aux copies moyennes).
5. **🧠 PLAN DE MÉMORISATION ÉCLAIR** (Squelette textuel type MindMap pour réviser 30 min avant l'épreuve).

Voici le contenu brut ou les notes à transformer :
---
${courseContent}
---
Rends la fiche ultra-propre, hiérarchisée en Markdown avec des titres clairs (#, ##), des emojis pédagogiques et des encarts précis.`;

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

      if (!res.ok) throw new Error("Erreur de génération");
      const data = await res.json();
      const generated = data.content || "Erreur lors de la génération de la fiche.";
      setResultText(generated);

      saveToHistory({
        id: "fiche_" + Date.now(),
        type: "fiche",
        title: courseTitle.trim() || "Fiche-Master IA",
        subtitle: `${ficheLevel} • ${ficheStyle.split(" (")[0]}`,
        content: generated,
        createdAt: Date.now()
      });
    } catch (error: any) {
      alert("Erreur lors de la génération de la fiche : " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnnales = async () => {
    if (!examSubject.trim()) return;
    setIsGenerating(true);
    setResultText(null);

    const prompt = `Tu es Président de Jury de Concours et Correcteur d'Élite à l'Université.
Ton objectif : Résoudre et rédiger le CORRIGÉ TYPE PARFAIT pour cet énoncé d'examen / annale (${subjectType}) avec le niveau d'exigence : "${targetGrade}".

Structure obligatoire du corrigé type :
1. **🎯 ANALYSE DU SUJET & PROBLÉMATIQUE** (Décorticage des mots-clés, pièges du sujet, et problématique centrale).
2. **📋 GRILLE D'ÉVALUATION & BARÈMES ESTIMÉS** (Ce que le correcteur attend pour mettre tous les points).
3. **✍️ RÉDACTION INTÉGRALE DE LA COPIE MODÈLE (18/20)** (Rédaction complète, structurée avec transitions, arguments majeurs, exemples ou démonstrations mathématiques/juridiques rigoureuses).
4. **💡 LES ASTUCES DU CORRECTEUR POUR SE DÉMARQUER** (Comment transformer une copie à 14/20 en copie à 18/20).

Voici l'énoncé / sujet d'examen :
---
${examSubject}
---
Sois d'une rigueur académique absolue, clair, pédagogique et immédiatement utilisable pour réviser l'examen.`;

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

      if (!res.ok) throw new Error("Erreur de génération");
      const data = await res.json();
      const generated = data.content || "Erreur lors de la génération du corrigé.";
      setResultText(generated);

      saveToHistory({
        id: "annale_" + Date.now(),
        type: "annales",
        title: examSubject.slice(0, 50) + (examSubject.length > 50 ? "..." : ""),
        subtitle: `${subjectType} • ${targetGrade.split(" (")[0]}`,
        content: generated,
        createdAt: Date.now()
      });
    } catch (error: any) {
      alert("Erreur lors de la génération du corrigé : " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FFFBF5] text-black">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} user={user} />
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="px-6 md:px-10 py-6 border-b-[3px] border-black bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FF5500]/10 text-[#FF5500] border-2 border-black px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest mb-2 shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles size={14} />
              <span>Studio d'Excellence Universitaire</span>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Fiches-Master & Annales IA
            </h1>
            <p className="text-xs font-bold text-black/60 mt-0.5">
              Transformez vos cours en fiches de révision structurées et obtenez les corrigés types 18/20 d'annales d'examens.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-2xl border-2 border-black">
            <button
              onClick={() => { setActiveTab("fiche"); setResultText(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                activeTab === "fiche"
                  ? "bg-[#FF5500] text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <FileText size={16} strokeWidth={2.5} />
              <span>Fiche-Master IA</span>
            </button>
            <button
              onClick={() => { setActiveTab("annales"); setResultText(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                activeTab === "annales"
                  ? "bg-[#FF5500] text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Award size={16} strokeWidth={2.5} />
              <span>Corrigé & Annales 18/20</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] flex flex-col gap-4">
              {activeTab === "fiche" ? (
                <>
                  <div className="flex items-center gap-2.5 border-b-2 border-black/10 pb-3">
                    <div className="p-2 bg-[#FF5500]/10 text-[#FF5500] rounded-xl border border-black">
                      <FileText size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-black">Créer une Fiche-Master</h2>
                      <p className="text-xs font-bold text-black/50">Synthèse immédiate de n'importe quel cours</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Titre de la Matière / du Cours
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="ex: Droit Administratif - L2 ou Neurobiologie"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Niveau d'Études
                    </label>
                    <select
                      value={ficheLevel}
                      onChange={(e) => setFicheLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500] min-h-[44px]"
                    >
                      <option value="Licence / Université (L1-L3)">Licence / Université (L1-L3)</option>
                      <option value="Master & Grandes Écoles (M1-M2)">Master & Grandes Écoles (M1-M2)</option>
                      <option value="Classes Préparatoires (CPGE / PACES)">Classes Préparatoires (CPGE / PACES)</option>
                      <option value="Lycée (Terminale & Baccalauréat)">Lycée (Terminale & Baccalauréat)</option>
                      <option value="Concours de la Fonction Publique">Concours de la Fonction Publique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Style de Synthèse
                    </label>
                    <select
                      value={ficheStyle}
                      onChange={(e) => setFicheStyle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500] min-h-[44px]"
                    >
                      <option value="Fiche-Master complète (Définitions + Formules + Pièges)">Fiche-Master complète (Définitions + Formules + Pièges)</option>
                      <option value="Carte Mentale Textuelle & Mots-Clés">Carte Mentale Textuelle & Mots-Clés</option>
                      <option value="Mémo-Flash Questions/Réponses express">Mémo-Flash Questions/Réponses express</option>
                      <option value="Focus Pièges d'Examen & Points de Barème">Focus Pièges d'Examen & Points de Barème</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Contenu du Cours (Collez vos notes ou extraits)
                    </label>
                    <textarea
                      value={courseContent}
                      onChange={(e) => setCourseContent(e.target.value)}
                      placeholder="Collez ici vos notes, paragraphes de cours, transcription ou résumé d'article..."
                      className="w-full h-44 px-3.5 py-2.5 rounded-xl border-2 border-black font-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500] resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateFiche}
                    disabled={isGenerating || !courseContent.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04D00] disabled:bg-black/20 text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5 min-h-[48px]"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Synthèse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} strokeWidth={2.5} />
                        <span>Générer la Fiche-Master ⚡</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 border-b-2 border-black/10 pb-3">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-black">
                      <Award size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-black">Résolveur d'Annales</h2>
                      <p className="text-xs font-bold text-black/50">Corrigé modèle & méthodologie 18/20</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Type d'Épreuve
                    </label>
                    <select
                      value={subjectType}
                      onChange={(e) => setSubjectType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                    >
                      <option value="Dissertation / Problématique philosophique ou juridique">Dissertation / Problématique philosophique ou juridique</option>
                      <option value="Commentaire d'arrêt ou de texte littéraire">Commentaire d'arrêt ou de texte littéraire</option>
                      <option value="Exercice & Problème mathématique / scientifique">Exercice & Problème mathématique / scientifique</option>
                      <option value="Cas clinique / Cas pratique d'entreprise">Cas clinique / Cas pratique d'entreprise</option>
                      <option value="Question à Réponse Courte (QRC) & QCM complexe">Question à Réponse Courte (QRC) & QCM complexe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Objectif d'Excellence
                    </label>
                    <select
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                    >
                      <option value="Objectif 18/20 (Corrigé académique d'élite & barème)">Objectif 18/20 (Corrigé académique d'élite & barème)</option>
                      <option value="Objectif 15/20 (Synthèse rapide, claire et directe)">Objectif 15/20 (Synthèse rapide, claire et directe)</option>
                      <option value="Méthodologie & Plan Détaillé uniquement">Méthodologie & Plan Détaillé uniquement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Énoncé du Sujet ou Question d'Examen
                    </label>
                    <textarea
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      placeholder="Collez ici l'énoncé du sujet, les questions de l'annale ou le cas pratique..."
                      className="w-full h-44 px-3.5 py-2.5 rounded-xl border-2 border-black font-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerateAnnales}
                    disabled={isGenerating || !examSubject.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-black/20 text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5 min-h-[48px]"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Corrigé en préparation...</span>
                      </>
                    ) : (
                      <>
                        <Award size={18} strokeWidth={2.5} />
                        <span>Générer le Corrigé Type 18/20 🎯</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Saved Items List */}
            {savedItems.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-primary" />
                    <span>Fiches & Corrigés sauvegardés</span>
                  </span>
                  <span className="text-[10px] font-extrabold bg-black/10 px-2 py-0.5 rounded-full">{savedItems.length}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setResultText(item.content)}
                      className="p-3 rounded-xl border-2 border-black/10 hover:border-black bg-[#FFFBF5] hover:bg-white transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-black text-xs truncate text-black">{item.title}</span>
                        <span className="text-[10px] font-bold text-black/50 truncate">{item.subtitle}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Result Display (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] min-h-[500px] flex flex-col">
              {/* Result Header */}
              <div className="px-6 py-4 border-b-[3px] border-black bg-[#FFFBF5] rounded-t-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-black" />
                  <span className="font-black text-sm uppercase tracking-wider">
                    {activeTab === "fiche" ? "Fiche-Master Générée" : "Corrigé Type & Méthodologie"}
                  </span>
                </div>

                {resultText && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(resultText)}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copied ? "Copié !" : "Copier"}</span>
                    </button>
                    <button
                      onClick={() => handleDownload(resultText, activeTab === "fiche" ? courseTitle : examSubject)}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-primary hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                    >
                      <Download size={14} />
                      <span>PDF / Markdown</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Result Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[650px] font-normal text-sm leading-relaxed prose prose-sm max-w-none">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-black text-lg">Analyse académique en cours...</p>
                      <p className="text-xs font-bold text-black/50 max-w-sm mt-1">
                        Notre IA structure les définitions clés, formules et pièges de barème pour maximiser votre note.
                      </p>
                    </div>
                  </div>
                ) : resultText ? (
                  <div className="whitespace-pre-wrap font-sans text-black/90 space-y-4">
                    {resultText}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-24 text-center text-black/40">
                    <div className="p-4 rounded-2xl bg-black/5 border-2 border-black/10">
                      {activeTab === "fiche" ? <FileText size={40} /> : <Award size={40} />}
                    </div>
                    <div>
                      <p className="font-black text-base text-black/60">
                        {activeTab === "fiche" ? "Aucune fiche générée pour l'instant" : "Aucun corrigé généré pour l'instant"}
                      </p>
                      <p className="text-xs font-bold text-black/40 max-w-xs mt-1">
                        Remplissez le formulaire à gauche et cliquez sur générer pour obtenir un document d'excellence.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
