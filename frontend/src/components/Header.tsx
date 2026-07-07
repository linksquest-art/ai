"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Star, LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "./AuthModal";

export function Header() {
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
    localStorage.removeItem("gama_sessions");
    localStorage.removeItem("gama_active_session");
    setUser(null);
  };

  return (
    <>
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full z-10 relative border-b-4 border-ink/10 mb-6 bg-paper/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2">
            <div className="bg-ink text-white p-2 rounded-xl border-2 border-ink group-hover:bg-primary transition-colors">
              <Star size={24} fill="currentColor" />
            </div>
            <span className="text-3xl font-black tracking-tight text-ink border-3 border-ink px-4 py-1.5 bg-white rounded-xl cartoon-shadow rotate-[-2deg] inline-block group-hover:rotate-0 transition-all">
              Gama Studio
            </span>
          </Link>
        </div>
        <nav className="flex gap-6 items-center font-extrabold text-lg text-ink">
          <Link href="/pricing" className="hover:text-primary transition-colors underline-offset-8 hover:underline decoration-4">Tarifs</Link>
          <Link href="/about" className="hover:text-primary transition-colors underline-offset-8 hover:underline decoration-4 hidden sm:inline">À Propos</Link>
          
          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border-2 border-black text-xs font-black text-emerald-900 shadow-[2px_2px_0px_0px_#000000]">
                <UserIcon size={14} className="text-emerald-600" />
                <span className="max-w-[140px] truncate">{user.email || "Utilisateur Pro"}</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-9 h-9 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000000]"
                title="Se déconnecter"
              >
                <LogOut size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="cartoon-btn text-base py-2.5 px-6 gap-2 ml-2 bg-white hover:bg-ink hover:text-white cursor-pointer"
            >
              <MessageSquare size={20} />
              <span>Connexion</span>
            </button>
          )}
        </nav>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
