"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface GamaMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  state?: "idle" | "thinking" | "speaking" | "happy";
  className?: string;
}

export function GamaMascot({ size = "md", state = "idle", className = "" }: GamaMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-32 h-32",
    xl: "w-44 h-44",
  };

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    // Reset animations
    gsap.killTweensOf(el.querySelectorAll(".mascot-body, .mascot-eye, .mascot-sparkle, .mascot-ring"));

    if (state === "idle") {
      // Gentle breathing/floating 1930s cartoon bounce
      gsap.to(el.querySelector(".mascot-body"), {
        y: -6,
        rotation: 3,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(el.querySelectorAll(".mascot-eye"), {
        scaleY: 0.1,
        duration: 0.15,
        repeat: -1,
        repeatDelay: 3.5,
        yoyo: true,
        ease: "power1.inOut",
      });

      gsap.to(el.querySelectorAll(".mascot-sparkle"), {
        scale: 1.2,
        opacity: 0.9,
        duration: 1,
        repeat: -1,
        yoyo: true,
        stagger: 0.3,
        ease: "sine.inOut",
      });
    } else if (state === "thinking") {
      // Fast, dynamic spinning & morphing like Claude's mascot!
      gsap.to(el.querySelector(".mascot-body"), {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "none",
      });

      gsap.to(el.querySelector(".mascot-ring"), {
        rotation: -360,
        scale: 1.15,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(el.querySelectorAll(".mascot-eye"), {
        scaleY: 0.5,
        scaleX: 1.3,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });

      gsap.to(el.querySelectorAll(".mascot-sparkle"), {
        scale: 1.6,
        rotation: 180,
        opacity: 1,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        stagger: 0.15,
        ease: "power1.inOut",
      });
    } else if (state === "speaking" || state === "happy") {
      gsap.to(el.querySelector(".mascot-body"), {
        y: -10,
        scale: 1.08,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }
  }, { scope: containerRef, dependencies: [state] });

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Outer Pulsing Ring when thinking */}
        <circle
          className="mascot-ring transition-opacity duration-300"
          cx="50"
          cy="50"
          r="46"
          stroke="#FF5500"
          strokeWidth="3"
          strokeDasharray="12 8"
          opacity={state === "thinking" ? 0.8 : 0}
        />

        {/* Decorative Sparkles */}
        <path
          className="mascot-sparkle"
          d="M15 25 L18 15 L28 18 L18 21 Z"
          fill="#FF5500"
          opacity="0.6"
        />
        <path
          className="mascot-sparkle"
          d="M80 75 L85 65 L95 70 L85 73 Z"
          fill="#141414"
          opacity="0.5"
        />
        <path
          className="mascot-sparkle"
          d="M82 20 L84 12 L92 14 L84 16 Z"
          fill="#FF5500"
          opacity="0.7"
        />

        {/* Main 1930s Star / Ink Mascot Body */}
        <g className="mascot-body origin-center" style={{ transformOrigin: "50px 50px" }}>
          {/* Outer Black Ink Outline & Shadow */}
          <path
            d="M50 8 C53 30 70 47 92 50 C70 53 53 70 50 92 C47 70 30 53 8 50 C30 47 47 30 50 8 Z"
            fill="#141414"
            className="translate-x-[3px] translate-y-[3px] opacity-20"
          />
          <path
            d="M50 8 C53 30 70 47 92 50 C70 53 53 70 53 92 C47 70 30 53 8 50 C30 47 47 30 50 8 Z"
            fill="#FF5500"
            stroke="#141414"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Inner White Face Plate */}
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="#FFFFFF"
            stroke="#141414"
            strokeWidth="3"
          />

          {/* 1930s Pie Eyes (Pac-man style cutouts) */}
          <g className="mascot-eye origin-center" style={{ transformOrigin: "42px 48px" }}>
            <circle cx="42" cy="48" r="4.5" fill="#141414" />
            <path d="M42 48 L46 44 A 4.5 4.5 0 0 1 46 52 Z" fill="#FFFFFF" />
          </g>
          <g className="mascot-eye origin-center" style={{ transformOrigin: "58px 48px" }}>
            <circle cx="58" cy="48" r="4.5" fill="#141414" />
            <path d="M58 48 L62 44 A 4.5 4.5 0 0 1 62 52 Z" fill="#FFFFFF" />
          </g>

          {/* Cute Retro Smile */}
          {state === "thinking" ? (
            <circle cx="50" cy="58" r="3" fill="#141414" />
          ) : (
            <path
              d="M44 56 Q50 63 56 56"
              stroke="#141414"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
