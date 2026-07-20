"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Headphones, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Coffee, 
  Flame, 
  Music, 
  Play, 
  Pause, 
  Lock, 
  Crown,
  Sparkles,
  SkipBack,
  SkipForward
} from "lucide-react";

interface FocusSoundboardProps {
  isPro: boolean;
  onRequirePro: () => void;
}

export type SoundType = "rain" | "cafe" | "fire" | "lofi";

// -- GLOBAL AUDIO STATE FOR PERSISTENCE ACROSS PAGE NAVIGATION --
let g_audio: HTMLAudioElement | null = null;
let g_lofiIndex: number = 1;
let g_isTransitioning: boolean = false;
let g_activeSound: SoundType | null = "lofi";
let g_volume: number = 65;
let g_isPlaying: boolean = false;

const stopAudio = () => {
  if (g_audio) {
    g_audio.pause();
    g_audio.removeAttribute("src");
    g_audio.load();
    g_audio = null;
  }
  g_isTransitioning = false;
};

const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number, callback?: () => void) => {
  const steps = 20;
  const stepTime = duration / steps;
  const startVolume = audio.volume;
  const volumeStep = (targetVolume - startVolume) / steps;
  let currentStep = 0;

  const interval = setInterval(() => {
    currentStep++;
    let nextVol = startVolume + (volumeStep * currentStep);
    if (nextVol > 1) nextVol = 1;
    if (nextVol < 0) nextVol = 0;
    
    try { audio.volume = nextVol; } catch(e) {}

    if (currentStep >= steps) {
      clearInterval(interval);
      try { audio.volume = targetVolume; } catch(e) {}
      if (callback) callback();
    }
  }, stepTime);
};

const setupLofiTrack = () => {
  const audio = new Audio(`/ambiance/l_${g_lofiIndex}.mp3`);
  audio.setAttribute('data-soundtype', 'lofi');
  audio.volume = g_isTransitioning ? 0 : (g_volume / 100);
  g_audio = audio;
  
  if (g_isTransitioning) {
    fadeAudio(audio, g_volume / 100, 3500, () => {
      g_isTransitioning = false;
    });
  }

  audio.addEventListener("timeupdate", function timeUpdateHandler() {
    if (g_activeSound !== "lofi") {
       audio.removeEventListener("timeupdate", timeUpdateHandler);
       return;
    }
    if (g_isTransitioning) return;
    
    if (audio.duration && audio.currentTime >= audio.duration - 4) {
      g_isTransitioning = true;
      fadeAudio(audio, 0, 3500, () => {
        audio.pause();
        audio.removeEventListener("timeupdate", timeUpdateHandler);
      });
      g_lofiIndex = (g_lofiIndex % 5) + 1;
      setupLofiTrack();
    }
  });

  audio.play().catch(e => console.error(e));
};

const startAudio = (sound: SoundType, volPercent: number) => {
  stopAudio();
  const targetVol = volPercent / 100;

  if (sound === "lofi") {
    g_isTransitioning = false;
    setupLofiTrack();
  } else {
    let url = "";
    if (sound === "rain") url = "/ambiance/a_1.wav";
    if (sound === "fire") url = "/ambiance/a_2.wav";
    if (sound === "cafe") url = "/ambiance/a_3.wav";
    
    const audio = new Audio(url);
    audio.setAttribute('data-soundtype', sound);
    audio.volume = targetVol;
    audio.loop = true;
    audio.play().catch(e => console.error(e));
    g_audio = audio;
  }
};

const handleGlobalSkipLofi = (direction: 'next' | 'prev') => {
  if (!g_audio || g_activeSound !== "lofi") return;
  g_audio.pause();
  g_isTransitioning = false;
  if (direction === 'next') {
    g_lofiIndex = (g_lofiIndex % 5) + 1;
  } else {
    g_lofiIndex = g_lofiIndex === 1 ? 5 : g_lofiIndex - 1;
  }
  setupLofiTrack();
};

export function FocusSoundboard({ isPro, onRequirePro }: FocusSoundboardProps) {
  const [activeSound, setActiveSound] = useState<SoundType | null>(g_activeSound);
  const [isPlaying, setIsPlaying] = useState<boolean>(g_isPlaying);
  const [volume, setVolume] = useState<number>(g_volume);

  useEffect(() => {
    g_activeSound = activeSound;
    g_isPlaying = isPlaying;
    g_volume = volume;

    if (isPlaying && activeSound) {
      if (!g_audio || g_audio.getAttribute('data-soundtype') !== activeSound || g_audio.paused) {
        startAudio(activeSound, volume);
      }
    } else {
      if (g_audio) {
        stopAudio();
      }
    }
    // No cleanup: allows audio to persist when navigating away!
  }, [isPlaying, activeSound]);

  useEffect(() => {
    if (audioRef.current && !isTransitioningRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSelectSound = (sound: SoundType) => {
    if (!isPro) {
      onRequirePro();
      return;
    }
    if (activeSound === sound && isPlaying) {
      setIsPlaying(false);
    } else {
      setActiveSound(sound);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (!isPro) {
      onRequirePro();
      return;
    }
    if (!activeSound) {
      setActiveSound("lofi");
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const soundsList = [
    {
      id: "rain" as SoundType,
      label: "Pluie sur la fenêtre",
      emoji: "🌧️",
      icon: CloudRain,
      color: "bg-blue-500",
      desc: "Ambiance pluvieuse calme"
    },
    {
      id: "cafe" as SoundType,
      label: "Café étudiant",
      emoji: "☕",
      icon: Coffee,
      color: "bg-amber-600",
      desc: "Murmures apaisants"
    },
    {
      id: "fire" as SoundType,
      label: "Feu de cheminée",
      emoji: "🔥",
      icon: Flame,
      color: "bg-orange-600",
      desc: "Crépitement chaleureux"
    },
    {
      id: "lofi" as SoundType,
      label: "Lofi Beats",
      emoji: "🎶",
      icon: Music,
      color: "bg-purple-600",
      desc: "Chords relaxants chill"
    }
  ];

  return (
    <div className="bg-[#FFFDF9] dark:bg-[#1A1A1D] border-3 border-black dark:border-white/20 rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#FF5500] flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-3.5 mb-5 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-black text-white shadow-[2px_2px_0px_0px_#FF5500] dark:bg-white dark:text-black">
            <Headphones size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm md:text-base uppercase tracking-tight text-black dark:text-white">
                Ambiance Sonore & Lofi Focus
              </h3>
              <span className="bg-black text-[#FF5500] dark:bg-white dark:text-[#FF5500] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-black dark:border-white">
                <Crown size={11} />
                <span>Exclusif PRO</span>
              </span>
            </div>
            <p className="text-xs font-bold text-black/60 dark:text-neutral-400">
              Soundboard intégré pour s&apos;isoler pendant le Pomodoro
            </p>
          </div>
        </div>

        {/* Lofi Controls or Visualizer bars */}
        {isPlaying && activeSound === "lofi" ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleGlobalSkipLofi('prev')}
              className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#FF5500] hover:text-white dark:hover:bg-[#FF5500] dark:hover:text-white border border-black/20 dark:border-white/20 transition-colors cursor-pointer text-black dark:text-white"
              title="Musique précédente"
            >
              <SkipBack size={15} />
            </button>
            <button
              onClick={() => handleGlobalSkipLofi('next')}
              className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#FF5500] hover:text-white dark:hover:bg-[#FF5500] dark:hover:text-white border border-black/20 dark:border-white/20 transition-colors cursor-pointer text-black dark:text-white"
              title="Musique suivante"
            >
              <SkipForward size={15} />
            </button>
          </div>
        ) : isPlaying && activeSound ? (
          <div className="flex items-end gap-1 h-5 px-3 py-1 bg-black/5 dark:bg-white/10 rounded-lg border border-black/20 dark:border-white/20">
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-3"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-4 delay-75"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-2 delay-150"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-4 delay-200"></span>
          </div>
        ) : null}
      </div>

      {/* Grid of 4 Ambiance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        {soundsList.map((sound) => {
          const Icon = sound.icon;
          const isActive = activeSound === sound.id && isPlaying;

          return (
            <button
              key={sound.id}
              onClick={() => handleSelectSound(sound.id)}
              className={`relative border-2 border-black dark:border-white/20 rounded-2xl p-4 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-[3px_3px_0px_0px_#FF5500] -translate-y-0.5"
                  : "bg-white dark:bg-[#252528] text-black dark:text-white hover:bg-[#FAFAFA] dark:hover:bg-[#2A2A2E] shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FF5500] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_#FF5500]"
              }`}
            >
              {!isPro && (
                <span className="absolute top-2.5 right-2.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-1 rounded-full border border-amber-300 dark:border-amber-700">
                  <Lock size={12} />
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl">{sound.emoji}</span>
                {isActive && (
                  <span className="text-[10px] font-black bg-[#FF5500] text-white px-1.5 py-0.5 rounded uppercase">
                    Actif
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="font-black text-xs md:text-sm leading-tight flex items-center gap-1.5">
                  <span>{sound.label}</span>
                </div>
                <div className={`text-[10px] font-bold truncate mt-0.5 ${isActive ? "text-white/70 dark:text-black/60" : "text-black/50 dark:text-neutral-400"}`}>
                  {sound.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Audio Controls Bar (Play/Pause & Volume) */}
      <div className="bg-white dark:bg-[#252528] border-2 border-black dark:border-white/20 rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#FF5500] flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 border-2 border-black dark:border-white/20 shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FF5500] cursor-pointer transition-all ${
              isPlaying
                ? "bg-[#FF5500] text-white hover:bg-black dark:hover:bg-white dark:hover:text-black"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-[#FF5500] dark:hover:bg-[#FF5500] dark:hover:text-white"
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "En cours" : "Lancer l'ambiance"}</span>
          </button>

          <span className="text-xs font-black text-black/70 dark:text-neutral-400">
            {activeSound
              ? soundsList.find((s) => s.id === activeSound)?.label
              : "Aucune ambiance sélectionnée"}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2.5 w-full sm:w-48">
          <button
            onClick={() => setVolume(volume === 0 ? 65 : 0)}
            className="text-black/60 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
            title={volume === 0 ? "Activer le son" : "Muet"}
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF5500]"
          />
          <span className="text-[11px] font-black w-8 text-right text-black/70 dark:text-neutral-400">
            {volume}%
          </span>
        </div>
      </div>
    </div>
  );
}
