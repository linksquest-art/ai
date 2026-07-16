"use client";

import React, { useMemo } from "react";
import { 
  Sparkles, 
  BookOpen, 
  Zap, 
  AlertTriangle, 
  Brain, 
  CheckCircle2, 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check,
  Bookmark
} from "lucide-react";

interface FicheMasterRendererProps {
  rawContent: string;
  courseTitle: string;
  level: string;
  styleName: string;
  onCopy: () => void;
  copied: boolean;
}

export function FicheMasterRenderer({
  rawContent,
  courseTitle,
  level,
  styleName,
  onCopy,
  copied
}: FicheMasterRendererProps) {

  // Parse structured sections from Markdown output
  const sections = useMemo(() => {
    const lines = rawContent.split("\n");
    const parsed: {
      type: "summary" | "definitions" | "formulas" | "traps" | "mindmap" | "generic";
      title: string;
      items: { subtitle?: string; text: string; badge?: string }[];
    }[] = [];

    let currentSection: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ") || trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
        if (currentSection) parsed.push(currentSection);

        const cleanTitle = trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
        let type: "summary" | "definitions" | "formulas" | "traps" | "mindmap" | "generic" = "generic";
        
        const lower = cleanTitle.toLowerCase();
        if (lower.includes("synthèse") || lower.includes("exécutive") || lower.includes("fondamentaux") || lower.includes("📌")) {
          type = "summary";
        } else if (lower.includes("définition") || lower.includes("vocabulaire") || lower.includes("terme") || lower.includes("📖")) {
          type = "definitions";
        } else if (lower.includes("formule") || lower.includes("loi") || lower.includes("principe") || lower.includes("⚡")) {
          type = "formulas";
        } else if (lower.includes("piège") || lower.includes("erreur") || lower.includes("éviter") || lower.includes("⚠️")) {
          type = "traps";
        } else if (lower.includes("mémorisation") || lower.includes("plan") || lower.includes("mindmap") || lower.includes("🧠")) {
          type = "mindmap";
        }

        currentSection = { type, title: cleanTitle, items: [] };
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\.\s/)) {
        if (!currentSection) {
          currentSection = { type: "summary", title: "Concepts Fondamentaux", items: [] };
        }
        const cleanItem = trimmed.replace(/^[-*\d.]+\s*/, "").trim();
        const parts = cleanItem.split(/[:–—]/);
        if (parts.length > 1 && parts[0].length < 60) {
          currentSection.items.push({
            subtitle: parts[0].replace(/\*\*/g, "").trim(),
            text: parts.slice(1).join(":").replace(/\*\*/g, "").trim()
          });
        } else {
          currentSection.items.push({ text: cleanItem.replace(/\*\*/g, "").trim() });
        }
      } else if (trimmed && currentSection && !trimmed.startsWith("---")) {
        if (currentSection.items.length > 0) {
          currentSection.items[currentSection.items.length - 1].text += ` ${trimmed.replace(/\*\*/g, "")}`;
        } else {
          currentSection.items.push({ text: trimmed.replace(/\*\*/g, "") });
        }
      }
    }
    if (currentSection) parsed.push(currentSection);
    return parsed;
  }, [rawContent]);

  // Generate standalone decorated HTML template with inline styles & Google Fonts for instant Print/Save to PDF
  const handleDownloadDecoratedHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche Master Décorée - ${courseTitle || "Gama Studio Pro"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #FF5500;
      --bg: #FDFBF7;
      --card-bg: #FFFFFF;
      --border: #000000;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: #111;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .sheet-container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 4px solid var(--border);
      box-shadow: 10px 10px 0px 0px var(--border);
      border-radius: 24px;
      padding: 48px;
    }
    .sheet-header {
      border-bottom: 4px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      background: var(--primary);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 6px 14px;
      border-radius: 999px;
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0px 0px var(--border);
      display: inline-block;
      margin-bottom: 12px;
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 34px;
      letter-spacing: -1px;
      color: #000;
    }
    .level-meta {
      font-weight: 700;
      font-size: 14px;
      color: #555;
    }
    .section-card {
      border: 3px solid var(--border);
      box-shadow: 5px 5px 0px 0px var(--border);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 28px;
      background: #fff;
    }
    .section-summary { background: #FFF7ED; border-color: #EA580C; box-shadow: 5px 5px 0px 0px #EA580C; }
    .section-definitions { background: #EEF2FF; border-color: #4F46E5; box-shadow: 5px 5px 0px 0px #4F46E5; }
    .section-formulas { background: #ECFDF5; border-color: #059669; box-shadow: 5px 5px 0px 0px #059669; }
    .section-traps { background: #FEF2F2; border-color: #DC2626; box-shadow: 5px 5px 0px 0px #DC2626; }
    .section-mindmap { background: #FDF4FF; border-color: #9333EA; box-shadow: 5px 5px 0px 0px #9333EA; }
    
    .section-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 20px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .items-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    .item-box {
      background: #fff;
      border: 2px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 2px 2px 0px 0px var(--border);
    }
    .item-subtitle {
      font-weight: 800;
      font-size: 15px;
      color: #000;
      margin-bottom: 4px;
      display: block;
    }
    .item-text {
      font-size: 14px;
      color: #333;
    }
    .footer-note {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #888;
      border-top: 2px dashed #ccc;
      padding-top: 20px;
    }
    .print-btn {
      background: #000;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 12px;
      border: 3px solid #000;
      cursor: pointer;
      box-shadow: 4px 4px 0px 0px #FF5500;
      margin-bottom: 30px;
      display: inline-block;
      text-decoration: none;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .sheet-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .section-card { box-shadow: none; break-inside: avoid; }
      .item-box { box-shadow: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align: center;" class="no-print">
    <button onclick="window.print()" class="print-btn">🖨️ Imprimer ou Enregistrer en PDF (A4 Décoré)</button>
  </div>

  <div class="sheet-container">
    <header class="sheet-header">
      <div>
        <div class="badge">✨ Fiche-Master d'Excellence • Gama Studio Pro</div>
        <h1>${courseTitle || "Fiche de Révision"}</h1>
        <div class="level-meta">Niveau : ${level} • ${styleName.split(" (")[0]}</div>
      </div>
      <div style="text-align: right; font-weight: 900; font-family: 'Outfit', sans-serif; font-size: 28px; color: #FF5500;">
        20/20
      </div>
    </header>

    <main>
      ${sections.map(sec => {
        let cardClass = "section-card";
        if (sec.type === "summary") cardClass += " section-summary";
        else if (sec.type === "definitions") cardClass += " section-definitions";
        else if (sec.type === "formulas") cardClass += " section-formulas";
        else if (sec.type === "traps") cardClass += " section-traps";
        else if (sec.type === "mindmap") cardClass += " section-mindmap";

        return `
          <section class="${cardClass}">
            <h2 class="section-title">${sec.title}</h2>
            <div class="items-grid">
              ${sec.items.map(it => `
                <div class="item-box">
                  ${it.subtitle ? `<span class="item-subtitle">${it.subtitle}</span>` : ""}
                  <span class="item-text">${it.text}</span>
                </div>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </main>

    <footer class="footer-note">
      Généré par Gama Studio Pro IA — Conçu pour la mémorisation éclair et la perfection aux examens.
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(courseTitle || "Fiche_Master").replace(/[^a-zA-Z0-9_-]/g, "_")}_Decoree.html`;
    link.click();
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full printable-fiche-container">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFBF5] border-[3px] border-black shadow-[4px_4px_0px_0px_#000000] no-print">
        <div className="flex items-center gap-2.5">
          <span className="font-black text-xs uppercase tracking-wider text-black/70 flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#FF5500]" />
            <span>Mode Fiche Haute Définition (Décorée)</span>
          </span>
          <span className="text-[10px] font-extrabold bg-black text-white px-2.5 py-0.5 rounded-full">Prête pour Examen</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onCopy}
            className="px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000]"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? "Copié !" : "Copier"}</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-indigo-600 hover:text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_0px_#000000]"
          >
            <Printer size={14} />
            <span>Imprimer / PDF Direct</span>
          </button>

          <button
            onClick={handleDownloadDecoratedHtml}
            className="px-4 py-2 rounded-xl border-[3px] border-black bg-[#FF5500] hover:bg-[#E04D00] text-white font-black text-xs flex items-center gap-2 transition-all shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
          >
            <Download size={15} strokeWidth={2.5} />
            <span>📥 Télécharger la Fiche Décorée (HTML/PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Decorated Fiche Layout (Rendered in UI & printable) */}
      <div className="p-8 md:p-10 rounded-3xl bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-8 print:border-0 print:shadow-none print:p-0">
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[4px] border-black pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FF5500] text-white font-black text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000000] mb-3">
              <Sparkles size={13} />
              <span>Fiche-Master d'Excellence • 20/20</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-black">{courseTitle || "Fiche de Révision"}</h2>
            <p className="text-sm font-bold text-black/60 mt-1">
              Niveau : {level} • {styleName.split(" (")[0]}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[#FFF7ED] border-[3px] border-[#EA580C] shadow-[4px_4px_0px_0px_#EA580C] text-center shrink-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#EA580C]">Objectif Note</span>
              <span className="text-2xl font-black text-[#EA580C]">20 / 20</span>
            </div>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 gap-6">
          {sections.map((sec, idx) => {
            let cardTheme = {
              bg: "bg-white",
              border: "border-black",
              shadow: "shadow-[5px_5px_0px_0px_#000000]",
              badgeBg: "bg-black text-white",
              titleColor: "text-black",
              icon: <FileText size={20} />
            };

            if (sec.type === "summary") {
              cardTheme = {
                bg: "bg-amber-50/80",
                border: "border-amber-600",
                shadow: "shadow-[5px_5px_0px_0px_#D97706]",
                badgeBg: "bg-amber-600 text-white",
                titleColor: "text-amber-950",
                icon: <Sparkles size={20} className="text-amber-600" />
              };
            } else if (sec.type === "definitions") {
              cardTheme = {
                bg: "bg-indigo-50/80",
                border: "border-indigo-600",
                shadow: "shadow-[5px_5px_0px_0px_#4F46E5]",
                badgeBg: "bg-indigo-600 text-white",
                titleColor: "text-indigo-950",
                icon: <BookOpen size={20} className="text-indigo-600" />
              };
            } else if (sec.type === "formulas") {
              cardTheme = {
                bg: "bg-emerald-50/80",
                border: "border-emerald-600",
                shadow: "shadow-[5px_5px_0px_0px_#059669]",
                badgeBg: "bg-emerald-600 text-white",
                titleColor: "text-emerald-950",
                icon: <Zap size={20} className="text-emerald-600" />
              };
            } else if (sec.type === "traps") {
              cardTheme = {
                bg: "bg-rose-50/80",
                border: "border-rose-600",
                shadow: "shadow-[5px_5px_0px_0px_#E11D48]",
                badgeBg: "bg-rose-600 text-white",
                titleColor: "text-rose-950",
                icon: <AlertTriangle size={20} className="text-rose-600" />
              };
            } else if (sec.type === "mindmap") {
              cardTheme = {
                bg: "bg-purple-50/80",
                border: "border-purple-600",
                shadow: "shadow-[5px_5px_0px_0px_#9333EA]",
                badgeBg: "bg-purple-600 text-white",
                titleColor: "text-purple-950",
                icon: <Brain size={20} className="text-purple-600" />
              };
            }

            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border-[3px] transition-all flex flex-col gap-4 ${cardTheme.bg} ${cardTheme.border} ${cardTheme.shadow}`}
              >
                <div className="flex items-center gap-3 border-b-2 border-black/10 pb-3">
                  <div className="p-2 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
                    {cardTheme.icon}
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${cardTheme.titleColor}`}>
                    {sec.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sec.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className={`p-4 rounded-xl bg-white border-2 border-black/80 shadow-[3px_3px_0px_0px_#000000] flex flex-col gap-1.5 ${
                        sec.items.length === 1 || sec.type === "traps" || sec.type === "summary" ? "md:col-span-2" : ""
                      }`}
                    >
                      {item.subtitle && (
                        <span className="font-black text-sm text-black flex items-center gap-1.5 border-b border-black/10 pb-1">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>{item.subtitle}</span>
                        </span>
                      )}
                      <p className="text-xs font-semibold text-black/80 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-6 border-t-2 border-dashed border-black/20 text-xs font-bold text-black/50">
          Gama Studio Pro IA — Fiche structurée pour une mémorisation rapide et une réussite aux examens.
        </div>
      </div>
    </div>
  );
}
