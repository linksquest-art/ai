"use client";

import React, { useState } from "react";
import { X, Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion Google");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("🎉 Compte créé avec succès ! Connexion instantanée...");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("✅ Connexion réussie !");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      let msg = err.message;
      if (msg === "Invalid login credentials") msg = "Email ou mot de passe incorrect.";
      if (msg === "User already registered") msg = "Cet email est déjà inscrit.";
      setError(msg || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] border-4 border-black animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          title="Fermer"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Header Mascot / Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-[#FF4500]/10 rounded-2xl border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#000000]">
            <Sparkles className="w-7 h-7 text-[#FF4500]" />
          </div>
          <h2 className="text-2xl font-black text-black">
            {isSignUp ? "Créer un compte Pro" : "Connexion Gama Studio"}
          </h2>
          <p className="text-xs font-bold text-black/60 mt-1 max-w-[280px]">
            Sauvegardez votre historique dans le Cloud & synchronisez sur PC, Mac et mobile.
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-white border-2 border-black font-black text-sm flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuer avec Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t-2 border-black/10 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-black tracking-widest text-black/40 uppercase absolute">
            Ou par Email
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 flex items-start gap-2.5 text-red-700 text-xs font-bold animate-in shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 flex items-start gap-2.5 text-emerald-800 text-xs font-bold">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-black/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-black font-bold text-sm bg-black/[0.02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-black/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-black font-bold text-sm bg-black/[0.02] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#FF4500] text-white border-2 border-black font-black text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000000] hover:bg-[#E03E00] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} strokeWidth={2.5} />
                Créer mon compte Pro
              </>
            ) : (
              <>
                <LogIn size={18} strokeWidth={2.5} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Signup */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs font-black text-black/70 hover:text-[#FF4500] underline underline-offset-4 transition-colors"
          >
            {isSignUp
              ? "Vous avez déjà un compte ? Connectez-vous ici"
              : "Pas encore de compte ? Inscrivez-vous gratuitement"}
          </button>
        </div>

      </div>
    </div>
  );
}
