"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { 
  Zap, 
  Headphones, 
  GraduationCap, 
  Play, 
  Pause, 
  Volume2, 
  Check, 
  Copy, 
  Download, 
  BookOpen, 
  Trash2, 
  Wand2, 
  Search, 
  ExternalLink,
  Bookmark,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";

interface SavedLabItem {
  id: string;
  type: "podcast" | "memoire";
  title: string;
  subtitle: string;
  content: string;
  createdAt: number;
}

interface DialogueLine {
  speaker: "Professeur Alex" | "Étudiant Léo";
  text: string;
}

export default function LabEtudiantPage() {
  const [activeTab, setActiveTab] = useState<"podcast" | "memoire">("podcast");
  
  // Podcast State
  const [podcastTitle, setPodcastTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [podcastTone, setPodcastTone] = useState("Dynamique & Captivant (Prof sympa + Étudiant curieux)");
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  
  // Memoire & Biblio State
  const [thesisTopic, setThesisTopic] = useState("");
  const [discipline, setDiscipline] = useState("Droit & Sciences Politiques");
  const [citationStyle, setCitationStyle] = useState("Norme APA 7th (International / Universitaire)");
  
  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedLabItem[]>([]);
  
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

    const saved = localStorage.getItem("gama_lab_etudiant_items");
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved lab items", e);
      }
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const saveToHistory = (item: SavedLabItem) => {
    const next = [item, ...savedItems.filter(x => x.id !== item.id)].slice(0, 30);
    setSavedItems(next);
    localStorage.setItem("gama_lab_etudiant_items", JSON.stringify(next));
  };

  const deleteSavedItem = (id: string) => {
    const next = savedItems.filter(x => x.id !== id);
    setSavedItems(next);
    localStorage.setItem("gama_lab_etudiant_items", JSON.stringify(next));
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
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_") || "Lab_Gama_Studio"}.md`;
    link.click();
  };

  const parseDialogue = (raw: string): DialogueLine[] => {
    const lines = raw.split("\n");
    const parsed: DialogueLine[] = [];
    for (const line of lines) {
      if (line.includes("Professeur Alex :") || line.includes("**Professeur Alex** :") || line.includes("Prof :")) {
        const text = line.replace(/^(.*)(Professeur Alex|Prof)([\s*:]+)/i, "").trim();
        if (text) parsed.push({ speaker: "Professeur Alex", text });
      } else if (line.includes("Étudiant Léo :") || line.includes("**Étudiant Léo** :") || line.includes("Léo :")) {
        const text = line.replace(/^(.*)(Étudiant Léo|Léo)([\s*:]+)/i, "").trim();
        if (text) parsed.push({ speaker: "Étudiant Léo", text });
      }
    }
    return parsed;
  };

  const handleStopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(null);
  };

  const handlePlayAudio = () => {
    if (isPlaying) {
      handleStopAudio();
      return;
    }

    if (!dialogueLines.length || typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Synthèse vocale non disponible ou aucun dialogue audio à lire.");
      return;
    }

    setIsPlaying(true);
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter(v => v.lang.startsWith("fr"));
    const voice1 = frenchVoices[0] || voices[0];
    const voice2 = frenchVoices[1] || frenchVoices[0] || voices[0];

    let index = 0;

    const speakNext = () => {
      if (index >= dialogueLines.length) {
        setIsPlaying(false);
        setCurrentLineIndex(null);
        return;
      }

      setCurrentLineIndex(index);
      const current = dialogueLines[index];
      const utterance = new SpeechSynthesisUtterance(current.text);
      utterance.lang = "fr-FR";
      
      if (current.speaker === "Professeur Alex") {
        utterance.voice = voice1;
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      } else {
        utterance.voice = voice2;
        utterance.pitch = 1.15;
        utterance.rate = 1.05;
      }

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentLineIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleGeneratePodcast = async () => {
    if (!sourceText.trim()) return;
    setIsGenerating(true);
    setResultText(null);
    setDialogueLines([]);
    handleStopAudio();

    const prompt = `Tu es Réalisateur et Écrivain de Podcasts de vulgarisation scientifique et universitaire (Style NotebookLM Audio).
Ton objectif : Créer un SHOW AUDIO À 2 VOIX captivant, vivant et ultra pédagogique à partir des notes de cours ci-dessous (${podcastTone}).

Les deux intervenants :
- **Professeur Alex** : Expert passionné, clair, qui explique avec des analogies percutantes et des exemples de la vie réelle.
- **Étudiant Léo** : Étudiant vif, curieux, qui pose exactement les questions que tout le monde se pose en amphi et relance le prof.

Format de sortie strictement obligatoire :
**Professeur Alex** : [Parole du professeur...]
**Étudiant Léo** : [Réponse / question de l'étudiant...]
(Alterner 10 à 16 répliques fluides et naturelles qui couvrent tout le cours pour que l'étudiant comprenne et retienne tout sans s'ennuyer).

Titre de l'émission : "${podcastTitle || "Épisode Spécial Révision"}"
Voici les notes ou le texte de cours à expliquer :
---
${sourceText}
---
Écris un dialogue passionnant, naturel, avec de vraies interactions, prêt pour la lecture audio.`;

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
      const generated = data.content || "Erreur lors de la génération du podcast.";
      setResultText(generated);
      const parsed = parseDialogue(generated);
      setDialogueLines(parsed);

      saveToHistory({
        id: "podcast_" + Date.now(),
        type: "podcast",
        title: podcastTitle.trim() || "Podcast NotebookLM IA",
        subtitle: `${parsed.length} répliques • ${podcastTone.split(" (")[0]}`,
        content: generated,
        createdAt: Date.now()
      });
    } catch (error: any) {
      alert("Erreur lors de la génération du podcast : " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMemoire = async () => {
    if (!thesisTopic.trim()) return;
    setIsGenerating(true);
    setResultText(null);

    const prompt = `Tu es Directeur de Thèse et Membre de Jury de Master / Doctorat en ${discipline}.
Ton objectif : Concevoir le PLAN ACADÉMIQUE MILLIMÉTRÉ et la BIBLIOGRAPHIE SCIENTIFIQUE DE RÉFÉRENCE (Norme : ${citationStyle}) pour ce sujet de mémoire / TFE :
"${thesisTopic}"

Structure obligatoire du document :
1. **📌 PROBLÉMATIQUE & HYPOTHÈSES DE RECHERCHE** (Formulation académique irréprochable du sujet).
2. **🏗️ PLAN DÉTAILLÉ EN TROIS PARTIES (ou deux parties de type I/II - A/B)** (Titres académiques rigoureux avec sous-parties détaillées).
3. **📚 BIBLIOGRAPHIE & SOURCES SCIENTIFIQUES RECOMMANDEES (Scholar & ArXiv)** (Sélectionnez 6 à 8 articles scientifiques majeurs, ouvrages de référence et revues académiques, formatés exactement selon ${citationStyle}, avec les mots-clés exacts pour les retrouver sur Google Scholar et ArXiv).
4. **💡 CONSEILS DE SOUTENANCE & PIÈGES À ÉVITER** (Ce que le jury va scruter).

Sois d'une rigueur universitaire absolue, structuré et immédiatement exploitable par un étudiant de Master / Doctorat.`;

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
      const generated = data.content || "Erreur lors de la génération du mémoire.";
      setResultText(generated);

      saveToHistory({
        id: "memoire_" + Date.now(),
        type: "memoire",
        title: thesisTopic.slice(0, 50) + (thesisTopic.length > 50 ? "..." : ""),
        subtitle: `${discipline} • ${citationStyle.split(" (")[0]}`,
        content: generated,
        createdAt: Date.now()
      });
    } catch (error: any) {
      alert("Erreur lors de la génération du mémoire : " + error.message);
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
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 border-2 border-black px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest mb-2 shadow-[2px_2px_0px_0px_#000000]">
              <Zap size={14} />
              <span>Studio d'Innovation & Recherche IA</span>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Podcasts Audio & Mémoires IA
            </h1>
            <p className="text-xs font-bold text-black/60 mt-0.5">
              Générez des shows audio à 2 voix style NotebookLM pour réviser et pilotez vos thèses avec bibliographie ArXiv/Scholar.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-2xl border-2 border-black">
            <button
              onClick={() => { setActiveTab("podcast"); setResultText(null); handleStopAudio(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                activeTab === "podcast"
                  ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Headphones size={16} strokeWidth={2.5} />
              <span>Podcast Audio 2 Voix</span>
            </button>
            <button
              onClick={() => { setActiveTab("memoire"); setResultText(null); handleStopAudio(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                activeTab === "memoire"
                  ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <GraduationCap size={16} strokeWidth={2.5} />
              <span>Mémoires & Biblio ArXiv</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] flex flex-col gap-4">
              {activeTab === "podcast" ? (
                <>
                  <div className="flex items-center gap-2.5 border-b-2 border-black/10 pb-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl border border-black">
                      <Headphones size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-black">Créer un Podcast NotebookLM</h2>
                      <p className="text-xs font-bold text-black/50">Show audio à 2 voix synthétisées en direct</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Titre de l'Épisode
                    </label>
                    <input
                      type="text"
                      value={podcastTitle}
                      onChange={(e) => setPodcastTitle(e.target.value)}
                      placeholder="ex: Le Droit Constitutionnel expliqué ou La Révolution Française"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Ambiance & Ton de l'Émission
                    </label>
                    <select
                      value={podcastTone}
                      onChange={(e) => setPodcastTone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    >
                      <option value="Dynamique & Captivant (Prof sympa + Étudiant curieux)">Dynamique & Captivant (Prof sympa + Étudiant curieux)</option>
                      <option value="Débat Académique Profond & Analytique">Débat Académique Profond & Analytique</option>
                      <option value="Synthèse Express Avant-Partiel (Focus astuces)">Synthèse Express Avant-Partiel (Focus astuces)</option>
                      <option value="Vulgarisation Fun & Analogies drôles">Vulgarisation Fun & Analogies drôles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Notes ou Cours à Transformer en Audio
                    </label>
                    <textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Collez ici votre cours, chapitre, article ou notes en vrac..."
                      className="w-full h-44 px-3.5 py-2.5 rounded-xl border-2 border-black font-medium text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGeneratePodcast}
                    disabled={isGenerating || !sourceText.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-black/20 text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5 min-h-[48px]"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Écriture du show en cours...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} strokeWidth={2.5} />
                        <span>Générer le Podcast & Script 🎙️</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 border-b-2 border-black/10 pb-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl border border-black">
                      <GraduationCap size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-black">Assistant Mémoire & Biblio</h2>
                      <p className="text-xs font-bold text-black/50">Thèses, TFE & recherches ArXiv/Scholar</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Sujet du Mémoire / de la Thèse
                    </label>
                    <textarea
                      value={thesisTopic}
                      onChange={(e) => setThesisTopic(e.target.value)}
                      placeholder="ex: L'impact de l'IA générative sur le droit d'auteur européen ou La transition écologique dans l'industrie..."
                      className="w-full h-28 px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Discipline Universitaire
                    </label>
                    <select
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    >
                      <option value="Droit & Sciences Politiques">Droit & Sciences Politiques</option>
                      <option value="Médecine & Sciences de la Santé">Médecine & Sciences de la Santé</option>
                      <option value="Informatique, Intelligence Artificielle & Ingénierie">Informatique, Intelligence Artificielle & Ingénierie</option>
                      <option value="Économie, Management & Finance">Économie, Management & Finance</option>
                      <option value="Sociologie, Psychologie & Sciences Humaines">Sociologie, Psychologie & Sciences Humaines</option>
                      <option value="Lettres, Histoire & Philosophie">Lettres, Histoire & Philosophie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Norme & Format de Citation
                    </label>
                    <select
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    >
                      <option value="Norme APA 7th (International / Universitaire)">Norme APA 7th (International / Universitaire)</option>
                      <option value="Norme Harvard (Auteur-Date)">Norme Harvard (Auteur-Date)</option>
                      <option value="Norme IEEE (Sciences & Ingénierie)">Norme IEEE (Sciences & Ingénierie)</option>
                      <option value="Notes de bas de page & Bibliographie à la française">Notes de bas de page & Bibliographie à la française</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateMemoire}
                    disabled={isGenerating || !thesisTopic.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-black/20 text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5 min-h-[48px]"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Recherche académique...</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap size={18} strokeWidth={2.5} />
                        <span>Générer Plan & Biblio ArXiv 📚</span>
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
                    <Bookmark size={14} className="text-indigo-600" />
                    <span>Podcasts & Mémoires sauvegardés</span>
                  </span>
                  <span className="text-[10px] font-extrabold bg-black/10 px-2 py-0.5 rounded-full">{savedItems.length}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setResultText(item.content);
                        if (item.type === "podcast") {
                          setDialogueLines(parseDialogue(item.content));
                        }
                      }}
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
              {/* Result Header & Audio Bar */}
              <div className="px-6 py-4 border-b-[3px] border-black bg-[#FFFBF5] rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 border border-black" />
                  <span className="font-black text-sm uppercase tracking-wider">
                    {activeTab === "podcast" ? "Show Audio 2 Voix & Script" : "Plan de Mémoire & Bibliographie"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeTab === "podcast" && dialogueLines.length > 0 && (
                    <button
                      onClick={handlePlayAudio}
                      className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all min-h-[38px] ${
                        isPlaying
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={15} />
                          <span>Stop la Lecture</span>
                        </>
                      ) : (
                        <>
                          <Play size={15} fill="currentColor" />
                          <span>Écouter le Podcast ▶️</span>
                        </>
                      )}
                    </button>
                  )}

                  {resultText && (
                    <>
                      <button
                        onClick={() => handleCopy(resultText)}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copied ? "Copié !" : "Copier"}</span>
                      </button>
                      <button
                        onClick={() => handleDownload(resultText, activeTab === "podcast" ? podcastTitle : thesisTopic)}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-primary hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                      >
                        <Download size={14} />
                        <span>PDF / Markdown</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Result Body */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[650px] font-normal text-sm leading-relaxed max-w-none">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-black text-lg">
                        {activeTab === "podcast" ? "Écriture & Synthèse Audio en cours..." : "Recherche bibliographique en cours..."}
                      </p>
                      <p className="text-xs font-bold text-black/50 max-w-sm mt-1">
                        {activeTab === "podcast"
                          ? "Génération du dialogue interactif entre le Professeur Alex et l'Étudiant Léo."
                          : "Recherche des meilleures références académiques et structuration du plan détaillé."}
                      </p>
                    </div>
                  </div>
                ) : activeTab === "podcast" && dialogueLines.length > 0 ? (
                  <div className="space-y-4">
                    {dialogueLines.map((line, idx) => {
                      const isAlex = line.speaker === "Professeur Alex";
                      const isSpeakingNow = isPlaying && currentLineIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance(line.text);
                              utterance.lang = "fr-FR";
                              utterance.pitch = isAlex ? 0.95 : 1.15;
                              window.speechSynthesis.speak(utterance);
                            }
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSpeakingNow
                              ? "bg-indigo-100 border-indigo-600 shadow-[4px_4px_0px_0px_#4F46E5] scale-[1.01]"
                              : isAlex
                              ? "bg-white border-black/20 hover:border-black shadow-[2px_2px_0px_0px_#000000]"
                              : "bg-emerald-50/70 border-emerald-300 hover:border-emerald-600 shadow-[2px_2px_0px_0px_#059669]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isAlex
                                ? "bg-indigo-600 text-white border-black"
                                : "bg-emerald-600 text-white border-black"
                            }`}>
                              {isAlex ? "🎤 Professeur Alex" : "🙋‍♂️ Étudiant Léo"}
                            </span>
                            <span className="text-[10px] font-bold text-black/40">Réplique #{idx + 1}</span>
                          </div>
                          <p className="text-sm font-semibold text-black/90 leading-relaxed mt-2">{line.text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : resultText ? (
                  <div className="whitespace-pre-wrap font-sans text-black/90 space-y-4">
                    {resultText}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-24 text-center text-black/40">
                    <div className="p-4 rounded-2xl bg-black/5 border-2 border-black/10">
                      {activeTab === "podcast" ? <Headphones size={40} /> : <GraduationCap size={40} />}
                    </div>
                    <div>
                      <p className="font-black text-base text-black/60">
                        {activeTab === "podcast" ? "Aucun podcast généré pour l'instant" : "Aucun mémoire généré pour l'instant"}
                      </p>
                      <p className="text-xs font-bold text-black/40 max-w-xs mt-1">
                        Remplissez le formulaire à gauche et lancez la génération pour créer vos contenus.
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
