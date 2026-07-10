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

// Extraction du contenu YouTube (Innertube API + Watch Page pour transcription intégrale)
async function extractYoutubeContent(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Lien YouTube invalide. Impossible d'extraire l'identifiant de la vidéo.");
  }

  let videoTitle = "";
  let videoAuthor = "";
  let videoDescription = "";
  let transcriptText = "";

  // 1. oEmbed fallback pour Titre & Chaîne
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { cache: "no-store" });
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      videoTitle = oembed.title || "";
      videoAuthor = oembed.author_name || "";
    }
  } catch (e) {}

  // 2. YouTube Innertube API (ANDROID & WEB clients contournent les restrictions serveurs)
  const clients = [
    { clientName: "ANDROID", clientVersion: "18.40.34" },
    { clientName: "WEB", clientVersion: "2.20231214.00.00" }
  ];

  for (const client of clients) {
    if (transcriptText) break;
    try {
      const playerRes = await fetch("https://www.youtube.com/youtubei/v1/player", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: client.clientName,
              clientVersion: client.clientVersion,
              hl: "fr",
              gl: "FR"
            }
          },
          videoId: videoId
        })
      });

      if (playerRes.ok) {
        const data = await playerRes.json();
        const details = data?.videoDetails;
        if (details) {
          if (!videoTitle) videoTitle = details.title || "";
          if (!videoAuthor) videoAuthor = details.author || "";
          if (!videoDescription) videoDescription = details.shortDescription || "";
        }

        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (tracks && Array.isArray(tracks) && tracks.length > 0) {
          const track = tracks.find((t: any) => t.languageCode?.startsWith("fr")) ||
                        tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
                        tracks[0];
          if (track?.baseUrl) {
            const subRes = await fetch(track.baseUrl, { cache: "no-store" });
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
    } catch (e) {}
  }

  // 3. Watch page HTML fallback pour description et sous-titres
  if (!transcriptText) {
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cookie": "CONSENT=YES+cb; SOCS=CAESNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AwGgJlbiACGgYIgK-qpwY;"
        }
      });

      if (watchRes.ok) {
        const html = await watchRes.text();
        const matchPlayer = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script>)/s) ||
                            html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s);

        if (matchPlayer && matchPlayer[1]) {
          try {
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
                const subRes = await fetch(track.baseUrl, { cache: "no-store" });
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
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  const parts = [
    videoTitle ? `TITRE DE LA VIDÉO YOUTUBE : "${videoTitle}"` : "",
    videoAuthor ? `CHAÎNE YOUTUBE : "${videoAuthor}"` : "",
    videoDescription ? `DESCRIPTION & CHAPITRES : \n${videoDescription}` : "",
    transcriptText ? `=== TRANSCRIPTION VERBATIM INTÉGRALE PAROLE PAR PAROLE DE LA VIDÉO ===\n${transcriptText.substring(0, 25000)}` : ""
  ].filter(Boolean);

  if (parts.length === 0) {
    return `Vidéo YouTube ID ${videoId} (URL: ${url})`;
  }

  return parts.join("\n\n");
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
      instructionsSpecifiques = `RÈGLES STRICTES ET IMPÉRATIVES POUR VIDÉO YOUTUBE :
1. INTERDICTION FORMELLE ET ABSOLUE de poser la moindre question sur le titre de la vidéo, le nom de la chaîne, la date ou les métadonnées.
2. Tu DOIS générer les questions EXCLUSIVEMENT ET EN PROFONDEUR à partir des paroles, faits, chiffres, explications concrètes et arguments présents dans la TRANSCRIPTION INTÉGRALE de la vidéo fournie ci-dessus.
3. Chaque question du QCM doit tester un point technique, un concept précis ou une explication prononcée dans la vidéo par l'intervenant.`;
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
