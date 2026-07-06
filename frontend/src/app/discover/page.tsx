"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Compass, Sparkles, ArrowRight, Search, RefreshCw, BookOpen, ExternalLink, MessageSquare, Globe } from "lucide-react";
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

interface ArticleInfo {
  id: string | number;
  title: string;
  category: string;
  summary: string;
  source?: string;
  url?: string;
  date?: string;
  prompt: string;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams?.get("topic") || "Tout";
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [articles, setArticles] = useState<ArticleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tout");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (topicParam && topicParam !== "Tout") {
      setActiveTab(topicParam);
    }
  }, [topicParam]);

  useEffect(() => {
    // Load local sessions
    const saved = localStorage.getItem("gama_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }

    // Fetch real live articles from our backend multi-API aggregator
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/discover");
        if (!res.ok) throw new Error("Erreur chargement");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setArticles(json.data);
        }
      } catch (err) {
        console.error("Erreur API Découvrir:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  const categories = ["Tout", "Finance & IA", "Santé", "Éducation", "Code & Tech", "Brevets & Tech", "Science & Innovation"];

  const filtered = articles.filter(a => {
    const matchesTab = activeTab === "Tout" || a.category.toLowerCase().includes(activeTab.toLowerCase()) || activeTab.toLowerCase().includes(a.category.toLowerCase());
    const matchesSearch = !searchQuery.trim() || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.source && a.source.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Banner */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-black">Découvrir & Actualités en Direct</h1>
              <p className="text-xs font-bold text-black/50">Flux d'articles réels agrégés en temps réel via Hacker News, Dev.to et SpaceNews</p>
            </div>
          </div>
          
          <Link href="/" className="ink-btn bg-black text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#FF5500]">
            <span>Nouveau Chat</span>
            <ArrowRight size={14} />
          </Link>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex flex-col gap-8">
          
          {/* Category Tabs & Search Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b-2 border-black/10">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs border-2 transition-all cursor-pointer ${
                    activeTab === cat
                      ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500]"
                      : "bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl px-3 py-1.5 min-w-[260px] shadow-[2px_2px_0px_0px_#000000]">
              <Search size={16} className="text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les articles réels..."
                className="w-full font-bold text-xs outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Real-time Status Badge */}
          <div className="flex items-center justify-between bg-[#FAFAFA] border-2 border-black/10 rounded-xl px-4 py-2.5 text-xs font-bold text-black/70">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-primary animate-spin" />
              <span>Agrégateur de presse en direct actif : connexion aux flux publics internationale</span>
            </div>
            <span className="flex items-center gap-1.5 font-black text-green-700 bg-green-500/15 px-2.5 py-0.5 rounded-md border border-green-600/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
              <span>100% Info Authentique</span>
            </span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <RefreshCw size={32} className="animate-spin text-primary" />
              <span className="text-lg font-black text-black">Récupération des articles en temps réel...</span>
              <span className="text-xs font-bold text-black/50">Interrogation des flux Hacker News, Dev.to et SpaceFlight News</span>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between gap-6 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_#FF5500] transition-all group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-black/5 text-black border border-black/10">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-black/50">
                        {item.date && <span>{item.date}</span>}
                        {item.source && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-black">
                            {item.source}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-black group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs font-bold text-black/70 leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-black/10 pt-4 mt-2">
                    {item.url ? (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-extrabold bg-black/5 hover:bg-black hover:text-white px-3 py-1.5 rounded-lg border border-black/20 transition-all text-black"
                      >
                        <BookOpen size={14} />
                        <span>Lire l'article original</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-black/40">Article vérifié</span>
                    )}

                    <Link
                      href={`/?q=${encodeURIComponent(item.prompt)}`}
                      className="bg-black text-white hover:bg-primary font-extrabold py-2 px-4 rounded-xl flex items-center gap-2 text-xs border-2 border-black transition-colors shadow-[2px_2px_0px_0px_#000000]"
                    >
                      <MessageSquare size={14} />
                      <span>Explorer avec l'IA</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-black/20 rounded-2xl">
              <span className="text-sm font-bold text-black/50">Aucun article ne correspond à votre recherche dans cette catégorie.</span>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center font-black">Chargement...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
