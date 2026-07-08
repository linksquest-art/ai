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
    const todayStr = new Date().toISOString().split("T")[0];
    const todayIndex = (new Date().getDay() + 6) % 7; // Lun=0 ... Dim=6
    const todayLabel = DAYS[todayIndex];

    const loadAndSyncStreak = async () => {
      let currentData: StudyStreakData = {
        currentStreak: 0,
        lastActiveDate: "",
        weeklyGoal: 5,
        completedThisWeek: []
      };

      // 1. Lire d'abord depuis localStorage ou Supabase metadata
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user?.user_metadata?.study_streak) {
        currentData = session.user.user_metadata.study_streak;
      } else {
        const localData = localStorage.getItem("gama_study_streak");
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            // Purger les anciennes fausses données par défaut (3 ou 4 jours arbitraires)
            if (
              (parsed.currentStreak === 3 && parsed.completedThisWeek?.length === 3) ||
              (parsed.currentStreak === 4 && parsed.completedThisWeek?.length === 4)
            ) {
              currentData = { currentStreak: 0, lastActiveDate: "", weeklyGoal: 5, completedThisWeek: [] };
            } else {
              currentData = parsed;
            }
          } catch (e) {}
        }
      }

      // 2. Valider automatiquement la connexion / activité d'aujourd'hui comme une vraie streak !
      const alreadyLoggedToday = currentData.lastActiveDate === todayStr;
      const updatedDays = currentData.completedThisWeek.includes(todayLabel)
        ? currentData.completedThisWeek
        : [...currentData.completedThisWeek, todayLabel];

      const newStreakCount = alreadyLoggedToday
        ? currentData.currentStreak
        : Math.max(1, currentData.currentStreak + 1);

      const syncedData: StudyStreakData = {
        currentStreak: newStreakCount,
        lastActiveDate: todayStr,
        weeklyGoal: currentData.weeklyGoal || 5,
        completedThisWeek: updatedDays
      };

      setStreak(syncedData);
      localStorage.setItem("gama_study_streak", JSON.stringify(syncedData));

      // 3. Synchroniser avec Supabase en arrière-plan si connecté
      if (session?.user) {
        supabase.auth.updateUser({
          data: {
            study_streak: syncedData
          }
        });
      }
    };

    loadAndSyncStreak();
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
    <div className="bg-gradient-to-br from-[#FFFBF5] via-white to-[#FFF5EB] dark:from-[#1E1E24] dark:via-[#18181B] dark:to-[#1E1E24] border-[3px] border-black dark:border-white/20 rounded-3xl p-5 md:p-6 shadow-[6px_6px_0px_0px_#FF5500] flex flex-col gap-5 text-black dark:text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-black/10 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500] text-white border-2 border-black shadow-[3px_3px_0px_0px_#000000] flex items-center justify-center">
            <Flame size={26} className="fill-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight">Streak de Révision</h3>
              <span className="bg-[#FF5500] text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-black shadow-sm">
                🔥 {streak.currentStreak} Jours
              </span>
            </div>
            <p className="text-xs font-bold text-black/60 dark:text-white/70">
              Régularité & Gamification — Chaque quiz ou devoir valide votre journée
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-[#27272A] px-3 py-1.5 rounded-xl border-2 border-black/20 dark:border-white/20 text-xs font-black text-black dark:text-white">
          <Trophy size={15} className="text-amber-500" />
          <span>Objectif Hebdo : {streak.completedThisWeek.length} / {streak.weeklyGoal} jours</span>
        </div>
      </div>

      {/* Week Days Badges */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => {
          const isDone = streak.completedThisWeek.includes(day);
          const todayIndex = (new Date().getDay() + 6) % 7;
          const isToday = day === DAYS[todayIndex];

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-2 transition-all ${
                isDone
                  ? "bg-[#FF5500] text-white border-black shadow-[2px_2px_0px_0px_#000000] scale-105"
                  : isToday
                  ? "bg-amber-100 dark:bg-amber-900/30 text-black dark:text-amber-300 border-black/50 dark:border-amber-400"
                  : "bg-[#FAFAFA] dark:bg-[#27272A] text-black/40 dark:text-white/40 border-black/15 dark:border-white/10"
              }`}
            >
              <span className="text-[10px] font-black uppercase mb-1 flex items-center gap-1">
                {day}
              </span>
              {isDone ? (
                <Flame size={16} className="fill-white" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-black/20 dark:border-white/20" />
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Goal Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-black/80 dark:text-white/80">
          <span className="flex items-center gap-1.5">
            <Target size={14} className="text-[#FF5500]" />
            <span>Objectif de révision hebdomadaire</span>
          </span>
          <span>{progressPercent}% complété</span>
        </div>
        <div className="w-full bg-black/10 dark:bg-white/10 h-3 rounded-full overflow-hidden border-2 border-black dark:border-white/20">
          <div
            className="bg-gradient-to-r from-amber-500 via-[#FF5500] to-red-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
