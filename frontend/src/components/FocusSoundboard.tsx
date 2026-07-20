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
  Sparkles
} from "lucide-react";

interface FocusSoundboardProps {
  isPro: boolean;
  onRequirePro: () => void;
}

export type SoundType = "rain" | "cafe" | "fire" | "lofi";

export function FocusSoundboard({ isPro, onRequirePro }: FocusSoundboardProps) {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(65);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop current audio synthesis
  const stopAudio = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
  };

  // Start sound synthesis via Web Audio API
  const startAudio = (sound: SoundType, volPercent: number) => {
    stopAudio();

    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      audioCtxRef.current = new AudioCtxClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }

    const gain = gainNodeRef.current;
    gain.gain.setValueAtTime((volPercent / 100) * 0.35, ctx.currentTime);

    if (sound === "rain") {
      // Pink/Brown noise buffer for realistic rain on window
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      whiteNoise.connect(filter);
      filter.connect(gain);
      whiteNoise.start();
      sourceNodeRef.current = whiteNoise;
    } else if (sound === "fire") {
      // Warm brown noise crackle
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.025 * white) / 1.025;
        lastOut = output[i];
        // Occasional crackle pop
        if (Math.random() < 0.0008) {
          output[i] += (Math.random() * 2 - 1) * 3.5;
        }
      }
      const fireSource = ctx.createBufferSource();
      fireSource.buffer = buffer;
      fireSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 550;

      fireSource.connect(filter);
      filter.connect(gain);
      fireSource.start();
      sourceNodeRef.current = fireSource;
    } else if (sound === "cafe") {
      // Gentle warm cafe murmur
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const cafeSource = ctx.createBufferSource();
      cafeSource.buffer = buffer;
      cafeSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;

      cafeSource.connect(filter);
      filter.connect(gain);
      cafeSource.start();
      sourceNodeRef.current = cafeSource;
    } else if (sound === "lofi") {
      // Chill relaxing Lofi harmonic chord loops
      const playLofiChord = () => {
        if (!audioCtxRef.current || !gainNodeRef.current) return;
        const c = audioCtxRef.current;
        const chords = [
          [261.63, 329.63, 392.00, 493.88], // Cmaj7
          [220.00, 261.63, 329.63, 392.00], // Am7
          [174.61, 220.00, 261.63, 329.63], // Fmaj7
          [196.00, 246.94, 293.66, 349.23], // G7
        ];
        const chosen = chords[Math.floor(Math.random() * chords.length)];
        chosen.forEach((freq) => {
          const osc = c.createOscillator();
          const noteGain = c.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, c.currentTime);

          noteGain.gain.setValueAtTime(0.001, c.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.3);
          noteGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 3.8);

          osc.connect(noteGain);
          noteGain.connect(gainNodeRef.current!);
          osc.start();
          osc.stop(c.currentTime + 4.0);
        });
      };
      playLofiChord();
      intervalRef.current = setInterval(playLofiChord, 3500);
    }
  };

  useEffect(() => {
    if (isPlaying && activeSound) {
      startAudio(activeSound, volume);
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isPlaying, activeSound]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime((volume / 100) * 0.35, audioCtxRef.current.currentTime);
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

        {/* Visualizer bars when playing */}
        {isPlaying && activeSound && (
          <div className="flex items-end gap-1 h-5 px-3 py-1 bg-black/5 dark:bg-white/10 rounded-lg border border-black/20 dark:border-white/20">
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-3"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-4 delay-75"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-2 delay-150"></span>
            <span className="w-1.5 bg-[#FF5500] rounded-full animate-pulse h-4 delay-200"></span>
          </div>
        )}
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
