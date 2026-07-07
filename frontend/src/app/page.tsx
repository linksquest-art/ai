"use client";

import { useState, useEffect, Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useSearchParams, useRouter } from "next/navigation";
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
  modelId?: string;
  modelName?: string;
  systemPrompt?: string;
  isIncognito?: boolean;
}

function HomeContent() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Load sessions from localStorage on mount & listen to Supabase Auth state for cloud sync
  useEffect(() => {
    const saved = localStorage.getItem("gama_sessions");
    const savedActive = localStorage.getItem("gama_active_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (savedActive && parsed.some((s: ChatSession) => s.id === savedActive)) {
          setActiveSessionId(savedActive);
        }
      } catch (e) {
        console.error("Failed to parse saved sessions:", e);
      }
    }

      const syncUserSessions = async (currentUser: any) => {
        setUser(currentUser);
        if (currentUser) {
          // Au moment de la connexion, récupérer l'historique de chat cloud depuis les métadonnées Supabase
          const cloudSessions = currentUser.user_metadata?.chat_sessions;
          if (cloudSessions && Array.isArray(cloudSessions) && cloudSessions.length > 0) {
            setSessions(cloudSessions);
            localStorage.setItem("gama_sessions", JSON.stringify(cloudSessions));
            if (savedActive && cloudSessions.some((s: ChatSession) => s.id === savedActive)) {
              setActiveSessionId(savedActive);
            } else if (cloudSessions[0]) {
              setActiveSessionId(cloudSessions[0].id);
              localStorage.setItem("gama_active_session", cloudSessions[0].id);
            }
          }
        } else {
          const saved = localStorage.getItem("gama_sessions");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setSessions(parsed);
              localStorage.setItem("gama_sessions", JSON.stringify(parsed));
            } catch (e) {}
          } else {
            setSessions([]);
            setActiveSessionId(null);
          }
        }
      };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserSessions(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("gama_sessions");
        localStorage.removeItem("gama_active_session");
        setSessions([]);
        setActiveSessionId(null);
        setUser(null);
      } else {
        syncUserSessions(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if there is an initial query or space context from url parameters
  useEffect(() => {
    const q = searchParams.get("q");
    const spaceTitle = searchParams.get("spaceTitle");
    const spacePrompt = searchParams.get("spacePrompt");

    if (spaceTitle) {
      const newId = Math.random().toString(36).substring(2, 15);
      const newSession: ChatSession = {
        id: newId,
        title: `📁 ${spaceTitle.substring(0, 20)}`,
        messages: [{ role: "assistant" as const, content: `👋 Bienvenue dans l'espace **${spaceTitle}** !\n\nLe contexte système spécialisé a été injecté dans l'IA pour cette discussion. Comment puis-je vous aider ?` }],
        createdAt: Date.now(),
        modelId: "deepseek/deepseek-chat",
        modelName: "Best ★",
        systemPrompt: spacePrompt || undefined
      };
      setSessions(prev => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
      setActiveSessionId(newId);
      router.replace("/");
      return;
    }

    if (q && q.trim()) {
      handleSendMessage(q);
      router.replace("/");
    }
  }, [searchParams]);

  // Check if returning from Stripe payment with success=true
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      supabase.auth.updateUser({ data: { plan: "pro" } }).then(({ data }) => {
        if (data.user) setUser(data.user);
        alert("🎉 PAIEMENT STRIPE VALIDÉ ! Bienvenue dans Gama Pro ★ ! Vous avez maintenant un accès illimité à GPT-5 et aux tokens !");
        router.replace("/");
      });
    }
  }, [searchParams]);

  // 2. Save sessions to localStorage & sync to Supabase user profile when logged in
  const saveSessions = async (updated: ChatSession[], customUser?: any, incognito?: boolean) => {
    const targetUser = customUser !== undefined ? customUser : user;
    setSessions(updated);

    if (incognito || isIncognito) return; // Mode Incognito : Ne rien enregistrer dans le navigateur ni le cloud

    const persistSessions = updated.filter(s => !s.isIncognito);
    localStorage.setItem("gama_sessions", JSON.stringify(persistSessions));

    if (targetUser) {
      try {
        await supabase.auth.updateUser({
          data: { chat_sessions: persistSessions }
        });
      } catch (e) {
        console.warn("Erreur de synchronisation cloud Supabase:", e);
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem("gama_active_session", id);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    localStorage.removeItem("gama_active_session");
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      const nextId = updated[0]?.id || null;
      setActiveSessionId(nextId);
      if (nextId) localStorage.setItem("gama_active_session", nextId);
      else localStorage.removeItem("gama_active_session");
    }
  };

  const handleSendMessage = async (text: any, modelId?: string, modelName?: string, skillPrompt?: string) => {
    let currentSessions = [...sessions];
    let activeSession = currentSessions.find(s => s.id === activeSessionId);
    let targetSessionId = activeSessionId;

    const userMessage: Message = { role: "user", content: text };
    const targetModelId = modelId || activeSession?.modelId || "deepseek/deepseek-chat";
    const targetModelName = modelName || activeSession?.modelName || "Best ★";
    const targetSystemPrompt = skillPrompt !== undefined ? skillPrompt : activeSession?.systemPrompt;

    const titleText = typeof text === "string" ? text : (Array.isArray(text) ? (text.find((p: any) => p.type === "text")?.text || "📷 Image analysée") : "Nouvelle discussion");

    if (!activeSession) {
      const isProPlan = user?.user_metadata?.plan === "pro";
      if (!isProPlan && !isIncognito && sessions.length >= 5) {
        setShowUpgradeModal(true);
        return;
      }
      const newId = Math.random().toString(36).substring(2, 15);
      const newSession: ChatSession = {
        id: newId,
        title: isIncognito ? `🕶️ [Incognito] ${titleText.substring(0, 18)}` : (titleText.length > 25 ? titleText.substring(0, 25) + "..." : titleText),
        messages: [userMessage],
        createdAt: Date.now(),
        modelId: targetModelId,
        modelName: targetModelName,
        systemPrompt: targetSystemPrompt,
        isIncognito: isIncognito
      };
      currentSessions.unshift(newSession);
      targetSessionId = newId;
      activeSession = newSession;
      setActiveSessionId(newId);
      saveSessions(currentSessions, undefined, isIncognito);
    } else {
      activeSession.messages.push(userMessage);
      if (modelId) activeSession.modelId = modelId;
      if (modelName) activeSession.modelName = modelName;
      if (skillPrompt !== undefined) activeSession.systemPrompt = skillPrompt;
      saveSessions(currentSessions, undefined, activeSession.isIncognito || isIncognito);
    }

    setIsGenerating(true);

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const currentPlan = authSession?.user?.user_metadata?.plan || user?.user_metadata?.plan || "free";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authSession?.access_token ? `Bearer ${authSession.access_token}` : "",
          "X-User-Plan": currentPlan
        },
        body: JSON.stringify({ 
          messages: activeSession.messages,
          model: targetModelId,
          systemPrompt: activeSession.systemPrompt
        })
      });

      if (!res.ok) throw new Error("API call failed");
      const data = await res.json();

      if (data.restrictedModel) {
        setShowUpgradeModal(true);
      }

      const updatedSessions = currentSessions.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, { role: data.role, content: data.content }]
          };
        }
        return s;
      });

      saveSessions(updatedSessions, undefined, activeSession.isIncognito || isIncognito);
    } catch (err) {
      console.error("Error communicating with AI:", err);
      const updatedSessions = currentSessions.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, { role: "assistant" as const, content: "⚠️ Désolé, une erreur technique est survenue lors de la communication avec OpenRouter. Veuillez vérifier votre connexion ou choisir un autre modèle." }]
          };
        }
        return s;
      });
      saveSessions(updatedSessions, undefined, activeSession.isIncognito || isIncognito);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b-[3px] border-black px-4 flex items-center justify-between z-30 shadow-sm notranslate" translate="no">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -ml-2 text-black hover:bg-black/5 rounded-xl transition-colors flex items-center gap-2 font-black"
          title="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
          <span className="text-sm font-extrabold">Menu</span>
        </button>
        <div className="flex items-center gap-2 font-black text-lg">
          <img src="/7.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span>Gama Studio</span>
        </div>
        <button 
          onClick={handleNewChat}
          className="p-2 -mr-2 text-black hover:bg-black/5 rounded-xl transition-colors font-black flex items-center gap-1"
          title="Nouvelle discussion"
        >
          <svg className="w-6 h-6 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - responsive: slide over on mobile, static on desktop */}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out md:flex shrink-0 h-full`}>
        <Sidebar 
          sessions={sessions.filter(s => !s.isIncognito)} 
          activeSessionId={activeSessionId} 
          onSelectSession={(id) => {
            handleSelectSession(id);
            setMobileMenuOpen(false);
          }} 
          onNewChat={() => {
            handleNewChat();
            setMobileMenuOpen(false);
          }}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 w-full pt-14 md:pt-0 overflow-hidden">
        <MainContent 
          activeSession={activeSession} 
          onSendMessage={handleSendMessage} 
          isGenerating={isGenerating}
          isIncognito={isIncognito}
          onToggleIncognito={() => {
            const next = !isIncognito;
            setIsIncognito(next);
            if (!next) {
              setSessions(prev => prev.filter(s => !s.isIncognito));
            }
            setActiveSessionId(null);
          }}
        />
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        user={user}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-[#FFFFFF] font-black text-xl text-black">Chargement de Gama Studio...</div>}>
      <HomeContent />
    </Suspense>
  );
}
