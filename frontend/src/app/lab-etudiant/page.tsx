"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { 
  Zap, 
  Headphones, 
  Network, 
  Play, 
  Pause, 
  Check, 
  Copy, 
  Download, 
  Trash2, 
  Wand2, 
  Bookmark, 
  Sparkles, 
  FileCode, 
  Palette, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sliders,
  PlusCircle,
  Lightbulb,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";
import { MindMapCanvas, MindMapData } from "@/components/MindMapCanvas";

interface SavedLabItem {
  id: string;
  type: "podcast" | "mindmap";
  title: string;
  subtitle: string;
  content: string;
  createdAt: number;
}

interface DialogueLine {
  speaker: "Professeur Alex" | "Étudiant Léo";
  text: string;
}

interface FlashQuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export default function LabEtudiantPage() {
  const [activeTab, setActiveTab] = useState<"podcast" | "mindmap">("podcast");
  
  // Podcast State
  const [podcastTitle, setPodcastTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [podcastTone, setPodcastTone] = useState("Dynamique & Captivant (Prof sympa + Étudiant curieux)");
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  
  // Mind Map State
  const [mapSubject, setMapSubject] = useState("");
  const [mapLayout, setMapLayout] = useState<"horizontal" | "radial" | "bento" | "columns">("horizontal");
  const [mapDensity, setMapDensity] = useState("Carte Exhaustive & Détaillée (6-8 branches + définitions clés)");
  const [selectedPaletteName, setSelectedPaletteName] = useState("Néon Universitaire");
  const [hideDefinitions, setHideDefinitions] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  
  // Flash Quiz on Mind Map
  const [flashQuiz, setFlashQuiz] = useState<FlashQuizQuestion[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiEnriching, setIsAiEnriching] = useState(false);
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

  const handleDownload = (text: string, title: string, ext = "md") => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_") || "Gama_Studio"}.${ext}`;
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

  const parseOrGenerateFallbackMap = (jsonStr: string, title: string): MindMapData => {
    try {
      // 1. Clean markdown code blocks if any
      let clean = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        let jsonPayload = match[0];
        // Attempt parse, or auto-close if slightly truncated by token limits
        try {
          const parsed = JSON.parse(jsonPayload);
          if (parsed.rootTitle && Array.isArray(parsed.branches)) {
            return formatMindMapPayload(parsed, title);
          }
        } catch (parseErr) {
          // Attempt auto-closing incomplete brackets
          let closed = jsonPayload;
          const openBraces = (closed.match(/\{/g) || []).length;
          const closeBraces = (closed.match(/\}/g) || []).length;
          const openBrackets = (closed.match(/\[/g) || []).length;
          const closeBrackets = (closed.match(/\]/g) || []).length;
          
          for (let i = 0; i < openBrackets - closeBrackets; i++) closed += "]";
          for (let i = 0; i < openBraces - closeBraces; i++) closed += "}";
          
          try {
            const parsed = JSON.parse(closed);
            if (parsed.rootTitle && Array.isArray(parsed.branches)) {
              return formatMindMapPayload(parsed, title);
            }
          } catch (e2) {
            console.warn("Auto-close fallback failed", e2);
          }
        }
      }
    } catch (e) {
      console.warn("JSON parse fallback for mind map triggered", e);
    }

    // 2. Line by line Markdown fallback if not JSON
    const lines = jsonStr.split("\n");
    const branches: any[] = [];
    let currentBranch: any = null;

    for (const line of lines) {
      if (line.startsWith("## ") || line.startsWith("### ")) {
        if (currentBranch) branches.push(currentBranch);
        const idx = branches.length;
        currentBranch = {
          id: "b_" + idx,
          title: line.replace(/^#+\s*/, "").replace(/\*\*/g, ""),
          colorTheme: {} as any,
          badge: `${idx + 1}.`,
          subtopics: []
        };
      } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        if (!currentBranch) {
          currentBranch = { id: "b_0", title: "Concepts Fondamentaux", colorTheme: {} as any, badge: "1.", subtopics: [] };
        }
        const clean = line.replace(/^[\s-*]+\s*/, "").replace(/\*\*/g, "").trim();
        const parts = clean.split(":");
        currentBranch.subtopics.push({
          id: `st_${branches.length}_${currentBranch.subtopics.length}`,
          text: parts[0].trim(),
          definition: parts[1] ? parts.slice(1).join(":").trim() : undefined,
          learned: false
        });
      }
    }
    if (currentBranch) branches.push(currentBranch);

    return {
      rootTitle: title || "Carte Mentale",
      subtitle: "Générée par Gama Studio Pro IA",
      branches: branches.length > 0 ? branches : [
        {
          id: "b_0",
          title: "Introduction & Problématique",
          colorTheme: {} as any,
          badge: "1.",
          subtopics: [{ id: "st_0_0", text: "Concept clé 1", definition: "Définition importante", learned: false }]
        }
      ]
    };
  };

  const formatMindMapPayload = (parsed: any, title: string): MindMapData => {
    return {
      rootTitle: parsed.rootTitle || title,
      subtitle: parsed.subtitle || "Carte Mentale d'Excellence",
      branches: (parsed.branches || []).map((b: any, idx: number) => ({
        id: "b_" + idx,
        title: b.title || `Branche ${idx + 1}`,
        colorTheme: {} as any,
        badge: b.badge || `${idx + 1}.`,
        subtopics: Array.isArray(b.subtopics) ? b.subtopics.map((st: any, sidx: number) => ({
          id: `st_${idx}_${sidx}`,
          text: typeof st === "string" ? st : (st.text || `Concept ${sidx + 1}`),
          definition: typeof st === "string" ? undefined : st.definition,
          learned: false
        })) : []
      }))
    };
  };

  const handleGenerateMindMap = async (customSubject?: string) => {
    const subjectToUse = customSubject || mapSubject;
    if (!subjectToUse.trim()) return;
    if (customSubject) setMapSubject(customSubject);
    
    setIsGenerating(true);
    setResultText(null);
    setMindMapData(null);
    setFlashQuiz(null);

    const prompt = `Tu es un Expert Concepteur pédagogique de Cartes Mentales (Mind Maps) et Organisateur visuel de haut niveau.
Ton objectif : Créer la structure JSON exacte et complète pour une CARTE MENTALE (Mind Map) sur le sujet / cours suivant :
"${subjectToUse}"

Niveau de densité souhaité : "${mapDensity}".

Tu dois répondre UNIQUEMENT par un objet JSON valide, sans aucun texte autour, ni codeblock markdown si possible, structuré de la manière suivante :
{
  "rootTitle": "Titre central exact et percutant de la Mind Map (ex: Le Droit Constitutionnel de la Vᵉ République)",
  "subtitle": "Sous-titre explicatif court et motivant (ex: 5 Principes Fondamentaux et Rôle des Institutions)",
  "branches": [
    {
      "title": "Titre de la Branche Principale 1 (ex: Le Pouvoir Exécutif & Le Président)",
      "badge": "1. Institutions",
      "subtopics": [
        {
          "text": "Concept ou mot-clé essentiel (ex: Article 16 - Pouvoirs exceptionnels)",
          "definition": "Astuce ou explication claire : Permet au Président de prendre des mesures de crise en cas de menace grave"
        },
        {
          "text": "Autre concept clé relié à cette branche (ex: Dissolution de l'Assemblée - Art 12)",
          "definition": "Le Président peut dissoudre l'Assemblée Nationale après consultation du Premier Ministre"
        }
      ]
    },
    {
      "title": "Titre de la Branche Principale 2",
      "badge": "2. Législatif",
      "subtopics": [ ... ]
    }
  ]
}

Assure-toi d'inclure obligatoirement 5 à 7 branches principales riches, avec des sous-concepts précis, des définitions claires, des formules ou des astuces mnémotechniques pour que l'étudiant révise tout le sujet visuellement et obtienne 20/20.`;

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
      const raw = data.content || "{}";
      setResultText(raw);
      const parsedMap = parseOrGenerateFallbackMap(raw, subjectToUse.trim());
      setMindMapData(parsedMap);

      saveToHistory({
        id: "mindmap_" + Date.now(),
        type: "mindmap",
        title: parsedMap.rootTitle || subjectToUse.slice(0, 40),
        subtitle: `${parsedMap.branches.length} branches • ${parsedMap.branches.reduce((acc, b) => acc + b.subtopics.length, 0)} concepts`,
        content: JSON.stringify(parsedMap),
        createdAt: Date.now()
      });
    } catch (error: any) {
      alert("Erreur lors de la création de la carte mentale : " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Feature 1: Enrichir & Approfondir (+ de branches IA)
  const handleAiEnrichMap = async () => {
    if (!mindMapData) return;
    setIsAiEnriching(true);

    const prompt = `Voici une carte mentale existante au format JSON :
${JSON.stringify(mindMapData)}

Ta mission : ENRICHIR cette carte mentale en ajoutant 3 NOUVELLES BRANCHES PRINCIPALES inédites avec des concepts avancés, des exemples concrets ou des astuces d'examen qui ne sont pas encore présents.
Réponds UNIQUEMENT avec l'objet JSON complet mis à jour contenant toutes les anciennes branches + les 3 nouvelles branches enrichies.`;

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

      if (!res.ok) throw new Error("Erreur d'enrichissement");
      const data = await res.json();
      const parsed = parseOrGenerateFallbackMap(data.content || "{}", mindMapData.rootTitle);
      setMindMapData(parsed);
    } catch (e: any) {
      alert("Erreur lors de l'enrichissement IA : " + e.message);
    } finally {
      setIsAiEnriching(false);
    }
  };

  // AI Feature 2: Astuces Mnémotechniques IA
  const handleAiAddMemos = async () => {
    if (!mindMapData) return;
    setIsAiEnriching(true);

    const prompt = `Voici une carte mentale au format JSON :
${JSON.stringify(mindMapData)}

Ta mission : Pour chaque sous-concept (subtopic) de chaque branche, ajoute dans la "definition" une ASTUCE MNÉMOTECHNIQUE drôle, courte et percutante (commençant par "💡 Mémo : ...") pour aider un étudiant à retenir le concept instantanément.
Réponds UNIQUEMENT par le JSON complet mis à jour avec ces astuces mnémotechniques incluses.`;

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

      if (!res.ok) throw new Error("Erreur d'enrichissement mnémotechnique");
      const data = await res.json();
      const parsed = parseOrGenerateFallbackMap(data.content || "{}", mindMapData.rootTitle);
      setMindMapData(parsed);
    } catch (e: any) {
      alert("Erreur lors de la génération des astuces mnémotechniques : " + e.message);
    } finally {
      setIsAiEnriching(false);
    }
  };

  // AI Feature 3: Flash Quiz sur la carte mentale
  const handleAiGenerateFlashQuiz = async () => {
    if (!mindMapData) return;
    setIsAiEnriching(true);
    setFlashQuiz(null);
    setSelectedAnswers({});
    setShowQuizResults(false);

    const prompt = `À partir de cette carte mentale :
${JSON.stringify(mindMapData)}

Génère un MINI-QUIZ FLASH INTELLECTUEL de 5 questions à choix multiples pour tester les connaissances de l'étudiant.
Réponds UNIQUEMENT avec un tableau JSON valide au format exact suivant :
[
  {
    "question": "Question claire et stimulante sur un concept de la carte...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIdx": 1,
    "explanation": "Explication courte expliquant pourquoi l'option B est la bonne réponse."
  }
]`;

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

      if (!res.ok) throw new Error("Erreur de quiz");
      const data = await res.json();
      const clean = (data.content || "").replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        setFlashQuiz(JSON.parse(match[0]));
      } else {
        alert("Impossible d'extraire le quiz JSON.");
      }
    } catch (e: any) {
      alert("Erreur lors de la création du quiz : " + e.message);
    } finally {
      setIsAiEnriching(false);
    }
  };

  const toggleSubtopicLearned = (branchId: string, subtopicId: string) => {
    if (!mindMapData) return;
    setMindMapData({
      ...mindMapData,
      branches: mindMapData.branches.map(b => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          subtopics: b.subtopics.map(st => st.id === subtopicId ? { ...st, learned: !st.learned } : st)
        };
      })
    });
  };

  const generateMermaidSyntax = (): string => {
    if (!mindMapData) return "";
    let syntax = `mindmap\n  root((${mindMapData.rootTitle}))\n`;
    for (const b of mindMapData.branches) {
      syntax += `    ["${b.badge} ${b.title}"]\n`;
      for (const st of b.subtopics) {
        syntax += `      (${st.text})\n`;
      }
    }
    return syntax;
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
              <Network size={14} />
              <span>Studio de Synthèse Visuelle & Audio IA</span>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Podcasts Audio & Mind Map Creator
            </h1>
            <p className="text-xs font-bold text-black/60 mt-0.5">
              Générez des shows audio à 2 voix style NotebookLM et créez des cartes mentales enrichies par IA avec courbes SVG.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-black/5 p-1.5 rounded-2xl border-2 border-black">
            <button
              onClick={() => { setActiveTab("podcast"); handleStopAudio(); }}
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
              onClick={() => { setActiveTab("mindmap"); handleStopAudio(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                activeTab === "mindmap"
                  ? "bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000000]"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Network size={16} strokeWidth={2.5} />
              <span>Mind Map Creator IA 🧠</span>
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
                      <Network size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-black">Mind Map Creator IA</h2>
                      <p className="text-xs font-bold text-black/50">Génération intelligente avec arborescence SVG</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Sujet, Leçon ou Plan à Mapper
                    </label>
                    <textarea
                      value={mapSubject}
                      onChange={(e) => setMapSubject(e.target.value)}
                      placeholder="ex: Le Système Nerveux Central, La Révolution Industrielle ou Plan d'un partiel de droit des affaires..."
                      className="w-full h-24 px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    />

                    {/* AI Magic Suggestion Chips */}
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>✨ Sujets Magiques en 1 Clic (Test IA) :</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Droit Constitutionnel : La Vᵉ République & ses Institutions",
                          "Neurobiologie : Le Système Nerveux & Synapses",
                          "Économie : L'Offre, la Demande & l'Inflation",
                          "Algorithmes : Arbres Binaires, Graphes & Tris"
                        ].map((magicSubj, mIdx) => (
                          <button
                            key={mIdx}
                            type="button"
                            onClick={() => handleGenerateMindMap(magicSubj)}
                            disabled={isGenerating}
                            className="px-2.5 py-1 rounded-lg bg-[#FDFBF7] hover:bg-indigo-600 hover:text-white border border-black/30 hover:border-black font-extrabold text-[11px] text-black/80 transition-all text-left truncate max-w-full"
                          >
                            🚀 {magicSubj.split(" : ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Vue & Disposition de la Carte
                    </label>
                    <select
                      value={mapLayout}
                      onChange={(e) => setMapLayout(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    >
                      <option value="horizontal">Arborescence Horizontale (Canevas infini Bézier S-curves)</option>
                      <option value="radial">Arborescence Équilibrée Gauche/Droite (Mode Radial)</option>
                      <option value="bento">Grille Bento (Cartes Concepts hiérarchisées)</option>
                      <option value="columns">Colonnes Parallèles (Idéal chronologie ou comparatif)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5">
                      Densité & Profondeur Pédagogique
                    </label>
                    <select
                      value={mapDensity}
                      onChange={(e) => setMapDensity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[44px]"
                    >
                      <option value="Carte Exhaustive & Détaillée (6-8 branches + définitions clés)">Carte Exhaustive & Détaillée (6-8 branches + définitions clés)</option>
                      <option value="Synthèse Flash (4-5 branches clés pour vision d'ensemble)">Synthèse Flash (4-5 branches clés pour vision d'ensemble)</option>
                      <option value="Focus Mémorisation & Astuces mnémotechniques">Focus Mémorisation & Astuces mnémotechniques</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1.5 flex items-center gap-1.5">
                      <Palette size={14} className="text-indigo-600" />
                      <span>Thème de Couleurs</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Néon Universitaire", "Minimaliste Encre"].map((themeName) => (
                        <button
                          key={themeName}
                          type="button"
                          onClick={() => setSelectedPaletteName(themeName)}
                          className={`px-3 py-2 rounded-xl font-black text-xs border-2 flex items-center justify-between transition-all ${
                            selectedPaletteName === themeName
                              ? "border-black bg-indigo-50 shadow-[2px_2px_0px_0px_#000000]"
                              : "border-black/20 bg-white hover:border-black/50"
                          }`}
                        >
                          <span>{themeName}</span>
                          {selectedPaletteName === themeName && <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateMindMap()}
                    disabled={isGenerating || !mapSubject.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-black/20 text-white font-black text-sm uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5 min-h-[48px] mt-1"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Génération IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} strokeWidth={2.5} />
                        <span>Générer la Mind Map IA 🧠</span>
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
                    <span>Podcasts & Mind Maps sauvegardés</span>
                  </span>
                  <span className="text-[10px] font-extrabold bg-black/10 px-2 py-0.5 rounded-full">{savedItems.length}</span>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === "podcast") {
                          setActiveTab("podcast");
                          setResultText(item.content);
                          setDialogueLines(parseDialogue(item.content));
                        } else {
                          setActiveTab("mindmap");
                          try {
                            const parsed = JSON.parse(item.content);
                            setMindMapData(parsed);
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="p-3 rounded-xl border-2 border-black/10 hover:border-black bg-[#FFFBF5] hover:bg-white transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-black text-xs truncate text-black flex items-center gap-1.5">
                          {item.type === "podcast" ? <Headphones size={13} className="text-indigo-600 shrink-0" /> : <Network size={13} className="text-indigo-600 shrink-0" />}
                          <span className="truncate">{item.title}</span>
                        </span>
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
            <div className="bg-white rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] min-h-[580px] flex flex-col">
              {/* Result Header Bar */}
              <div className="px-6 py-4 border-b-[3px] border-black bg-[#FFFBF5] rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 border border-black" />
                  <span className="font-black text-sm uppercase tracking-wider">
                    {activeTab === "podcast" ? "Show Audio 2 Voix & Script" : "Canevas Mind Map & Super-Pouvoirs IA"}
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

                  {activeTab === "mindmap" && mindMapData && (
                    <>
                      <button
                        onClick={() => handleCopy(generateMermaidSyntax())}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                        title="Copier au format Mermaid pour Notion ou Obsidian"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <FileCode size={14} />}
                        <span>{copied ? "Copié !" : "Mermaid Syntax"}</span>
                      </button>

                      <button
                        onClick={() => handleDownload(generateMermaidSyntax(), mindMapData.rootTitle, "mmd")}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-primary hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000] min-h-[36px]"
                      >
                        <Download size={14} />
                        <span>Export</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Superpowers Floating Bar (If Mind Map generated) */}
              {activeTab === "mindmap" && mindMapData && !isGenerating && (
                <div className="px-6 py-3 bg-indigo-50 border-b-2 border-black/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5 mr-2">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>Actions IA sur la carte :</span>
                  </span>

                  <button
                    onClick={handleAiEnrichMap}
                    disabled={isAiEnriching}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <PlusCircle size={14} />
                    <span>{isAiEnriching ? "IA en cours..." : "✨ IA : Approfondir (+3 branches)"}</span>
                  </button>

                  <button
                    onClick={handleAiAddMemos}
                    disabled={isAiEnriching}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-500 hover:text-black text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Lightbulb size={14} />
                    <span>💡 IA : Ajouter Astuces Mnémotechniques</span>
                  </button>

                  <button
                    onClick={handleAiGenerateFlashQuiz}
                    disabled={isAiEnriching}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <HelpCircle size={14} />
                    <span>⚡ IA : Mini-Quiz Flash d'Auto-Évaluation</span>
                  </button>
                </div>
              )}

              {/* Result Body Canvas */}
              <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[720px] font-normal text-sm leading-relaxed max-w-none flex flex-col">
                {isGenerating || isAiEnriching ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-24 text-center my-auto">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-black text-lg">
                        {isAiEnriching 
                          ? "L'IA enrichit votre carte mentale avec des super-pouvoirs..."
                          : activeTab === "podcast" ? "Écriture & Synthèse Audio en cours..." : "Génération de l'arborescence interactive..."}
                      </p>
                      <p className="text-xs font-bold text-black/50 max-w-sm mt-1">
                        {isAiEnriching
                          ? "Ajout de branches expertes, d'astuces mnémotechniques et d'exemples d'examens."
                          : activeTab === "podcast"
                          ? "Génération du dialogue interactif entre le Professeur Alex et l'Étudiant Léo."
                          : "Calcul des nœuds concepts, courbes SVG Bézier et encarts mnémotechniques."}
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
                ) : activeTab === "mindmap" && mindMapData ? (
                  <div className="flex flex-col gap-6 w-full">
                    <MindMapCanvas
                      data={mindMapData}
                      layoutMode={mapLayout}
                      hideDefinitions={hideDefinitions}
                      onToggleLearned={toggleSubtopicLearned}
                      onToggleHideDefinitions={() => setHideDefinitions(!hideDefinitions)}
                      colorPaletteName={selectedPaletteName}
                    />

                    {/* Optional Flash Quiz Section if generated by AI */}
                    {flashQuiz && flashQuiz.length > 0 && (
                      <div className="mt-4 p-6 rounded-2xl bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-5">
                        <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-black">
                              <HelpCircle size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-black">Mini-Quiz Flash d'Examen (IA)</h3>
                              <p className="text-xs font-bold text-black/50">Testez instantanément votre maîtrise de cette carte</p>
                            </div>
                          </div>
                          {!showQuizResults && (
                            <button
                              onClick={() => setShowQuizResults(true)}
                              disabled={Object.keys(selectedAnswers).length < flashQuiz.length}
                              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-emerald-600 disabled:opacity-40 font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all"
                            >
                              Corriger le Quiz ({Object.keys(selectedAnswers).length}/{flashQuiz.length})
                            </button>
                          )}
                        </div>

                        <div className="space-y-6">
                          {flashQuiz.map((q, qIdx) => {
                            const userAnswer = selectedAnswers[qIdx];
                            return (
                              <div key={qIdx} className="p-4 rounded-xl bg-[#FDFBF7] border-2 border-black/20 flex flex-col gap-3">
                                <h4 className="font-black text-sm text-black">{qIdx + 1}. {q.question}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, oIdx) => {
                                    const isSelected = userAnswer === oIdx;
                                    const isCorrect = q.correctIdx === oIdx;
                                    let btnStyle = "bg-white border-black/30 hover:border-black text-black";
                                    if (showQuizResults) {
                                      if (isCorrect) btnStyle = "bg-emerald-600 border-black text-white font-black";
                                      else if (isSelected && !isCorrect) btnStyle = "bg-red-500 border-black text-white font-black";
                                    } else if (isSelected) {
                                      btnStyle = "bg-indigo-600 border-black text-white font-black shadow-[2px_2px_0px_0px_#000000]";
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => !showQuizResults && setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                        className={`p-3 rounded-xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between ${btnStyle}`}
                                      >
                                        <span>{opt}</span>
                                        {showQuizResults && isCorrect && <span className="text-[10px] uppercase bg-white/20 px-1.5 py-0.5 rounded">✓ Exact</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                                {showQuizResults && (
                                  <div className={`p-3 rounded-xl text-xs font-bold border-l-4 ${
                                    userAnswer === q.correctIdx ? "bg-emerald-50 border-emerald-600 text-emerald-950" : "bg-amber-50 border-amber-600 text-amber-950"
                                  }`}>
                                    💡 <strong>Explication IA :</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-24 text-center text-black/40">
                    <div className="p-4 rounded-2xl bg-black/5 border-2 border-black/10">
                      {activeTab === "podcast" ? <Headphones size={40} /> : <Network size={40} />}
                    </div>
                    <div>
                      <p className="font-black text-base text-black/60">
                        {activeTab === "podcast" ? "Aucun podcast généré pour l'instant" : "Aucune carte mentale générée pour l'instant"}
                      </p>
                      <p className="text-xs font-bold text-black/40 max-w-xs mt-1">
                        Utilisez les boutons magiques IA ou saisissez votre cours à gauche et lancez la génération.
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
