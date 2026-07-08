"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Plus, 
  Folder, 
  History, 
  Sparkles,
  Compass,
  LogIn,
  LogOut,
  User as UserIcon,
  Zap,
  Crown,
  TrendingUp,
  Settings,
  Calendar,
  GraduationCap,
  FileText,
  CheckSquare
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
}

interface SidebarProps {
  sessions?: ChatSession[];
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (id: string) => void;
}

export function Sidebar({ 
  sessions = [], 
  activeSessionId = null, 
  onSelectSession = () => {}, 
  onNewChat = () => {},
  onDeleteSession = () => {} 
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSelectChat = (id: string) => {
    localStorage.setItem("gama_active_session", id);
    onSelectSession(id);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleNewChatClick = () => {
    localStorage.removeItem("gama_active_session");
    onNewChat();
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dailyCount, setDailyCount] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Suivi en temps réel de la consommation quotidienne
  useEffect(() => {
    const checkQuota = () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const saved = localStorage.getItem("gama_daily_quota");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.date === todayStr) {
            setDailyCount(parsed.count || 0);
          } else {
            setDailyCount(0);
          }
        } catch (e) {
          setDailyCount(0);
        }
      } else {
        setDailyCount(0);
      }
    };
    checkQuota();
    const interval = setInterval(checkQuota, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Découvrir", href: "/discover", icon: Compass },
    { name: "Historique", href: "/history", icon: History },
    { name: "Espaces & Skills", href: "/spaces", icon: Folder },
    { name: "Devoirs IA", href: "/homework", icon: GraduationCap },
    { name: "Quiz & QCM IA", href: "/quiz", icon: CheckSquare },
    { name: "Résumés & YouTube", href: "/summary", icon: FileText },
    { name: "Calendrier", href: "/calendar", icon: Calendar },
    { name: "Tarifs", href: "/pricing", icon: Sparkles },
  ];

  const isPro = user?.user_metadata?.plan === "pro";

  return (
    <>
      <aside className="w-[260px] bg-[#FFFFFF] border-r-[3px] border-black flex flex-col h-screen shrink-0 p-3 select-none justify-between z-20 shadow-[2px_0px_0px_0px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
          {/* Top Header Logo */}
          <div className="flex items-center justify-between px-2 pt-1 shrink-0">
            <Link href="/" onClick={handleNewChatClick} className="flex items-center gap-3 group text-left">
              <img src="/7.png" alt="Gama Studio Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
              <span className="font-black text-xl tracking-tight text-black group-hover:text-primary transition-colors">
                Gama Studio
              </span>
            </Link>
          </div>

          {/* New Chat Button */}
          <Link
            href="/"
            onClick={handleNewChatClick}
            className="ink-btn bg-[#FFFFFF] hover:bg-primary hover:text-white text-black font-extrabold py-2.5 px-3 rounded-xl flex items-center gap-2.5 w-full text-sm shrink-0 border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000000]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Nouveau Chat</span>
          </Link>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1 text-xs md:text-sm font-bold text-black/80 pt-1 overflow-y-auto flex-1 min-h-0 pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all border-2 shrink-0 ${
                    isActive
                      ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500]"
                      : "border-transparent text-black hover:bg-black/5 hover:border-black/20"
                  }`}
                >
                  <Icon size={17} className={isActive ? "text-primary" : "text-black/70"} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* UI/UX PRO MAX - Minimalist Bottom Account Rectangle */}
        <div className="pt-3 border-t-2 border-black/10 flex flex-col gap-2 shrink-0">
          {user && !isPro && (
            <button
              onClick={async () => {
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
              className="w-full bg-gradient-to-r from-[#FF5500] to-[#FF8800] hover:from-black hover:to-black text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer animate-pulse"
              title="Passer à Gama Pro via paiement Stripe sécurisé"
            >
              <span>👑 Passer à Pro (Stripe)</span>
            </button>
          )}
          {user ? (
            <Link 
              href="/account"
              className="bg-white p-2.5 rounded-xl border-2 border-black flex items-center justify-between shadow-[3px_3px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer group"
              title="Mon Compte, Quotas & Paramètres"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg text-white font-black flex items-center justify-center shrink-0 text-xs shadow-sm overflow-hidden ${isPro ? "bg-[#FF5500]" : "bg-emerald-500"}`}>
                  {isPro ? <img src="/Arrowai.png" alt="Pro" className="w-full h-full object-cover" /> : (user.email?.[0].toUpperCase() || "U")}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-black truncate group-hover:text-primary transition-colors">
                    {user.email?.split('@')[0]}
                  </span>
                  <span className={`text-[10px] font-extrabold flex items-center gap-1 ${isPro ? "text-amber-700" : "text-emerald-700"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span>{isPro ? "Gama Pro ★" : "Hobby (Gratuit)"}</span>
                  </span>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/5 group-hover:bg-black group-hover:text-white text-black/70 transition-colors shrink-0 flex items-center justify-center">
                <Settings size={16} className="group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </Link>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-[#FF4500] hover:bg-[#E03E00] text-white font-black py-2.5 px-3 rounded-xl flex items-center justify-between gap-2 text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer animate-pulse group"
              title="Se connecter pour accéder à votre espace et à vos quotas"
            >
              <div className="flex items-center gap-2">
                <LogIn size={18} strokeWidth={2.5} />
                <span>S'inscrire / Connexion</span>
              </div>
              <div className="p-1 rounded bg-black/20 group-hover:bg-black/40 transition-colors">
                <Settings size={15} />
              </div>
            </button>
          )}

          {/* Subtle Operational Status */}
          <div className="flex items-center justify-between px-1 pt-0.5 text-[10px] font-black uppercase text-black/40 select-none">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>IA Opérationnelle</span>
            </span>
            <span>v2.9</span>
          </div>
        </div>
      </aside>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
