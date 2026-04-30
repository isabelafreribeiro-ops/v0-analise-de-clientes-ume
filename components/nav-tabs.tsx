"use client";

import { BarChart3, Zap, Route, DollarSign, CreditCard } from "lucide-react";

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: NavTab[] = [
  { id: "aquisicao", label: "Aquisição", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "segmentacao", label: "Segmentação", icon: <Zap className="h-4 w-4" /> },
  { id: "jornada", label: "Jornada", icon: <Route className="h-4 w-4" /> },
  { id: "rentabilidade", label: "Rentabilidade", icon: <DollarSign className="h-4 w-4" /> },
  { id: "credito", label: "Crédito", icon: <CreditCard className="h-4 w-4" /> },
];

interface NavTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <div className="border-b border-[#E2E8F0] bg-white">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[#00C853] text-[#1a1a1a]"
                : "border-transparent text-[#64748b] hover:text-[#00C853]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
