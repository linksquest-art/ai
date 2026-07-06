"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Sparkles, Smile } from "lucide-react";

export function HeroAnimation() {
  const container = useRef(null);

  useGSAP(() => {
    // 1930s Rubber hose bounce effect
    gsap.fromTo(
      ".draw-line",
      { strokeDasharray: 1200, strokeDashoffset: 1200 },
      { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", stagger: 0.2 }
    );
    
    // Playful rubber hose entrance for text
    gsap.from(".hero-text", {
      y: 60,
      scaleX: 0.8,
      scaleY: 1.2,
      opacity: 0,
      duration: 0.9,
      ease: "elastic.out(1, 0.5)",
      stagger: 0.15,
      delay: 0.5
    });

    // Continuous 1930s bounce/wobble for cartoon decorations
    gsap.to(".rubber-bounce", {
      y: -10,
      rotation: 5,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.2
    });
  }, { scope: container });

  return (
    <div ref={container} className="flex flex-col items-center justify-center pt-12 pb-12 text-center relative w-full overflow-hidden">
      {/* 1930s Rubber Hose Vintage Background Sketch */}
      <svg className="absolute w-[900px] h-[550px] -z-10 text-ink opacity-15 top-[-40px]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Classic cartoon burst lines */}
        <path className="draw-line" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M10,20 L30,40 M90,20 L70,40 M10,80 L30,60 M90,80 L70,60" />
        {/* Rubber hose curves */}
        <path className="draw-line" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M5,50 Q25,10 50,50 T95,50" />
        <circle className="draw-line" cx="15" cy="25" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle className="draw-line" cx="85" cy="75" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Vintage 1930s Title Badge */}
      <div className="hero-text inline-flex items-center gap-2 bg-ink text-paper px-5 py-1.5 rounded-full font-black text-sm uppercase tracking-widest mb-8 cartoon-shadow rotate-[-2deg] rubber-bounce">
        <Sparkles size={16} className="text-primary animate-spin" style={{ animationDuration: '4s' }} />
        <span>Inspiré de l'Âge d'Or du Cartoon 1930</span>
      </div>

      <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.05] max-w-5xl px-4 text-ink tracking-tight">
        <span className="hero-text block">L'Intelligence Artificielle</span>
        <span className="hero-text inline-block relative mt-2 bg-white px-6 py-2 border-4 border-ink rounded-3xl cartoon-shadow rotate-[1deg]">
          Façon Rubber Hose !
          {/* 1930s Pie Eye decoration or ink scribble */}
          <span className="absolute -top-6 -right-6 bg-primary text-white w-12 h-12 rounded-full border-3 border-ink flex items-center justify-center font-black text-2xl rotate-12 cartoon-shadow">
            ★
          </span>
        </span>
      </h1>
      
      <p className="hero-text text-2xl md:text-3xl max-w-3xl text-ink/90 mb-12 font-extrabold px-4 leading-relaxed">
        Fini les interfaces tristes. Accédez à <span className="underline decoration-primary decoration-4 underline-offset-4">tous les modèles d'IA</span> via OmniRoute avec le charme des cartoons américains dessinés à la main !
      </p>

      {/* Rubber Hose Glove Pointer Graphic */}
      <div className="hero-text flex items-center gap-3 font-black text-xl text-ink uppercase tracking-wider mb-4">
        <span className="text-2xl rubber-bounce inline-block">👉</span>
        <span>Posez votre première question ci-dessous</span>
        <span className="text-2xl rubber-bounce inline-block" style={{ animationDelay: '0.5s' }}>👈</span>
      </div>
    </div>
  );
}
