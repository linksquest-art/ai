import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gama Studio Pro • Plateforme Multi-Modèles d'IA & Veille Web",
  description: "Gama Studio Pro est la plateforme de référence pour exploiter l'intelligence artificielle sans limite. Accédez aux meilleurs modèles (OpenAI GPT-4o, GPT-4o Mini, NVIDIA Nemotron 550B, Llama 3) avec recherche web en direct et reconnaissance vocale temps réel.",
  keywords: ["IA", "Gama Studio", "Chatbot IA", "OpenAI GPT-4o", "Multi-modèle", "NVIDIA Nemotron", "OpenSource", "Veille web", "Recherche IA", "Reconnaissance vocale"],
  authors: [{ name: "Gama Studio Team" }],
  openGraph: {
    title: "Gama Studio Pro • Plateforme Multi-Modèles d'IA & Veille Web",
    description: "Exploitez les modèles d'IA les plus puissants en 100% gratuit avec recherche web et transcription vocale en direct.",
    url: "https://gamastudio.ai",
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
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
