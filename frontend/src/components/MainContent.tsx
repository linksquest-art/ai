"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronDown, 
  Mic, 
  Sparkles,
  ArrowRight,
  Globe,
  Link2,
  MessageSquare,
  Image as ImageIcon,
  Paperclip,
  X,
  Table,
  Link as LinkIcon,
  Cpu,
  GraduationCap,
  Zap,
  Check,
  LogIn,
  LogOut,
  Shield,
  EyeOff,
  Award,
  Wand2,
  Trash2,
  Download,
  BookOpen
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FlashcardModal } from "@/components/FlashcardModal";
import { AuthModal } from "./AuthModal";

export interface SkillItem {
  id: string;
  name: string;
  icon: string;
  badge: string;
  desc: string;
  prompt: string;
  isCustom?: boolean;
}

export const DEFAULT_SKILLS: SkillItem[] = [
  {
    id: "none",
    name: "Standard (Sans Skill)",
    icon: "⚡",
    badge: "Libre",
    desc: "Discussion générale libre sans instructions spécialisées",
    prompt: ""
  },
  {
    id: "saas_arch",
    name: "Architecte SaaS Pro",
    icon: "🚀",
    badge: "Code & Tech",
    desc: "Expert Next.js 16, Tailwind, Supabase, architectures évolutives & Clean Code",
    prompt: "Tu es un architecte logiciel senior et tech lead spécialisé dans le développement d'applications web et SaaS modernes (Next.js 16, TypeScript, TailwindCSS, Supabase). Ton objectif est de produire du code propre, modulaire, sécurisé et performant en appliquant strictement les meilleures pratiques du design UI/UX Pro Max. Fournis toujours des explications techniques concises et du code directement utilisable en production."
  },
  {
    id: "seo_copy",
    name: "Copywriter & Rédacteur SEO",
    icon: "✍️",
    badge: "Marketing",
    desc: "Textes persuasifs, conversion maximale & optimisation moteurs de recherche",
    prompt: "Tu es un copywriter d'élite et expert en stratégie marketing et référencement naturel (SEO). Tu rédiges des contenus à fort taux de conversion, engageants, parfaitement structurés avec des balises H1/H2 percutantes, des appels à l'action (CTA) magnétiques et un storytelling captivant adapté à l'audience cible."
  },
  {
    id: "business_data",
    name: "Business & Data Analyst",
    icon: "📊",
    badge: "Finance",
    desc: "Analyse de métriques KPI, tableaux financiers & stratégie d'entreprise",
    prompt: "Tu es un analyste financier et stratégique senior. Tu as une excellente maîtrise des chiffres, des modèles économiques, de la rentabilité (LTV, CAC, MRR, Churn) et de la prise de décision orientée données. Synthétise toujours tes analyses sous forme de tableaux clairs, identifie les risques et propose des plans d'action concrets pour maximiser la croissance."
  },
  {
    id: "ui_ux_pro",
    name: "UI/UX Designer Pro Max",
    icon: "🎨",
    badge: "Design",
    desc: "Design d'interfaces futuristes, glassmorphism, palettes harmonieuses & accessibilité",
    prompt: "Tu es un directeur artistique et designer UI/UX visionnaire. Tu conçois des expériences web et mobiles à couper le souffle, en appliquant les principes modernes de glassmorphism, d'animations douces, de typographie élégante et de hiérarchie visuelle irréprochable. Tes suggestions visuelles doivent toujours viser l'excellence et le 'wouah effect' immédiat."
  },
  {
    id: "pedagogue",
    name: "Professeur & Pédagogue",
    icon: "🎓",
    badge: "Éducation",
    desc: "Explications limpides par étapes, analogies concrètes & exercices interactifs",
    prompt: "Tu es un enseignant exceptionnel, patient et inspirant. Tu as le don de simplifier les concepts les plus techniques ou abstraits en utilisant des métaphores concrètes de la vie quotidienne, des schémas mentaux progressifs et des résumés par points clés. Vérifie régulièrement la compréhension de l'apprenant en lui posant des questions stimulantes."
  }
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  modelId?: string;
  modelName?: string;
  systemPrompt?: string;
  isIncognito?: boolean;
}

interface MainContentProps {
  activeSession: ChatSession | null;
  onSendMessage: (text: any, modelId?: string, modelName?: string, skillPrompt?: string) => void;
  isGenerating: boolean;
  isIncognito?: boolean;
  onToggleIncognito?: () => void;
}

export function MainContent({ activeSession, onSendMessage, isGenerating, isIncognito, onToggleIncognito }: MainContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseQueryRef = useRef("");
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const searchMenuRef = useRef<HTMLDivElement>(null);
  const skillMenuRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("GPT-4o Mini (OpenAI)");
  const [searchMode, setSearchMode] = useState("Recherche Globale");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; base64?: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Skills states
  const [skillsList, setSkillsList] = useState<SkillItem[]>(DEFAULT_SKILLS);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem>(DEFAULT_SKILLS[0]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardInitialText, setFlashcardInitialText] = useState<string | undefined>(undefined);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillPrompt, setNewSkillPrompt] = useState("");
  const [newSkillBadge, setNewSkillBadge] = useState("Custom");
  const [newSkillIcon, setNewSkillIcon] = useState("⚡");
  
  // Dropdown states
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedSkills = localStorage.getItem("gama_custom_skills");
    if (savedSkills) {
      try {
        const parsed = JSON.parse(savedSkills);
        setSkillsList([...DEFAULT_SKILLS, ...parsed]);
      } catch (e) {}
    }
  }, []);

  const handleCreateCustomSkill = () => {
    if (!newSkillName.trim()) return;
    const customSkill: SkillItem = {
      id: "custom_" + Math.random().toString(36).substring(2, 9),
      name: newSkillName.trim(),
      icon: newSkillIcon || "⚡",
      badge: newSkillBadge.trim() || "Custom",
      desc: newSkillDesc.trim() || "Skill personnalisé créé par l'utilisateur",
      prompt: newSkillPrompt.trim() || "",
      isCustom: true
    };

    const updatedSkills = [...skillsList, customSkill];
    setSkillsList(updatedSkills);
    setSelectedSkill(customSkill);

    const onlyCustom = updatedSkills.filter(s => s.isCustom);
    localStorage.setItem("gama_custom_skills", JSON.stringify(onlyCustom));

    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillPrompt("");
    setShowSkillModal(false);
  };

  const isPro = user?.user_metadata?.plan === "pro" || user?.user_metadata?.is_pro === true;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isGenerating]);

  // Sync selected model if activeSession has a stored model
  useEffect(() => {
    if (activeSession?.modelName) {
      setModel(activeSession.modelName);
    }
  }, [activeSession?.id]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Auto-close menus on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !plusMenuRef.current?.contains(e.target as Node) &&
        !modelMenuRef.current?.contains(e.target as Node) &&
        !searchMenuRef.current?.contains(e.target as Node) &&
        !skillMenuRef.current?.contains(e.target as Node)
      ) {
        closeAllMenus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllMenus();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeAllMenus = () => {
    setShowPlusMenu(false);
    setShowModelMenu(false);
    setShowSearchMenu(false);
    setShowSkillMenu(false);
  };

  // OpenAI & OpenRouter Paid Models
  const availableModels = [
    { name: "Best ★", id: "deepseek/deepseek-chat", desc: "Modèle d'excellence", icon: Sparkles, color: "text-amber-500" },
    { name: "GPT-4o Mini (OpenAI)", id: "gpt-4o-mini", desc: "Rapide & économique (Gratuit)", icon: Zap, color: "text-emerald-500" },
    { name: "GPT-5 (OpenAI)", id: "gpt-4o", desc: "Intelligence maximale", icon: Sparkles, color: "text-purple-500" },
    { name: "Gemini 2.5 Pro (Google)", id: "google/gemini-2.5-pro", desc: "Raisonnement & analyse logique approfondie", icon: Globe, color: "text-blue-500" },
    { name: "Claude 3.5 Sonnet (Anthropic)", id: "anthropic/claude-3-5-haiku", desc: "Analyse avancée & Créativité", icon: Cpu, color: "text-indigo-500" },
    { name: "Nemotron 3 Ultra (NVIDIA)", id: "nvidia/nemotron-3-ultra-550b-a55b", desc: "Puissance 550B paramètres", icon: Zap, color: "text-emerald-600" },
    { name: "Grok 3 (xAI)", id: "x-ai/grok-2-1212", desc: "Expert Maths & Actualité", icon: Zap, color: "text-[#FF5500]" },
  ];

  const availableSearchModes = [
    { name: "Recherche Globale", desc: "Synthèse du web en temps réel", icon: Globe, color: "text-primary" },
    { name: "Recherche Profonde", desc: "Exploration multi-sources avancée", icon: Search, color: "text-purple-600" },
    { name: "Recherche Académique", desc: "Articles scientifiques & ArXiv", icon: GraduationCap, color: "text-blue-600" },
    { name: "Mode Rapide (Sans Web)", desc: "Réponse instantanée via mémoire", icon: Zap, color: "text-amber-500" },
  ];

  const handleSend = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if ((!query.trim() && attachedFiles.length === 0) || isGenerating) return;
    
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }

    let finalContent: any = query.trim();
    if (attachedFiles.length > 0) {
      const images = attachedFiles.filter(f => f.type === "image" && f.base64);
      const otherFiles = attachedFiles.filter(f => f.type !== "image" || !f.base64);
      
      let textPart = finalContent;
      if (otherFiles.length > 0) {
        const filesText = otherFiles.map(f => `[📎 Fichier joint : ${f.name}]`).join("\n");
        textPart = textPart ? `${textPart}\n\n${filesText}` : filesText;
      }
      
      if (images.length > 0) {
        finalContent = [
          { type: "text", text: textPart || "Analyse et décris en détail cette image jointe." },
          ...images.map(img => ({
            type: "image_url",
            image_url: { url: img.base64 }
          }))
        ];
      } else {
        finalContent = textPart;
      }
    }

    const selectedModelObj = availableModels.find(m => m.name === model) || availableModels[0];
    const promptToSend = selectedSkill.id !== "none" ? selectedSkill.prompt : undefined;

    onSendMessage(finalContent, selectedModelObj.id, model, promptToSend);
    setQuery("");
    setAttachedFiles([]);
    closeAllMenus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newFiles = await Promise.all(
        filesArray.map(async (file) => {
          const isImg = file.type.startsWith("image/");
          let base64 = "";
          if (isImg) {
            base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
          return {
            name: file.name,
            type: isImg ? "image" : "file",
            base64
          };
        })
      );
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
    closeAllMenus();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Real-time Web Speech Recognition
  const toggleVoiceRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale native en direct. Utilisez Google Chrome, Edge ou Brave sur ordinateur.");
      return;
    }

    try {
      baseQueryRef.current = query ? query + " " : "";
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let liveTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        setQuery(baseQueryRef.current + liveTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Erreur micro:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Impossible de lancer le micro:", err);
      setIsRecording(false);
    }
  };

  const renderSkillsBar = () => (
    <div className="flex items-center gap-2 pb-2 border-b border-black/10 w-full relative select-none" ref={skillMenuRef}>
      <span className="text-[11px] font-black uppercase text-black/50 shrink-0 flex items-center gap-1">
        <Wand2 size={13} className="text-primary" />
        <span>Skill :</span>
      </span>
      
      {/* Skill Dropdown Menu */}
      {showSkillMenu && (
        <div className="absolute top-9 left-0 z-50 w-80 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
          <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1 flex items-center justify-between">
            <span>Sélectionner un Skill Pro</span>
            <span className="text-primary font-bold">{skillsList.length} disponibles</span>
          </div>
          
          {skillsList.map((skill) => {
            const isSelected = selectedSkill.id === skill.id;
            return (
              <button
                key={skill.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelectedSkill(skill);
                  closeAllMenus();
                }}
                className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left ${
                  isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                }`}
              >
                <span className="text-base shrink-0 mt-0.5">{skill.icon}</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs flex items-center gap-1.5 truncate">
                      <span className="notranslate" translate="no">{skill.name}</span>
                      {isSelected && <Check size={12} className="text-[#FF5500] shrink-0" />}
                    </span>
                    {skill.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 font-extrabold ${
                        isSelected ? "bg-white/20 text-white" : "bg-black/5 text-black/60"
                      }`}>
                        {skill.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold line-clamp-1 ${isSelected ? "text-white/70" : "text-black/50"}`}>
                    {skill.desc}
                  </span>
                </div>
              </button>
            );
          })}
          
          <div className="border-t border-black/10 mt-1 pt-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                closeAllMenus();
                setShowSkillModal(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-[#FF5500]/10 text-[#FF5500] hover:bg-[#FF5500] hover:text-white transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Ajouter / Créer un Skill personnalisé</span>
            </button>
          </div>
        </div>
      )}

      {/* Skill Selector Button */}
      <button
        type="button"
        onClick={() => {
          const wasOpen = showSkillMenu;
          closeAllMenus();
          if (!wasOpen) setShowSkillMenu(true);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer ${
          showSkillMenu || selectedSkill.id !== "none"
            ? "bg-black text-white"
            : "bg-white text-black hover:bg-black/5"
        }`}
      >
        <span>{selectedSkill.icon}</span>
        <span className="max-w-[160px] sm:max-w-[220px] truncate">{selectedSkill.name}</span>
        {selectedSkill.badge && (
          <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider ${
            showSkillMenu || selectedSkill.id !== "none" ? "bg-white/20 text-white" : "bg-black/5 text-black/60"
          }`}>
            {selectedSkill.badge}
          </span>
        )}
        <ChevronDown size={14} className={showSkillMenu ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {selectedSkill.id !== "none" && (
        <button
          type="button"
          onClick={() => setSelectedSkill(DEFAULT_SKILLS[0])}
          className="text-black/40 hover:text-red-500 text-xs font-bold px-1.5 transition-colors flex items-center gap-0.5"
          title="Réinitialiser (Standard sans skill)"
        >
          <X size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Réinitialiser</span>
        </button>
      )}
    </div>
  );

  const renderSkillModal = () => (
    showSkillModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-white ink-border ink-shadow rounded-3xl p-6 md:p-8 max-w-lg w-full flex flex-col gap-5 relative shadow-[8px_8px_0px_0px_#000000] max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowSkillModal(false)}
            className="absolute top-5 right-5 p-2 rounded-xl border-2 border-black/10 hover:border-black hover:bg-red-500 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} strokeWidth={3} />
          </button>

          <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border-2 border-primary flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000000]">
              🎯
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Ajouter un Skill Spécialisé</h3>
              <p className="text-xs font-bold text-black/60">Enrichissez les compétences et le prompt système de l'IA</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-1/4">
                <label className="text-xs font-black uppercase text-black/70 mb-1 block">Icône</label>
                <input
                  type="text"
                  value={newSkillIcon}
                  onChange={(e) => setNewSkillIcon(e.target.value)}
                  placeholder="⚡"
                  className="w-full bg-[#FAFAFA] ink-border-sm rounded-xl px-3 py-2 text-center text-lg font-bold outline-none focus:bg-white focus:border-primary"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-black uppercase text-black/70 mb-1 block">Nom du Skill *</label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="ex: Expert Python & Django"
                  className="w-full bg-[#FAFAFA] ink-border-sm rounded-xl px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-primary"
                />
              </div>
              <div className="w-1/3">
                <label className="text-xs font-black uppercase text-black/70 mb-1 block">Badge</label>
                <input
                  type="text"
                  value={newSkillBadge}
                  onChange={(e) => setNewSkillBadge(e.target.value)}
                  placeholder="Tech / Bio / Droit"
                  className="w-full bg-[#FAFAFA] ink-border-sm rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-black/70 mb-1 block">Description rapide</label>
              <input
                type="text"
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                placeholder="En quoi cette IA se distingue-t-elle ?"
                className="w-full bg-[#FAFAFA] ink-border-sm rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-black/70 mb-1 block">Prompt Système (Instructions pour l'IA) *</label>
              <textarea
                value={newSkillPrompt}
                onChange={(e) => setNewSkillPrompt(e.target.value)}
                placeholder="Tu es un expert mondial en... Tes réponses doivent suivre la méthode... Ne donne jamais de code non testé..."
                rows={5}
                className="w-full bg-[#FAFAFA] ink-border-sm rounded-xl p-3 text-xs font-medium outline-none focus:bg-white focus:border-primary resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black/10">
            <button
              type="button"
              onClick={() => setShowSkillModal(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-black/5 text-black hover:bg-black/10 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateCustomSkill}
              disabled={!newSkillName.trim()}
              className={`px-6 py-2.5 rounded-xl ink-border-sm font-black text-xs shadow-[3px_3px_0px_0px_#000000] flex items-center gap-2 transition-all cursor-pointer ${
                newSkillName.trim()
                  ? "bg-primary text-white hover:bg-black"
                  : "bg-black/10 text-black/40 border-black/20 shadow-none cursor-not-allowed"
              }`}
            >
              <Wand2 size={15} />
              <span>Installer ce Skill</span>
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#FFFFFF]">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <FlashcardModal
        isOpen={showFlashcardModal}
        onClose={() => {
          setShowFlashcardModal(false);
          setFlashcardInitialText(undefined);
        }}
        topic={activeSession ? activeSession.title : "Espace de Travail"}
        initialText={
          flashcardInitialText ||
          (activeSession?.messages && activeSession.messages.length > 0
            ? activeSession.messages
                .slice(-6)
                .map((m) => `${m.role === "user" ? "Question" : "Explication"}: ${typeof m.content === "string" ? m.content : ""}`)
                .join("\n\n")
            : query.trim() || undefined)
        }
      />
      {/* Invisible backdrop to close menus when clicking outside */}
      {(showPlusMenu || showModelMenu || showSearchMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={closeAllMenus} 
        />
      )}

      {/* Hidden File Input for attaching images & documents */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        multiple 
        accept="image/*,.pdf,.txt,.doc,.docx,.csv,.xlsx" 
        className="hidden" 
      />

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {!activeSession ? (
          /* Welcome View (Home Screen) */
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center max-w-3xl w-full mx-auto px-6 pb-20 pt-4">
            
            {/* Mascot in the middle of Welcome Screen instead of old logo */}
            <div className="mb-3 relative flex flex-col items-center justify-center">
              <img 
                src={isGenerating ? "/Arrowai.png" : "/generated-image__1_-removebg-preview.png"} 
                alt="Gama Studio AI Mascot" 
                className={`w-48 h-48 md:w-56 md:h-56 object-contain transition-all ${isGenerating ? 'animate-spin' : 'hover:scale-105 filter drop-shadow-[0_10px_15px_rgba(255,85,0,0.2)]'}`} 
              />
              <div className="flex items-center gap-2.5 mt-2 mb-4">
                {isPro ? (
                  <span className="text-xs md:text-sm font-black tracking-widest uppercase px-3.5 py-1 rounded-xl transition-all shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
                    ★ PRO STUDIO EDITION
                  </span>
                ) : (
                  <button 
                    onClick={async () => {
                      if (!user) {
                        router.push("/pricing");
                        return;
                      }
                      try {
                        const res = await fetch("/api/stripe/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id, userEmail: user.email, returnUrl: window.location.origin })
                        });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                        else alert("Erreur Stripe : " + (data.error || "Impossible d'ouvrir le paiement"));
                      } catch (e: any) {
                        alert("Erreur Stripe : " + e.message);
                      }
                    }}
                    className="text-xs md:text-sm font-black tracking-widest uppercase px-4 py-1.5 rounded-xl transition-all shadow-[3px_3px_0px_0px_#000000] flex items-center gap-1.5 bg-[#FF5500] hover:bg-black text-white hover:scale-105 cursor-pointer animate-pulse"
                    title="Passer à Gama Pro — 9€/mois"
                  >
                    <span>👑 PASSER À PRO — 9€/MOIS</span>
                  </button>
                )}
                <span className="text-xs font-bold text-black/60 bg-black/5 px-3 py-1 rounded-xl border border-black/10">
                  ⚡ {isPro ? "Quotas Débridés & VIP" : "Multi-Modèle & Veille Web"}
                </span>
                <button
                  type="button"
                  onClick={onToggleIncognito}
                  className={`px-3.5 py-1 rounded-xl font-black text-xs border-2 flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000000] ${
                    isIncognito
                      ? "bg-black text-white border-black animate-pulse"
                      : "bg-white text-black border-black/20 hover:border-black hover:bg-black/5"
                  }`}
                  title="Mode Incognito : Les discussions ne sont jamais enregistrées ni dans le navigateur ni dans le cloud"
                >
                  {isIncognito ? <Shield size={14} className="text-[#FF5500]" /> : <EyeOff size={14} className="text-black/60" />}
                  <span>{isIncognito ? "🕶️ Incognito Actif" : "🕶️ Incognito"}</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className={`w-full bg-[#FFFBF5] ink-border rounded-2xl p-5 flex flex-col gap-4 transition-all relative ${
              isRecording 
                ? "shadow-[7px_7px_0px_0px_#EF4444] border-red-600 bg-red-50/20" 
                : "ink-shadow hover:shadow-[7px_7px_0px_0px_#FF5500]"
            }`}>
              
              {/* Skills Bar */}
              {renderSkillsBar()}

              {/* Attached Files & Images Previews */}
              {attachedFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-black/10">
                  {attachedFiles.map((file, idx) => (
                    <span key={idx} className="bg-white border-2 border-black text-black px-3 py-1 rounded-xl text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]">
                      {file.type === "image" ? <ImageIcon size={14} className="text-primary" /> : <Paperclip size={14} className="text-black/60" />}
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button 
                        onClick={() => removeFile(idx)} 
                        className="hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors"
                        title="Supprimer"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 bg-red-500/15 text-red-600 px-4 py-1.5 rounded-xl border border-red-500/30 animate-pulse font-black text-xs w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>🎤 Microphone Écoute en Direct... Parlez maintenant !</span>
                </div>
              )}

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "🎤 Parlez maintenant... La transcription s'écrit en direct..." : "Demandez ce que vous voulez... ou utilisez les menus ci-dessous"}
                className="w-full resize-none outline-none text-xl md:text-2xl font-black bg-transparent placeholder-[#666666] text-[#000000] min-h-[70px] px-2 pt-1 leading-relaxed notranslate"
                translate="no"
                rows={2}
                autoFocus
              />

              {/* Bottom Toolbar inside search box */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t-2 border-[#000000]/15 relative">
                
                {/* Left Side: Plus Menu & Search Mode Dropdown */}
                <div className="flex items-center gap-2 relative">
                  
                  {/* 1. Plus Dropdown Menu */}
                  {showPlusMenu && (
                    <div className="absolute bottom-12 left-0 z-50 w-64 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150" ref={plusMenuRef}>
                      <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                        Ajouter / Actions rapides
                      </div>
                      <button
                        onClick={() => {
                          closeAllMenus();
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                      >
                        <Paperclip size={16} className="text-primary shrink-0" />
                        <span>Joindre image ou document</span>
                      </button>
                      <button
                        onClick={() => {
                          closeAllMenus();
                          setQuery("Génère une idée innovante et complète de projet SaaS en 2026");
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                      >
                        <Sparkles size={16} className="text-amber-500 shrink-0" />
                        <span>Suggérer une idée créative</span>
                      </button>
                      <button
                        onClick={() => {
                          closeAllMenus();
                          setQuery("Analyse ces données et extrais les tendances principales :\n\n");
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                      >
                        <Table size={16} className="text-emerald-500 shrink-0" />
                        <span>Analyser des données (CSV)</span>
                      </button>
                      <button
                        onClick={() => {
                          closeAllMenus();
                          setQuery("Fais une synthèse de ce lien Web : https://");
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                      >
                        <LinkIcon size={16} className="text-blue-500 shrink-0" />
                        <span>Résumer une page Web</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Search Mode Dropdown Menu */}
                  {showSearchMenu && (
                    <div className="absolute bottom-12 left-10 z-50 w-72 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150" ref={searchMenuRef}>
                      <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                        Mode de recherche Web
                      </div>
                      {availableSearchModes.map((item) => {
                        const Icon = item.icon;
                        const isSelected = searchMode === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchMode(item.name);
                              closeAllMenus();
                            }}
                            className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left ${
                              isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                            }`}
                          >
                            <Icon size={16} className={`${item.color} shrink-0 mt-0.5`} />
                            <div className="flex flex-col">
                              <span className="font-black text-xs flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {isSelected && <Check size={12} className="text-primary" />}
                              </span>
                              <span className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-black/50"}`}>
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      const wasOpen = showPlusMenu;
                      closeAllMenus();
                      if (!wasOpen) setShowPlusMenu(true);
                    }}
                    className={`w-9 h-9 rounded-xl ink-border-sm flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_#000000] ${
                      showPlusMenu ? "bg-black text-white" : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                    }`}
                    title="Menu d'actions (+)"
                  >
                    <Plus size={18} strokeWidth={3} className={showPlusMenu ? "rotate-45 transition-transform duration-200" : "transition-transform duration-200"} />
                  </button>

                  <button 
                    onClick={() => {
                      const wasOpen = showSearchMenu;
                      closeAllMenus();
                      if (!wasOpen) setShowSearchMenu(true);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] ${
                      showSearchMenu ? "bg-black text-white" : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Globe size={15} className="text-primary" />
                    <span>{searchMode}</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Right Side: Model Dropdown, Mic & Send */}
                <div className="flex items-center gap-2 relative" ref={modelMenuRef}>
                  
                  {/* 3. Model Selector Dropdown Menu */}
                  {showModelMenu && (
                    <div className="absolute bottom-12 right-0 z-50 w-72 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                        Sélectionner le Modèle IA (Multi-Moteurs)
                      </div>
                      {availableModels.map((item) => {
                        const Icon = item.icon;
                        const isSelected = model === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setModel(item.name);
                              closeAllMenus();
                            }}
                            className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left ${
                              isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                            }`}
                          >
                            <Icon size={16} className={`${item.color} shrink-0 mt-0.5`} />
                            <div className="flex flex-col">
                              <span className="font-black text-xs flex items-center gap-1.5">
                                <span className="notranslate" translate="no">{item.name}</span>
                                {isSelected && <Check size={12} className="text-primary" />}
                              </span>
                              <span className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-black/50"}`}>
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      const wasOpen = showModelMenu;
                      closeAllMenus();
                      if (!wasOpen) setShowModelMenu(true);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] ${
                      showModelMenu ? "bg-black text-white" : "bg-[#FF5500]/15 text-[#FF5500] hover:bg-[#FF5500] hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Sparkles size={15} />
                    <span className="notranslate" translate="no">{model}</span>
                    <ChevronDown size={14} />
                  </button>

                  <button 
                    onClick={toggleVoiceRecognition}
                    className={`p-2 rounded-xl ink-border-sm transition-all shadow-[2px_2px_0px_0px_#000000] ${
                      isRecording 
                        ? "bg-red-600 text-white animate-pulse border-red-800 shadow-[2px_2px_0px_0px_#7F1D1D]" 
                        : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                    }`}
                    title={isRecording ? "Arrêter l'enregistrement vocal" : "Activer la reconnaissance vocale en temps réel (Micro)"}
                  >
                    <Mic size={16} />
                  </button>

                  <button 
                    onClick={handleSend}
                    disabled={(!query.trim() && attachedFiles.length === 0) || isGenerating}
                    className={`py-2 px-5 rounded-xl ink-border-sm font-black shadow-[3px_3px_0px_0px_#000000] flex items-center gap-2 transition-all ${
                      (query.trim() || attachedFiles.length > 0)
                        ? "bg-[#FF5500] text-[#FFFFFF] hover:bg-[#000000] cursor-pointer" 
                        : "bg-[#000000]/10 text-[#000000]/40 border-[#000000]/20 shadow-none cursor-not-allowed"
                    }`}
                  >
                    <span>Envoyer</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-2xl">
              <button onClick={() => setQuery("Explique l'informatique quantique à un enfant de 10 ans")} className="text-xs font-black bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] px-4 py-2 rounded-xl ink-border-sm transition-all text-[#000000] shadow-[2px_2px_0px_0px_#000000]">
                💡 Expliquer l'informatique quantique
              </button>
              <button onClick={() => setQuery("Crée un composant React pour un panier e-commerce")} className="text-xs font-black bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] px-4 py-2 rounded-xl ink-border-sm transition-all text-[#000000] shadow-[2px_2px_0px_0px_#000000]">
                ⚛️ Créer un panier React
              </button>
              <button onClick={() => setQuery("Rédige un e-mail de prospection percutant pour mon SaaS")} className="text-xs font-black bg-[#FAFAFA] hover:bg-[#000000] hover:text-[#FFFFFF] px-4 py-2 rounded-xl ink-border-sm transition-all text-[#000000] shadow-[2px_2px_0px_0px_#000000]">
                ✉️ E-mail de prospection
              </button>
            </div>
          </div>
        ) : (
          /* Chat History View (Conversation Log - Clean Natural Thread without giant boxes) */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Conversation Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 w-full max-w-4xl mx-auto flex flex-col gap-6 notranslate" translate="no">
              {activeSession.messages.map((msg, index) => (
                <div key={index} className="flex flex-col w-full">
                  {msg.role === "user" ? (
                    /* User Message: Aligned to right as a neat message bubble */
                    <div className="flex justify-end w-full pl-12">
                      <div className="bg-[#FAFAFA] dark:bg-[#1E1E24] ink-border-sm dark:border-white/20 rounded-2xl px-5 py-3.5 max-w-2xl text-lg font-black text-[#000000] dark:text-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FF5500] whitespace-pre-wrap leading-relaxed">
                        {typeof msg.content === "string" ? (
                          msg.content
                        ) : Array.isArray(msg.content) ? (
                          <div className="flex flex-col gap-3">
                            {msg.content.map((part: any, idx: number) => {
                              if (part.type === "text") return <span key={idx}>{part.text}</span>;
                              if (part.type === "image_url") {
                                return (
                                  <img 
                                    key={idx} 
                                    src={part.image_url?.url} 
                                    alt="Image analysée" 
                                    className="max-h-60 max-w-full rounded-xl border border-black/20 object-contain bg-white shadow-sm mt-1" 
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        ) : (
                          String(msg.content)
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message: Clean natural conversation thread (no giant boxed card) */
                    <div className="flex items-start gap-4 w-full py-3 pr-8">
                      <img 
                        src="/dragon-avatar.png" 
                        alt="Gama Dragon AI" 
                        className="w-10 h-10 object-contain rounded-full shrink-0 mt-0.5 border border-black/15 p-0.5 bg-white shadow-sm" 
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-black/80 dark:text-white/90 tracking-wider">
                            Gama Studio AI • {activeSession.modelName || model}
                          </span>
                        </div>
                        
                        {(!user && index >= 3) ? (
                          <div className="relative overflow-hidden rounded-2xl pt-0.5">
                            <div className="text-lg font-medium text-black/90 dark:text-white leading-relaxed whitespace-pre-wrap select-none max-h-[160px] overflow-hidden opacity-85">
                              {(typeof msg.content === "string" ? msg.content : String(msg.content)).substring(0, 320) + "..."}
                            </div>
                            <div className="relative mt-[-50px] pt-16 pb-4 px-4 bg-gradient-to-b from-transparent via-white/95 to-white flex flex-col items-center justify-center text-center">
                              <div className="bg-black text-white p-4 rounded-2xl shadow-[4px_4px_0px_0px_#FF5500] max-w-sm w-full flex flex-col items-center gap-2.5 border-2 border-black">
                                <div className="text-xs font-black uppercase tracking-wider text-[#FF5500]">
                                  🔐 Réponse complète prête
                                </div>
                                <p className="text-xs text-white/80 leading-tight">
                                  Connectez-vous pour lire la suite de cette réponse et continuer votre discussion avec le modèle Best ★.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowAuthModal(true)}
                                  className="w-full py-2 rounded-xl bg-white text-black hover:bg-[#FF5500] hover:text-white font-black text-xs transition-all cursor-pointer shadow-[2px_2px_0px_0px_#FF5500]"
                                >
                                  Se connecter / Voir la suite
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-lg font-medium text-black/90 dark:text-white leading-relaxed whitespace-pre-wrap pt-0.5">
                            {typeof msg.content === "string" ? msg.content : (Array.isArray(msg.content) ? msg.content.map((p: any) => p.text || "").join("") : String(msg.content))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button onClick={() => alert("Copié dans le presse-papier !")} className="text-xs font-bold text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-lg cursor-pointer">
                            📋 Copier
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Thinking Animation */}
              {isGenerating && (
                <div className="flex items-center gap-4 py-4 px-2 animate-pulse">
                  <img src="/Arrowai.png" alt="Thinking Gama Studio AI" className="w-8 h-8 object-contain animate-spin shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-black uppercase tracking-wide">
                      L'IA réfléchit en direct... ({activeSession.modelName || model})
                    </span>
                    <span className="text-xs font-semibold text-black/50">Synthèse et formulation dans le fil de discussion...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Bottom Search Box - Always visible with solid borders when in chat */}
            <div className="border-t-[3px] border-[#000000]/15 p-2 sm:p-4 bg-[#FFFFFF] shrink-0 z-10">
              <div className={`max-w-3xl mx-auto bg-[#FFFBF5] ink-border rounded-xl p-2.5 sm:p-3 flex flex-col gap-3 transition-all relative ${
                isRecording ? "shadow-[5px_5px_0px_0px_#EF4444] border-red-600 bg-red-50/20" : "ink-shadow"
              }`}>
                
                {/* Skills Bar inside chat */}
                {renderSkillsBar()}

                {/* Attached Files inside chat bottom box */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachedFiles.map((file, idx) => (
                      <span key={idx} className="bg-white border-2 border-black text-black font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000]">
                        <span>{file.type === "image" ? "🖼️" : "📄"}</span>
                        <span className="max-w-[120px] sm:max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:text-red-500 font-extrabold ml-1 p-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "🎤 Parlez maintenant..." : "Posez une question de suivi... (+ pour joindre une image)"}
                  className="w-full resize-none outline-none text-base sm:text-lg font-black bg-transparent placeholder-[#666666] text-[#000000] min-h-[44px] px-1 pt-1 notranslate"
                  translate="no"
                  rows={1}
                />
                
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-t-2 border-[#000000]/10 pt-2 relative">
                  <div className="flex items-center gap-1.5 sm:gap-2 relative">
                    
                    {/* 1. Plus Dropdown Menu (Bottom Chat Bar) */}
                    {showPlusMenu && (
                      <div className="absolute bottom-11 left-0 z-50 w-64 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150" ref={plusMenuRef}>
                        <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                          Ajouter / Actions rapides
                        </div>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            fileInputRef.current?.click();
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left min-h-[44px]"
                        >
                          <Paperclip size={15} className="text-primary shrink-0" />
                          <span>Joindre image ou fichier</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Génère une idée innovante et complète de projet SaaS en 2026");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left min-h-[44px]"
                        >
                          <Sparkles size={15} className="text-amber-500 shrink-0" />
                          <span>Suggérer une idée créative</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Analyse ces données et extrais les tendances principales :\n\n");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left min-h-[44px]"
                        >
                          <Table size={15} className="text-emerald-500 shrink-0" />
                          <span>Analyser des données (CSV)</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Fais une synthèse de ce lien Web : https://");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left min-h-[44px]"
                        >
                          <LinkIcon size={15} className="text-blue-500 shrink-0" />
                          <span>Résumer une page Web</span>
                        </button>
                      </div>
                    )}

                    {/* 2. Search Mode Dropdown Menu (Bottom Chat Bar) */}
                    {showSearchMenu && (
                      <div className="absolute bottom-11 left-10 z-50 w-72 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150" ref={searchMenuRef}>
                        <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                          Mode de recherche Web
                        </div>
                        {availableSearchModes.map((item) => {
                          const Icon = item.icon;
                          const isSelected = searchMode === item.name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchMode(item.name);
                                closeAllMenus();
                              }}
                              className={`flex items-start gap-3 w-full px-3 py-2 rounded-xl transition-colors text-left min-h-[44px] ${
                                isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                              }`}
                            >
                              <Icon size={15} className={`${item.color} shrink-0 mt-0.5`} />
                              <div className="flex flex-col">
                                <span className="font-black text-xs flex items-center gap-1.5">
                                  <span className="notranslate" translate="no">{item.name}</span>
                                  {isSelected && <Check size={12} className="text-primary" />}
                                </span>
                                <span className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-black/50"}`}>
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        const wasOpen = showPlusMenu;
                        closeAllMenus();
                        if (!wasOpen) setShowPlusMenu(true);
                      }}
                      className={`p-2 sm:p-1.5 rounded-lg ink-border-sm flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_#000000] min-h-[40px] min-w-[40px] ${
                        showPlusMenu ? "bg-black text-white" : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                      }`}
                      title="Menu d'actions (+)"
                    >
                      <Plus size={16} strokeWidth={3} className={showPlusMenu ? "rotate-45 transition-transform duration-200" : "transition-transform duration-200"} />
                    </button>
                    <button 
                      onClick={() => {
                        const wasOpen = showSearchMenu;
                        closeAllMenus();
                        if (!wasOpen) setShowSearchMenu(true);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ink-border-sm font-bold text-xs transition-all shadow-[2px_2px_0px_0px_#000000] min-h-[40px] ${
                        showSearchMenu ? "bg-black text-white" : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <Globe size={14} className="text-primary shrink-0" />
                      <span className="max-w-[80px] sm:max-w-none truncate">{searchMode}</span>
                      <ChevronDown size={14} className="shrink-0" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 relative ml-auto" ref={modelMenuRef}>
                    
                    {/* 3. Model Selector Dropdown Menu (Bottom Chat Bar) */}
                    {showModelMenu && (
                      <div className="absolute bottom-11 right-0 z-50 w-72 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                          Sélectionner le Modèle IA (Multi-Moteurs)
                        </div>
                        {availableModels.map((item) => {
                          const Icon = item.icon;
                          const isSelected = model === item.name;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setModel(item.name);
                                closeAllMenus();
                              }}
                              className={`flex items-start gap-3 w-full px-3 py-2 rounded-xl transition-colors text-left min-h-[44px] ${
                                isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                              }`}
                            >
                              <Icon size={15} className={`${item.color} shrink-0 mt-0.5`} />
                              <div className="flex flex-col">
                                <span className="font-black text-xs flex items-center gap-1.5">
                                  <span className="notranslate" translate="no">{item.name}</span>
                                  {isSelected && <Check size={12} className="text-primary" />}
                                </span>
                                <span className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-black/50"}`}>
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        const wasOpen = showModelMenu;
                        closeAllMenus();
                        if (!wasOpen) setShowModelMenu(true);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] min-h-[40px] ${
                        showModelMenu ? "bg-black text-white" : "bg-[#FF5500]/15 text-[#FF5500] hover:bg-[#FF5500] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <Sparkles size={14} className="shrink-0" />
                      <span className="notranslate max-w-[100px] sm:max-w-none truncate" translate="no">{model}</span>
                      <ChevronDown size={14} className="shrink-0" />
                    </button>

                    <button 
                      onClick={toggleVoiceRecognition}
                      className={`p-2 sm:p-1.5 rounded-lg ink-border-sm transition-all shadow-[2px_2px_0px_0px_#000000] min-h-[40px] min-w-[40px] flex items-center justify-center ${
                        isRecording 
                          ? "bg-red-600 text-white animate-pulse border-red-800 shadow-[2px_2px_0px_0px_#7F1D1D]" 
                          : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                      }`}
                      title={isRecording ? "Arrêter le micro" : "Reconnaissance vocale en direct"}
                    >
                      <Mic size={16} />
                    </button>

                    <button 
                      onClick={handleSend}
                      disabled={(!query.trim() && attachedFiles.length === 0) || isGenerating}
                      className={`py-1.5 px-3 sm:px-4 rounded-lg ink-border-sm font-extrabold shadow-[2px_2px_0px_0px_#000000] text-xs flex items-center gap-1.5 transition-all min-h-[40px] ${
                        (query.trim() || attachedFiles.length > 0)
                          ? "bg-[#FF5500] text-[#FFFFFF] hover:bg-[#000000] cursor-pointer" 
                          : "bg-[#000000]/10 text-[#000000]/40 border-[#000000]/20 shadow-none cursor-not-allowed"
                      }`}
                    >
                      <span>Envoyer</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderSkillModal()}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
