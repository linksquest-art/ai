import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { source, cardCount = 10, category = "Révision" } = await req.json();

    const extractedText = typeof source === "string" ? source : "";
    if (!extractedText.trim() || extractedText.trim().length < 3) {
      return NextResponse.json(
        { error: "Veuillez fournir un sujet, un thème ou un cours pour générer les Flashcards." },
        { status: 400 }
      );
    }

    const prompt = `Tu es un professeur d'université et spécialiste en sciences cognitives appliquées à la répétition espacée (Spaced Repetition).

SOURCE OU SUJET DE RÉVISION :
"""
${extractedText.substring(0, 20000)}
"""

Génère STRICTEMENT un tableau JSON valide de ${cardCount} Flashcards de niveau académique et pédagogique supérieur sur ce sujet.

RÈGLES IMPÉRATIVES :
1. Renvoie UNIQUEMENT un tableau JSON valide (sans balises markdown ni texte autour).
2. Chaque carte doit être claire, percutante et optimisée pour l'ancrage mémoriel (recto = question claire ou concept clé à définir ; verso = réponse complète, structurée et précise).
3. Format exact exigé :
[
  {
    "id": 1,
    "recto": "Question précise, théorème ou concept clé à maîtriser...",
    "verso": "Réponse complète, explication claire, formule ou exemple concret...",
    "category": "${category}"
  }
]`;

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    const isOpenAI = !!process.env.OPENAI_API_KEY;
    const endpoint = isOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
    const model = isOpenAI ? "gpt-4o-mini" : "deepseek/deepseek-chat";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API non configurée sur le serveur pour la génération des Flashcards." },
        { status: 500 }
      );
    }

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "Tu es un assistant pédagogique expert qui renvoie exclusivement des tableaux JSON valides." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: "Erreur de communication avec le modèle d'IA." },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const rawContent = aiData?.choices?.[0]?.message?.content || "";

    let parsedCards: any[] = [];
    try {
      const matchJson = rawContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (matchJson) {
        parsedCards = JSON.parse(matchJson[0]);
      } else {
        parsedCards = JSON.parse(rawContent);
      }
    } catch (e) {
      console.error("Erreur parsing JSON Flashcards:", rawContent);
      return NextResponse.json(
        { error: "Le modèle d'IA n'a pas renvoyé un format Flashcards JSON valide. Réessayez." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
      return NextResponse.json(
        { error: "Aucune carte n'a pu être extraite de cette source." },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards: parsedCards });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur interne lors de la génération des Flashcards." },
      { status: 500 }
    );
  }
}
