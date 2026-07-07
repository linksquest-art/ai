"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Check, Star, Zap, Shield, Heart, ArrowRight, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
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
}

export default function PricingPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gama_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        supabase.auth.updateUser({ data: { plan: "pro" } }).then(({ data }) => {
          if (data.user) setUser(data.user);
          alert("🎉 PAIEMENT STRIPE VALIDÉ ! Bienvenue dans Gama Pro ★ ! Vous avez maintenant un accès illimité à GPT-5 et aux tokens !");
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      } else if (params.get("canceled") === "true") {
        alert("ℹ️ Paiement Stripe annulé. Vous êtes toujours sur le Plan Hobby gratuit.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const currentPlan = user?.user_metadata?.plan === "pro" ? "pro" : "free";

  const handleUpgradePro = async () => {
    if (!user) {
      alert("⚠️ Veuillez d'abord vous connecter dans le menu de gauche pour souscrire à Gama Pro !");
      return;
    }

    if (currentPlan === "pro") {
      alert("✨ Vous êtes déjà abonné à Gama Pro ! Votre compte bénéficie d'une puissance maximale sans limite.");
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.origin
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Impossible d'initialiser Stripe.");
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      alert("Erreur Stripe : " + (err.message || "Erreur inconnue"));
      setIsUpgrading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-black flex items-center gap-2">
                <span>Tarifs & Abonnements</span>
                {user && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border-2 font-black ${
                    currentPlan === "pro" 
                      ? "bg-amber-100 text-amber-800 border-amber-500 shadow-[2px_2px_0px_0px_#f59e0b]" 
                      : "bg-gray-100 text-gray-700 border-gray-400"
                  }`}>
                    {currentPlan === "pro" ? "★ Votre Plan Actuel : Gama Pro" : "Votre Plan Actuel : Hobby Studio (Gratuit)"}
                  </span>
                )}
              </h1>
              <p className="text-xs font-bold text-black/50">Choisissez la puissance d'animation qui convient à votre studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/" className="ink-btn bg-black text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#FF5500]">
              <span>Retour au Chat</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-5xl w-full mx-auto px-8 py-12 flex flex-col items-center">
          <div className="text-center mb-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black/5 text-black border-2 border-black px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest mb-4">
              ★ Sans Engagement • Annulable en 1 Clic ★
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              Passez à la vitesse supérieure.
            </h2>
            <p className="text-lg font-extrabold text-black/70">
              Débloquez l'accès illimité à tous les meilleurs modèles d'IA avec une interface qui a du style.
            </p>
          </div>

          {/* 🛠️ ENCART MODE DEV / SIMULATION */}
          {user && (
            <div className="w-full max-w-4xl mb-10 bg-amber-50/90 border-[3px] border-dashed border-amber-600 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#d97706] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  🛠️
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                    <span>Espace Simulation Dev Studio</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border border-amber-400">Mode Dev Actif</span>
                  </h3>
                  <p className="text-xs font-bold text-amber-800/90">
                    Basculez votre compte entre le mode Gratuit et le mode Pro en 1 clic pour tester l'interface.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <button
                  onClick={async () => {
                    const { data } = await supabase.auth.updateUser({ data: { plan: "pro" } });
                    if (data.user) setUser(data.user);
                    alert("🛠️ MODE DEV : Statut basculé en Gama Pro ★ !");
                  }}
                  disabled={currentPlan === "pro"}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer ${
                    currentPlan === "pro" ? "bg-amber-200 text-amber-800 opacity-60 cursor-default" : "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:scale-105"
                  }`}
                >
                  ⚡ Simuler Gama Pro ★
                </button>
                <button
                  onClick={async () => {
                    const { data } = await supabase.auth.updateUser({ data: { plan: "free" } });
                    if (data.user) setUser(data.user);
                    alert("🛠️ MODE DEV : Statut rebasculé en Plan Gratuit !");
                  }}
                  disabled={currentPlan === "free"}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer ${
                    currentPlan === "free" ? "bg-gray-200 text-gray-500 opacity-60 cursor-default" : "bg-white hover:bg-black hover:text-white text-black"
                  }`}
                >
                  🌱 Simuler Gratuit
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            
            {/* Plan Gratuit */}
            <div className="bg-white border-[3px] border-black rounded-2xl p-8 flex flex-col shadow-[5px_5px_0px_0px_#000000] relative justify-between">
              <div>
                <span className="bg-black/5 text-black border border-black/20 px-3 py-1 rounded-lg font-black text-xs uppercase">
                  Édition Classique
                </span>
                <h3 className="text-3xl font-black mb-2 mt-4">Hobby Studio</h3>
                <p className="text-black/70 font-extrabold mb-6 text-sm">Pour explorer et tester nos modèles d'IA au quotidien.</p>
                <div className="text-5xl font-black mb-8">0€ <span className="text-base text-black/50 font-bold">/mois</span></div>
                
                <ul className="flex flex-col gap-3 mb-8 border-t-2 border-black/10 pt-6 text-sm font-extrabold">
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> 50 messages quotidiens (Bridé à 700 tokens)</li>
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> Accès à GPT-4o Mini & modèles gratuits</li>
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> Sauvegarde cloud sécurisée sur Supabase</li>
                  <li className="flex items-center gap-3 text-black/40"><Check className="text-black/20" strokeWidth={3} size={18} /> Pas d'accès aux modèles Pro (GPT-5 / Claude 3.5 Sonnet)</li>
                </ul>
              </div>
              
              <div className="w-full text-center bg-black/5 text-black/60 font-black py-3 rounded-xl border-2 border-black/20 text-sm">
                {currentPlan === "free" ? "✓ Plan Actif (Par défaut)" : "Plan Gratuit Standard"}
              </div>
            </div>

            {/* Plan Pro */}
            <div className="bg-white border-[3px] border-black rounded-2xl p-8 flex flex-col shadow-[7px_7px_0px_0px_#FF5500] relative justify-between transform md:-translate-y-2">
              <div>
                <div className="absolute -top-3.5 right-6 bg-primary text-white border-2 border-black px-3 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000000]">
                  ★ Recommandé ★
                </div>
                
                <h3 className="text-3xl font-black mb-2 mt-2 flex items-center gap-2">
                  <Zap className="text-primary fill-primary" size={28} />
                  <span>Gama Pro</span>
                </h3>
                <p className="text-black/70 font-extrabold mb-6 text-sm">Pour les créateurs et studios qui exigent le maximum d'intelligence.</p>
                <div className="text-5xl font-black mb-8">19€ <span className="text-base text-black/50 font-bold">/mois</span></div>
                
                <ul className="flex flex-col gap-3 mb-8 border-t-2 border-black/10 pt-6 text-sm font-extrabold">
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Messages ILLIMITÉS 24h/24</li>
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Quota débridé (2500+ tokens par analyse)</li>
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Accès VIP : GPT-5, Claude 3.5 Sonnet, Gemini Pro</li>
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Routage prioritaire anti-panne</li>
                  <li className="flex items-center gap-3"><Shield className="text-primary" strokeWidth={3} size={18} /> Sync cloud en temps réel & chiffrement Supabase</li>
                </ul>
              </div>
              
              <button 
                onClick={handleUpgradePro}
                disabled={isUpgrading || currentPlan === "pro"}
                className={`w-full text-center font-black py-3 rounded-xl border-2 border-black transition-all text-sm cursor-pointer ${
                  currentPlan === "pro"
                    ? "bg-emerald-500 text-white shadow-[4px_4px_0px_0px_#000000] cursor-default"
                    : "bg-[#FF5500] hover:bg-black text-white shadow-[4px_4px_0px_0px_#000000]"
                }`}
              >
                {isUpgrading ? "Ouverture de Stripe..." : currentPlan === "pro" ? "★ Plan Gama Pro Actif ★" : "👑 Passer à Gama Pro (Paiement Stripe)"}
              </button>
            </div>

          </div>

          {/* Guarantee badge */}
          <div className="mt-12 text-center bg-black/5 border-2 border-black/10 rounded-xl p-4 max-w-xl">
            <p className="text-xs font-bold text-black/60">
              🔒 Vos paiements sont sécurisés par Stripe. Le statut de votre abonnement est géré nativement dans Supabase et synchronisé en temps réel sur l'application.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
