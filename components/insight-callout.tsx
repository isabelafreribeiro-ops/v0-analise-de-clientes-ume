"use client";

import { useMemo } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import type { FunnelStep } from "@/lib/types";

interface InsightCalloutProps {
  data: FunnelStep[];
  title?: string;
}

export function InsightCallout({ data, title = "clientes" }: InsightCalloutProps) {
  const insight = useMemo(() => {
    if (data.length < 2) return null;

    let maxDropoff = 0;
    let maxDropoffIndex = 0;

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].dropoffRate > maxDropoff) {
        maxDropoff = data[i].dropoffRate;
        maxDropoffIndex = i;
      }
    }

    if (maxDropoff === 0) return null;

    return {
      fromStep: data[maxDropoffIndex].name,
      toStep: data[maxDropoffIndex + 1].name,
      dropoffRate: maxDropoff,
      lostCount: data[maxDropoffIndex].value - data[maxDropoffIndex + 1].value,
    };
  }, [data]);

  if (!insight) {
    return (
      <div className="flex items-center gap-4 rounded-lg border-l-4 border-[#00C853] bg-[#002a14] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003d1f]">
          <TrendingDown className="h-5 w-5 text-[#7a9e8a]" />
        </div>
        <div>
          <p className="font-medium text-white">
            Carregue os dados para visualizar insights
          </p>
          <p className="text-sm text-[#8fbc9e]">
            Faça upload das bases para análise
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border-l-4 border-[#00C853] bg-[#002a14] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#003d1f]">
        <AlertTriangle className="h-5 w-5 text-[#00C853]" />
      </div>
      <div>
        <p className="font-semibold text-white">
          Maior perda identificada: {insight.fromStep} → {insight.toStep}
        </p>
        <p className="mt-1 text-sm text-[#8fbc9e]">
          Taxa de drop-off de <span className="font-bold text-[#00C853]">{insight.dropoffRate.toFixed(1)}%</span>
          {" "}representa a perda de{" "}
          <span className="font-bold text-[#00C853]">{insight.lostCount.toLocaleString("pt-BR")}</span> {title}
          {" "}nesta etapa do funil.
        </p>
        <p className="mt-2 text-xs text-[#8fbc9e]/80">
          Considere analisar os motivos dessa conversão baixa para otimizar a aquisição.
        </p>
      </div>
    </div>
  );
}
