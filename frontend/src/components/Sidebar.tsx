"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, 
  Folder, 
  Link2, 
  History, 
  Sparkles,
  Compass,
  LogIn,
  LogOut,
  User as UserIcon
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navItems = [
    { name: "Découvrir", href: "/discover", icon: Compass },
    { name: "Espaces", href: "/spaces", icon: Folder },
    { name: "Tarifs", href: "/pricing", icon: Sparkles },
  ];

  return (
    <>
      <aside className="w-[260px] bg-[#FFFFFF] border-r-[3px] border-black flex flex-col h-screen shrink-0 p-3 select-none justify-between z-20 shadow-[2px_0px_0px_0px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
          {/* Top Header Logo */}
          <div className="flex items-center justify-between px-2 pt-1 shrink-0">
            <Link href="/" onClick={onNewChat} className="flex items-center gap-3 group text-left">
              <img src="/logo.png" alt="Gama Studio Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
              <span className="font-black text-xl tracking-tight text-black group-hover:text-primary transition-colors">
                Gama Studio
              </span>
            </Link>
          </div>

          {/* New Chat Button */}
          <Link
            href="/"
            onClick={onNewChat}
            className="ink-btn bg-[#FFFFFF] hover:bg-primary hover:text-white text-black font-extrabold py-2.5 px-3 rounded-xl flex items-center gap-2.5 w-full text-sm shrink-0 border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000000]"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Nouveau Chat</span>
          </Link>

          {/* User Auth Section (Prominent Login / Profile Button) */}
          <div className="shrink-0">
            {user ? (
              <div className="bg-emerald-50 p-2.5 rounded-xl border-2 border-black flex items-center justify-between shadow-[2px_2px_0px_0px_#000000]">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    {user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-black truncate">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] font-bold text-emerald-700">En ligne • Pro</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-black/60 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Se déconnecter"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-[#FF4500] hover:bg-[#E03E00] text-white font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer animate-pulse"
              >
                <LogIn size={18} strokeWidth={2.5} />
                <span>Connexion / S'inscrire</span>
              </button>
            )}
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1 text-sm font-bold text-black/80 pt-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border-2 ${
                    isActive
                      ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500]"
                      : "border-transparent text-black hover:bg-black/5 hover:border-black/20"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-primary" : "text-black/70"} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* History Section - Scrollable & Real */}
          <div className="flex flex-col gap-1 pt-3 border-t-2 border-black/10 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between px-2.5 text-xs font-black text-black/40 uppercase tracking-wider mb-1 sticky top-0 bg-[#FFFFFF] py-1 z-10">
              <div className="flex items-center gap-1.5">
                <History size={14} />
                <span>Historique Réel</span>
              </div>
              <span className="text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-black/60">
                {sessions.length}
              </span>
            </div>

            {(!sessions || sessions.length === 0) ? (
              <div className="px-3 py-4 text-center border-2 border-dashed border-black/15 rounded-xl my-2">
                <span className="text-xs font-bold text-black/40 block">Aucune discussion lancée</span>
                <span className="text-[10px] text-black/30 block mt-0.5">Posez une question pour démarrer !</span>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                    activeSessionId === session.id
                      ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#000000]"
                      : "border-transparent text-black hover:bg-black/5 hover:border-black/15"
                  }`}
                >
                  <span className="truncate max-w-[150px]">{session.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteSession) {
                        onDeleteSession(session.id);
                      }
                    }}
                    title="Supprimer la conversation"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-black/40 p-1.5 transition-opacity shrink-0 mr-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Minimalist Footer */}
        <div className="pt-3 border-t-2 border-black/10 flex flex-col gap-2 shrink-0 text-center">
          <div className="bg-black/5 p-2 rounded-xl border border-black/10 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-black">Système IA Opérationnel</span>
            </div>
            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              v2.7
            </span>
          </div>
        </div>
      </aside>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
