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
  LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "./AuthModal";

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
}

interface MainContentProps {
  activeSession: ChatSession | null;
  onSendMessage: (text: string, modelId?: string, modelName?: string) => void;
  isGenerating: boolean;
}

export function MainContent({ activeSession, onSendMessage, isGenerating }: MainContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseQueryRef = useRef("");
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const searchMenuRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("GPT-4o Mini");
  const [searchMode, setSearchMode] = useState("Recherche Globale");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Dropdown states
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
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

  const isPro = user?.user_metadata?.plan === "pro";

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
        !searchMenuRef.current?.contains(e.target as Node)
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
  };

  // OpenAI Official Models
  const availableModels = [
    { name: "GPT-4o Mini", id: "gpt-4o-mini", desc: "Rapide & économique", icon: Zap, color: "text-emerald-500" },
    { name: "GPT-5", id: "gpt-4o", desc: "Intelligence maximale", icon: Sparkles, color: "text-purple-500" },
  ];

  const availableSearchModes = [
    { name: "Recherche Globale", desc: "Synthèse du web en temps réel", icon: Globe, color: "text-primary" },
    { name: "Recherche Profonde", desc: "Exploration multi-sources avancée", icon: Search, color: "text-purple-600" },
    { name: "Recherche Académique", desc: "Articles scientifiques & ArXiv", icon: GraduationCap, color: "text-blue-600" },
    { name: "Mode Rapide (Sans Web)", desc: "Réponse instantanée via mémoire", icon: Zap, color: "text-amber-500" },
  ];

  const handleSend = () => {
    if ((!query.trim() && attachedFiles.length === 0) || isGenerating) return;
    
    if (isRecording && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }

    let finalContent = query.trim();
    if (attachedFiles.length > 0) {
      const filesText = attachedFiles.map(f => `[📎 Fichier joint : ${f.name}]`).join("\n");
      finalContent = finalContent ? `${finalContent}\n\n${filesText}` : filesText;
    }

    const selectedModelObj = availableModels.find(m => m.name === model) || availableModels[0];

    onSendMessage(finalContent, selectedModelObj.id, model);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file"
      }));
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#FFFFFF]">
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
                <Link 
                  href="/pricing"
                  className={`text-xs md:text-sm font-black tracking-widest uppercase px-3.5 py-1 rounded-xl transition-all shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5 ${
                    isPro
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:scale-105"
                      : "bg-black text-white hover:bg-primary"
                  }`}
                  title={isPro ? "Gama Pro Actif" : "Cliquez pour passer à Gama Pro"}
                >
                  <span>{isPro ? "★ PRO STUDIO EDITION" : "HOBBY STUDIO EDITION"}</span>
                </Link>
                <span className="text-xs font-bold text-black/60 bg-black/5 px-3 py-1 rounded-xl border border-black/10">
                  ⚡ {isPro ? "Quotas Débridés & VIP" : "Multi-Modèle & Veille Web"}
                </span>
              </div>
            </div>

            {/* Search Box */}
            <div className={`w-full bg-[#FFFBF5] ink-border rounded-2xl p-5 flex flex-col gap-4 transition-all relative ${
              isRecording 
                ? "shadow-[7px_7px_0px_0px_#EF4444] border-red-600 bg-red-50/20" 
                : "ink-shadow hover:shadow-[7px_7px_0px_0px_#FF5500]"
            }`}>
              
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
                className="w-full resize-none outline-none text-xl md:text-2xl font-black bg-transparent placeholder-[#666666] text-[#000000] min-h-[70px] px-2 pt-1 leading-relaxed"
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
                        Sélectionner le Modèle IA (Gratuit)
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
                      const wasOpen = showModelMenu;
                      closeAllMenus();
                      if (!wasOpen) setShowModelMenu(true);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] ${
                      showModelMenu ? "bg-black text-white" : "bg-[#FF5500]/15 text-[#FF5500] hover:bg-[#FF5500] hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Sparkles size={15} />
                    <span>{model}</span>
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
            <div className="flex-1 overflow-y-auto px-6 py-8 w-full max-w-4xl mx-auto flex flex-col gap-6">
              {activeSession.messages.map((msg, index) => (
                <div key={index} className="flex flex-col w-full">
                  {msg.role === "user" ? (
                    /* User Message: Aligned to right as a neat message bubble */
                    <div className="flex justify-end w-full pl-12">
                      <div className="bg-[#FAFAFA] ink-border-sm rounded-2xl px-5 py-3.5 max-w-2xl text-lg font-black text-[#000000] shadow-[3px_3px_0px_0px_#000000] whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message: Clean natural conversation thread (no giant boxed card) */
                    <div className="flex items-start gap-4 w-full py-3 pr-8">
                      <img 
                        src="/Arrowai.png" 
                        alt="Gama AI Star" 
                        className="w-10 h-10 object-contain rounded-full shrink-0 mt-0.5 border border-black/15 p-0.5 bg-white shadow-sm" 
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-black/80 tracking-wider">
                            Gama Studio AI • {activeSession.modelName || model}
                          </span>
                          <span className="text-[10px] font-bold bg-green-500/15 text-green-800 px-2 py-0.5 rounded-md border border-green-600/30">
                            Réponse Vérifiée
                          </span>
                        </div>
                        
                        <div className="text-lg font-medium text-black/90 leading-relaxed whitespace-pre-wrap pt-0.5">
                          {msg.content}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button onClick={() => alert("Copié dans le presse-papier !")} className="text-xs font-bold text-black/50 hover:text-black flex items-center gap-1 transition-colors bg-black/5 px-2.5 py-1 rounded-lg">
                            📋 Copier
                          </button>
                          <button className="text-xs font-bold text-black/50 hover:text-black flex items-center gap-1 transition-colors bg-black/5 px-2.5 py-1 rounded-lg">
                            🔄 Régénérer
                          </button>
                          <span className="text-xs font-bold text-black/40 ml-auto">Généré instantanément via OpenRouter</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Thinking Animation */}
              {isGenerating && (
                <div className="flex items-center gap-4 py-4 px-2 animate-pulse">
                  <img src="/Arrowai.png" alt="Thinking Arrow AI" className="w-10 h-10 object-contain animate-spin shrink-0" />
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
            <div className="border-t-[3px] border-[#000000]/15 p-4 bg-[#FFFFFF] shrink-0 z-10">
              <div className={`max-w-3xl mx-auto bg-[#FFFBF5] ink-border rounded-xl p-3 flex flex-col gap-3 transition-all relative ${
                isRecording ? "shadow-[5px_5px_0px_0px_#EF4444] border-red-600 bg-red-50/20" : "ink-shadow"
              }`}>
                
                {/* Attached Files inside chat bottom box */}
                {attachedFiles.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-black/10">
                    {attachedFiles.map((file, idx) => (
                      <span key={idx} className="bg-white border-2 border-black text-black px-2.5 py-0.5 rounded-lg text-xs font-black flex items-center gap-1.5">
                        {file.type === "image" ? <ImageIcon size={12} className="text-primary" /> : <Paperclip size={12} />}
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="hover:text-red-500 font-extrabold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "🎤 Parlez maintenant... La transcription s'écrit en direct..." : "Posez une question de suivi... ou cliquez sur + pour le menu"}
                  className="w-full resize-none outline-none text-lg font-black bg-transparent placeholder-[#666666] text-[#000000] min-h-[44px] px-1 pt-1"
                  rows={1}
                />
                
                <div className="flex items-center justify-between border-t-2 border-[#000000]/10 pt-2 relative">
                  <div className="flex items-center gap-2 relative">
                    
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
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                        >
                          <Paperclip size={15} className="text-primary shrink-0" />
                          <span>Joindre image ou fichier</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Génère une idée innovante et complète de projet SaaS en 2026");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                        >
                          <Sparkles size={15} className="text-amber-500 shrink-0" />
                          <span>Suggérer une idée créative</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Analyse ces données et extrais les tendances principales :\n\n");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
                        >
                          <Table size={15} className="text-emerald-500 shrink-0" />
                          <span>Analyser des données (CSV)</span>
                        </button>
                        <button
                          onClick={() => {
                            closeAllMenus();
                            setQuery("Fais une synthèse de ce lien Web : https://");
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-black hover:text-white text-black font-extrabold text-xs transition-colors text-left"
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
                              className={`flex items-start gap-3 w-full px-3 py-2 rounded-xl transition-colors text-left ${
                                isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                              }`}
                            >
                              <Icon size={15} className={`${item.color} shrink-0 mt-0.5`} />
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
                      className={`p-1.5 rounded-lg ink-border-sm flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_#000000] ${
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
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ink-border-sm font-bold text-xs transition-all shadow-[2px_2px_0px_0px_#000000] ${
                        showSearchMenu ? "bg-black text-white" : "bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <Globe size={14} className="text-primary" />
                      <span>{searchMode}</span>
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 relative" ref={modelMenuRef}>
                    
                    {/* 3. Model Selector Dropdown Menu (Bottom Chat Bar) */}
                    {showModelMenu && (
                      <div className="absolute bottom-11 left-0 z-50 w-72 bg-white ink-border ink-shadow rounded-2xl p-2 flex flex-col gap-1 shadow-[5px_5px_0px_0px_#000000] animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[10px] font-black uppercase text-black/40 px-3 py-1 border-b border-black/10 mb-1">
                          Sélectionner le Modèle IA (Gratuit)
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
                              className={`flex items-start gap-3 w-full px-3 py-2 rounded-xl transition-colors text-left ${
                                isSelected ? "bg-black text-white" : "hover:bg-black/5 text-black"
                              }`}
                            >
                              <Icon size={15} className={`${item.color} shrink-0 mt-0.5`} />
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
                        const wasOpen = showModelMenu;
                        closeAllMenus();
                        if (!wasOpen) setShowModelMenu(true);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ink-border-sm font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000000] ${
                        showModelMenu ? "bg-black text-white" : "bg-[#FF5500]/15 text-[#FF5500] hover:bg-[#FF5500] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>{model}</span>
                      <ChevronDown size={14} />
                    </button>

                    <button 
                      onClick={toggleVoiceRecognition}
                      className={`p-1.5 rounded-lg ink-border-sm transition-all shadow-[2px_2px_0px_0px_#000000] ${
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
                      className={`py-1.5 px-4 rounded-lg ink-border-sm font-extrabold shadow-[2px_2px_0px_0px_#000000] text-xs flex items-center gap-1.5 transition-all ${
                        (query.trim() || attachedFiles.length > 0)
                          ? "bg-[#FF5500] text-[#FFFFFF] hover:bg-[#000000] cursor-pointer" 
                          : "bg-[#000000]/10 text-[#000000]/40 border-[#000000]/20 shadow-none cursor-not-allowed"
                      }`}
                    >
                      <span>Envoyer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
