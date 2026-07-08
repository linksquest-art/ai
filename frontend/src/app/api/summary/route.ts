import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, format, notes } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL YouTube requise" }, { status: 400 });
    }

    // Extract videoId
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) {
      return NextResponse.json({ error: "ID YouTube invalide" }, { status: 400 });
    }

    // 1. Fetch YouTube oEmbed & Watch page metadata + transcript
    let videoTitle = "";
    let videoAuthor = "";
    let videoDescription = "";
    let transcriptText = "";

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        videoTitle = oembed.title || "";
        videoAuthor = oembed.author_name || "";
      }
    } catch (e) {
      console.warn("oembed fetch error", e);
    }

    // Fetch watch page HTML to get description and captions
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });

      if (watchRes.ok) {
        const html = await watchRes.text();

        // Try extract ytInitialPlayerResponse
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

            // Extract captions if available
            const tracks = playerRes?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (tracks && Array.isArray(tracks) && tracks.length > 0) {
              // Prefer French or English track
              const track = tracks.find((t: any) => t.languageCode?.startsWith("fr")) ||
                            tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
                            tracks[0];
              if (track?.baseUrl) {
                const subRes = await fetch(track.baseUrl);
                if (subRes.ok) {
                  const xml = await subRes.text();
                  // Parse xml texts
                  const texts = xml.match(/<text[^>]*>([^<]+)<\/text>/g);
                  if (texts) {
                    transcriptText = texts
                      .map(t => t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
                      .join(" ");
                  }
                }
              }
            }
          } catch (e) {
            console.warn("playerRes parse error", e);
          }
        }
      }
    } catch (e) {
      console.warn("watch page fetch error", e);
    }

    // Build rich context for LLM
    const contextContent = [
      videoTitle ? `Titre de la vidéo : "${videoTitle}"` : "",
      videoAuthor ? `Chaîne YouTube : "${videoAuthor}"` : "",
      videoDescription ? `Description officielle & chapitres de la vidéo :\n${videoDescription}` : "",
      transcriptText ? `Transcription / sous-titres complets de la vidéo :\n${transcriptText.substring(0, 15000)}` : ""
    ].filter(Boolean).join("\n\n");

    const prompt = `Tu es un analyste et synthétiseur expert.
Voici LES DONNÉES ET LE CONTENU RÉEL de la vidéo YouTube (ID: ${videoId}) :

${contextContent || `Vidéo URL : ${url}`}

${notes ? `Focus ou instructions supplémentaires de l'utilisateur : ${notes}\n` : ""}
Format demandé : "${format}".

RÈGLES D'OR ABSOLUES :
1. NE DIS JAMAIS "Je n'ai pas accès à la vidéo" ni "ce modèle est générique" ni "Je suis l'IA officielle de...". Tu disposes ci-dessus des métadonnées, de la description et/ou de la transcription du contenu.
2. Rédige une synthèse 100% concrète, détaillée, structurée en Markdown propre et agréable à lire.
3. Si le format demande des horodatages ou des chapitres, utilise les informations de la description et du contenu pour structurer précisément la réponse.`;

    // Forward to internal AI chat handler
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    const isOpenAI = !!process.env.OPENAI_API_KEY;

    const endpoint = isOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

    const model = isOpenAI ? "gpt-4o-mini" : "deepseek/deepseek-chat";

    if (!apiKey) {
      return NextResponse.json({
        content: `# 🎬 ${videoTitle || "Résumé de la vidéo"}\n\n**Chaîne** : ${videoAuthor || "YouTube"}\n\n### 📝 Synthèse & Informations\n${videoDescription || "Analyse en cours..."}`
      });
    }

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Tu es un synthétiseur expert, direct et naturel. Ne te présente pas, va droit au but avec un résumé de haute qualité."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI API Error:", errText);
      throw new Error("Erreur LLM API");
    }

    const aiData = await aiRes.json();
    const resultText = aiData.choices?.[0]?.message?.content || "Aucun résumé généré.";

    return NextResponse.json({ content: resultText, title: videoTitle, author: videoAuthor });
  } catch (error: any) {
    console.error("Summary API Error:", error);
    return NextResponse.json(
      { error: "Impossible de générer le résumé YouTube." },
      { status: 500 }
    );
  }
}
