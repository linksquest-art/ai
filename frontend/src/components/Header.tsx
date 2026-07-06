import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full z-10 relative border-b-4 border-ink/10 mb-6 bg-paper/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link href="/" className="group flex items-center gap-2">
          <div className="bg-ink text-white p-2 rounded-xl border-2 border-ink group-hover:bg-primary transition-colors">
            <Star size={24} fill="currentColor" />
          </div>
          <span className="text-3xl font-black tracking-tight text-ink border-3 border-ink px-4 py-1.5 bg-white rounded-xl cartoon-shadow rotate-[-2deg] inline-block group-hover:rotate-0 transition-all">
            Gama Studio
          </span>
        </Link>
      </div>
      <nav className="flex gap-8 items-center font-extrabold text-xl text-ink">
        <Link href="/pricing" className="hover:text-primary transition-colors underline-offset-8 hover:underline decoration-4">Tarifs</Link>
        <Link href="/about" className="hover:text-primary transition-colors underline-offset-8 hover:underline decoration-4 hidden sm:inline">À Propos</Link>
        <Link href="/login" className="cartoon-btn text-base py-2.5 px-6 gap-2 ml-2 bg-white hover:bg-ink hover:text-white">
          <MessageSquare size={20} />
          <span>Connexion</span>
        </Link>
      </nav>
    </header>
  );
}
