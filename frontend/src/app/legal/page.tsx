"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, Mail, Lock, Scale, CheckCircle2 } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] text-black font-sans pb-24">
      {/* Top Header */}
      <header className="border-b-[3px] border-black bg-white px-6 py-5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#FF5500]">
              <Scale size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Mentions Légales & Conditions Générales</h1>
              <p className="text-xs font-bold text-black/60">Conformité légale & transparence pour les services d'IA</p>
            </div>
          </div>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white hover:bg-black hover:text-white border-2 border-black font-black text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <ArrowLeft size={16} />
            <span>Retour au Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-10 space-y-8">
        
        {/* Banner */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 text-[#FF5500] border-2 border-black font-black text-xs uppercase tracking-wider">
            <Shield size={14} />
            <span>Informations Légales Officielles</span>
          </div>
          <h2 className="text-3xl font-black text-black tracking-tight">
            Gama Studio Pro — Plateforme d&apos;Analyse et de Synthèse IA
          </h2>
          <p className="text-sm font-bold text-black/70 leading-relaxed">
            Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie Numérique (LCEN), il est porté à la connaissance des utilisateurs du site Gama Studio Pro les présentes mentions légales et conditions d&apos;utilisation.
          </p>
        </div>

        {/* Section 1: Éditeur & Responsable de publication */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-black/10 pb-3">
            <FileText className="text-[#FF5500]" size={22} />
            <h3 className="text-lg font-black uppercase tracking-wider">1. Éditeur du Site & Responsable</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-black/80">
            <div className="bg-black/5 p-4 rounded-2xl border border-black/10 space-y-1">
              <span className="text-xs font-black uppercase text-black/50">Propriétaire & Fondateur</span>
              <p className="text-base font-black text-black">Jules Peyrus</p>
            </div>
            <div className="bg-black/5 p-4 rounded-2xl border border-black/10 space-y-1">
              <span className="text-xs font-black uppercase text-black/50">Contact Officiel</span>
              <p className="text-base font-black text-black flex items-center gap-2">
                <Mail size={16} className="text-[#FF5500]" />
                <a href="mailto:gamastudio@outlook.fr" className="hover:underline">
                  gamastudio@outlook.fr
                </a>
              </p>
            </div>
          </div>
          <p className="text-xs font-bold text-black/60">
            Le site est hébergé sur une infrastructure cloud moderne et accessible publiquement à l&apos;adresse officielle : <span className="font-black text-black">https://ai.gamastudio.fr</span>.
          </p>
        </div>

        {/* Section 2: Hébergement */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-black/10 pb-3">
            <Lock className="text-[#FF5500]" size={22} />
            <h3 className="text-lg font-black uppercase tracking-wider">2. Hébergement & Infrastructure</h3>
          </div>
          <p className="text-sm font-bold text-black/80 leading-relaxed">
            L&apos;hébergement du site et de l&apos;application front-end est assuré par la société <span className="font-black">Vercel Inc.</span> (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis). Les bases de données et les services d&apos;authentification sont opérés et sécurisés par <span className="font-black">Supabase Inc.</span> conformément aux normes RGPD en vigueur.
          </p>
        </div>

        {/* Section 3: Propriété Intellectuelle & Contenus IA */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-black/10 pb-3">
            <Scale className="text-[#FF5500]" size={22} />
            <h3 className="text-lg font-black uppercase tracking-wider">3. Propriété Intellectuelle & Conditions d&apos;Utilisation</h3>
          </div>
          <p className="text-sm font-bold text-black/80 leading-relaxed">
            L&apos;ensemble de l&apos;architecture, des designs visuels, de l&apos;interface utilisateur (UI/UX Pro Max), des mascottes et des codes sources constituant <span className="font-black">Gama Studio Pro</span> sont la propriété exclusive de <span className="font-black">Jules Peyrus</span>. Toute reproduction, représentation ou distribution non autorisée est expressément interdite.
          </p>
          <ul className="space-y-2.5 pt-2">
            <li className="flex items-start gap-2.5 text-xs font-bold text-black/80">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Contenus générés par l&apos;utilisateur :</strong> Les synthèses YouTube, fiches de cours et flashcards créés par l&apos;IA appartiennent à l&apos;utilisateur abonné à des fins personnelles, académiques ou professionnelles.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs font-bold text-black/80">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Quotas & Bridage :</strong> Le plan Hobby (gratuit) est limité à 50 messages/jour et 700 tokens maximum par requête afin de préserver les ressources du serveur. Le plan Gama Pro débride ces limites pour un usage intensif.</span>
            </li>
          </ul>
        </div>

        {/* Section 4: RGPD & Données Personnelles */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-black/10 pb-3">
            <Shield className="text-[#FF5500]" size={22} />
            <h3 className="text-lg font-black uppercase tracking-wider">4. Protection des Données (RGPD)</h3>
          </div>
          <p className="text-sm font-bold text-black/80 leading-relaxed">
            Les données personnelles collectées lors de l&apos;inscription (adresse e-mail, identifiants d&apos;authentification) sont strictement utilisées pour la gestion de votre compte, de vos sessions et de votre abonnement. Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression totale de vos données en écrivant directement à <a href="mailto:gamastudio@outlook.fr" className="font-black text-[#FF5500] hover:underline">gamastudio@outlook.fr</a>.
          </p>
        </div>

      </main>
    </div>
  );
}
