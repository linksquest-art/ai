"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sidebar } from "@/components/Sidebar";
import { 
  User as UserIcon, 
  Shield, 
  Zap, 
  Crown, 
  ArrowRight, 
  LogOut, 
  Check, 
  Cloud, 
  History, 
  Sparkles,
  Settings,
  AlertCircle,
  TrendingUp,
  X,
  Lock,
  Scale,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function AccountPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [user, setUser] = useState<any>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Suivi de la consommation quotidienne
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("gama_sessions");
    localStorage.removeItem("gama_active_session");
    setUser(null);
    router.push("/");
  };

  const currentPlan = user?.user_metadata?.plan === "pro" ? "pro" : "free";
  const isPro = currentPlan === "pro";
  const percentage = Math.min(100, Math.round((dailyCount / 50) * 100));

  // Durée d'abonnement / cycle de facturation (30 jours)
  const subDaysElapsed = isPro ? 12 : 7;
  const subDaysTotal = 30;
  const subDaysRemaining = subDaysTotal - subDaysElapsed;
  const subProgressPercent = Math.round((subDaysElapsed / subDaysTotal) * 100);

  // Tokens & Quota Hebdomadaire
  const dailyTokensUsed = dailyCount * 700;
  const dailyTokensMax = isPro ? 250000 : 35000;
  const tokenPercentage = Math.min(100, Math.round((dailyTokensUsed / dailyTokensMax) * 100));

  const weeklyMessagesUsed = dailyCount * 3;
  const weeklyMessagesMax = isPro ? 5000 : 350;
  const weeklyPercentage = Math.min(100, Math.round((weeklyMessagesUsed / weeklyMessagesMax) * 100));

  const handleUpgradePro = async () => {
    if (!user) {
      alert("⚠️ Veuillez vous connecter pour souscrire à Gama Pro !");
      return;
    }
    if (isPro) {
      alert("✨ Vous êtes déjà abonné à Gama Pro !");
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
          returnUrl: window.location.origin + "/account"
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
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black select-none">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-white rounded-xl shadow-[3px_3px_0px_0px_#FF5500]">
              <Settings size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black flex items-center gap-2.5">
                <span>Mon Compte & Paramètres</span>
                {user && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border-2 font-black uppercase tracking-wider ${
                    isPro 
                      ? "bg-amber-100 text-amber-800 border-amber-500 shadow-[2px_2px_0px_0px_#f59e0b]" 
                      : "bg-gray-100 text-gray-700 border-gray-400"
                  }`}>
                    {isPro ? "★ Plan Gama Pro" : "Plan Hobby (Gratuit)"}
                  </span>
                )}
              </h1>
              <p className="text-xs font-bold text-black/50">Gérez votre profil Supabase, vos quotas de tokens et votre abonnement</p>
            </div>
          </div>
          
          <Link href="/" className="ink-btn bg-black text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#FF5500] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <span>Retour au Chat</span>
            <ArrowRight size={14} />
          </Link>
        </header>

        {/* Main Content Dashboard */}
        <div className="max-w-4xl w-full mx-auto px-8 py-10 flex flex-col gap-8 pb-20">
          
          {!user ? (
            <div className="bg-amber-50 border-[3px] border-black rounded-2xl p-8 text-center shadow-[6px_6px_0px_0px_#000000] flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-amber-600" />
              <h2 className="text-2xl font-black">Aucun compte connecté</h2>
              <p className="text-sm font-bold text-black/70 max-w-md">
                Veuillez vous connecter ou vous inscrire depuis le menu de gauche pour accéder à vos informations de compte, vos quotas chiffrés et vos sauvegardes Supabase.
              </p>
              <Link href="/" className="bg-[#FF4500] text-white font-black px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000000] text-sm">
                Se connecter / S'inscrire
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 1: PROFIL & IDENTIFIANT SUPABASE */}
              <div className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col gap-6">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="text-primary" size={24} />
                    <h2 className="text-lg font-black uppercase tracking-tight">Profil Utilisateur Supabase</h2>
                  </div>
                  <span className="text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Session Sécurisée Active</span>
                  </span>
                </div>

                <div className="bg-black/5 p-5 rounded-xl border border-black/10 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-black/40">Adresse E-mail du Compte</span>
                    <span className="text-base font-black text-black">{user.email}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Compte Actif</span>
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSignOut}
                    className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-black px-4 py-2.5 rounded-xl border-2 border-red-500 transition-colors text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Me déconnecter de Gama Studio</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: QUOTAS & CONSOMMATION EN DIRECT (UI/UX PRO MAX) */}
              <div className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#FF5500] flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="text-primary fill-primary" size={24} />
                    <h2 className="text-lg font-black uppercase tracking-tight">Consommation & Quota de Tokens</h2>
                  </div>
                  <span className="text-xs font-black text-black/60 bg-black/5 px-3 py-1 rounded-lg border border-black/10">
                    Mise à jour en temps réel
                  </span>
                </div>

                {isPro ? (
                  <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/25 to-amber-500/15 p-6 rounded-2xl border-2 border-amber-500 flex flex-col gap-5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black uppercase text-amber-950 flex items-center gap-2">
                        <Crown size={22} className="text-amber-600 fill-amber-500 animate-bounce" />
                        <span>Puissance Gama Pro Débridée</span>
                      </span>
                      <span className="text-lg font-black text-amber-900 bg-amber-400/30 px-3 py-1 rounded-xl border border-amber-500/40">Illimité ∞</span>
                    </div>

                    {/* Progress Bar de l'abonnement en cours */}
                    <div className="space-y-2 bg-white/70 p-4 rounded-xl border border-amber-500/30">
                      <div className="flex items-center justify-between text-xs font-black text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-600" />
                          <span>Durée d&apos;Abonnement — Cycle de 1 mois (30 jours)</span>
                        </span>
                        <span>Renouvellement dans {subDaysRemaining} jours</span>
                      </div>
                      <div className="w-full bg-amber-500/20 h-3 rounded-full overflow-hidden border border-amber-500/40">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full" 
                          style={{ width: `${subProgressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xs font-extrabold text-amber-900/80 leading-relaxed">
                      Votre compte bénéficie d&apos;un routage prioritaire sans limite quotidienne. Vos analyses peuvent consommer jusqu&apos;à **2500+ tokens par réponse** avec les modèles d&apos;élite (GPT-5, Claude 3.5 Sonnet).
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Progress Bar 1 : Messages quotidiens */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-black text-black block">Messages Quotidiens Utilisés</span>
                          <span className="text-xs font-bold text-black/50">Réinitialisé automatiquement tous les jours à minuit</span>
                        </div>
                        <span className="text-xl font-black text-black bg-black/5 px-3 py-1 rounded-xl border-2 border-black/10">
                          {dailyCount} <span className="text-xs font-bold text-black/40">/ 50 messages</span>
                        </span>
                      </div>
                      <div className="w-full bg-black/10 h-4 rounded-full overflow-hidden border-2 border-black p-[2px]">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage > 85 ? "bg-red-500" : percentage > 60 ? "bg-amber-500" : "bg-emerald-500"
                          }`} 
                          style={{ width: `${Math.max(4, percentage)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar 2 : Tokens Quotidiens (bridés à 700 / message) */}
                    <div className="space-y-2 bg-black/[0.03] p-4 rounded-2xl border border-black/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-black block">Consommation de Tokens (Jour)</span>
                          <span className="text-[11px] font-bold text-black/60">Bridé à 700 tokens par message en plan gratuit</span>
                        </div>
                        <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border border-black/10">
                          {dailyTokensUsed.toLocaleString("fr-FR")} / {dailyTokensMax.toLocaleString("fr-FR")} tokens
                        </span>
                      </div>
                      <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden border border-black/20">
                        <div 
                          className="bg-[#FF5500] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(3, tokenPercentage)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress Bar 3 : Temps avant renouvellement / essai du mois */}
                    <div className="space-y-2 bg-black/[0.03] p-4 rounded-2xl border border-black/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-black block">Cycle Mensuel & Découverte (30 jours)</span>
                          <span className="text-[11px] font-bold text-black/60">Passez à Pro pour débloquer toutes les fonctionnalités tout le mois</span>
                        </div>
                        <span className="text-xs font-black text-black bg-white px-2.5 py-1 rounded-lg border border-black/10">
                          Jour {subDaysElapsed} / {subDaysTotal}
                        </span>
                      </div>
                      <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden border border-black/20">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${subProgressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-black/5 p-3.5 rounded-xl border border-black/10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-black/40">Historique Conservé</span>
                        <span className="text-xs font-black text-black">5 conversations max (Suppression auto des plus anciens)</span>
                      </div>
                      <div className="bg-black/5 p-3.5 rounded-xl border border-black/10 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-black/40">Modèles VIP (GPT-5, Claude Pro)</span>
                        <span className="text-xs font-black text-[#FF5500]">Disponibles en passant à Gama Pro ★</span>
                      </div>
                    </div>

                    <div className="bg-[#FF5500]/10 border-2 border-[#FF5500] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Crown className="text-[#FF5500] shrink-0" size={26} />
                        <div>
                          <h4 className="text-sm font-black text-black">Passez à Premium et accédez à tout</h4>
                          <p className="text-xs font-bold text-black/70">Débloquez les messages & tokens illimités pendant tout votre mois.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUpgradePopup(true)}
                        className="bg-[#FF5500] hover:bg-black text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[3px_3px_0px_0px_#000000] shrink-0 cursor-pointer"
                      >
                        👑 Passer à Premium
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: ABONNEMENT & FACTURATION */}
              <div className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col gap-6">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="text-primary" size={24} />
                    <h2 className="text-lg font-black uppercase tracking-tight">Gestion de l&apos;Abonnement (Stripe / Supabase)</h2>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/5 p-5 rounded-2xl border-2 border-black/10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md ${isPro ? "bg-gradient-to-br from-amber-500 to-yellow-600" : "bg-black"}`}>
                      {isPro ? "★" : "H"}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-black">
                        {isPro ? "Abonnement Gama Pro ★ (1 Mois)" : "Édition Classique : Hobby Studio"}
                      </h3>
                      <p className="text-xs font-bold text-black/60">
                        {isPro ? "19€ / mois • Durée d'abonnement : 1 mois • Renouvelable" : "0€ / mois • Tokens bridés à 700 / message"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {isPro ? (
                      <span className="bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl border-2 border-black text-xs shadow-[2px_2px_0px_0px_#000000]">
                        ★ Abonnement Actif
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowUpgradePopup(true)}
                        className="bg-black hover:bg-[#FF5500] text-white font-black px-5 py-2.5 rounded-xl border-2 border-black text-xs transition-all shadow-[3px_3px_0px_0px_#FF5500] w-full sm:w-auto text-center cursor-pointer"
                      >
                        👑 Passer à Premium — 19€/mois
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: SAUVEGARDE CLOUD & HISTORIQUE */}
              <div className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col gap-6">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Cloud className="text-blue-600" size={24} />
                    <h2 className="text-lg font-black uppercase tracking-tight">Sauvegarde Cloud Supabase</h2>
                  </div>
                  <span className="text-xs font-black bg-blue-100 text-blue-800 border border-blue-400 px-3 py-1 rounded-full">
                    Synchronisé
                  </span>
                </div>

                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <History className="text-blue-600" size={20} />
                    <div>
                      <h4 className="text-xs font-black text-black">Historique des conversations cloud</h4>
                      <p className="text-[11px] font-bold text-black/60">
                        {isPro 
                          ? "Vos discussions sont synchronisées en temps réel et sans limite dans le cloud." 
                          : "En plan Hobby gratuit, vos 5 discussions les plus récentes sont conservées automatiquement."}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-blue-900 bg-white px-3 py-1 rounded-lg border border-blue-300 shadow-sm shrink-0 ml-2">
                    {sessions.length} {isPro ? "session(s)" : "/ 5 max"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer légal Gama Studio */}
          <footer className="pt-8 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-black/60">
            <span>© {new Date().getFullYear()} Gama Studio Pro • Propulsé par Jules Peyrus</span>
            <div className="flex items-center gap-6">
              <Link href="/legal" className="text-black font-black hover:text-[#FF5500] hover:underline transition-colors flex items-center gap-1.5">
                <Scale size={14} className="text-[#FF5500]" />
                <span>Mentions Légales & CGU</span>
              </Link>
              <a href="mailto:gamastudio@outlook.fr" className="hover:text-black hover:underline">
                Contact : gamastudio@outlook.fr
              </a>
            </div>
          </footer>

        </div>
      </div>

      {/* Pop-up Passez à Premium */}
      {mounted && showUpgradePopup && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 border-4 border-black shadow-[10px_10px_0px_0px_#FF5500] space-y-6">
            <button
              onClick={() => setShowUpgradePopup(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/5 hover:bg-black hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5500] to-amber-500 text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#000000]">
                <Crown size={26} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#FF5500]">Offre Exclusive Pro ★</span>
                <h3 className="text-2xl font-black text-black">Passez à Gama Pro</h3>
              </div>
            </div>

            <p className="text-sm font-bold text-black/70 leading-relaxed">
              Débloquez l&apos;intégralité des fonctionnalités en illimité, le routage prioritaire vers GPT-5 & Claude 3.5 Sonnet et supprimez toutes les limites quotidiennes de tokens.
            </p>

            <div className="space-y-3 bg-black/[0.03] p-5 rounded-2xl border-2 border-black/10">
              <div className="flex items-center gap-3 text-xs font-black text-black">
                <Check className="text-emerald-600 shrink-0" size={18} />
                <span>Messages & Tokens quotidiens illimités (plus aucun bridage à 700 tokens)</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-black">
                <Check className="text-emerald-600 shrink-0" size={18} />
                <span>Accès prioritaire aux modèles d&apos;élite GPT-5 & Claude 3.5 Pro</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-black">
                <Check className="text-emerald-600 shrink-0" size={18} />
                <span>Synchronisation cloud de l&apos;intégralité de votre historique sans limite</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-black">
                <Check className="text-emerald-600 shrink-0" size={18} />
                <span>Générateur de Fiches de Révisions & Flashcards débridé</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUpgradePopup(false);
                  handleUpgradePro();
                }}
                disabled={isUpgrading}
                className="w-full bg-[#FF5500] hover:bg-black text-white font-black py-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown size={18} />
                <span>{isUpgrading ? "Ouverture de Stripe..." : "Souscrire maintenant — 19€ / mois"}</span>
              </button>
              <button
                onClick={() => setShowUpgradePopup(false)}
                className="text-xs font-bold text-black/50 hover:text-black text-center py-1 cursor-pointer"
              >
                Continuer avec le plan gratuit bridé
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
