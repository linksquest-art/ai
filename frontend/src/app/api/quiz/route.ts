import { NextRequest, NextResponse } from "next/server";

// Polyfills Node.js pour éviter les erreurs DOMMatrix / canvas lors du build Next.js
if (typeof global !== "undefined") {
  if (!global.DOMMatrix) (global as any).DOMMatrix = class DOMMatrix {};
  if (!(global as any).ImageData) (global as any).ImageData = class ImageData {};
  if (!(global as any).Path2D) (global as any).Path2D = class Path2D {};
}

// Helper pour extraire l'ID vidéo YouTube
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Extraction du contenu YouTube (Titre, Auteur, Description & Sous-titres)
async function extractYoutubeContent(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Lien YouTube invalide. Impossible d'extraire l'identifiant de la vidéo.");
  }

  let videoTitle = "";
  let videoAuthor = "";
  let videoDescription = "";
  let transcriptText = "";

  // 1. oEmbed pour Titre et Chaîne
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      videoTitle = oembed.title || "";
      videoAuthor = oembed.author_name || "";
    }
  } catch (e) {}

  // 2. Watch page pour description et sous-titres
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    if (watchRes.ok) {
      const html = await watchRes.text();

      const matchPlayer = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script>)/s) ||
                          html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s);

      if (matchPlayer && matchPlayer[1]) {
        const playerRes = JSON.parse(matchPlayer[1]);
        const details = playerRes?.videoDetails;
        if (details) {
          if (!videoTitle) videoTitle = details.title || "";
          if (!videoAuthor) videoAuthor = details.author || "";
          videoDescription = details.shortDescription || "";
        }

        const tracks = playerRes?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && Array.isArray(tracks) && tracks.length > 0) {
          const track = tracks.find((t: any) => t.languageCode?.startsWith("fr")) ||
                        tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
                        tracks[0];
          if (track?.baseUrl) {
            const subRes = await fetch(track.baseUrl);
            if (subRes.ok) {
              const xml = await subRes.text();
              const texts = xml.match(/<text[^>]*>([^<]+)<\/text>/g);
              if (texts) {
                transcriptText = texts
                  .map(t => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
                  .join(" ");
              }
            }
          }
        }
      }
    }
  } catch (e) {}

  const combined = [
    videoTitle ? `Titre vidéo : ${videoTitle}` : "",
    videoAuthor ? `Chaîne : ${videoAuthor}` : "",
    videoDescription ? `Description :\n${videoDescription}` : "",
    transcriptText ? `Transcription complète :\n${transcriptText.substring(0, 18000)}` : ""
  ].filter(Boolean).join("\n\n");

  if (!combined.trim()) {
    throw new Error("Impossible d'extraire le contenu ou les sous-titres de cette vidéo YouTube.");
  }

  return combined;
}

export async function POST(req: NextRequest) {
  try {
    const { source, sourceType, pdfBase64, questionCount = 5 } = await req.json();

    let extractedText = "";

    if (sourceType === "youtube" || (typeof source === "string" && (source.includes("youtube.com") || source.includes("youtu.be")))) {
      try {
        extractedText = await extractYoutubeContent(source);
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || "Erreur lors de l'extraction de la vidéo YouTube." },
          { status: 400 }
        );
      }
    } else if (sourceType === "pdf" && pdfBase64) {
      try {
        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const pdfParseMod = require("pdf-parse");
        const pdfData = await pdfParseMod(buffer);
        extractedText = pdfData.text || "";
        if (!extractedText.trim() || extractedText.trim().length < 30) {
          return NextResponse.json(
            { error: "Ce fichier PDF ne contient pas suffisamment de texte sélectionnable (PDF scanné ou image)." },
            { status: 400 }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: "Erreur lors de la lecture du fichier PDF. Veuillez fournir un fichier PDF texte lisible." },
          { status: 400 }
        );
      }
    } else {
      extractedText = typeof source === "string" ? source : "";
      if (!extractedText.trim() || extractedText.trim().length < 30) {
        return NextResponse.json(
          { error: "Le texte source fourni est trop court pour générer un QCM fiable. Veuillez fournir un contenu plus complet." },
          { status: 400 }
        );
      }
    }

    const prompt = `Tu es un professeur d'université expert.
Voici le CONTENU RÉEL ET VÉRIFIÉ de la source étudiée :
"""
${extractedText.substring(0, 20000)}
"""

Génère STRICTEMENT un tableau JSON valide de ${questionCount} questions QCM basées EXCLUSIVEMENT ET PRÉCISÉMENT sur les informations concrètes (faits, dates, concepts, arguments) présentes dans ce texte.
RÈGLES IMPÉRATIVES :
1. N'INVENTE AUCUNE INFORMATION. N'ajoute pas de concepts hors du texte.
2. Renvoie UNIQUEMENT un tableau JSON valide (sans balises markdown ni texte autour).
3. Format exact exigé :
[
  {
    "id": 1,
    "question": "Question précise tirée directement des faits ou concepts de la source...",
    "options": ["Choix A exact", "Choix B erroné", "Choix C erroné", "Choix D erroné"],
    "correctIndex": 0,
    "explanation": "Explication pédagogique citant le passage du texte qui justifie la réponse."
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
        { error: "Clé API non configurée sur le serveur pour la génération du QCM." },
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
          { role: "system", content: "Tu es un assistant pédagogique qui renvoie exclusivement des tableaux JSON valides." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
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

    let parsedQuestions: any[] = [];
    try {
      const matchJson = rawContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (matchJson) {
        parsedQuestions = JSON.parse(matchJson[0]);
      } else {
        parsedQuestions = JSON.parse(rawContent);
      }
    } catch (e) {
      console.error("Erreur parsing JSON QCM:", rawContent);
      return NextResponse.json(
        { error: "Le modèle d'IA n'a pas renvoyé un format QCM JSON valide. Réessayez." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Aucune question QCM n'a pu être extraite de cette source." },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: parsedQuestions, extractedLength: extractedText.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur interne lors de la génération du QCM." },
      { status: 500 }
    );
  }
}
