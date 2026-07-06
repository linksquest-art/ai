import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    const selectedModel = model || "gpt-4o-mini";
    const isOpenAIOfficial = selectedModel === "gpt-4o-mini" || selectedModel === "gpt-4o";
    const openAiKey = process.env.OPENAI_API_KEY || "";
    const openRouterKey = process.env.OPENROUTER_API_KEY || "";

    console.log(`[API Call] Selected model: ${selectedModel}`);

    const systemMessage = {
      role: "system",
      content: "Tu es l'intelligence artificielle officielle de Gama Studio Pro, une plateforme d'IA avancée et ultra-performante. Quand on te demande qui tu es, tu dois TOUJOURS te présenter fièrement comme l'IA de Gama Studio Pro. Sois concis, direct, utile et courtois en français afin d'offrir une efficacité maximale."
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // 1. Priorité aux modèles officiels OpenAI en appel direct bridé (pour économiser le budget)
    if (isOpenAIOfficial && openAiKey) {
      console.log(`[OpenAI Official Call] Attempting direct model: ${selectedModel} (Bridé à 700 tokens max)`);
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
            max_tokens: 700, // Bridé pour ne pas consommer de trop gros quotas
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (response.ok && !data.error) {
          const reply = data.choices?.[0]?.message?.content || "Oups, aucune réponse textuelle reçue de l'IA.";
          return NextResponse.json({ role: "assistant", content: reply });
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
          max_tokens: 700 // Également bridé sur OpenRouter
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
    return NextResponse.json({ role: "assistant", content: reply });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ 
      role: "assistant", 
      content: `⚠️ **Erreur de connexion serveur** : ${error.message || "Erreur inconnue."}` 
    }, { status: 500 });
  }
}
