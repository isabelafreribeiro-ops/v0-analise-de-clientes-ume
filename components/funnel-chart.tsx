"use client";

import { useMemo } from "react";
import type { FunnelStep } from "@/lib/types";

interface FunnelChartProps {
  data: FunnelStep[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  if (data.length === 0) return null;

  // Cores do funil: #00C853 (maior) -> progressivamente mais escuro
  const FUNNEL_COLORS = [
    { bg: "#00C853", text: "#001a0f" },   // Primary green - brightest
    { bg: "#009e3f", text: "#001a0f" },   // Darker
    { bg: "#007a30", text: "white" },     // Darker
    { bg: "#005a22", text: "white" },     // Darker
    { bg: "#003d16", text: "white" },     // Darkest
  ];

  return (
    <div className="flex flex-col gap-3">
      {data.map((step, index) => {
        // Bar width based on ratio to first step value
        // Each bar gets narrower or stays same width as it progresses
        const firstStepValue = data[0].value;
        const widthPercentage = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0;
        // Clamp to min 10% for readability
        const displayWidth = Math.max(widthPercentage, 10);
        
        const isLast = index === data.length - 1;
        
        const colorIndex = Math.min(index, FUNNEL_COLORS.length - 1);
        const { bg, text } = FUNNEL_COLORS[colorIndex];

        return (
          <div key={step.name} className="relative">
            <div className="flex items-center gap-4">
              {/* Barra do funil */}
              <div className="relative flex-1">
                <div
                  className="relative flex min-h-[72px] items-center justify-between rounded-lg px-4 py-3 transition-all duration-500"
                  style={{ 
                    width: `${displayWidth}%`,
                    backgroundColor: bg,
                    color: text
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{step.name}</span>
                    <span className="text-2xl font-bold">
                      {step.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {step.percentage.toFixed(1)}% do total
                    </span>
                    {!isLast && step.dropoffRate > 0 && (
                      <span className="text-xs opacity-80">
                        -{step.dropoffRate.toFixed(1)}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Indicador de drop-off */}
              {!isLast && (
                <div className="flex h-8 w-8 items-center justify-center">
                  <svg
                    className="h-5 w-5 text-[#cbd5e1]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
