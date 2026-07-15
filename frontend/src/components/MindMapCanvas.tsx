"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Network, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  FolderMinus, 
  FolderPlus,
  CircleDot
} from "lucide-react";

export interface SubtopicNode {
  id: string;
  text: string;
  definition?: string;
  learned: boolean;
}

export interface BranchNode {
  id: string;
  title: string;
  colorTheme: {
    border: string;
    bg: string;
    text: string;
    badgeBg: string;
    lineColor: string;
    shadow: string;
  };
  badge: string;
  subtopics: SubtopicNode[];
}

export interface MindMapData {
  rootTitle: string;
  subtitle: string;
  branches: BranchNode[];
}

interface MindMapCanvasProps {
  data: MindMapData;
  layoutMode: "horizontal" | "radial" | "bento" | "columns";
  hideDefinitions: boolean;
  onToggleLearned: (branchId: string, subtopicId: string) => void;
  onToggleHideDefinitions: () => void;
  colorPaletteName: string;
}

const PALETTE_THEMES: Record<string, { border: string; bg: string; text: string; badgeBg: string; lineColor: string; shadow: string }[]> = {
  "Néon Universitaire": [
    { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-950", badgeBg: "bg-emerald-600 text-white", lineColor: "#10b981", shadow: "#059669" },
    { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-950", badgeBg: "bg-indigo-600 text-white", lineColor: "#6366f1", shadow: "#4f46e5" },
    { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-950", badgeBg: "bg-amber-600 text-white", lineColor: "#f59e0b", shadow: "#d97706" },
    { border: "border-rose-500", bg: "bg-rose-50", text: "text-rose-950", badgeBg: "bg-rose-600 text-white", lineColor: "#f43f5e", shadow: "#e11d48" },
    { border: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-950", badgeBg: "bg-cyan-600 text-white", lineColor: "#06b6d4", shadow: "#0891b2" },
    { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-950", badgeBg: "bg-purple-600 text-white", lineColor: "#a855f7", shadow: "#9333ea" },
  ],
  "Minimaliste Encre": [
    { border: "border-black", bg: "bg-white", text: "text-black", badgeBg: "bg-black text-white", lineColor: "#000000", shadow: "#000000" },
    { border: "border-slate-700", bg: "bg-slate-50", text: "text-slate-900", badgeBg: "bg-slate-800 text-white", lineColor: "#334155", shadow: "#1e293b" },
    { border: "border-zinc-800", bg: "bg-zinc-50", text: "text-zinc-900", badgeBg: "bg-[#FF5500] text-white", lineColor: "#FF5500", shadow: "#FF5500" },
    { border: "border-neutral-700", bg: "bg-neutral-100", text: "text-neutral-900", badgeBg: "bg-neutral-700 text-white", lineColor: "#404040", shadow: "#262626" },
  ]
};

export function MindMapCanvas({
  data,
  layoutMode,
  hideDefinitions,
  onToggleLearned,
  onToggleHideDefinitions,
  colorPaletteName
}: MindMapCanvasProps) {
  const [scale, setScale] = useState(0.85);
  const [translate, setTranslate] = useState({ x: 80, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply colors dynamically if palette changed
  const themes = PALETTE_THEMES[colorPaletteName] || PALETTE_THEMES["Néon Universitaire"];
  const coloredBranches = useMemo(() => {
    return data.branches.map((b, idx) => ({
      ...b,
      colorTheme: themes[idx % themes.length]
    }));
  }, [data.branches, themes]);

  const toggleCollapse = (branchId: string) => {
    setCollapsedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    coloredBranches.forEach(b => {
      next[b.id] = true;
    });
    setCollapsedBranches(next);
  };

  const expandAll = () => {
    setCollapsedBranches({});
  };

  const resetView = () => {
    setScale(layoutMode === "radial" ? 0.75 : 0.85);
    setTranslate(layoutMode === "radial" ? { x: 250, y: 150 } : { x: 80, y: 40 });
  };

  // Handle Zoom & Pan via Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || true) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.35), 2.2);
      
      // Zoom towards mouse coordinate approximately
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newTranslateX = mouseX - (mouseX - translate.x) * (newScale / scale);
        const newTranslateY = mouseY - (mouseY - translate.y) * (newScale / scale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
      }
      setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".mindmap-node") || (e.target as HTMLElement).closest("button")) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate coordinates for SVG Bezier lines when in Tree or Radial mode
  const layoutMetrics = useMemo(() => {
    if (layoutMode === "bento" || layoutMode === "columns") return null;

    const isRadial = layoutMode === "radial";
    const rootX = isRadial ? 900 : 260;
    const rootY = isRadial ? 550 : 500;
    
    const branchCoords: {
      id: string;
      x: string | number;
      y: string | number;
      isLeft?: boolean;
      subtopics: { id: string; x: number; y: number }[];
    }[] = [];

    const totalBranches = coloredBranches.length;
    let leftCount = 0;
    let rightCount = 0;
    const half = Math.ceil(totalBranches / 2);

    let currentStackYRight = 100;
    let currentStackYLeft = 100;

    coloredBranches.forEach((branch, idx) => {
      const isLeft = isRadial && idx >= half;
      const isCollapsed = collapsedBranches[branch.id];
      const subtopicCount = isCollapsed ? 0 : branch.subtopics.length;
      
      // Calculate height footprint required for this branch + its subtopics
      const branchFootprintHeight = Math.max(120, subtopicCount * (hideDefinitions ? 65 : 95) + 60);

      let branchX = 0;
      let branchY = 0;

      if (!isRadial) {
        // Horizontal right-branching tree
        branchX = rootX + 440;
        branchY = currentStackYRight + branchFootprintHeight / 2;
        currentStackYRight += branchFootprintHeight + 40;
      } else {
        // Balanced Radial tree (left & right)
        if (isLeft) {
          branchX = rootX - 480;
          branchY = currentStackYLeft + branchFootprintHeight / 2;
          currentStackYLeft += branchFootprintHeight + 40;
        } else {
          branchX = rootX + 480;
          branchY = currentStackYRight + branchFootprintHeight / 2;
          currentStackYRight += branchFootprintHeight + 40;
        }
      }

      // Calculate Subtopic Node coordinates
      const subtopicCoords: { id: string; x: number; y: number }[] = [];
      if (!isCollapsed) {
        const startY = branchY - ((subtopicCount - 1) * (hideDefinitions ? 65 : 95)) / 2;
        branch.subtopics.forEach((st, sIdx) => {
          const stX = isLeft ? branchX - 420 : branchX + 420;
          const stY = startY + sIdx * (hideDefinitions ? 65 : 95);
          subtopicCoords.push({ id: st.id, x: stX, y: stY });
        });
      }

      branchCoords.push({
        id: branch.id,
        x: branchX,
        y: branchY,
        isLeft,
        subtopics: subtopicCoords
      });
    });

    const canvasWidth = isRadial ? 1900 : Math.max(1600, rootX + 1100);
    const canvasHeight = Math.max(1100, Math.max(currentStackYRight, currentStackYLeft) + 200);

    return { rootX, rootY, branchCoords, canvasWidth, canvasHeight };
  }, [coloredBranches, layoutMode, collapsedBranches, hideDefinitions]);

  // Render non-canvas layouts (Bento / Columns)
  if (layoutMode === "bento" || layoutMode === "columns") {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Root Node Title Card */}
        <div className="p-6 rounded-2xl bg-black text-white border-[3px] border-black shadow-[6px_6px_0px_0px_#FF5500] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FF5500] text-white px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-2">
              <Sparkles size={12} />
              <span>Nœud Central • {data.branches.length} Branches</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{data.rootTitle}</h2>
            <p className="text-xs font-bold text-white/70 mt-1">{data.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleHideDefinitions}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 border-2 transition-all ${
                hideDefinitions ? "bg-amber-400 text-black border-black" : "bg-white text-black border-black hover:bg-black/90 hover:text-white"
              }`}
            >
              {hideDefinitions ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{hideDefinitions ? "Mode Flashcard" : "Explications visibles"}</span>
            </button>
          </div>
        </div>

        {/* Bento Grid or Columns View */}
        <div className={`grid gap-6 ${
          layoutMode === "columns"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {coloredBranches.map((branch, bIdx) => {
            const isCollapsed = collapsedBranches[branch.id];
            return (
              <div
                key={branch.id || bIdx}
                className={`p-5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col gap-3.5 bg-white transition-all`}
              >
                <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-black text-xs px-2.5 py-1 rounded-lg border border-black shrink-0 ${branch.colorTheme.badgeBg}`}>
                      {branch.badge || `${bIdx + 1}.`}
                    </span>
                    <h3 className="font-black text-base text-black truncate">{branch.title}</h3>
                  </div>
                  <button
                    onClick={() => toggleCollapse(branch.id)}
                    className="p-1.5 rounded-lg border border-black/20 hover:border-black bg-black/5 hover:bg-black hover:text-white transition-colors"
                    title={isCollapsed ? "Déplier" : "Replier"}
                  >
                    {isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
                  </button>
                </div>

                {!isCollapsed ? (
                  <div className="flex flex-col gap-2.5">
                    {branch.subtopics.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => onToggleLearned(branch.id, st.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          st.learned
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[2px_2px_0px_0px_#059669]"
                            : "bg-[#FDFBF7] border-black/20 hover:border-black hover:bg-white shadow-[2px_2px_0px_0px_#000000]"
                        }`}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-black/90">{st.text}</span>
                            {st.learned && <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Maîtrisé ✓</span>}
                          </div>
                          {!hideDefinitions && st.definition && (
                            <p className="text-xs font-medium text-black/70 leading-snug">
                              {st.definition}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLearned(branch.id, st.id);
                          }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                            st.learned ? "bg-emerald-600 border-black text-white" : "bg-white border-black/30 hover:border-black text-transparent hover:text-black/20"
                          }`}
                        >
                          <Check size={13} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center bg-black/[0.02] rounded-xl border border-dashed border-black/20">
                    <span className="text-xs font-bold text-black/50">{branch.subtopics.length} concepts masqués</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Interactive Infinite Canvas with SVG Bezier Curves (Tree / Radial modes)
  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[680px] rounded-2xl border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] overflow-hidden select-none bg-[#FDFBF7] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px"
      }}
    >
      {/* Top Floating Controls Toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 z-30 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
          <button
            onClick={() => setScale(prev => Math.min(prev + 0.15, 2.2))}
            className="p-2 rounded-xl hover:bg-black hover:text-white font-black transition-colors"
            title="Zoom avant (+)"
          >
            <Plus size={16} />
          </button>
          <span className="text-xs font-black px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(prev => Math.max(prev - 0.15, 0.35))}
            className="p-2 rounded-xl hover:bg-black hover:text-white font-black transition-colors"
            title="Zoom arrière (-)"
          >
            <Minus size={16} />
          </button>
          <div className="w-px h-5 bg-black/20 mx-1" />
          <button
            onClick={resetView}
            className="p-2 rounded-xl hover:bg-black hover:text-white font-black transition-colors flex items-center gap-1.5 text-xs"
            title="Centrer / Réinitialiser la vue"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">Centrer</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000000]">
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-xl hover:bg-black hover:text-white font-black text-xs transition-colors flex items-center gap-1.5"
            title="Replier toutes les branches pour vue d'ensemble"
          >
            <FolderMinus size={15} />
            <span className="hidden md:inline">Replier tout</span>
          </button>
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-xl hover:bg-black hover:text-white font-black text-xs transition-colors flex items-center gap-1.5"
            title="Déplier toutes les branches"
          >
            <FolderPlus size={15} />
            <span className="hidden md:inline">Déplier tout</span>
          </button>
          <div className="w-px h-5 bg-black/20 mx-1" />
          <button
            onClick={onToggleHideDefinitions}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 border transition-all ${
              hideDefinitions ? "bg-amber-400 text-black border-black" : "hover:bg-black hover:text-white border-transparent"
            }`}
          >
            {hideDefinitions ? <EyeOff size={15} /> : <Eye size={15} />}
            <span className="hidden sm:inline">{hideDefinitions ? "Mode Mémo" : "Définitions"}</span>
          </button>
        </div>
      </div>

      {/* Main Scaled Canvas Surface */}
      <div
        className="absolute top-0 left-0 transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          width: layoutMetrics ? layoutMetrics.canvasWidth : 1600,
          height: layoutMetrics ? layoutMetrics.canvasHeight : 1100
        }}
      >
        {/* SVG Bezier Curves Layer */}
        {layoutMetrics && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.15" />
              </filter>
            </defs>

            {layoutMetrics.branchCoords.map((branch) => {
              const theme = coloredBranches.find(b => b.id === branch.id)?.colorTheme;
              const lineColor = theme?.lineColor || "#000000";
              const isLeft = branch.isLeft;

              // Root Node center connection points
              const startX = isLeft ? layoutMetrics.rootX - 160 : layoutMetrics.rootX + 160;
              const startY = layoutMetrics.rootY;
              
              // Branch connection point
              const branchBoxX = Number(branch.x);
              const branchBoxY = Number(branch.y);
              const endX = isLeft ? branchBoxX + 140 : branchBoxX - 140;
              const endY = branchBoxY;

              // Cubic Bezier control points for smooth S-curve
              const controlX1 = startX + (isLeft ? -130 : 130);
              const controlX2 = endX + (isLeft ? 130 : -130);
              const pathD = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;

              return (
                <g key={branch.id}>
                  {/* Curve from Root to Branch */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={5}
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />

                  {/* Curves from Branch to its Subtopics */}
                  {branch.subtopics.map((st) => {
                    const stStartX = isLeft ? branchBoxX - 140 : branchBoxX + 140;
                    const stStartY = branchBoxY;
                    const stEndX = isLeft ? st.x + 160 : st.x - 160;
                    const stEndY = st.y;
                    
                    const stControlX1 = stStartX + (isLeft ? -100 : 100);
                    const stControlX2 = stEndX + (isLeft ? 100 : -100);
                    const stPathD = `M ${stStartX} ${stStartY} C ${stControlX1} ${stStartY}, ${stControlX2} ${stEndY}, ${stEndX} ${stEndY}`;

                    return (
                      <path
                        key={st.id}
                        d={stPathD}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        opacity={0.7}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}

        {/* Nodes HTML/React Layer */}
        {layoutMetrics && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* 1. Root Central Node */}
            <div
              className="mindmap-node absolute pointer-events-auto transition-transform hover:scale-105"
              style={{
                left: layoutMetrics.rootX - 160,
                top: layoutMetrics.rootY - 60,
                width: 320
              }}
            >
              <div className="px-6 py-4 rounded-3xl bg-black text-white border-[4px] border-black shadow-[6px_6px_0px_0px_#FF5500] text-center flex flex-col items-center justify-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5500] text-white font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-widest border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000000]">
                  <Sparkles size={11} />
                  <span>Sujet Central</span>
                </div>
                <h2 className="text-xl font-black tracking-tight mt-1 leading-tight">{data.rootTitle}</h2>
                {data.subtitle && <p className="text-[11px] font-bold text-white/70 mt-1 line-clamp-2">{data.subtitle}</p>}
              </div>
            </div>

            {/* 2. Branch Nodes */}
            {layoutMetrics.branchCoords.map((branchCoord) => {
              const branch = coloredBranches.find(b => b.id === branchCoord.id);
              if (!branch) return null;
              const isCollapsed = collapsedBranches[branch.id];

              return (
                <div
                  key={branch.id}
                  className="mindmap-node absolute pointer-events-auto transition-transform hover:scale-[1.03]"
                  style={{
                    left: Number(branchCoord.x) - 140,
                    top: Number(branchCoord.y) - 45,
                    width: 280
                  }}
                >
                  <div 
                    onClick={() => toggleCollapse(branch.id)}
                    className={`p-4 rounded-2xl border-[3px] shadow-[4px_4px_0px_0px_#000000] cursor-pointer flex flex-col gap-2 transition-all ${branch.colorTheme.border} ${branch.colorTheme.bg}`}
                    style={{
                      boxShadow: `4px 4px 0px 0px ${branch.colorTheme.shadow}`
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-black text-xs px-2.5 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000000] ${branch.colorTheme.badgeBg}`}>
                        {branch.badge || "Branche"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black bg-black/10 px-2 py-0.5 rounded-full text-black/70">
                          {branch.subtopics.length} nœuds
                        </span>
                        <div className="p-1 rounded-md bg-black text-white border border-black">
                          {isCollapsed ? <Plus size={12} /> : <Minus size={12} />}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-black text-sm text-black leading-snug">{branch.title}</h3>
                  </div>
                </div>
              );
            })}

            {/* 3. Subtopic Leaf Nodes */}
            {layoutMetrics.branchCoords.map((branchCoord) => {
              const branch = coloredBranches.find(b => b.id === branchCoord.id);
              if (!branch || collapsedBranches[branch.id]) return null;

              return branchCoord.subtopics.map((stCoord) => {
                const st = branch.subtopics.find(s => s.id === stCoord.id);
                if (!st) return null;

                return (
                  <div
                    key={st.id}
                    className="mindmap-node absolute pointer-events-auto transition-transform hover:scale-105"
                    style={{
                      left: stCoord.x - 160,
                      top: stCoord.y - (hideDefinitions || !st.definition ? 25 : 38),
                      width: 320
                    }}
                  >
                    <div
                      onClick={() => onToggleLearned(branch.id, st.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 shadow-[3px_3px_0px_0px_#000000] ${
                        st.learned
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                          : "bg-white border-black/80 hover:border-black"
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-black/90 leading-tight">{st.text}</span>
                          {st.learned && <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">Retenu ✓</span>}
                        </div>
                        {!hideDefinitions && st.definition && (
                          <p className="text-xs font-medium text-black/70 leading-snug">
                            {st.definition}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLearned(branch.id, st.id);
                        }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          st.learned ? "bg-emerald-600 border-black text-white" : "bg-black/5 border-black/30 hover:border-black text-transparent hover:text-black/20"
                        }`}
                        title="Cocher comme maîtrisé"
                      >
                        <Check size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-30 text-xs font-extrabold text-black/60">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/20 shadow-sm pointer-events-auto">
          🖱️ <span className="underline">Molette</span> : Zoomer / Dézoomer • <span className="underline">Cliqué-glissé</span> : Déplacer la carte
        </div>
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/20 shadow-sm pointer-events-auto hidden sm:block">
          💡 <span className="underline">Clic sur une branche</span> : Plier/Déplier
        </div>
      </div>
    </div>
  );
}
