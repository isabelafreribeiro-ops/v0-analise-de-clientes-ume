"use client";

import { useMemo } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FunnelStep } from "@/lib/types";

interface InsightCalloutProps {
  data: FunnelStep[];
}

export function InsightCallout({ data }: InsightCalloutProps) {
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
      <Card className="border-muted bg-muted/30">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <TrendingDown className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              Carregue os dados para visualizar insights
            </p>
            <p className="text-sm text-muted-foreground/70">
              Faça upload das bases de clientes e varejo para análise
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardContent className="flex items-start gap-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Maior perda identificada: {insight.fromStep} → {insight.toStep}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Taxa de drop-off de <span className="font-bold">{insight.dropoffRate.toFixed(1)}%</span>
            {" "}representa a perda de{" "}
            <span className="font-bold">{insight.lostCount.toLocaleString("pt-BR")}</span> clientes
            nesta etapa do funil.
          </p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            💡 Considere analisar os motivos dessa conversão baixa para otimizar a aquisição.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
