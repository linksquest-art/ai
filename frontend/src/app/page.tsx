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
}

function HomeContent() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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

  // Check if there is an initial query from /discover (e.g. ?q=...)
  useEffect(() => {
    const q = searchParams.get("q");
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
  const saveSessions = async (updated: ChatSession[], customUser?: any) => {
    const targetUser = customUser !== undefined ? customUser : user;

    setSessions(updated);
    localStorage.setItem("gama_sessions", JSON.stringify(updated));

    if (targetUser) {
      try {
        await supabase.auth.updateUser({
          data: { chat_sessions: updated }
        });
      } catch (e) {
        console.warn("Erreur de synchronisation cloud Supabase:", e);
      }
    }
  };

  const handleNewChat = () => {
    const isProPlan = user?.user_metadata?.plan === "pro";
    if (!isProPlan && sessions.length >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveSessionId(null);
    localStorage.removeItem("gama_active_session");
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem("gama_active_session", id);
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

  const handleSendMessage = async (text: string, modelId?: string, modelName?: string) => {
    let currentSessions = [...sessions];
    let activeSession = currentSessions.find(s => s.id === activeSessionId);
    let targetSessionId = activeSessionId;

    const userMessage: Message = { role: "user", content: text };
    const targetModelId = modelId || activeSession?.modelId || "anthropic/claude-3.5-sonnet";
    const targetModelName = modelName || activeSession?.modelName || "Claude 3.5 Sonnet";

    if (!activeSession) {
      const isProPlan = user?.user_metadata?.plan === "pro";
      if (!isProPlan && sessions.length >= 5) {
        setShowUpgradeModal(true);
        return;
      }
      const newId = Math.random().toString(36).substring(2, 15);
      const newSession: ChatSession = {
        id: newId,
        title: text.length > 25 ? text.substring(0, 25) + "..." : text,
        messages: [userMessage],
        createdAt: Date.now(),
        modelId: targetModelId,
        modelName: targetModelName
      };
      currentSessions.unshift(newSession);
      targetSessionId = newId;
      activeSession = newSession;
      setActiveSessionId(newId);
      saveSessions(currentSessions);
    } else {
      activeSession.messages.push(userMessage);
      if (modelId) activeSession.modelId = modelId;
      if (modelName) activeSession.modelName = modelName;
      saveSessions(currentSessions);
    }

    // Suivi quotidien des quotas de messages dans le navigateur pour la barre visuelle UI/UX Pro Max
    const todayStr = new Date().toISOString().split("T")[0];
    const savedQuota = localStorage.getItem("gama_daily_quota");
    let quotaObj = { date: todayStr, count: 0 };
    if (savedQuota) {
      try {
        const parsed = JSON.parse(savedQuota);
        if (parsed.date === todayStr) quotaObj.count = parsed.count || 0;
      } catch (e) {}
    }
    quotaObj.count += 1;
    localStorage.setItem("gama_daily_quota", JSON.stringify(quotaObj));

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
          model: targetModelId
        })
      });

      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      
      const updatedSessions = currentSessions.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, { role: data.role, content: data.content }]
          };
        }
        return s;
      });

      saveSessions(updatedSessions);
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
      saveSessions(updatedSessions);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={handleSelectSession} 
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      <MainContent 
        activeSession={activeSession} 
        onSendMessage={handleSendMessage} 
        isGenerating={isGenerating} 
      />
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
