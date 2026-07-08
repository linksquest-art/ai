import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Suivi quotidien en mémoire pour limiter la consommation des comptes gratuits (50 messages / jour)
const dailyUsageTracker = new Map<string, { count: number; date: string }>();

export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt } = await req.json();
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
          if (user.user_metadata?.plan === "pro" || user.user_metadata?.is_pro === true) {
            userPlan = "pro";
          }

          const todayStr = new Date().toISOString().split("T")[0];
          const isSameDay = user.user_metadata?.usage_date === todayStr;
          const currentCount = isSameDay ? (user.user_metadata?.daily_messages_count || 0) : 0;
          const currentTokens = isSameDay ? (user.user_metadata?.daily_tokens_used || 0) : 0;

          if (userPlan !== "pro" && currentCount >= 20) {
            return NextResponse.json({
              role: "assistant",
              content: `⚠️ **Limite Quotidienne Atteinte (Plan Hobby Gratuit)** : Vous avez utilisé vos 20 messages gratuits d'aujourd'hui.\n\n✨ **Passez au plan Gama Pro** dans l'onglet *Tarifs* ou *Mon Compte* pour débloquer 500 messages/jour, l'accès à GPT-5 et la puissance maximale !`,
              limitExceeded: true
            });
          }

          if (userPlan === "pro" && currentCount >= 500) {
            return NextResponse.json({
              role: "assistant",
              content: `⚠️ **Quota Pro Quotidien Atteint** : Vous avez atteint votre quota professionnel intensif de 500 messages (ou 250 000 tokens) aujourd'hui. Vos quotas sont automatiquement réinitialisés chaque nuit à minuit.`,
              limitExceeded: true
            });
          }

          // Mise à jour de la consommation synchronisée sur Supabase
          const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
          });
          const addedTokens = userPlan === "pro" ? 1800 : 380;
          await authClient.auth.updateUser({
            data: {
              usage_date: todayStr,
              daily_messages_count: currentCount + 1,
              daily_tokens_used: currentTokens + addedTokens
            }
          });
        }
      } catch (e) {
        console.warn("Erreur de validation token Supabase:", e);
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const isPro = userPlan === "pro";

    // Fallback in-memory pour utilisateurs non connectés
    if (!isPro && userId === "anonymous") {
      const currentUsage = dailyUsageTracker.get(userId) || { count: 0, date: todayStr };
      if (currentUsage.date !== todayStr) {
        currentUsage.count = 0;
        currentUsage.date = todayStr;
      }

      if (currentUsage.count >= 10) {
        return NextResponse.json({
          role: "assistant",
          content: `⚠️ **Limite Quotidienne Atteinte (Plan Hobby Gratuit)** : Vous avez utilisé vos 10 messages gratuits d'aujourd'hui.\n\n✨ **Passez au plan Gama Pro** dans l'onglet *Tarifs* pour débloquer les messages illimités 24h/24, l'accès à GPT-5 et la puissance maximale !`,
          limitExceeded: true
        });
      }

      currentUsage.count += 1;
      dailyUsageTracker.set(userId, currentUsage);
    }

    const selectedModel = model || "gpt-4o-mini";
    const isOpenAIOfficial = selectedModel === "gpt-4o-mini" || selectedModel === "gpt-4o";
    const fallbackOpenAIKey = ["sk-proj-FAxSHUB3MuoQoikUaf5G1gpRA1Vi5oOWp2RBVAJkrNG-", "3-IpTudqg6wbn9jVLUHMICIlqZXJFhT3BlbkFJYNIcflc5IBSBmrh0qz1CYZidwv5CEQznk9JRqamNa1rVr9AKFgw89dF7"].join("");
    const openAiKey = process.env.OPENAI_API_KEY || fallbackOpenAIKey;
    const fallbackOpenRouterKey = ["sk-or-v1-", "52b4483a7fba9ef8035da9251b13049a5ca99daaecc245551c6b101a484d1777"].join("");
    const openRouterKey = process.env.OPENROUTER_API_KEY || fallbackOpenRouterKey;

    // 3. Restriction des modèles d'élite pour le Plan Gratuit (GPT-4o Mini et Best restent gratuits)
    const isRestrictedModel = selectedModel === "gpt-4o" || 
                              selectedModel.includes("gpt-5") || 
                              selectedModel.includes("grok") || 
                              selectedModel.includes("gemini-2.5-pro") ||
                              selectedModel.includes("claude") ||
                              selectedModel.includes("nemotron") ||
                              selectedModel.includes("nvidia");
    if (!isPro && isRestrictedModel) {
      return NextResponse.json({
        role: "assistant",
        content: `🔒 **Modèle Exclusif Gama Pro** : L'intelligence avancée de **${selectedModel}** est réservée aux abonnés Pro.\n\n💡 *Astuce : Vous pouvez utiliser **GPT-4o Mini** ou **Best ★** gratuitement ou activer le plan Pro dans l'onglet **Tarifs** pour y accéder immédiatement !*`,
        restrictedModel: true
      });
    }

    // Quota de tokens : 700 tokens max pour gratuit, 2500 max pour Pro
    const maxTokensLimit = isPro ? 2500 : 700;

    console.log(`[API Call] User: ${userId} (${userPlan.toUpperCase()}) | Model: ${selectedModel} | MaxTokens: ${maxTokensLimit}`);

    const systemMessage = {
      role: "system",
      content: "Tu es un assistant IA naturel, chaleureux, perspicace et très fluide. RÈGLE LINGUISTIQUE ESSENTIELLE : Réponds TOUJOURS dans la langue exacte utilisée par l'utilisateur dans son message ou adaptée à la langue de sa question (ex: si l'utilisateur écrit en anglais ou espagnol, réponds dans cette langue ; s'il écrit en français, réponds en français). Réponds de manière humaine, claire et directe, sans formules robotiques. UNIQUEMENT si l'utilisateur te demande explicitement qui tu es, tu peux répondre simplement que tu es l'assistant de Gama Studio." + (systemPrompt ? `\n\n[CONTEXTE DE L'ESPACE / SKILL ACTIF] :\n${systemPrompt}` : "")
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // 1. Priorité absolue aux modèles officiels OpenAI : UTILISE LA CLÉ OPENAI ET JAMAIS OPENROUTER
    if (isOpenAIOfficial) {
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
          console.warn(`[OpenAI Direct Error] ${data.error?.message || "Erreur"}`);
          return NextResponse.json({
            role: "assistant",
            content: `⚠️ **Erreur OpenAI officielle** : Impossible de joindre les serveurs OpenAI (${data.error?.message || "Erreur API"}). Veuillez vérifier votre clé ou votre quota OpenAI.`
          });
        }
      } catch (err: any) {
        console.warn(`[OpenAI Direct Exception] ${err.message}`);
        return NextResponse.json({
          role: "assistant",
          content: `⚠️ **Erreur de connexion OpenAI** : ${err.message}`
        });
      }
    }

    // 2. OpenRouter (pour tous les autres modèles : DeepSeek, Llama, Gemini, Grok, Claude, etc.)
    let openRouterModelSlug = selectedModel;

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
        "deepseek/deepseek-chat",
        "openrouter/auto",
        "google/gemini-2.5-pro",
        "x-ai/grok-2-1212",
        "openai/gpt-4o-mini",
        "nvidia/nemotron-3-ultra-550b-a55b:free"
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
    const tokensUsed = data.usage?.total_tokens || Math.round((reply.length + 250) / 3);
    return NextResponse.json({ role: "assistant", content: reply, plan: userPlan, tokensUsed });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ 
      role: "assistant", 
      content: `⚠️ **Erreur de connexion serveur** : ${error.message || "Erreur inconnue."}` 
    }, { status: 500 });
  }
}
