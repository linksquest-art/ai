import { NextRequest, NextResponse } from "next/server";

// Polyfills Node.js pour éviter les erreurs DOMMatrix / canvas lors du build Next.js
if (typeof global !== "undefined") {
  if (!global.DOMMatrix) (global as any).DOMMatrix = class DOMMatrix {};
  if (!(global as any).ImageData) (global as any).ImageData = class ImageData {};
  if (!(global as any).Path2D) (global as any).Path2D = class Path2D {};
}

import { YoutubeTranscript } from 'youtube-transcript';

// Helper pour extraire l'ID vidéo YouTube
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Extraction du contenu YouTube via youtube-transcript
async function extractYoutubeContent(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Lien YouTube invalide. Impossible d'extraire l'identifiant de la vidéo.");
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      throw new Error("La transcription est vide.");
    }
    const transcriptText = transcript.map(t => t.text).join(" ");
    
    return `[TRANSCRIPTION DU CONTENU PAROLE PAR PAROLE] :\n${transcriptText.substring(0, 18000)}`;
  } catch (e: any) {
    throw new Error("Impossible d'extraire les sous-titres de cette vidéo YouTube. Assurez-vous que la vidéo possède des sous-titres publics. Erreur: " + e.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source, sourceType, pdfBase64, questionCount = 5, difficulty = "Moyen" } = await req.json();

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
      if (!extractedText.trim() || extractedText.trim().length < 3) {
        return NextResponse.json(
          { error: "Veuillez fournir un sujet, un thème ou un cours pour générer le QCM." },
          { status: 400 }
        );
      }
    }

    const isYoutubeSource = sourceType === "youtube" || (typeof source === "string" && (source.includes("youtube.com") || source.includes("youtu.be")));
    const isShortTheme = !isYoutubeSource && sourceType !== "pdf" && extractedText.trim().length <= 350;

    let difficultyInstruction = "";
    if (difficulty === "Facile") {
      difficultyInstruction = "NIVEAU DE DIFFICULTÉ : Facile. Les questions doivent être directes, axées sur les concepts de base et la mémorisation simple.";
    } else if (difficulty === "Difficile") {
      difficultyInstruction = "NIVEAU DE DIFFICULTÉ : Difficile. Les questions doivent nécessiter de la réflexion, l'application de concepts, et proposer des pièges subtils.";
    } else if (difficulty === "Expert") {
      difficultyInstruction = "NIVEAU DE DIFFICULTÉ : Expert (Niveau Universitaire/Recherche). Les questions doivent être extrêmement pointues, analyser des cas complexes, et inclure des pièges hautement sophistiqués.";
    } else {
      difficultyInstruction = "NIVEAU DE DIFFICULTÉ : Moyen. Les questions doivent être équilibrées, testant la compréhension générale avec quelques questions demandant plus de réflexion.";
    }

    let instructionsSpecifiques = "";
    if (isYoutubeSource) {
      instructionsSpecifiques = `RÈGLES STRICTES POUR VIDÉO YOUTUBE :
1. INTERDICTION FORMELLE ET ABSOLUE de poser la moindre question sur le titre de la vidéo, le nom du créateur/de la chaîne, la date ou les métadonnées de publication.
2. Tes questions doivent porter EXCLUSIVEMENT ET EN PROFONDEUR sur le CONTENU PÉDAGOGIQUE, SCIENTIFIQUE, HISTORIQUE OU TECHNIQUE abordé dans la vidéo.
3. Si la transcription complète est fournie, teste précisément les concepts, explications et arguments abordés par le conférencier. Si seule une synthèse ou le sujet de la vidéo est disponible, agis en professeur universitaire expert pour poser des questions académiques pointues et techniques sur ce sujet précis.`;
    } else if (isShortTheme) {
      instructionsSpecifiques = `RÈGLES STRICTES POUR UN THÈME / SUJET D'ÉTUDE :
1. L'utilisateur a fourni un THÈME ou SUJET D'ÉTUDE : « ${extractedText.trim()} ».
2. Tu dois agir en tant que professeur d'université expert de cette discipline et concevoir un examen QCM de niveau académique supérieur sur ce thème précis.
3. INTERDICTION DE POSER DES QUESTIONS VAGUES, BANALES OU TROP LARGES/SUPERFICIELLES. Pose des questions techniques, pointues, rigoureuses et approfondies (mécanismes, concepts clés, dates fondamentales, théorèmes ou analyses) pour évaluer une vraie maîtrise spécialisée du sujet.`;
    } else {
      instructionsSpecifiques = `RÈGLES STRICTES POUR COURS / DOCUMENT COMPLET :
1. L'utilisateur a fourni un cours complet ou document détaillé.
2. Tes questions doivent porter EXCLUSIVEMENT ET PRÉCISÉMENT sur les informations concrètes, faits, concepts, formules et arguments enseignés dans ce texte. N'invente pas d'informations hors du cours.`;
    }

    const prompt = `Tu es un professeur d'université expert dans l'évaluation académique.

SOURCE ÉTUDIÉE :
"""
${extractedText.substring(0, 20000)}
"""

${difficultyInstruction}

${instructionsSpecifiques}

Génère STRICTEMENT un tableau JSON valide de ${questionCount} questions QCM.
RÈGLES IMPÉRATIVES :
1. Renvoie UNIQUEMENT un tableau JSON valide (sans balises markdown ni texte autour).
2. Format exact exigé :
[
  {
    "id": 1,
    "question": "Question précise, technique et pertinente...",
    "options": ["Choix A exact et complet", "Choix B plausible mais faux", "Choix C erroné", "Choix D erroné"],
    "correctIndex": 0,
    "explanation": "Explication pédagogique détaillée justifiant la bonne réponse."
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
