"use client";

import { useMemo, useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  segmentarClientes,
  calculateSegmentMetrics,
  generateSegmentInsights,
  calculateThresholds,
  calculatePurchaseDistribution,
  calculatePurchaseGroupComparison,
  calculateAgeDistribution,
  calculateGenderDistribution,
  calculateRetailerDistribution,
  calculateCohortAnalysis,
  calculateProxyDeValor,
  parseNumber,
  parseBoolean,
  getColumnValue,
  type SegmentMetrics,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "high-value": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  "potencial": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  "negados": { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
};

const SEGMENT_ORDER = ["negados", "aprovados-nao-ativados", "high-value", "potencial", "recorrentes"];

const SEGMENT_DESCRIPTIONS: Record<string, { meaning: string; opportunity: string; action: string }> = {
  "high-value": {
    meaning: "Clientes com 3+ compras e limite acima da média. Maior potencial de receita.",
    opportunity: "Aumentar limite, oferecer produtos premium, consolidar relacionamento",
    action: "Programas de retention, limite aumentado, ofertas exclusivas",
  },
  "potencial": {
    meaning: "Clientes com bom score/limite mas 0-1 compras. Ainda não engajados.",
    opportunity: "Converter em recorrentes com primeira/segunda compra",
    action: "Campanhas de onboarding, incentivo primeira compra, abordagem personalizada",
  },
  "aprovados-nao-ativados": {
    meaning: "Aprovados que nunca usaram o crédito. Maior desafio de ativação.",
    opportunity: "Reativar base dormente antes que perca interesse",
    action: "Campanhas WhatsApp/SMS, abordagem em varejo, ofertas com desconto",
  },
  "recorrentes": {
    meaning: "2+ compras. Engajado e gerando receita consistente.",
    opportunity: "Aumentar frequência e diversificar varejos onde compra",
    action: "Cross-retail incentives, aumentar limite, programa de lealdade",
  },
  "negados": {
    meaning: "Clientes não aprovados na avaliação de crédito.",
    opportunity: "Reavaliar borderline cases com score melhorado",
    action: "Políticas de reassessment para high-score rejections após 3-6 meses",
  },
};

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "k";
  return value.toFixed(1);
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return value.toFixed(1) + "%";
}

export function SegmentacaoTab() {
  const { clientesData } = useData();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [cohortMonthsFilter, setCohortMonthsFilter] = useState<"L3M" | "L6M" | "L12M" | "todos">("L6M");
  const ROWS_PER_PAGE = 50;

  const {
    segments,
    metrics,
    insights,
    distribution,
    comparison,
    ageDistribution,
    genderDistribution,
    retailerDistribution,
    cohortAnalysis,
    scoreDistribution,
    limitDistribution,
  } = useMemo(() => {
    if (!clientesData || clientesData.length === 0) {
      return {
        segments: [],
        metrics: [],
        insights: [],
        distribution: [],
        comparison: [],
        ageDistribution: [],
        genderDistribution: [],
        retailerDistribution: [],
        cohortAnalysis: [],
        scoreDistribution: [],
        limitDistribution: [],
      };
    }

    // Score distribution: Baixo (<400), Médio (400-700), Alto (>700)
    const scoreDistribution = {
      low: clientesData.filter((c) => {
        const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
        return score < 400;
      }).length,
      medium: clientesData.filter((c) => {
        const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
        return score >= 400 && score < 700;
      }).length,
      high: clientesData.filter((c) => {
        const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
        return score >= 700;
      }).length,
    };

    // Limit distribution: Baixo (<300), Médio (300-600), Alto (>600)
    const limitDistribution = {
      low: clientesData.filter((c) => {
        const limit = parseNumber(getColumnValue(c, ["limite total", "limite"])) || 0;
        return limit < 300;
      }).length,
      medium: clientesData.filter((c) => {
        const limit = parseNumber(getColumnValue(c, ["limite total", "limite"])) || 0;
        return limit >= 300 && limit < 600;
      }).length,
      high: clientesData.filter((c) => {
        const limit = parseNumber(getColumnValue(c, ["limite total", "limite"])) || 0;
        return limit >= 600;
      }).length,
    };

    const segs = segmentarClientes(clientesData);
    const mets = calculateSegmentMetrics(segs, clientesData.length);
    const insi = generateSegmentInsights(mets, null);
    const dist = calculatePurchaseDistribution(clientesData);
    const comp = calculatePurchaseGroupComparison(clientesData);
    const ageDist = calculateAgeDistribution(clientesData);
    const genderDist = calculateGenderDistribution(clientesData);
    const retailerDist = calculateRetailerDistribution(clientesData);
    const cohortDist = calculateCohortAnalysis(clientesData);

    return {
      segments: segs,
      metrics: mets,
      insights: insi,
      distribution: dist,
      comparison: comp,
      ageDistribution: ageDist,
      genderDistribution: genderDist,
      retailerDistribution: retailerDist,
      cohortAnalysis: cohortDist,
      scoreDistribution,
      limitDistribution,
    };
  }, [clientesData]);

  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => SEGMENT_ORDER.indexOf(a.segmentId) - SEGMENT_ORDER.indexOf(b.segmentId));
  }, [metrics]);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);
  const defaultSegment = useMemo(() => {
    const notNegados = segments.find((s) => s.id !== "negados" && s.customers.length > 0);
    return notNegados;
  }, [segments]);

  const activeSegment = selectedSegment || defaultSegment;

  const filteredCustomers = useMemo(() => {
    if (!activeSegment) return [];
    const search = searchTerm.toLowerCase();
    return activeSegment.customers.filter((c) => {
      const nome = String(getColumnValue(c, ["nome", "name"]) || "").toLowerCase();
      return nome.includes(search);
    });
  }, [activeSegment, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    const start = pageIndex * ROWS_PER_PAGE;
    return filteredCustomers.slice(start, start + ROWS_PER_PAGE);
  }, [filteredCustomers, pageIndex]);

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Nenhum dado de clientes disponível. Por favor, envie o arquivo Base de Clientes.</p>
      </div>
    );
  }

  // Persona predominante
  const largestAgeGroup = ageDistribution.reduce((max, g) => (g.count > max.count ? g : max), ageDistribution[0]);
  const largestScoreGroup = scoreDistribution.high > scoreDistribution.low && scoreDistribution.high > scoreDistribution.medium ? "Alto" : scoreDistribution.medium > scoreDistribution.low ? "Médio" : "Baixo";
  const appAdoption = ((clientesData.filter((c) => parseBoolean(getColumnValue(c, ["tem app", "app"]))).length / clientesData.length) * 100).toFixed(0);
  const largestPurchaseGroup = distribution.reduce((max, g) => (g.count > max.count ? g : max), distribution[0]);

  // Filter cohort data based on selected time period
  const filteredCohortData = useMemo(() => {
    if (cohortAnalysis.length === 0) return [];
    
    const now = new Date();
    const getCohortDate = (monthStr: string) => {
      const [year, month] = monthStr.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    };

    switch (cohortMonthsFilter) {
      case "L3M": {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return cohortAnalysis.filter((c) => getCohortDate(c.month) >= threeMonthsAgo);
      }
      case "L6M": {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return cohortAnalysis.filter((c) => getCohortDate(c.month) >= sixMonthsAgo);
      }
      case "L12M": {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        return cohortAnalysis.filter((c) => getCohortDate(c.month) >= oneYearAgo);
      }
      default:
        return cohortAnalysis;
    }
  }, [cohortAnalysis, cohortMonthsFilter]);

  // Aprovados Não Ativados segment
  const aprovadosNaoAtivadosSegment = segments.find((s) => s.id === "aprovados-nao-ativados");
  const aprovadosNaoAtivadosCount = aprovadosNaoAtivadosSegment?.customers.length || 0;
  const totalAprovados = clientesData.filter((c) => {
    const situacao = String(getColumnValue(c, ["situacao", "status"]) || "").toLowerCase();
    return situacao !== "negada";
  }).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Análise completa da base Ume: quem são os clientes, como se comportam, quais segmentos importam e onde está a oportunidade.
        </p>
      </div>

      {/* Section 1: Insights Executivos */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[#64748b] mb-2">Base Total</p>
            <p className="text-3xl font-bold text-[#1a1a1a]">{clientesData.length.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-[#94a3b8] mt-2">clientes cadastrados</p>
          </CardContent>
        </Card>
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[#64748b] mb-2">Taxa de Ativação</p>
            <p className="text-3xl font-bold text-[#1a1a1a]">
              {formatPercentage((distribution.filter((d) => d.range !== "0 compras")[0]?.count || 0) / clientesData.length * 100 || 0)}
            </p>
            <p className="text-xs text-[#94a3b8] mt-2">clientes com 1+ compra</p>
          </CardContent>
        </Card>
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-[#64748b] mb-2">Score Médio</p>
            <p className="text-3xl font-bold text-[#1a1a1a]">
              {formatNumber(
                clientesData.reduce((sum, c) => {
                  const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
                  return sum + score;
                }, 0) / clientesData.length || 0
              )}
            </p>
            <p className="text-xs text-[#94a3b8] mt-2">pontos de score</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Perfil da Base */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Quem é o Cliente Ume?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* A) Demografia */}
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#E2E8F0]">DEMOGRAFIA</p>
              <div className="space-y-2 text-xs">
                <p className="text-[#64748b]"><span className="font-medium">Idade:</span></p>
                {ageDistribution.map((a) => (
                  <div key={a.group} className="flex justify-between">
                    <span className="text-[#94a3b8]">{a.group}</span>
                    <span className="text-[#64748b] font-medium">{formatPercentage(a.percentage)}</span>
                  </div>
                ))}
                <p className="text-[#64748b] mt-3"><span className="font-medium">Gênero:</span></p>
                {genderDistribution.map((g) => (
                  <div key={g.gender} className="flex justify-between">
                    <span className="text-[#94a3b8]">{g.gender}</span>
                    <span className="text-[#64748b] font-medium">{formatPercentage(g.percentage)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* B) Crédito */}
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#E2E8F0]">CRÉDITO</p>
              <div className="space-y-2 text-xs">
                <p className="text-[#64748b]"><span className="font-medium">Score:</span></p>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Baixo (&lt;400)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((scoreDistribution.low / clientesData.length) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Médio (400-700)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((scoreDistribution.medium / clientesData.length) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Alto (&gt;700)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((scoreDistribution.high / clientesData.length) * 100)}</span>
                </div>
                <p className="text-[#64748b] mt-3"><span className="font-medium">Limite:</span></p>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Baixo (&lt;R$300)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((limitDistribution.low / clientesData.length) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Médio (R$300-600)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((limitDistribution.medium / clientesData.length) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Alto (&gt;R$600)</span>
                  <span className="text-[#64748b] font-medium">{formatPercentage((limitDistribution.high / clientesData.length) * 100)}</span>
                </div>
              </div>
            </div>

            {/* C) Canal */}
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#E2E8F0]">CANAL</p>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[#64748b] font-medium mb-1">App Adoption</p>
                  <p className="text-2xl font-bold text-[#00C853]">{appAdoption}%</p>
                  <p className="text-[#94a3b8] text-xs mt-1">com app</p>
                </div>
              </div>
            </div>

            {/* D) Comportamento */}
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#E2E8F0]">COMPORTAMENTO</p>
              <div className="space-y-2 text-xs">
                <p className="text-[#64748b]"><span className="font-medium">Compras:</span></p>
                {distribution.map((d) => (
                  <div key={d.range} className="flex justify-between">
                    <span className="text-[#94a3b8]">{d.range}</span>
                    <span className="text-[#64748b] font-medium">{formatPercentage(d.percentage)}</span>
                  </div>
                ))}
                <p className="text-[#64748b] mt-3"><span className="font-medium">Varejos:</span></p>
                {retailerDistribution.map((r) => (
                  <div key={r.group} className="flex justify-between">
                    <span className="text-[#94a3b8]">{r.group}</span>
                    <span className="text-[#64748b] font-medium">{formatPercentage(r.percentage)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Persona Predominante */}
          <div className="mt-6 p-4 rounded-lg bg-[#E3F2FD] border border-[#2196F3]/20">
            <p className="text-xs font-semibold text-[#0D47A1] mb-2">PERSONA PREDOMINANTE DA BASE</p>
            <p className="text-sm text-[#1976D2]">
              Cliente {largestAgeGroup?.group || "—"}, com score <span className="font-medium">{largestScoreGroup}</span>, {appAdoption}% adota app, e o maior grupo tem{" "}
              <span className="font-medium">{largestPurchaseGroup?.range}</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Qualidade por Cohort de Entrada */}
      {cohortAnalysis.length > 0 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Qualidade por Cohort de Entrada</CardTitle>
                <p className="text-xs text-[#64748b] mt-1">
                  Mostra se a qualidade dos clientes adquiridos está melhorando ou piorando ao longo do tempo.
                </p>
              </div>
              <select
                value={cohortMonthsFilter}
                onChange={(e) => setCohortMonthsFilter(e.target.value as "L3M" | "L6M" | "L12M" | "todos")}
                className="px-3 py-2 border border-[#E2E8F0] rounded text-xs font-medium text-[#64748b] bg-white hover:border-[#CBD5E1]"
              >
                <option value="L3M">Últimos 3 meses</option>
                <option value="L6M">Últimos 6 meses</option>
                <option value="L12M">Últimos 12 meses</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Mês de Entrada</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Clientes</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">% Aprovados</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">% Ativados</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">% Recorrentes</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Score Médio</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Limite Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCohortData.map((c) => (
                    <tr key={c.month} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 text-[#64748b] font-medium">{c.monthDisplay}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{c.totalClientes.toLocaleString("pt-BR")}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatPercentage(c.percentageAprovados)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatPercentage(c.percentageAtivados)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatPercentage(c.percentageRecorrentes)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatNumber(c.avgScore)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatCurrency(c.avgLimite)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Oportunidade - Aprovados Não Ativados */}
      {aprovadosNaoAtivadosSegment && (
        <Card className="border-[#2196F3] border-l-4">
          <CardHeader>
            <CardTitle className="text-[#0D47A1]">Oportunidade: Aprovados Não Ativados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div className="p-3 rounded-lg bg-[#E3F2FD]">
                <p className="text-xs text-[#0D47A1] font-medium">Total Clientes</p>
                <p className="text-2xl font-bold text-[#1976D2]">{aprovadosNaoAtivadosCount}</p>
                <p className="text-xs text-[#0D47A1] mt-1">{formatPercentage((aprovadosNaoAtivadosCount / totalAprovados) * 100)} da base aprovada</p>
              </div>
              <div className="p-3 rounded-lg bg-[#E3F2FD]">
                <p className="text-xs text-[#0D47A1] font-medium">Score Médio</p>
                <p className="text-2xl font-bold text-[#1976D2]">
                  {formatNumber(
                    aprovadosNaoAtivadosSegment.customers.reduce((sum, c) => {
                      const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
                      return sum + score;
                    }, 0) / aprovadosNaoAtivadosSegment.customers.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#E3F2FD]">
                <p className="text-xs text-[#0D47A1] font-medium">App Adoption</p>
                <p className="text-2xl font-bold text-[#1976D2]">
                  {formatPercentage(
                    (aprovadosNaoAtivadosSegment.customers.filter((c) => parseBoolean(getColumnValue(c, ["tem app", "app"]))).length /
                      aprovadosNaoAtivadosSegment.customers.length) *
                      100 || 0
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#E8F5E9] border border-[#00C853]/20">
              <p className="text-xs font-semibold text-[#1B5E20] mb-2">RECOMENDAÇÃO</p>
              <p className="text-sm text-[#2E7D32]">
                Priorizar clientes aprovados não ativados com score médio/alto e limite relevante em campanhas de ativação via WhatsApp, SMS ou abordagem no varejo. Oferecer incentivos (cashback, primeira compra sem juros) para conversão.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Segmentação de Clientes */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Segmentação de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 mb-6">
            {sortedMetrics.map((metric) => {
              const colors = SEGMENT_COLORS[metric.segmentId];
              const isSelected = selectedSegmentId === metric.segmentId;

              return (
                <div
                  key={metric.segmentId}
                  onClick={() => setSelectedSegmentId(metric.segmentId)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? `border-[${colors.accent}] bg-[${colors.bg}]` : "border-[#E2E8F0] bg-white hover:bg-[#F7FAF8]"
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: colors.accent,
                          backgroundColor: colors.bg,
                        }
                      : {}
                  }
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: colors.accent }}>
                    {metric.segmentName}
                  </p>
                  <p className="text-lg font-bold text-[#1a1a1a]">{metric.totalClientes}</p>
                  <p className="text-xs text-[#64748b]">{formatPercentage(metric.percentageOfBase)} da base</p>
                </div>
              );
            })}
          </div>

          {/* Segment Details */}
          {activeSegment && (
            <div className="mt-6 p-4 rounded-lg bg-[#F7FAF8] border border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-3">{activeSegment.name}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#64748b] font-medium">O que significa</p>
                  <p className="text-sm text-[#1a1a1a]">{SEGMENT_DESCRIPTIONS[activeSegment.id]?.meaning}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] font-medium">Oportunidade</p>
                  <p className="text-sm text-[#1a1a1a]">{SEGMENT_DESCRIPTIONS[activeSegment.id]?.opportunity}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] font-medium">Ação Recomendada</p>
                  <p className="text-sm text-[#1a1a1a]">{SEGMENT_DESCRIPTIONS[activeSegment.id]?.action}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Tabela de Clientes */}
      {activeSegment && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>Clientes do Segmento: {activeSegment.name}</CardTitle>
            <div className="mt-3 flex items-center gap-2 bg-[#F7FAF8] rounded px-3 py-2">
              <Search className="w-4 h-4 text-[#64748b]" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageIndex(0);
                }}
                className="flex-1 bg-transparent text-sm outline-none text-[#1a1a1a] placeholder-[#94a3b8]"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Nome</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Compras</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Limite</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Score</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">App</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Taxa Juros</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((cliente, idx) => (
                    <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 text-[#1a1a1a] font-medium">
                        {String(getColumnValue(cliente, ["nome", "name"]) || "—")}
                      </td>
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {formatNumber(parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])))}
                      </td>
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {formatCurrency(parseNumber(getColumnValue(cliente, ["limite total", "limite"])))}
                      </td>
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {formatNumber(parseNumber(getColumnValue(cliente, ["score de crédito", "score"])))}
                      </td>
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {parseBoolean(getColumnValue(cliente, ["tem app", "app"])) ? "Sim" : "Não"}
                      </td>
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {formatPercentage(parseNumber(getColumnValue(cliente, ["taxa de juros média (ao mês)", "taxa juros"])))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredCustomers.length > ROWS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between text-xs">
                <p className="text-[#64748b]">
                  Mostrando {pageIndex * ROWS_PER_PAGE + 1} a {Math.min((pageIndex + 1) * ROWS_PER_PAGE, filteredCustomers.length)} de{" "}
                  {filteredCustomers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                    disabled={pageIndex === 0}
                    className="px-2 py-1 rounded border border-[#E2E8F0] text-[#64748b] disabled:opacity-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPageIndex(pageIndex + 1)}
                    disabled={(pageIndex + 1) * ROWS_PER_PAGE >= filteredCustomers.length}
                    className="px-2 py-1 rounded border border-[#E2E8F0] text-[#64748b] disabled:opacity-50"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
