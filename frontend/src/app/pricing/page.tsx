"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Check, Star, Zap, Shield, Heart, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    const saved = localStorage.getItem("gama_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-black">Tarifs & Abonnements</h1>
              <p className="text-xs font-bold text-black/50">Choisissez la puissance d'animation qui convient à votre studio</p>
            </div>
          </div>
          
          <Link href="/" className="ink-btn bg-black text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#FF5500]">
            <span>Retour au Chat</span>
            <ArrowRight size={14} />
          </Link>
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
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> 50 messages quotidiens</li>
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> Accès à Gemini 2.5 Flash & Claude Haiku</li>
                  <li className="flex items-center gap-3"><Check className="text-black" strokeWidth={3} size={18} /> Sauvegarde de l'historique en local</li>
                  <li className="flex items-center gap-3 text-black/40"><Check className="text-black/20" strokeWidth={3} size={18} /> Pas d'accès aux modèles Pro (GPT-4o / Claude Sonnet)</li>
                </ul>
              </div>
              
              <Link href="/" className="w-full text-center bg-white hover:bg-black hover:text-white text-black font-black py-3 rounded-xl border-2 border-black transition-all shadow-[3px_3px_0px_0px_#000000] text-sm">
                Démarrer Gratuitement
              </Link>
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
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Accès aux modèles d'élite (Claude 3.5 Sonnet, GPT-4o)</li>
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Routage prioritaire anti-panne</li>
                  <li className="flex items-center gap-3"><Check className="text-primary" strokeWidth={3} size={18} /> Sync cloud en temps réel sur Supabase</li>
                  <li className="flex items-center gap-3"><Shield className="text-primary" strokeWidth={3} size={18} /> Sécurité et confidentialité renforcées</li>
                </ul>
              </div>
              
              <button 
                onClick={() => alert("Redirection vers la passerelle de paiement Stripe sécurisée...")}
                className="w-full text-center bg-primary hover:bg-black text-white font-black py-3 rounded-xl border-2 border-black transition-all shadow-[4px_4px_0px_0px_#000000] text-sm cursor-pointer"
              >
                Souscrire via Stripe
              </button>
            </div>

          </div>

          {/* Guarantee badge */}
          <div className="mt-12 text-center bg-black/5 border-2 border-black/10 rounded-xl p-4 max-w-xl">
            <p className="text-xs font-bold text-black/60">
              🔒 Vos paiements sont sécurisés par Stripe. Vous pouvez annuler votre abonnement à tout moment depuis vos paramètres en un seul clic sans aucune pénalité.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
