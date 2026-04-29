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
        
        // Gradiente de cores verde (escuro para claro)
        const colors = [
          "bg-[#00C853]", // Verde Ume principal
          "bg-[#00E676]", // Verde mais claro
          "bg-[#69F0AE]", // Verde claro
          "bg-[#B9F6CA]", // Verde muito claro
          "bg-[#E8F5E9]", // Verde quase branco
        ];
        
        const bgColor = colors[Math.min(index, colors.length - 1)];
        const textColor = index < 2 ? "text-white" : "text-foreground";

        return (
          <div key={step.name} className="relative">
            <div className="flex items-center gap-4">
              {/* Barra do funil */}
              <div className="relative flex-1">
                <div
                  className={`${bgColor} relative flex min-h-[72px] items-center justify-between rounded-lg px-4 py-3 transition-all duration-500`}
                  style={{ width: `${Math.max(widthPercentage, 30)}%` }}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${textColor}`}>{step.name}</span>
                    <span className={`text-2xl font-bold ${textColor}`}>
                      {step.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-medium ${textColor}`}>
                      {step.percentage.toFixed(1)}% do total
                    </span>
                    {!isLast && step.dropoffRate > 0 && (
                      <span className={`text-xs ${index < 2 ? "text-white/80" : "text-muted-foreground"}`}>
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
                    className="h-5 w-5 text-muted-foreground"
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
