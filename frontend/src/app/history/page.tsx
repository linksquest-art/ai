"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, Search, Trash2, MessageSquare, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
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

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const saved = localStorage.getItem("gama_chat_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem("gama_chat_sessions", JSON.stringify(updated));
    if (localStorage.getItem("gama_active_session") === id) {
      localStorage.removeItem("gama_active_session");
    }
  };

  const handleOpenChat = (id: string) => {
    localStorage.setItem("gama_active_session", id);
    router.push("/");
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.messages?.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="flex-1 bg-[#FFFBF5] min-h-screen p-4 md:p-8 flex flex-col max-w-5xl mx-auto gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-black pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#FF5500]">
            <History size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">
              Historique des Discussions
            </h1>
            <p className="text-xs md:text-sm font-bold text-black/60">
              Retrouvez, filtrez ou reprenez toutes vos conversations enregistrées sur Gama Studio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem("gama_active_session");
              router.push("/");
            }}
            className="bg-[#FF5500] text-white hover:bg-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-all cursor-pointer"
          >
            <span>+ Nouvelle Discussion</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans le titre ou les messages de votre historique..."
          className="w-full pl-11 pr-4 py-3 bg-white border-[3px] border-black rounded-2xl font-bold text-sm outline-none focus:shadow-[4px_4px_0px_0px_#FF5500] transition-all"
        />
      </div>

      {/* List Sessions */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white border-[3px] border-black rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 my-6 shadow-[6px_6px_0px_0px_#000000]">
          <div className="w-16 h-16 rounded-2xl bg-black/5 border-2 border-black/20 flex items-center justify-center text-black/40">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-xl font-black text-black uppercase">
            {searchQuery ? "Aucun résultat trouvé" : "Votre historique est vide"}
          </h3>
          <p className="text-xs font-bold text-black/60 max-w-md">
            {searchQuery
              ? "Essayez d'autres mots-clés dans votre recherche."
              : "Lancez une nouvelle conversation avec Gama Studio pour qu'elle s'enregistre automatiquement ici."}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("gama_active_session");
              router.push("/");
            }}
            className="mt-2 bg-black text-white hover:bg-[#FF5500] font-extrabold px-6 py-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Démarrer un chat maintenant</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session) => {
            const dateStr = new Date(session.createdAt || Date.now()).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            const lastMsg = session.messages && session.messages.length > 0
              ? session.messages[session.messages.length - 1].content
              : "Aucun message en mémoire";

            return (
              <div
                key={session.id}
                onClick={() => handleOpenChat(session.id)}
                className="bg-white border-[3px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#FF5500] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-black truncate notranslate" translate="no">
                      {session.title || "Discussion sans titre"}
                    </span>
                    <span className="text-[10px] bg-black/5 border border-black/10 font-bold px-2 py-0.5 rounded-full text-black/60 flex items-center gap-1 shrink-0">
                      <Calendar size={11} />
                      {dateStr}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-black/60 truncate line-clamp-1">
                    {lastMsg}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-xs font-black text-black/50 px-2.5 py-1 bg-[#FAFAFA] rounded-xl border border-black/10">
                    {session.messages?.length || 0} messages
                  </span>

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    title="Supprimer définitivement"
                    className="p-2 rounded-xl border-2 border-black/15 hover:border-black hover:bg-red-500 hover:text-white text-black/40 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="px-4 py-2 bg-black group-hover:bg-[#FF5500] text-white font-extrabold text-xs rounded-xl border-2 border-black flex items-center gap-1.5 transition-colors">
                    <span>Reprendre</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}
