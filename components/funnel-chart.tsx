"use client";

import { useMemo } from "react";
import type { FunnelStep } from "@/lib/types";

interface FunnelChartProps {
  data: FunnelStep[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  if (data.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.map((step, index) => {
        const widthPercentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
        const isLast = index === data.length - 1;
        
        // Gradiente de cores verde Ume (accent -> primary -> mais escuro)
        const colors = [
          { bg: "bg-[#00ff6a]", text: "text-[#001a0f]" }, // Accent - mais brilhante
          { bg: "bg-[#00C853]", text: "text-[#001a0f]" }, // Primary
          { bg: "bg-[#00a344]", text: "text-white" },     // Médio
          { bg: "bg-[#007a33]", text: "text-white" },     // Escuro
          { bg: "bg-[#005522]", text: "text-white" },     // Mais escuro
        ];
        
        const colorIndex = Math.min(index, colors.length - 1);
        const { bg, text } = colors[colorIndex];

        return (
          <div key={step.name} className="relative">
            <div className="flex items-center gap-4">
              {/* Barra do funil */}
              <div className="relative flex-1">
                <div
                  className={`${bg} relative flex min-h-[72px] items-center justify-between rounded-lg px-4 py-3 transition-all duration-500`}
                  style={{ width: `${Math.max(widthPercentage, 30)}%` }}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${text}`}>{step.name}</span>
                    <span className={`text-2xl font-bold ${text}`}>
                      {step.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-medium ${text}`}>
                      {step.percentage.toFixed(1)}% do total
                    </span>
                    {!isLast && step.dropoffRate > 0 && (
                      <span className={`text-xs ${colorIndex < 2 ? "opacity-70" : "opacity-80"} ${text}`}>
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
                    className="h-5 w-5 text-[#7a9e8a]"
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
