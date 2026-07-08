import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai.gamastudio.fr"),
  title: "Gama Studio Pro • Plateforme Multi-Modèles d'IA & Veille Web",
  description: "Gama Studio Pro est la plateforme de référence pour exploiter l'intelligence artificielle sans limite. Accédez aux meilleurs modèles (OpenAI GPT-4o, GPT-4o Mini, NVIDIA Nemotron 550B, Llama 3) avec recherche web en direct et reconnaissance vocale temps réel.",
  keywords: ["IA", "Gama Studio", "Chatbot IA", "OpenAI GPT-4o", "Multi-modèle", "NVIDIA Nemotron", "OpenSource", "Veille web", "Recherche IA", "Reconnaissance vocale"],
  authors: [{ name: "Gama Studio Team" }],
  openGraph: {
    title: "Gama Studio Pro • Plateforme Multi-Modèles d'IA & Veille Web",
    description: "Exploitez les modèles d'IA les plus puissants en 100% gratuit avec recherche web et transcription vocale en direct.",
    url: "https://ai.gamastudio.fr",
    siteName: "Gama Studio Pro",
    images: [
      {
        url: "/mascot.png",
        width: 800,
        height: 600,
        alt: "Gama Studio Pro AI Mascot",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gama Studio Pro • IA Multi-Modèles",
    description: "La plateforme ultime pour discuter avec l'IA, effectuer des recherches web et analyser vos documents.",
    images: ["/mascot.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        {/* Purge automatique et silencieuse des anciens cookies obsolètes afin d'éviter toute erreur Vercel 494 chez les visiteurs */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.cookie.split(";").forEach(function(c) {
                  var name = c.trim().split("=")[0];
                  if (name && (name.indexOf("sb-") === 0 || name.indexOf("supabase") === 0)) {
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                  }
                });
              } catch(e) {}
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* Gama Studio Pro Max v2.0 - Production Build */}
        {children}
      </body>
    </html>
  );
}
