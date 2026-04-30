"use client";

import { useMemo } from "react";
import type { FunnelStep } from "@/lib/types";

interface FunnelChartProps {
  data: FunnelStep[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  if (data.length === 0) return null;

  // Cores do funil: #00C853 (maior) -> progressivamente mais escuro
  const FUNNEL_COLORS = [
    { bg: "#00C853", text: "#001a0f" },   // Primary green - brightest
    { bg: "#009e3f", text: "#001a0f" },   // Darker
    { bg: "#007a30", text: "white" },     // Darker
    { bg: "#005a22", text: "white" },     // Darker
    { bg: "#003d16", text: "white" },     // Darkest
  ];

  // Calculate widths ensuring each bar is narrower or equal to previous
  const widths = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstStepValue = data[0]?.value || 0;
    const minWidth = 35; // Minimum 35% for readability
    const maxWidth = 100;
    
    const calculatedWidths: number[] = [];
    
    data.forEach((step, index) => {
      // Calculate width based on proportion to first step
      let width = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0;
      
      // Apply min and max bounds
      width = Math.max(width, minWidth);
      width = Math.min(width, maxWidth);
      
      // Ensure each bar doesn't exceed the previous one
      if (index > 0 && calculatedWidths.length > 0) {
        const prevWidth = calculatedWidths[index - 1];
        width = Math.min(width, prevWidth);
      }
      
      calculatedWidths.push(width);
    });
    
    return calculatedWidths;
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      {data.map((step, index) => {
        const isLast = index === data.length - 1;
        const colorIndex = Math.min(index, FUNNEL_COLORS.length - 1);
        const { bg, text } = FUNNEL_COLORS[colorIndex];
        const displayWidth = widths[index] || 35;

        return (
          <div key={step.name} className="relative">
            <div className="flex items-stretch gap-4">
              {/* Barra do funil */}
              <div className="relative flex-1">
                <div
                  className="relative flex items-center justify-between rounded-lg px-6 py-5 transition-all duration-500"
                  style={{ 
                    width: `${displayWidth}%`,
                    backgroundColor: bg,
                    color: text,
                    minHeight: "80px",
                  }}
                >
                  {/* Left side: Label + Main Number */}
                  <div className="flex flex-col gap-1 min-w-max">
                    <span className="text-sm font-medium opacity-90">{step.name}</span>
                    <span className="text-3xl font-bold">
                      {step.value.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* Right side: % and Drop-off */}
                  <div className="flex flex-col items-end gap-0.5 min-w-max">
                    <span className="text-sm font-semibold">
                      {step.percentage.toFixed(1)}% do total
                    </span>
                    {!isLast && step.dropoffRate > 0 && (
                      <span className="text-xs opacity-85">
                        -{step.dropoffRate.toFixed(1)}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Indicador de drop-off */}
              {!isLast && (
                <div className="flex w-12 items-center justify-center flex-shrink-0">
                  <svg
                    className="h-6 w-6"
                    style={{ color: text }}
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
