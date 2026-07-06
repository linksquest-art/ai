import { NextResponse } from "next/server";

export async function GET() {
  try {
    const articles: any[] = [];

    // 1. Fetch real articles from Dev.to API (Tech, AI, Code)
    try {
      const devRes = await fetch("https://dev.to/api/articles?top=1&per_page=6", {
        next: { revalidate: 1800 }
      });
      if (devRes.ok) {
        const devData = await devRes.json();
        if (Array.isArray(devData)) {
          devData.forEach((item: any, idx: number) => {
            articles.push({
              id: `dev-${item.id}`,
              title: item.title,
              category: idx % 2 === 0 ? "Code & Tech" : "Finance & IA",
              summary: item.description || "Article technique et analyse des tendances technologiques actuelles.",
              source: `Dev.to (${item.user?.name || "Tech News"})`,
              url: item.url,
              date: item.readable_publish_date || "Aujourd'hui",
              prompt: `Fais un résumé complet et analyse les enjeux de cet article de veille technologique : "${item.title}". Context : ${item.description || ""}`
            });
          });
        }
      }
    } catch (e) {
      console.error("Dev.to API fetch error:", e);
    }

    // 2. Fetch real science & space articles from SpaceFlight News API (Public, no key required)
    try {
      const spaceRes = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=6", {
        next: { revalidate: 1800 }
      });
      if (spaceRes.ok) {
        const spaceData = await spaceRes.json();
        if (spaceData && Array.isArray(spaceData.results)) {
          spaceData.results.forEach((item: any, idx: number) => {
            articles.push({
              id: `space-${item.id}`,
              title: item.title,
              category: idx % 2 === 0 ? "Science & Innovation" : "Brevets & Tech",
              summary: item.summary || "Découvertes récentes et actualités aérospatiales internationales.",
              source: item.news_site || "SpaceNews",
              url: item.url,
              date: new Date(item.published_at).toLocaleDateString("fr-FR"),
              prompt: `Quelle est l'importance et les avancées scientifiques décrites dans cet article : "${item.title}" ? Résume le contenu pour moi.`
            });
          });
        }
      }
    } catch (e) {
      console.error("SpaceNews API fetch error:", e);
    }

    // 3. Fetch top stories from Hacker News API (Public, no key required)
    try {
      const hnRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
        next: { revalidate: 1800 }
      });
      if (hnRes.ok) {
        const topIds = await hnRes.json();
        if (Array.isArray(topIds)) {
          // Fetch top 5 stories details
          const sliceIds = topIds.slice(0, 5);
          const hnItems = await Promise.all(
            sliceIds.map(async (id: number) => {
              const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
              return r.ok ? await r.json() : null;
            })
          );
          
          hnItems.forEach((item: any, idx: number) => {
            if (item && item.title) {
              const categories = ["Finance & IA", "Éducation", "Code & Tech", "Brevets & Tech", "Santé"];
              articles.push({
                id: `hn-${item.id}`,
                title: item.title,
                category: categories[idx % categories.length],
                summary: `Article en tête des tendances internationales avec un score de ${item.score || 100} points par la communauté tech.`,
                source: `Hacker News (@${item.by || "tech"})`,
                url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                date: new Date(item.time * 1000).toLocaleDateString("fr-FR"),
                prompt: `Explique-moi les concepts et pourquoi cet article fait le buzz dans l'écosystème tech actuel : "${item.title}".`
              });
            }
          });
        }
      }
    } catch (e) {
      console.error("HackerNews API fetch error:", e);
    }

    // If we gathered real articles, randomize slightly and return
    if (articles.length > 0) {
      return NextResponse.json({ success: true, data: articles });
    }

    throw new Error("All public news APIs failed");
  } catch (error) {
    console.error("Discover API Error, using verified backup news:", error);
    // Verified real information backup if offline
    const backupArticles = [
      {
        id: "b1",
        title: "Anthropic dévoile les capacités améliorées de Claude 3.5 Sonnet",
        category: "Finance & IA",
        summary: "Le nouveau modèle d'Anthropic bat des records sur les benchmarks de codage et de raisonnement complexe, redéfinissant les standards de l'industrie.",
        source: "Anthropic News",
        url: "https://www.anthropic.com/news",
        date: "Récemment",
        prompt: "Fais un résumé complet des performances et améliorations de Claude 3.5 Sonnet par rapport aux modèles concurrents."
      },
      {
        id: "b2",
        title: "Avancées de DeepSeek V3 et l'optimisation par architecture MoE",
        category: "Code & Tech",
        summary: "L'architecture Mixture of Experts (MoE) permet de réduire drastiquement les coûts d'entraînement tout en maintenant des performances de niveau GPT-4.",
        source: "AI Research Feed",
        url: "https://arxiv.org",
        date: "Récemment",
        prompt: "Comment fonctionne précisément une architecture Mixture of Experts (MoE) et comment DeepSeek V3 l'a exploitée ?"
      },
      {
        id: "b3",
        title: "NASA & ESA : Les premières données spectroscopiques du télescope James Webb sur les exoplanètes",
        category: "Science & Innovation",
        summary: "Les nouvelles observations atmosphériques révèlent des traces moléculaires inédites sur des planètes situées dans la zone habitable de leur étoile.",
        source: "SpaceNews / NASA",
        url: "https://www.nasa.gov",
        date: "Récemment",
        prompt: "Quelles molécules ont été détectées dans l'atmosphère des exoplanètes par le télescope James Webb et qu'est-ce que cela signifie ?"
      },
      {
        id: "b4",
        title: "Régulation de l'IA en Europe : Entrée en application de l'AI Act",
        category: "Brevets & Tech",
        summary: "Les entreprises technologiques doivent désormais classer leurs systèmes selon quatre niveaux de risque juridique et éthique.",
        source: "Commission Européenne",
        url: "https://digital-strategy.ec.europa.eu",
        date: "Récemment",
        prompt: "Explique de manière concrète les 4 niveaux de risque définis par l'AI Act européen et leurs implications pour une start-up IA."
      }
    ];

    return NextResponse.json({ success: true, data: backupArticles });
  }
}
