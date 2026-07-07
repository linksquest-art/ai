"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Folder, Plus, Sparkles, ArrowRight, Lock, Clock, Trash2, Wand2, Download, Check, Award, BookOpen, X, Cpu } from "lucide-react";
import Link from "next/link";
import { DEFAULT_SKILLS, SkillItem } from "@/components/MainContent";
import { FlashcardModal } from "@/components/FlashcardModal";

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
  systemPrompt?: string;
  chatsCount: number;
  isPrivate: boolean;
  color: string;
  createdAt: number;
}

export default function SpacesPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeTab, setActiveTab] = useState<"spaces" | "skills">("spaces");
  
  // Create Space states
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSystemPrompt, setNewSystemPrompt] = useState("");
  
  // Skills states
  const [skillsList, setSkillsList] = useState<SkillItem[]>(DEFAULT_SKILLS);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillPrompt, setNewSkillPrompt] = useState("");
  const [newSkillBadge, setNewSkillBadge] = useState("Custom");
  const [newSkillIcon, setNewSkillIcon] = useState("⚡");
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [activeFlashcardTopic, setActiveFlashcardTopic] = useState<string | null>(null);

  useEffect(() => {
    // Load chat sessions
    const savedSessions = localStorage.getItem("gama_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {}
    }

    // Load user spaces
    const savedSpaces = localStorage.getItem("gama_spaces");
    if (savedSpaces) {
      try {
        setSpaces(JSON.parse(savedSpaces));
      } catch (e) {}
    } else {
      // Default sample space
      const sampleSpace: Space = {
        id: "sample_saas",
        title: "Projets & Architecture SaaS",
        description: "Espace dédié au design technique, au choix des stacks et aux bonnes pratiques de code moderne.",
        systemPrompt: "Tu es un architecte logiciel senior spécialisé dans les architectures cloud évolutives (Next.js, Supabase, TailwindCSS). Tu analyses en profondeur chaque question et fournis du code propre, commenté et optimisé pour la production.",
        chatsCount: 1,
        isPrivate: true,
        color: "bg-orange-500",
        createdAt: Date.now()
      };
      setSpaces([sampleSpace]);
      localStorage.setItem("gama_spaces", JSON.stringify([sampleSpace]));
    }

    // Load custom skills
    const savedSkills = localStorage.getItem("gama_custom_skills");
    if (savedSkills) {
      try {
        const parsed = JSON.parse(savedSkills);
        setSkillsList([...DEFAULT_SKILLS, ...parsed]);
      } catch (e) {}
    }

    // Mark all defaults and saved custom skills as installed
    setInstalledIds(DEFAULT_SKILLS.map(s => s.id));
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
      systemPrompt: newSystemPrompt.trim() || "Tu es un assistant IA spécialisé et proactif, s'adaptant parfaitement aux exigences de cet espace de travail.",
      chatsCount: 0,
      isPrivate: true,
      color: randomColor,
      createdAt: Date.now(),
    };
    
    const updated = [newSpace, ...spaces];
    saveSpaces(updated);
    setNewTitle("");
    setNewDesc("");
    setNewSystemPrompt("");
    setIsCreatingSpace(false);
  };

  const handleDeleteSpace = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer cet espace ?")) {
      saveSpaces(spaces.filter(s => s.id !== id));
    }
  };

  const handleCreateSkill = () => {
    if (!newSkillName.trim()) return;
    const customSkill: SkillItem = {
      id: "custom_" + Math.random().toString(36).substring(2, 9),
      name: newSkillName.trim(),
      icon: newSkillIcon || "⚡",
      badge: newSkillBadge.trim() || "Custom",
      desc: newSkillDesc.trim() || "Skill personnalisé créé par l'utilisateur",
      prompt: newSkillPrompt.trim() || "",
      isCustom: true
    };

    const updatedSkills = [...skillsList, customSkill];
    setSkillsList(updatedSkills);

    const onlyCustom = updatedSkills.filter(s => s.isCustom);
    localStorage.setItem("gama_custom_skills", JSON.stringify(onlyCustom));
    setInstalledIds(prev => [...prev, customSkill.id]);

    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillPrompt("");
    setIsCreatingSkill(false);
  };

  const handleDeleteSkill = (id: string) => {
    if (confirm("Supprimer ce skill personnalisé ?")) {
      const updated = skillsList.filter(s => s.id !== id);
      setSkillsList(updated);
      const onlyCustom = updated.filter(s => s.isCustom);
      localStorage.setItem("gama_custom_skills", JSON.stringify(onlyCustom));
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#FFFFFF] text-black">
      <FlashcardModal
        isOpen={!!activeFlashcardTopic}
        onClose={() => setActiveFlashcardTopic(null)}
        topic={activeFlashcardTopic || "Espace de Travail"}
      />
      <Sidebar sessions={sessions} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Banner */}
        <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-8 py-5 border-b-2 border-black/10 bg-[#FFFFFF] sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-black uppercase tracking-tight">Studio d'Espaces & Skills IA</h1>
              <p className="text-xs font-bold text-black/50">Gérez vos environnements de projet et enrichissez les compétences de votre IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setActiveFlashcardTopic("Révision Générale")}
              className="bg-[#FFFBF5] hover:bg-[#FF5500] text-black hover:text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer transition-all"
            >
              <span>🃏</span>
              <span className="hidden md:inline">Studio Flashcards 3D</span>
            </button>
            {activeTab === "spaces" ? (
              <button 
                onClick={() => setIsCreatingSpace(true)}
                className="bg-primary text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer hover:bg-black transition-all"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Créer un Espace</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsCreatingSkill(true)}
                className="bg-primary text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000000] cursor-pointer hover:bg-black transition-all"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Nouveau Skill</span>
              </button>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="px-6 md:px-8 pt-6">
          <div className="flex items-center gap-4 border-b-2 border-black/10 pb-2">
            <button
              onClick={() => setActiveTab("spaces")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                activeTab === "spaces"
                  ? "bg-black text-white shadow-[3px_3px_0px_0px_#FF5500]"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              <Folder size={18} className={activeTab === "spaces" ? "text-primary" : ""} />
              <span>📁 Espaces de Travail ({spaces.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                activeTab === "skills"
                  ? "bg-black text-white shadow-[3px_3px_0px_0px_#FF5500]"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              <Wand2 size={18} className={activeTab === "skills" ? "text-primary" : ""} />
              <span>🎯 Catalogue des Skills ({skillsList.length})</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl w-full mx-auto px-6 md:px-8 py-8 flex flex-col gap-8">
          
          {/* ================= TAB 1: SPACES ================= */}
          {activeTab === "spaces" && (
            <>
              {/* Creation Modal/Card if active */}
              {isCreatingSpace && (
                <div className="bg-[#FFFFFF] border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 mb-4 relative">
                  <button
                    onClick={() => setIsCreatingSpace(false)}
                    className="absolute top-5 right-5 p-2 rounded-xl border-2 border-black/10 hover:border-black hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>

                  <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 border-2 border-primary flex items-center justify-center text-primary shadow-[3px_3px_0px_0px_#000000]">
                      <Folder size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-black uppercase tracking-tight">Nouvel Espace de Travail</h3>
                      <p className="text-xs font-bold text-black/60">Définissez le contexte et le prompt système pour vos futures discussions</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-black uppercase text-black/70 mb-1 block">Nom de l'espace *</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="ex: Architecture SaaS, Rédaction SEO, Finance..."
                        className="w-full px-4 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-black/70 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Résumé rapide de l'objectif de cet espace..."
                        className="w-full px-4 py-2.5 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-black/70 mb-1 block">Prompt de Base (Contexte Système de l'Espace) *</label>
                      <textarea
                        value={newSystemPrompt}
                        onChange={(e) => setNewSystemPrompt(e.target.value)}
                        placeholder="Tu es un assistant IA d'élite affecté à cet espace. Tes règles strictes sont..."
                        rows={4}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-medium outline-none focus:bg-white focus:border-primary text-xs leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black/10">
                    <button 
                      onClick={() => setIsCreatingSpace(false)}
                      className="px-5 py-2.5 font-bold text-xs hover:bg-black/5 rounded-xl border border-black/20 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleCreateSpace}
                      disabled={!newTitle.trim()}
                      className="bg-black text-white hover:bg-primary font-extrabold px-6 py-2.5 rounded-xl text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles size={15} />
                      <span>Créer l'Espace</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Spaces Grid */}
              {spaces.length === 0 ? (
                <div className="bg-[#FAFAFA] border-[3px] border-dashed border-black/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-6">
                  <div className="w-16 h-16 rounded-2xl bg-black/5 border-2 border-black/20 flex items-center justify-center text-black/40 mb-2">
                    <Folder size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-black uppercase">Aucun espace pour le moment</h3>
                  <p className="text-sm font-bold text-black/60 max-w-md leading-relaxed">
                    Les espaces vous permettent de regrouper vos conversations et d'injecter des instructions système de base pour chaque thématique.
                  </p>
                  <button
                    onClick={() => setIsCreatingSpace(true)}
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
                      className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between gap-6 hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#FF5500] transition-all group relative"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${space.color} border border-black shadow-sm`} />
                            <span className="text-xs font-black uppercase tracking-wider text-black/70">
                              Espace Spécialisé
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-extrabold bg-black/5 text-black px-2.5 py-1 rounded-lg border border-black/10">
                              <Lock size={11} />
                              <span>Privé</span>
                            </span>
                            <button 
                              onClick={(e) => handleDeleteSpace(space.id, e)}
                              className="text-black/30 hover:text-red-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                              title="Supprimer l'espace"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <h2 className="text-2xl font-black text-black group-hover:text-primary transition-colors mb-1.5">
                            {space.title}
                          </h2>
                          <p className="text-sm font-bold text-black/70 leading-relaxed mb-3">
                            {space.description}
                          </p>
                          {space.systemPrompt && (
                            <div className="bg-[#FAFAFA] border-2 border-black/10 rounded-xl p-3 text-xs font-medium text-black/80 line-clamp-2 italic">
                              <span className="font-bold not-italic text-primary mr-1">🎯 Prompt de base :</span>
                              "{space.systemPrompt}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between border-t-2 border-black/10 pt-4 mt-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-black/5 px-2.5 py-1.5 rounded-lg border border-black/5 text-xs font-bold text-black/60" title="Nombre de discussions">
                            <Clock size={13} className="text-primary" />
                            <span>{space.chatsCount}</span>
                          </span>
                          <button
                            onClick={() => setActiveFlashcardTopic(space.title)}
                            className="bg-[#FFFBF5] hover:bg-[#FF5500] text-black hover:text-white font-black py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-xs border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000000] cursor-pointer shrink-0"
                            title="Lancer un Deck Flashcards 3D interactif pour cet espace"
                          >
                            <span>🃏 Flashcards 3D</span>
                          </button>
                        </div>

                        <Link
                          href={`/?spaceTitle=${encodeURIComponent(space.title)}&spacePrompt=${encodeURIComponent(space.systemPrompt || space.description)}`}
                          className="bg-black text-white hover:bg-primary font-extrabold py-2 px-4 rounded-xl flex items-center gap-1.5 text-xs border-2 border-black transition-all shadow-[3px_3px_0px_0px_#000000] hover:translate-x-1"
                        >
                          <span>Lancer</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ================= TAB 2: SKILLS CATALOGUE ================= */}
          {activeTab === "skills" && (
            <>
              {/* Skill Creation Card */}
              {isCreatingSkill && (
                <div className="bg-[#FFFFFF] border-[3px] border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 mb-4 relative">
                  <button
                    onClick={() => setIsCreatingSkill(false)}
                    className="absolute top-5 right-5 p-2 rounded-xl border-2 border-black/10 hover:border-black hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>

                  <div className="flex items-center gap-3 border-b-2 border-black/10 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 border-2 border-primary flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000000]">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-black uppercase tracking-tight">Ajouter un Skill au Catalogue</h3>
                      <p className="text-xs font-bold text-black/60">Créez un module de compétence réutilisable dans la barre de discussion</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <div className="w-1/4">
                        <label className="text-xs font-black uppercase text-black/70 mb-1 block">Icône</label>
                        <input
                          type="text"
                          value={newSkillIcon}
                          onChange={(e) => setNewSkillIcon(e.target.value)}
                          placeholder="⚡"
                          className="w-full px-3 py-2 bg-[#FAFAFA] border-2 border-black rounded-xl text-center text-lg font-bold outline-none focus:bg-white focus:border-primary"
                          maxLength={4}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-black uppercase text-black/70 mb-1 block">Nom du Skill *</label>
                        <input
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          placeholder="ex: Conseiller Juridique, Expert Docker..."
                          className="w-full px-4 py-2 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="text-xs font-black uppercase text-black/70 mb-1 block">Badge</label>
                        <input
                          type="text"
                          value={newSkillBadge}
                          onChange={(e) => setNewSkillBadge(e.target.value)}
                          placeholder="Tech / Marketing"
                          className="w-full px-3 py-2 bg-[#FAFAFA] border-2 border-black rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-black/70 mb-1 block">Description</label>
                      <input
                        type="text"
                        value={newSkillDesc}
                        onChange={(e) => setNewSkillDesc(e.target.value)}
                        placeholder="En quoi ce skill est-il unique ?"
                        className="w-full px-4 py-2 bg-[#FAFAFA] border-2 border-black rounded-xl font-bold outline-none focus:bg-white focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-black/70 mb-1 block">Prompt Système (Instructions pour l'IA) *</label>
                      <textarea
                        value={newSkillPrompt}
                        onChange={(e) => setNewSkillPrompt(e.target.value)}
                        placeholder="Tu es un expert mondial en... Tes réponses doivent suivre la structure..."
                        rows={5}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border-2 border-black rounded-xl font-medium outline-none focus:bg-white focus:border-primary text-xs leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black/10">
                    <button 
                      onClick={() => setIsCreatingSkill(false)}
                      className="px-5 py-2.5 font-bold text-xs hover:bg-black/5 rounded-xl border border-black/20 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleCreateSkill}
                      disabled={!newSkillName.trim()}
                      className="bg-black text-white hover:bg-primary font-extrabold px-6 py-2.5 rounded-xl text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Wand2 size={15} />
                      <span>Ajouter et Activer</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skillsList.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between gap-5 hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_#FF5500] transition-all relative group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-black/5 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#000000]">
                          {skill.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-black text-white">
                            {skill.badge || "Skill"}
                          </span>
                          {skill.isCustom && (
                            <button
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="text-black/30 hover:text-red-600 p-1 rounded transition-colors"
                              title="Supprimer ce skill"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-black group-hover:text-primary transition-colors mt-1">
                          {skill.name}
                        </h3>
                        <p className="text-xs font-bold text-black/60 leading-relaxed mt-1">
                          {skill.desc}
                        </p>
                      </div>

                      {skill.prompt ? (
                        <div className="bg-[#FAFAFA] border-2 border-black/10 rounded-xl p-3 text-[11px] font-medium text-black/80 line-clamp-3 italic">
                          "{skill.prompt}"
                        </div>
                      ) : (
                        <div className="bg-[#FAFAFA] border-2 border-dashed border-black/10 rounded-xl p-3 text-[11px] font-bold text-black/40 text-center">
                          Mode de discussion libre sans contrainte
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between">
                      <span className="text-[11px] font-black text-green-700 flex items-center gap-1 bg-green-500/15 px-3 py-1 rounded-lg border border-green-600/30">
                        <Check size={13} strokeWidth={3} />
                        <span>Actif dans la barre</span>
                      </span>

                      <Link
                        href="/"
                        className="text-xs font-black text-black hover:text-primary flex items-center gap-1 underline"
                      >
                        <span>Essayer en chat</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
