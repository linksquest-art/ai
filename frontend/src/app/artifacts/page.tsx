"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FileText, Code2, Image as ImageIcon, Sparkles, Copy, Download, Check, Eye, Terminal } from "lucide-react";

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

export default function ArtifactsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("Tout");

  useEffect(() => {
    const saved = localStorage.getItem("gama_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const artifacts = [
    {
      id: "a1",
      title: "Composant Navbar 1930s (Next.js / TSX)",
      type: "code",
      language: "tsx",
      date: "Il y a 2h",
      content: `export function CartoonNavbar() {\n  return (\n    <nav className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000] rounded-xl">\n      <h1 className="font-black text-2xl">Gama Studio</h1>\n    </nav>\n  );\n}`,
    },
    {
      id: "a2",
      title: "Schéma d'Architecture Passerelle IA",
      type: "plan",
      language: "markdown",
      date: "Hier",
      content: `# Architecture Gama Studio\n\n1. **Frontend Next.js** : Interface réactive avec persistance LocalStorage.\n2. **API Route Fallback** : Routage intelligent OpenRouter avec secours local.\n3. **Supabase Sync** : Base de données de secours en temps réel.`,
    },
    {
      id: "a3",
      title: "Configuration GSAP Rubber Hose Animation",
      type: "code",
      language: "typescript",
      date: "Il y a 3 jours",
      content: `useGSAP(() => {\n  gsap.to(".rubber-bounce", {\n    y: -10,\n    rotation: 5,\n    duration: 1,\n    repeat: -1,\n    yoyo: true,\n    ease: "sine.inOut",\n  });\n});`,
    },
    {
      id: "a4",
      title: "Script SQL de Création des Tables Supabase",
      type: "code",
      language: "sql",
      date: "Il y a 4 jours",
      content: `CREATE TABLE gama_sessions (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  title TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  user_id UUID REFERENCES auth.users(id)\n);`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = activeFilter === "Tout"
    ? artifacts
    : artifacts.filter(a => a.type === activeFilter.toLowerCase() || (activeFilter === "Code" && a.type === "code"));

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Banner */}
        <header className="w-full flex items-center justify-between px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#FF5500]">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black">Bibliothèque d'Artefacts</h1>
              <p className="text-xs font-bold text-black/50">Code, schémas et documents générés par l'IA lors de vos sessions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {["Tout", "Code", "Plan"].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border-2 transition-all ${
                  activeFilter === f
                    ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF5500]"
                    : "bg-white text-black border-black/20 hover:border-black"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex flex-col gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border-[3px] border-black rounded-2xl overflow-hidden shadow-[5px_5px_0px_0px_#000000] flex flex-col hover:shadow-[7px_7px_0px_0px_#FF5500] transition-all"
            >
              {/* Header */}
              <div className="bg-black/5 px-6 py-3 border-b-2 border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                    {item.language === "tsx" || item.language === "typescript" ? <Code2 size={16} /> : <Terminal size={16} />}
                  </span>
                  <div>
                    <h3 className="font-black text-base text-black">{item.title}</h3>
                    <span className="text-[11px] font-bold text-black/50 uppercase">{item.language} • {item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="flex items-center gap-1.5 bg-white hover:bg-black hover:text-white px-3 py-1.5 rounded-lg border border-black font-extrabold text-xs transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="p-6 bg-[#FAFAFA] font-mono text-sm font-bold text-black/90 overflow-x-auto whitespace-pre">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
