"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Folder, Plus, Sparkles, ArrowRight, Lock, Users, Clock, Trash2, Shield } from "lucide-react";
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

interface Space {
  id: string;
  title: string;
  description: string;
  chatsCount: number;
  isPrivate: boolean;
  color: string;
  createdAt: number;
}

export default function SpacesPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("bg-orange-500");

  useEffect(() => {
    // Load chat sessions
    const savedSessions = localStorage.getItem("gama_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {}
    }

    // Load user spaces - starts EMPTY by default without fake info
    const savedSpaces = localStorage.getItem("gama_spaces");
    if (savedSpaces) {
      try {
        setSpaces(JSON.parse(savedSpaces));
      } catch (e) {}
    }
  }, []);

  const saveSpaces = (updated: Space[]) => {
    setSpaces(updated);
    localStorage.setItem("gama_spaces", JSON.stringify(updated));
  };

  const handleCreateSpace = () => {
    if (!newTitle.trim()) return;
    const colors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newSpace: Space = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      description: newDesc.trim() || "Espace de travail personnalisé.",
      chatsCount: 0,
      isPrivate: true,
      color: randomColor,
      createdAt: Date.now(),
    };
    
    const updated = [newSpace, ...spaces];
    saveSpaces(updated);
    setNewTitle("");
    setNewDesc("");
    setIsCreating(false);
  };

  const handleDeleteSpace = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer cet espace ?")) {
      saveSpaces(spaces.filter(s => s.id !== id));
    }
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
              <h1 className="text-2xl font-black text-black">Vos Espaces de Travail</h1>
              <p className="text-xs font-bold text-black/50">Créez et organisez vos environnements par projets ou thématiques</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="ink-btn bg-primary text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer hover:bg-black"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Créer un Espace</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-8 py-10 flex flex-col gap-8">
          
          {/* Creation Modal/Card if active */}
          {isCreating && (
            <div className="bg-[#FFFFFF] border-[3px] border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 mb-4">
              <h3 className="text-lg font-black text-black flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <span>Nouvel Espace de Travail</span>
              </h3>
              
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nom de l'espace (ex: Architecture SaaS, Rédaction...)"
                  className="w-full px-3 py-2 border-2 border-black rounded-xl font-bold outline-none focus:border-primary text-sm"
                  autoFocus
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description du projet et instructions de contexte..."
                  className="w-full px-3 py-2 border-2 border-black rounded-xl font-bold outline-none focus:border-primary text-sm resize-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 font-bold text-xs hover:bg-black/5 rounded-xl border border-black/20"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreateSpace}
                  disabled={!newTitle.trim()}
                  className="bg-black text-white hover:bg-primary font-extrabold px-5 py-2 rounded-xl text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Créer maintenant
                </button>
              </div>
            </div>
          )}

          {/* Spaces List - Empty state when user hasn't created any space */}
          {spaces.length === 0 ? (
            <div className="bg-[#FAFAFA] border-[3px] border-dashed border-black/20 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-black/5 border-2 border-black/20 flex items-center justify-center text-black/40 mb-2">
                <Folder size={32} />
              </div>
              <h3 className="text-2xl font-black text-black">Aucun espace pour le moment</h3>
              <p className="text-sm font-bold text-black/60 max-w-md leading-relaxed">
                Les espaces vous permettent de regrouper vos conversations et d'attacher des instructions spécifiques. Créez votre premier espace personnalisé !
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="mt-2 bg-black text-white hover:bg-primary font-extrabold py-3 px-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex items-center gap-2 text-sm transition-all cursor-pointer"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Créer votre premier espace</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spaces.map((space) => (
                <div 
                  key={space.id}
                  className="bg-white border-[3px] border-black rounded-2xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between gap-6 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_#FF5500] transition-all group relative"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${space.color} border border-black`} />
                        <span className="text-xs font-black uppercase tracking-wider text-black/60">
                          Espace Personnel
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-extrabold bg-black/5 text-black px-2 py-0.5 rounded border border-black/10">
                          <Lock size={10} />
                          <span>Privé</span>
                        </span>
                        <button 
                          onClick={(e) => handleDeleteSpace(space.id, e)}
                          className="text-black/30 hover:text-red-600 p-1 transition-colors"
                          title="Supprimer l'espace"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-black text-black group-hover:text-primary transition-colors mb-1">
                        {space.title}
                      </h2>
                      <p className="text-sm font-bold text-black/70 leading-relaxed">
                        {space.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-black/10 pt-4 mt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-black/60">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{space.chatsCount} discussions</span>
                      </span>
                    </div>

                    <Link
                      href={`/?q=${encodeURIComponent("Dans l'espace : " + space.title + ". ")}`}
                      className="bg-black text-white hover:bg-primary font-extrabold py-2 px-4 rounded-xl flex items-center gap-2 text-xs border-2 border-black transition-colors"
                    >
                      <span>Ouvrir l'espace</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
