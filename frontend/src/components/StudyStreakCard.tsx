"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle2, Trophy, Target, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StudyStreakData {
  currentStreak: number;
  lastActiveDate: string;
  weeklyGoal: number;
  completedThisWeek: string[]; // ["Lun", "Mar", ...]
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function StudyStreakCard({ onIncrement }: { onIncrement?: () => void }) {
  const [streak, setStreak] = useState<StudyStreakData>({
    currentStreak: 0,
    lastActiveDate: "",
    weeklyGoal: 5,
    completedThisWeek: []
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.study_streak) {
        setStreak(session.user.user_metadata.study_streak);
      }
    });

    const localData = localStorage.getItem("gama_study_streak");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Ne jamais garder d'anciennes fausses données de démonstration (ex: 3 ou 4 jours par défaut)
        if (
          (parsed.currentStreak === 3 && parsed.completedThisWeek?.length === 3) ||
          (parsed.currentStreak === 4 && parsed.completedThisWeek?.length === 4)
        ) {
          const zeroData: StudyStreakData = {
            currentStreak: 0,
            lastActiveDate: "",
            weeklyGoal: 5,
            completedThisWeek: []
          };
          setStreak(zeroData);
          localStorage.setItem("gama_study_streak", JSON.stringify(zeroData));
        } else {
          setStreak(parsed);
        }
      } catch (e) {}
    } else {
      // Zéro absolu à la création d'un compte (aucune fausse donnée)
      const zeroData: StudyStreakData = {
        currentStreak: 0,
        lastActiveDate: "",
        weeklyGoal: 5,
        completedThisWeek: []
      };
      setStreak(zeroData);
      localStorage.setItem("gama_study_streak", JSON.stringify(zeroData));
    }
  }, []);

  const incrementStreak = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const dayIndex = (new Date().getDay() + 6) % 7; // Lun=0 ... Dim=6
    const dayLabel = DAYS[dayIndex];

    const updatedDays = streak.completedThisWeek.includes(dayLabel)
      ? streak.completedThisWeek
      : [...streak.completedThisWeek, dayLabel];

    const isNewDay = streak.lastActiveDate !== todayStr;
    const newCount = isNewDay ? streak.currentStreak + 1 : streak.currentStreak;

    const updated: StudyStreakData = {
      ...streak,
      currentStreak: newCount,
      lastActiveDate: todayStr,
      completedThisWeek: updatedDays
    };

    setStreak(updated);
    localStorage.setItem("gama_study_streak", JSON.stringify(updated));

    if (user) {
      supabase.auth.updateUser({
        data: {
          study_streak: updated
        }
      });
    }

    if (onIncrement) onIncrement();
  };

  const progressPercent = Math.min(100, Math.round((streak.completedThisWeek.length / streak.weeklyGoal) * 100));

  return (
    <div className="bg-gradient-to-br from-[#FFFBF5] via-white to-[#FFF5EB] border-[3px] border-black rounded-3xl p-5 md:p-6 shadow-[6px_6px_0px_0px_#FF5500] flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500] text-white border-2 border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center">
            <Flame size={26} className="fill-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-black uppercase tracking-tight">Streak de Révision</h3>
              <span className="bg-[#FF5500] text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-black shadow-sm">
                🔥 {streak.currentStreak} Jours
              </span>
            </div>
            <p className="text-xs font-bold text-black/60">
              Régularité & Gamification — Chaque quiz ou devoir valide votre journée
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-black/20 text-xs font-black text-black">
          <Trophy size={15} className="text-amber-500" />
          <span>Objectif Hebdo : {streak.completedThisWeek.length} / {streak.weeklyGoal} jours</span>
        </div>
      </div>

      {/* Week Days Badges */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => {
          const isDone = streak.completedThisWeek.includes(day);
          return (
            <div
              key={day}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-2 transition-all ${
                isDone
                  ? "bg-[#FF5500] text-white border-black shadow-[2px_2px_0px_0px_#000000] scale-105"
                  : "bg-[#FAFAFA] text-black/40 border-black/15"
              }`}
            >
              <span className="text-[10px] font-black uppercase mb-1">{day}</span>
              {isDone ? (
                <Flame size={16} className="fill-white" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-black/20" />
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Goal Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-black/80">
          <span className="flex items-center gap-1.5">
            <Target size={14} className="text-[#FF5500]" />
            <span>Objectif de révision hebdomadaire</span>
          </span>
          <span>{progressPercent}% complété</span>
        </div>
        <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden border-2 border-black">
          <div
            className="bg-gradient-to-r from-amber-500 via-[#FF5500] to-red-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
