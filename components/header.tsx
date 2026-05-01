"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img 
            src="https://framerusercontent.com/images/pNtPTWHkvXSPqlOFosuumgsDJmQ.svg"
            alt="Ume Logo"
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Ume</h1>
            <p className="text-xs text-[#64748b]">Dashboard de Análise</p>
          </div>
        </div>
      </div>
    </header>
  );
}
