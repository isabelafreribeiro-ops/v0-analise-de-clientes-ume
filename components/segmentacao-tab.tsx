"use client";

import { TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  formatBRNumber,
  normalizeSituacao,
  calculatePercentage,
  type SegmentMetrics,
  type AggregatedMetrics,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "high-value": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  "potencial": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  "negados": { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
};

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "k";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return value.toFixed(1) + "%";
}

export function SegmentacaoTab() {
  const { clientesData, cachedAnalytics, isLoading } = useData();

  // Show loading state while computing
  if (isLoading && cachedAnalytics === null) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Processando base...</p>
      </div>
    );
  }

  if (!clientesData || clientesData.length === 0 || !cachedAnalytics) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a análise de segmentação.</p>
      </div>
    );
  }

  // PERFORMANCE FIX: Use ONLY cached analytics - NO recalculation
  // All data is pre-computed once after upload and stored in context
  const segments = cachedAnalytics?.segments ?? [];
  const metrics = cachedAnalytics?.metrics ?? null;
  const thresholds = cachedAnalytics?.thresholds ?? null;
  const distribution = cachedAnalytics?.distribution ?? [];
  const groupComparison = cachedAnalytics?.groupComparison ?? [];
  const ageDistribution = cachedAnalytics?.ageDistribution ?? [];
  const genderDistribution = cachedAnalytics?.genderDistribution ?? [];
  const retailerDistribution = cachedAnalytics?.retailerDistribution ?? [];
  const aggregated = cachedAnalytics?.aggregated ?? null;

  // Extract values from cached metrics (no recalculation)
  // Provide safe defaults for all properties to prevent undefined errors
  const totalAprovados = cachedAnalytics?.metrics?.total?.aprovados ?? 0;
  const totalNegados = cachedAnalytics?.metrics?.total?.negados ?? 0;
  const totalAtivados = cachedAnalytics?.metrics?.total?.ativados ?? 0;
  const totalAprovadosNaoAtivados = cachedAnalytics?.metrics?.total?.aprovadosNaoAtivados ?? totalAprovados - totalAtivados;
  const appAdoptionPct = cachedAnalytics?.metrics?.adoption?.app ?? 0;
  const avgScore = cachedAnalytics?.thresholds?.avgScore ?? 0;
  const avgLimite = cachedAnalytics?.thresholds?.avgLimite ?? 0;
  const avgCompras = cachedAnalytics?.thresholds?.avgCompras ?? 0;
  const percentageComAumento = 0;
  
  // Score distribution from aggregated data
  const scoreDistribution = cachedAnalytics?.aggregated?.scoreDistribution ?? { low: 0, medium: 0, high: 0 };

  // === RENDER ===
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">Análise consultiva da base de clientes Ume para identificar oportunidades estratégicas.</p>
      </div>

      {/* 1. INSIGHTS EXECUTIVOS */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(totalAprovados > 0 ? (totalAtivados / totalAprovados) * 100 : 0)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">de aprovados ativados • Gargalo de conversão</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">App Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(appAdoptionPct)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">com aplicativo • Canal digital</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(avgScore)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">base aprovada • Perfil de risco</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. QUEM É O CLIENTE UME */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Quem é o Cliente Ume?</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Perfil demográfico, comportamental e de crédito da base.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Demographics */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">👤 Demografia</p>
              <div className="space-y-2 text-xs">
                {ageDistribution.map((g) => (
                  <div key={g.group} className="flex justify-between">
                    <span className="text-[#64748b]">{g.group}</span>
                    <span className="font-medium text-[#1a1a1a]">{g.count} ({g.percentage.toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                {genderDistribution.map((g) => (
                  <div key={g.gender} className="flex justify-between text-xs">
                    <span className="text-[#64748b]">{g.gender}</span>
                    <span className="font-medium text-[#1a1a1a]">{g.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">💳 Crédito</p>
              <div className="space-y-2 text-xs mb-3">
                <div>
                  <span className="text-[#64748b] block mb-1">Score</span>
                  <div className="flex justify-between font-medium text-[#1a1a1a]">
                    <span>Baixo: {scoreDistribution.low}</span>
                    <span>Médio: {scoreDistribution.medium}</span>
                    <span>Alto: {scoreDistribution.high}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-[#64748b]">Limite Médio</span>
                <div className="font-medium text-[#1a1a1a]">{formatCurrency(avgLimite)}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="text-[#64748b]">Com aumento de limite</span>
                <div className="font-medium text-[#1a1a1a]">
                  {formatPercentage(percentageComAumento)}
                </div>
              </div>
            </div>

            {/* Channel & Behavior */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">📱 Canal & Comportamento</p>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#64748b] block mb-1">Com App</span>
                  <span className="font-medium text-[#1a1a1a] block">{formatPercentage(appAdoptionPct)}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block mb-1">Compras Médias</span>
                  <span className="font-medium text-[#1a1a1a] block">{formatNumber(avgCompras)}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block mb-1">Varejos</span>
                  <div className="space-y-1">
                    {retailerDistribution.map((r) => (
                      <div key={r.group} className="flex justify-between">
                        <span className="text-[#94a3b8]">{r.group}</span>
                        <span className="font-medium text-[#1a1a1a]">{r.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona */}
          <div className="mt-6 p-4 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">🎯 Cliente Predominante</p>
            <p className="text-sm text-[#1a1a1a]">
              {ageDistribution.length > 0 ? ageDistribution[0].group : "Cliente"} com {Math.round(avgScore || 0)} de score,{" "}
              {formatPercentage(appAdoptionPct)} de adoção de app e comportamento de {distribution.length > 0 ? distribution[0].range : "baixo volume"}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. DIAGNÓSTICO DA BASE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Diagnóstico da Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise dos principais desafios e oportunidades da base.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Activation */}
            <div className="p-4 bg-[#E3F2FD] rounded border border-[#2196F3]/20">
              <p className="text-xs font-semibold text-[#0D47A1] uppercase mb-2">📊 Ativação</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{formatPercentage(totalAprovados > 0 ? (totalAprovados - totalAprovedNaoAtivados) / totalAprovados * 100 : 0)}</div>
              <p className="text-xs text-[#64748b] mt-1">Taxa de ativação</p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {totalAprovedNaoAtivados} aprovados aguardando primeira compra — maior gargalo de conversão.
              </p>
            </div>

            {/* Engagement */}
            <div className="p-4 bg-[#FFF3E0] rounded border border-[#FF9800]/20">
              <p className="text-xs font-semibold text-[#3E2723] uppercase mb-2">🛍️ Engajamento</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{distribution.find((d) => d.range === "0 compras")?.percentage.toFixed(0) || "0"}%</div>
              <p className="text-xs text-[#64748b] mt-1">Sem compras</p>
              <p className="text-xs text-[#94a3b8] mt-2">Base altamente concentrada em baixa frequência — necessário ativar e engajar.</p>
            </div>

            {/* Credit & Risk */}
            <div className="p-4 bg-[#F3E5F5] rounded border border-[#9C27B0]/20">
              <p className="text-xs font-semibold text-[#4A148C] uppercase mb-2">💳 Crédito & Risco</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{scoreDistribution.low}</div>
              <p className="text-xs text-[#64748b] mt-1">Clientes com score baixo</p>
              <p className="text-xs text-[#94a3b8] mt-2">Perfil de risco mais alto impacta ativação e limite — necessário credit enhancement.</p>
            </div>

            {/* Status */}
            <div className="p-4 bg-[#FFEBEE] rounded border border-[#F44336]/20">
              <p className="text-xs font-semibold text-[#B71C1C] uppercase mb-2">🚫 Status</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{totalNegados}</div>
              <p className="text-xs text-[#64748b] mt-1">Clientes negados</p>
              <p className="text-xs text-[#94a3b8] mt-2">Volume expressivo fora da base ativa — revisar política de crédito para oportunidades.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. DISTRIBUIÇÃO DE COMPRAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Distribuição de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.range} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-[#64748b]">{d.range}</div>
                <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                  <div className="bg-[#00C853] h-2 rounded" style={{ width: `${Math.min(d.percentage, 100)}%` }} />
                </div>
                <div className="w-16 text-xs text-right font-medium text-[#1a1a1a]">
                  {d.count} ({d.percentage.toFixed(0)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. COMPARAÇÃO POR GRUPO */}
      {groupComparison.length > 0 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>Comparação por Grupo de Compras</CardTitle>
            <p className="text-xs text-[#64748b] mt-2">Clientes com maior frequência apresentam melhor perfil de risco e adoção de canal.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Grupo</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Count</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Score Médio</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Limite Médio</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">% Com App</th>
                  </tr>
                </thead>
                <tbody>
                  {groupComparison.map((g) => (
                    <tr key={g.group} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 text-[#64748b] font-medium">{g.group}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{g.count}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatNumber(g.avgScore)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatCurrency(g.avgLimite)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatPercentage(g.percentageComApp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. SEGMENTAÇÃO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Segmentação de Clientes</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise comportamental segmentada. Cada segmento possui características e oportunidades distintas.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Critérios de Segmentação:</p>
            <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
              <li><span className="font-medium text-[#1a1a1a]">Aprovados Não Ativados:</span> aprovado + 0 compras</li>
              <li><span className="font-medium text-[#1a1a1a]">Potencial:</span> 1 compra + bom perfil de crédito</li>
              <li><span className="font-medium text-[#1a1a1a]">Recorrentes:</span> 2+ compras</li>
              <li><span className="font-medium text-[#1a1a1a]">High Value:</span> 3+ compras + alto limite</li>
              <li><span className="font-medium text-[#1a1a1a]">Negados:</span> não aprovados na base</li>
            </ul>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            {segments.map((segment) => {
              const metric = metrics.find((m) => m.segmentId === segment.id);
              const colors = SEGMENT_COLORS[segment.id] || { bg: "#F7FAF8", accent: "#00C853", text: "#1a1a1a" };

              return (
                <div
                  key={segment.id}
                  className="p-4 rounded border-2"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.accent,
                  }}
                >
                  <p className="text-xs font-semibold uppercase" style={{ color: colors.accent }}>
                    {segment.name}
                  </p>
                  <p className="text-lg font-bold text-[#1a1a1a] mt-2">{segment.customers.length}</p>
                  <p className="text-xs text-[#64748b] mt-1">{metric?.percentageOfBase.toFixed(1)}% da base</p>

                  {metric && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.accent + "40" }}>
                      <div className="text-xs space-y-1 text-left">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Compras:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(metric.avgCompras)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Score:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(metric.avgScore)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Limite:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatCurrency(metric.avgLimite)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">App:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatPercentage(metric.percentageComApp)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 7. ANÁLISE DE RISCO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Análise de Risco</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Correlação entre perfil de risco, comportamento de compras e características do cliente.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Risk Profile */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">⚠️ Distribuição de Score</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Baixo (&lt;400)</span>
                    <span className="font-medium text-[#1a1a1a]">{scoreDistribution.low} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div className="bg-[#F44336] h-2 rounded" style={{ width: `${Math.min((scoreDistribution.low / clientesData.length) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Médio (400-700)</span>
                    <span className="font-medium text-[#1a1a1a]">{scoreDistribution.medium} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div className="bg-[#FF9800] h-2 rounded" style={{ width: `${Math.min((scoreDistribution.medium / clientesData.length) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Alto (≥700)</span>
                    <span className="font-medium text-[#1a1a1a]">{scoreDistribution.high} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div className="bg-[#00C853] h-2 rounded" style={{ width: `${Math.min((scoreDistribution.high / clientesData.length) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase & Limit Correlation */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">📊 Insights de Risco</p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-[#0D47A1]">Score vs Compras:</span>
                  <p className="text-[#64748b] mt-1">
                    {metrics && metrics.length > 0 
                      ? `Clientes com score alto têm média de ${formatNumber(metrics.find((m) => m.avgScore >= 700)?.avgCompras || 0)} compras.`
                      : "Nenhum dado disponível para análise."
                    }
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="font-medium text-[#E65100]">Limite vs App:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatPercentage(appAdoptionPct)} da base usa app — correlação forte com maior confiança.
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-[#1B5E20]">Recorrência:</span>
                  <p className="text-[#64748b] mt-1">
                    {metrics && metrics.length > 0
                      ? `${metrics.find((m) => m.segmentId === "recorrentes")?.totalClientes || 0} clientes recorrentes representam a menor inadimplência esperada.`
                      : "Nenhum cliente recorrente identificado."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. OPORTUNIDADES ESTRATÉGICAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Oportunidades Estratégicas</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Recomendações de ação para cada segmento.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Aprovados Não Ativados */}
            {segments.find((s) => s.id === "aprovados-nao-ativados") && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🔵</div>
                  <div>
                    <p className="text-sm font-semibold text-[#0D47A1]">Aprovados Não Ativados</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {totalAprovedNaoAtivados} clientes • {formatPercentage((totalAprovedNaoAtivados / clientesData.length) * 100)} da base
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Insight:</p>
                <p className="text-xs text-[#64748b] mb-3">Maior oportunidade de crescimento — CAC já pago, apenas necessário ativar.</p>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Ações:</p>
                <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
                  <li>Campanhas de reengajamento via WhatsApp/SMS</li>
                  <li>Abordagem em ponto de venda</li>
                  <li>Oferta de desconto primeira compra</li>
                </ul>
              </div>
            )}

            {/* Potencial */}
            {segments.find((s) => s.id === "potencial") && (
              <div className="p-4 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🟠</div>
                  <div>
                    <p className="text-sm font-semibold text-[#3E2723]">Potencial</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {segments.find((s) => s.id === "potencial")?.customers.length} clientes • Bom perfil, baixa recorrência
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Insight:</p>
                <p className="text-xs text-[#64748b] mb-3">Alta probabilidade de conversão em recorrentes — melhor ROI em campanha.</p>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Ações:</p>
                <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
                  <li>Incentivo segunda compra (cashback, frete)</li>
                  <li>Personalização de oferta por perfil</li>
                  <li>Acompanhamento pós-primeira compra</li>
                </ul>
              </div>
            )}

            {/* Recorrentes */}
            {segments.find((s) => s.id === "recorrentes") && (
              <div className="p-4 bg-purple-50 rounded border border-purple-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🟣</div>
                  <div>
                    <p className="text-sm font-semibold text-[#4A148C]">Recorrentes</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {segments.find((s) => s.id === "recorrentes")?.customers.length} clientes • Engajados, maior valor
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Insight:</p>
                <p className="text-xs text-[#64748b] mb-3">Maior rentabilidade potencial — foco em retention e limite aumentado.</p>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Ações:</p>
                <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
                  <li>Aumento de limite proativo</li>
                  <li>Programa de fidelização e rewards</li>
                  <li>Cross-sell e upsell</li>
                </ul>
              </div>
            )}

            {/* High Value */}
            {segments.find((s) => s.id === "high-value") && (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🟢</div>
                  <div>
                    <p className="text-sm font-semibold text-[#001a0f]">High Value</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {segments.find((s) => s.id === "high-value")?.customers.length} clientes • Máximo engajamento
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Insight:</p>
                <p className="text-xs text-[#64748b] mb-3">Core de rentabilidade da base — essential para consolidar relacionamento.</p>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Ações:</p>
                <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
                  <li>Conta dedicada e suporte premium</li>
                  <li>Limite aumentado automático</li>
                  <li>Produtos exclusivos e eventos VIP</li>
                </ul>
              </div>
            )}

            {/* Negados */}
            {totalNegados > 0 && (
              <div className="p-4 bg-red-50 rounded border border-red-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-xl">🔴</div>
                  <div>
                    <p className="text-sm font-semibold text-[#B71C1C]">Negados</p>
                    <p className="text-xs text-[#64748b] mt-1">{totalNegados} solicitações • Fora da base ativa</p>
                  </div>
                </div>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Insight:</p>
                <p className="text-xs text-[#64748b] mb-3">Volume expressivo — revisar política para identificar falsos negativos.</p>
                <p className="text-xs text-[#1a1a1a] font-medium mb-2">Ações:</p>
                <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
                  <li>Análise de falsos negativos</li>
                  <li>Programa de segunda chance</li>
                  <li>Ajuste de critérios de aprovação</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
