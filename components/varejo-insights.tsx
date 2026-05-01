"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, AlertCircle, Target, ShoppingBag } from "lucide-react";

interface VarejoInsightsProps {
  data: any[];
}

function parseBRNumber(value: string): number {
  if (!value) return 0;
  const str = String(value).trim().replace("R$", "").trim();
  const normalized = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function VarejoInsights({ data }: VarejoInsightsProps) {
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        concentracao: 0,
        topCategories: "N/A",
        recorrentesPercent: 0,
        cauda: 0,
      };
    }

    // Card 1: Concentração (28% dos varejos geram 80% da originação)
    const sortedByOriginacao = [...data].sort((a, b) => {
      const aOrig = parseBRNumber(a["Originação Total"]);
      const bOrig = parseBRNumber(b["Originação Total"]);
      return bOrig - aOrig;
    });
    
    const totalOriginacao = sortedByOriginacao.reduce((sum, v) => {
      return sum + parseBRNumber(v["Originação Total"]);
    }, 0);

    let concentracaoVarejos = 0;
    let cumulativo = 0;
    for (const varejo of sortedByOriginacao) {
      cumulativo += parseBRNumber(varejo["Originação Total"]);
      concentracaoVarejos++;
      if (cumulativo >= totalOriginacao * 0.8) break;
    }
    const concentracaoPercent = Math.round((concentracaoVarejos / data.length) * 100);

    // Card 2: Top Categorias (agregar por Segmento)
    const bySegmento: Record<string, number> = {};
    data.forEach((v) => {
      const seg = v.Segmento || "N/A";
      const orig = parseBRNumber(v["Originação Total"]);
      bySegmento[seg] = (bySegmento[seg] || 0) + orig;
    });
    
    const topSegmentos = Object.entries(bySegmento)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    const topSegmentosTotal = topSegmentos.reduce((sum, [, val]) => sum + val, 0);
    const topSegmentosPercent = Math.round((topSegmentosTotal / totalOriginacao) * 100 * 10) / 10;

    // Card 3: Tipo de Transação (recorrentes vs conversões)
    const totalRecorrentes = data.reduce((sum, v) => {
      return sum + (Number(v["Transações Recorrentes por mês"]) || 0);
    }, 0);
    const totalConversoes = data.reduce((sum, v) => {
      return sum + (Number(v["Transações de Conversões por mês"]) || 0);
    }, 0);
    const recorrentesPercent = totalRecorrentes + totalConversoes > 0
      ? Math.round((totalRecorrentes / (totalRecorrentes + totalConversoes)) * 100)
      : 0;

    // Card 4: Cauda Fraca (varejos com originação < R$ 5k)
    const caudaFraca = data.filter(
      (v) => parseBRNumber(v["Originação Total"]) < 5000
    ).length;
    const semConversoes = data.filter(
      (v) => (Number(v["Transações de Conversões por mês"]) || 0) === 0
    ).length;

    return {
      concentracaoPercent,
      topSegmentosPercent,
      topSegmentos,
      recorrentesPercent,
      caudaFraca,
      semConversoes,
    };
  }, [data]);

  const conversaoPercent = 100 - insights.recorrentesPercent;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Concentração */}
      <Card className="border-l-4 border-[#00C853] bg-[#E8F5E9]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <span className="text-lg">🎯</span>
            CONCENTRAÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-[#00C853]">{insights.concentracaoPercent}%</div>
          <p className="text-xs text-[#64748b]">
            dos varejos geram 80% da originação
          </p>
          <p className="text-xs text-[#64748b] mt-2">
            Reflexo do perfil de cliente aprovado pela política atual — categorias de ticket alto e parcelamento (Calçados, Móveis, Eletro) dominam.
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Top Categorias */}
      <Card className="border-l-4 border-[#66BB6A] bg-[#F1F8E9]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <span className="text-lg">🛍️</span>
            TOP CATEGORIAS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-[#66BB6A]">{insights.topSegmentosPercent}%</div>
          <p className="text-xs text-[#64748b]">
            da originação em 3 segmentos
          </p>
          <p className="text-xs text-[#64748b] mt-2">
            {insights.topSegmentos.map(([seg]) => seg).join(" + ")} — categorias com ticket alto e parcelamento natural.
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Tipo de Transação */}
      <Card className="border-l-4 border-[#94A3B8] bg-[#F1F5F9]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <span className="text-lg">🔄</span>
            TIPO DE TRANSAÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-[#1a1a1a]">{insights.recorrentesPercent}% / {conversaoPercent}%</div>
          <p className="text-xs text-[#64748b]">
            recorrentes vs. conversões novas
          </p>
          <p className="text-xs text-[#64748b] mt-2">
            A operação vive de cliente recorrente. Aquisição constante é secundária — retenção é o motor do negócio.
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Cauda Fraca */}
      <Card className="border-l-4 border-[#EF4444] bg-[#FEF2F2]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            CAUDA FRACA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-[#EF4444]">{insights.caudaFraca}</div>
          <p className="text-xs text-[#64748b]">
            varejos com originação &lt; R$ 5k/mês
          </p>
          <p className="text-xs text-[#64748b] mt-2">
            Bem abaixo do breakeven operacional — varejo precisa originar ~R$ 12k/mês só para cobrir o custo de R$ 60k/ano. Esses {insights.caudaFraca} parceiros custam ~R$ 540k/ano e geram receita marginal. Candidatos diretos a desinvestimento ou renegociação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
