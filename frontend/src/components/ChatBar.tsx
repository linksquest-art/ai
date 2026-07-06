"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { ArrowUp, Sparkles, ChevronDown } from "lucide-react";

export function ChatBar() {
  const barRef = useRef(null);
  const [model, setModel] = useState("Claude 3.5 Sonnet");

  useGSAP(() => {
    gsap.from(barRef.current, {
      y: 60,
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      delay: 1.2,
      ease: "back.out(1.6)"
    });
  });

  return (
    <div ref={barRef} className="w-full max-w-4xl mx-auto px-4 relative z-10 mb-16">
      <div className="border-4 border-ink rounded-[28px] flex flex-col gap-4 relative bg-white p-6 cartoon-shadow">
        {/* Model Selector Banner */}
        <div className="flex items-center justify-between border-b-4 border-ink/15 pb-4">
          <div className="flex items-center gap-2">
            <span className="bg-ink text-paper text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Passerelle OmniRoute
            </span>
            <span className="text-base font-extrabold text-ink/60 uppercase tracking-wider hidden sm:inline">
              Modèle actif :
            </span>
          </div>
          
          <button className="flex items-center gap-2 font-black text-ink bg-paper hover:bg-primary hover:text-white border-2 border-ink px-4 py-1.5 rounded-xl transition-all text-base cartoon-shadow-hover">
            <Sparkles size={18} />
            {model}
            <ChevronDown size={18} strokeWidth={3} />
          </button>
        </div>
        
        {/* Input Area */}
        <div className="flex items-end gap-4 pt-2">
          <textarea 
            placeholder="Écrivez ici comme sur une vieille machine à écrire..."
            className="w-full resize-none outline-none text-2xl font-extrabold bg-transparent placeholder:text-ink/30 min-h-[70px] text-ink"
            rows={2}
          />
          <button className="bg-ink text-white border-3 border-ink p-5 rounded-2xl font-black uppercase tracking-wider hover:bg-primary hover:scale-105 transition-all cartoon-shadow flex items-center justify-center shrink-0">
            <ArrowUp size={28} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
