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
    if (!data || data.length < 2) return null;

    let maxDropoff = 0;
    let maxDropoffIndex = 0;

    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].dropoffRate > maxDropoff) {
        maxDropoff = data[i].dropoffRate;
        maxDropoffIndex = i;
      }
    }

    if (maxDropoff === 0) return null;

    const fromStep = data[maxDropoffIndex].name;
    const toStep = data[maxDropoffIndex + 1].name;
    const lostCount = data[maxDropoffIndex].value - data[maxDropoffIndex + 1].value;

    // Determine hypothesis and action based on stage transition
    let hypothesis = "";
    let action = "";

    // Normalize step names to match common patterns
    const lowerFrom = fromStep.toLowerCase();
    const lowerTo = toStep.toLowerCase();

    if (lowerFrom.includes("solicitação") && lowerTo.includes("aprovado")) {
      hypothesis = "Pode indicar uma política de crédito rigorosa, baixa qualidade de solicitantes ou desalinhamento entre critérios de aquisição e crédito.";
      action = "Revise critérios de aprovação e perfil dos solicitantes capturados.";
    } else if (lowerFrom.includes("aprovado") && lowerTo.includes("ativado")) {
      hypothesis = "Pode indicar atrito na ativação (ponto de venda), baixa percepção de valor, limite aprovado insuficiente, ou falta de follow-up do vendedor/promotor.";
      action = "Melhore a experiência de ativação e fortaleça o engajamento pós-aprovação.";
    } else if (lowerFrom.includes("ativado") && lowerTo.includes("recorrente")) {
      hypothesis = "Oportunidade de retenção: pode faltar comunicação no ciclo de vida, incentivos para repetição, ou experiência insatisfatória na primeira compra.";
      action = "Implemente programas de retenção e acompanhamento pós-primeira compra.";
    } else {
      hypothesis = "Investigue os motivos dessa conversão baixa para otimizar o funil.";
      action = "Analise dados de comportamento nesta etapa do funil.";
    }

    return {
      fromStep,
      toStep,
      dropoffRate: maxDropoff,
      lostCount,
      hypothesis,
      action,
    };
  }, [data]);

  if (!insight) {
    return (
      <div className="mt-6 border-l-4 border-[#00C853] bg-[#F0F4F3] px-4 py-4 rounded">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-5 w-5 flex-shrink-0 text-[#00C853]" />
          <div>
            <p className="font-medium text-[#1a1a1a]">
              Carregue os dados para visualizar insights
            </p>
            <p className="text-sm text-[#64748b]">
              Faça upload das bases para análise
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-l-4 border-[#00C853] bg-[#F0F4F3] px-4 py-4 rounded">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#00C853] mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-[#1a1a1a]">
            Maior perda identificada: {insight.fromStep} → {insight.toStep}
          </p>
          <p className="text-sm text-[#64748b]">
            Drop-off de <span className="font-bold text-[#00C853]">{insight.dropoffRate.toFixed(1)}%</span>
            {" "}representa uma perda de{" "}
            <span className="font-bold text-[#00C853]">{insight.lostCount.toLocaleString("pt-BR")}</span> {title}
            {" "}nesta etapa.
          </p>
          <p className="text-sm text-[#64748b]">
            <span className="font-medium text-[#1a1a1a]">Hipótese:</span> {insight.hypothesis}
          </p>
          <p className="text-sm text-[#00C853] font-medium">
            <span className="text-[#64748b]">Ação sugerida:</span> {insight.action}
          </p>
        </div>
      </div>
    </div>
  );
}
