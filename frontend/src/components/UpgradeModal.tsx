"use client";

import React, { useState } from "react";
import { X, Crown, Sparkles, Zap, MessageSquare, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  badgeText?: string;
  titleText?: string;
  descText?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  user,
  badgeText = "★ LIMITE DU PLAN HOBBY ATTEINTE ★",
  titleText = "Passez en Mode Illimité avec Gama Pro !",
  descText = "En Plan Hobby Gratuit, vous avez atteint votre quota d'utilisation sur cette fonctionnalité. Débloquez un accès 100% illimité à l'ensemble du Studio IA avec Gama Pro !"
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleStripeCheckout = async () => {
    if (!user) {
      router.push("/pricing");
      onClose();
      return;
    }

    setLoading(true);
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
        throw new Error(result.error || "Erreur lors de l'initialisation du paiement sécurisé");
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      alert("Erreur de paiement : " + (err.message || "Erreur inconnue"));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-[#FFFFFF] border-[3.5px] border-black rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[10px_10px_0px_0px_#FF5500] relative flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-black/60 hover:text-black transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X size={22} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-[4px_4px_0px_0px_#000000] border-2 border-black animate-bounce">
            <Crown size={32} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-400 px-3 py-1 rounded-full mb-2 inline-block">
              {badgeText}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">
              {titleText}
            </h2>
            <p className="text-sm font-bold text-black/75 mt-2 max-w-sm mx-auto leading-relaxed">
              {descText}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 bg-[#FF5500]/15 border border-[#FF5500] px-3 py-1 rounded-xl">
              <span className="text-xs font-black text-black">Offre Spéciale :</span>
              <span className="text-sm font-black text-[#FF5500]">9€/mois</span>
              <span className="text-xs font-bold text-black/50 line-through">13€</span>
              <span className="text-[10px] font-black bg-[#FF5500] text-white px-1.5 py-0.5 rounded">-30%</span>
            </div>
          </div>
        </div>

        {/* Pro Benefits Box */}
        <div className="bg-amber-50/70 border-[2.5px] border-black rounded-2xl p-5 flex flex-col gap-3.5 shadow-inner">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg border border-black shrink-0 mt-0.5 shadow-sm">
              <MessageSquare size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-black uppercase">Discussions & Historique Illimités ∞</h4>
              <p className="text-[11px] font-bold text-black/65">Conservez 100% de vos conversations et archives dans le cloud sans aucune suppression.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#FF5500] text-white rounded-lg border border-black shrink-0 mt-0.5 shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-black uppercase">Accès VIP à GPT-5 & Claude 3.5 Sonnet</h4>
              <p className="text-[11px] font-bold text-black/65">Les modèles d&apos;IA d&apos;élite déverrouillés 24h/24 pour votre studio.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-black text-white rounded-lg border border-black shrink-0 mt-0.5 shadow-sm">
              <Zap size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-black uppercase">Quotas de Tokens Débridés</h4>
              <p className="text-[11px] font-bold text-black/65">Des réponses ultra-détaillées et un traitement prioritaire de vos requêtes.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="w-full bg-[#FF5500] hover:bg-black text-white font-black py-3.5 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Ouverture du paiement sécurisé...</span>
            ) : (
              <>
                <Crown size={18} className="fill-white" />
                <span>👑 Débloquer Gama Pro — 9€/mois (au lieu de 13€)</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-black/5 hover:bg-black/10 text-black/70 font-extrabold py-2.5 px-4 rounded-xl text-xs transition-colors text-center cursor-pointer"
          >
            Fermer la fenêtre
          </button>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-extrabold text-black/40 uppercase tracking-wider">
            🔒 Paiement 100% sécurisé • Sans engagement • Annulable en 1 clic
          </span>
        </div>

      </div>
    </div>
  );
}
