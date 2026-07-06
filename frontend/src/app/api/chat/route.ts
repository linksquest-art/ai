import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    // Use environment variable (stored in .env.local or Vercel Env Vars)
    const apiKey = process.env.OPENROUTER_API_KEY || "";

    // Map selected UI model or fallback to guaranteed working free model
    let openRouterModel = model || "nvidia/nemotron-3-ultra-550b-a55b:free";

    console.log(`[OpenRouter API Call] Attempting model: ${openRouterModel}`);

    const systemMessage = {
      role: "system",
      content: "Tu es l'intelligence artificielle officielle de Gama Studio Pro, une plateforme d'IA avancée de référence et ultra-performante. Quand on te demande qui tu es, tu dois TOUJOURS te présenter fièrement comme l'IA de Gama Studio Pro. Ne dis jamais que tu es ChatGPT, OpenAI, Claude ou Llama. Réponds toujours de manière claire, utile, professionnelle et en français."
    };

    const formattedMessages = [
      systemMessage,
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const callOpenRouter = async (modelSlug: string) => {
      return await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://gamastudio.ai",
          "X-Title": "Gama Studio Pro AI"
        },
        body: JSON.stringify({
          model: modelSlug,
          messages: formattedMessages
        })
      });
    };

    let response = await callOpenRouter(openRouterModel);
    let data = await response.json();

    // If endpoint not found or error on restricted/rate-limited model, automatically iterate through verified free working models
    if (!response.ok || data.error) {
      console.warn(`[OpenRouter Warning] Model ${openRouterModel} failed (${data.error?.message || "Error"}). Retrying with verified working free models...`);
      
      const freeModelsList = [
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "openai/gpt-oss-20b:free",
        "liquid/lfm-2.5-1.2b-thinking:free",
        "cohere/north-mini-code:free",
        "poolside/laguna-xs-2.1:free",
        "tencent/hy3:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
      ];

      for (const fallbackModel of freeModelsList) {
        if (fallbackModel === openRouterModel) continue;
        console.warn(`[OpenRouter Retry] Trying fallback model: ${fallbackModel}...`);
        response = await callOpenRouter(fallbackModel);
        data = await response.json();
        if (response.ok && !data.error) {
          openRouterModel = fallbackModel;
          break;
        }
      }
    }

    if (!response.ok || data.error) {
      console.error("OpenRouter Error after all fallbacks:", data.error || data);
      const errorMsg = data.error?.message || `Erreur HTTP ${response.status}`;
      return NextResponse.json({ 
        role: "assistant", 
        content: `⚠️ **Erreur temporaire OpenRouter** : ${errorMsg}\n\n*Veuillez réessayer dans quelques secondes.*` 
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
