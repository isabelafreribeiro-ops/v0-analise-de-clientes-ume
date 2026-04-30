"use client";

import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00C853]">
            <span className="text-xl font-bold text-white">U</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Ume</h1>
            <p className="text-xs text-[#64748b]">Dashboard de Análise</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-6">
          <a
            href="#"
            className="flex items-center gap-2 text-sm font-medium text-[#00C853] hover:text-[#009e3f] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Funil de Aquisição
          </a>
        </nav>
      </div>
    </header>
  );
}
