"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Link2, Check, Plus, Shield, Zap, Database, Globe, Lock, ArrowRight, RefreshCw } from "lucide-react";
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

export default function ConnectorsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [connectors, setConnectors] = useState([
    {
      id: "supa",
      name: "Supabase Database",
      description: "Synchronisez vos sessions, historiques et vecteurs directement dans votre base de données PostgreSQL.",
      category: "Base de données",
      icon: "⚡",
      connected: true,
      color: "bg-emerald-500",
    },
    {
      id: "gh",
      name: "GitHub Repositories",
      description: "Permet à l'IA d'analyser vos architectures de code, de revoir vos Pull Requests et d'inspecter vos fichiers en direct.",
      category: "Développement",
      icon: "🐙",
      connected: false,
      color: "bg-black",
    },
    {
      id: "notion",
      name: "Notion Workspace",
      description: "Indexez vos pages, wikis et bases de données Notion pour donner un contexte ultra-précis à vos chats.",
      category: "Productivité",
      icon: "📓",
      connected: false,
      color: "bg-amber-500",
    },
    {
      id: "gdrive",
      name: "Google Drive & Docs",
      description: "Importez vos documents PDF, Google Sheets et présentations pour une analyse multi-modale en profondeur.",
      category: "Fichiers",
      icon: "📁",
      connected: false,
      color: "bg-blue-500",
    },
    {
      id: "stripe",
      name: "Stripe Billing & Live API",
      description: "Gérez vos abonnements Pro, factures et tunnels de conversion marketing en temps réel.",
      category: "Finance",
      icon: "💳",
      connected: true,
      color: "bg-purple-500",
    },
    {
      id: "slack",
      name: "Slack Team Channels",
      description: "Déployez un bot Gama Studio dans vos canaux d'équipe pour l'assistance au support technique.",
      category: "Communication",
      icon: "💬",
      connected: false,
      color: "bg-rose-500",
    },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("gama_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const toggleConnect = (id: string) => {
    setConnectors(connectors.map(c => {
      if (c.id === id) {
        return { ...c, connected: !c.connected };
      }
      return c;
    }));
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Banner */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-black">Connecteurs & Intégrations</h1>
              <p className="text-xs font-bold text-black/50">Reliez vos outils externes pour décupler le contexte et l'autonomie de l'IA</p>
            </div>
          </div>
          
          <Link href="/" className="ink-btn bg-black text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#FF5500]">
            <span>Retour au Chat</span>
            <ArrowRight size={14} />
          </Link>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex flex-col gap-8">


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((item) => (
              <div 
                key={item.id}
                className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between gap-6 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_#FF5500] transition-all"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-black/5 text-black/70 border border-black/10">
                      {item.category}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black text-black mb-2 flex items-center gap-2">
                      <span>{item.name}</span>
                    </h3>
                    <p className="text-xs font-bold text-black/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="border-t-2 border-black/10 pt-4 mt-2 flex items-center justify-between">
                  {item.connected ? (
                    <span className="flex items-center gap-1.5 text-xs font-black text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span>Connecté & Actif</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-black/40">
                      Non connecté
                    </span>
                  )}

                  <button
                    onClick={() => toggleConnect(item.id)}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs border-2 transition-all cursor-pointer ${
                      item.connected
                        ? "bg-white text-black border-black/30 hover:border-black hover:bg-red-50 hover:text-red-600"
                        : "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500] hover:bg-primary"
                    }`}
                  >
                    {item.connected ? "Déconnecter" : "Connecter"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
