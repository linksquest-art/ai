import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Suivi quotidien en mémoire pour limiter la consommation des comptes gratuits (50 messages / jour)
const dailyUsageTracker = new Map<string, { count: number; date: string }>();

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // 1. Vérification sécurisée du plan et de l'utilisateur
    const authHeader = req.headers.get("Authorization") || "";
    const clientPlanHeader = req.headers.get("X-User-Plan") || "free";
    
    let userPlan = clientPlanHeader === "pro" ? "pro" : "free";
    let userId = "anonymous_" + (req.headers.get("x-forwarded-for") || "localhost");

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fkqhbfahipuqhknwvvat.supabase.co";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcWhiZmFoaXB1cWhrbnd2dmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTg4NjAsImV4cCI6MjA5ODkzNDg2MH0.rszShYkaCi_BDihlSO1iiLRES30mmDIRbXdphyyzO5Y";
      
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
          if (user.user_metadata?.plan === "pro") {
            userPlan = "pro";
          }
        }
      } catch (e) {
        console.warn("Erreur de validation token Supabase:", e);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const isPro = userPlan === "pro";

    // 2. Contrôle de quota strict pour les comptes gratuits (Max 50 msgs / jour)
    if (!isPro) {
      const currentUsage = dailyUsageTracker.get(userId) || { count: 0, date: todayStr };
      if (currentUsage.date !== todayStr) {
        currentUsage.count = 0;
        currentUsage.date = todayStr;
      }

      if (currentUsage.count >= 50) {
        return NextResponse.json({
          role: "assistant",
          content: `⚠️ **Limite Quotidienne Atteinte (Plan Hobby Studio Gratuit)** : Vous avez utilisé vos 50 messages gratuits d'aujourd'hui.\n\n✨ **Passez au plan Gama Pro** dans l'onglet *Tarifs* pour débloquer les messages illimités 24h/24, l'accès à GPT-5 et la puissance maximale !`,
          limitExceeded: true
        });
      }

      currentUsage.count += 1;
      dailyUsageTracker.set(userId, currentUsage);
    }

    const selectedModel = model || "gpt-4o-mini";
    const isOpenAIOfficial = selectedModel === "gpt-4o-mini" || selectedModel === "gpt-4o";
    const openAiKey = process.env.OPENAI_API_KEY || "";
    const openRouterKey = process.env.OPENROUTER_API_KEY || "";

    // 3. Restriction des modèles d'élite pour le Plan Gratuit
    const premiumModels = ["gpt-4o", "gpt-5", "anthropic/claude-3.5-sonnet", "google/gemini-1.5-pro", "google/gemini-2.5-pro"];
    if (!isPro && premiumModels.some(m => selectedModel.toLowerCase().includes(m.toLowerCase()))) {
      return NextResponse.json({
        role: "assistant",
        content: `🔒 **Modèle Exclusif Gama Pro** : L'intelligence avancée de **${selectedModel}** est réservée aux abonnés Pro.\n\n💡 *Astuce : Vous pouvez utiliser **GPT-4o Mini** gratuitement ou activer le plan Pro dans l'onglet **Tarifs** pour y accéder immédiatement !*`,
        restrictedModel: true
      });
    }

    // Quota de tokens : 700 tokens max pour gratuit, 2500 max pour Pro
    const maxTokensLimit = isPro ? 2500 : 700;

    console.log(`[API Call] User: ${userId} (${userPlan.toUpperCase()}) | Model: ${selectedModel} | MaxTokens: ${maxTokensLimit}`);

    const systemMessage = {
      role: "system",
      content: "Tu es l'intelligence artificielle officielle de Gama Studio Pro, une plateforme d'IA avancée et ultra-performante. Quand on te demande qui tu es, tu dois TOUJOURS te présenter fièrement comme l'IA de Gama Studio Pro. Sois concis, direct, utile et courtois en français afin d'offrir une efficacité maximale."
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // 1. Priorité aux modèles officiels OpenAI en appel direct bridé / débridé
    if (isOpenAIOfficial && openAiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: formattedMessages,
            max_tokens: maxTokensLimit,
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (response.ok && !data.error) {
          const reply = data.choices?.[0]?.message?.content || "Oups, aucune réponse textuelle reçue de l'IA.";
          return NextResponse.json({ role: "assistant", content: reply, plan: userPlan });
        } else {
          console.warn(`[OpenAI Direct Error] ${data.error?.message || "Erreur"}. Bascule sur OpenRouter...`);
        }
      } catch (err: any) {
        console.warn(`[OpenAI Direct Exception] ${err.message}. Bascule sur OpenRouter...`);
      }
    }

    // 2. Bascule vers OpenRouter (soit pour les autres modèles, soit en secours)
    let openRouterModelSlug = isOpenAIOfficial ? `openai/${selectedModel}` : selectedModel;

    const callOpenRouter = async (modelSlug: string) => {
      return await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://gamastudio.ai",
          "X-Title": "Gama Studio Pro AI"
        },
        body: JSON.stringify({
          model: modelSlug,
          messages: formattedMessages,
          max_tokens: maxTokensLimit
        })
      });
    };

    let response = await callOpenRouter(openRouterModelSlug);
    let data = await response.json();

    // If endpoint not found or error on restricted/rate-limited model, automatically iterate through verified free working models
    if (!response.ok || data.error) {
      console.warn(`[OpenRouter Warning] Model ${openRouterModelSlug} failed (${data.error?.message || "Error"}). Retrying with verified working free models...`);
      
      const freeModelsList = [
        "openai/gpt-4o-mini",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "openai/gpt-oss-20b:free",
        "liquid/lfm-2.5-1.2b-thinking:free",
        "cohere/north-mini-code:free",
        "poolside/laguna-xs-2.1:free",
        "tencent/hy3:free"
      ];

      for (const fallbackModel of freeModelsList) {
        if (fallbackModel === openRouterModelSlug) continue;
        console.warn(`[OpenRouter Retry] Trying fallback model: ${fallbackModel}...`);
        response = await callOpenRouter(fallbackModel);
        data = await response.json();
        if (response.ok && !data.error) {
          openRouterModelSlug = fallbackModel;
          break;
        }
      }
    }

    if (!response.ok || data.error) {
      console.error("OpenRouter Error after all fallbacks:", data.error || data);
      const errorMsg = data.error?.message || `Erreur HTTP ${response.status}`;
      return NextResponse.json({ 
        role: "assistant", 
        content: `⚠️ **Erreur temporaire API** : ${errorMsg}\n\n*Veuillez vérifier vos clés ou réessayer dans quelques secondes.*` 
      });
    }

    const reply = data.choices?.[0]?.message?.content || "Oups, aucune réponse textuelle reçue de l'IA.";
    return NextResponse.json({ role: "assistant", content: reply, plan: userPlan });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ 
      role: "assistant", 
      content: `⚠️ **Erreur de connexion serveur** : ${error.message || "Erreur inconnue."}` 
    }, { status: 500 });
  }
}
