"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/parse-utils";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "negados": { bg: "#FFE5E5", accent: "#F44336", text: "#B71C1C" },
  "aprovados-nao-ativados": { bg: "#FFF3E0", accent: "#FF9800", text: "#E65100" },
  "potencial": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes": { bg: "#E8F5E9", accent: "#4CAF50", text: "#1B5E20" },
  "high-value": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
};

export function SegmentacaoTab() {
  const { aggregatedMetrics } = useData();

  if (!aggregatedMetrics) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a análise de segmentação.</p>
      </div>
    );
  }

  const metrics = aggregatedMetrics;

  return (
    <div className="space-y-6">
      {/* 1. QUEM É O CLIENTE UME */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Quem é o Cliente Ume?</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Perfil consolidado da base de clientes com principais indicadores.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Status</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#64748b]">Aprovados</span>
                    <span className="text-xs font-medium text-[#00C853]">{formatPercentage(metrics.percentageAprovados)}</span>
                  </div>
                  <div className="text-sm font-bold text-[#1a1a1a]">{metrics.totalAprovados.toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#64748b]">Negados</span>
                    <span className="text-xs font-medium text-[#F44336]">{formatPercentage(100 - metrics.percentageAprovados)}</span>
                  </div>
                  <div className="text-sm font-bold text-[#1a1a1a]">{metrics.totalNegados.toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Score</p>
              <div className="text-3xl font-bold text-[#1a1a1a] mb-2">{formatNumber(metrics.avgScore)}</div>
              <p className="text-xs text-[#64748b]">Score médio da base aprovada</p>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Alto (≥700):</span>
                    <span className="font-medium">{metrics.scoreDistribution.alto} ({formatPercentage((metrics.scoreDistribution.alto / metrics.totalClientes) * 100)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Médio:</span>
                    <span className="font-medium">{metrics.scoreDistribution.medio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Baixo:</span>
                    <span className="font-medium">{metrics.scoreDistribution.baixo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Limite */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Limite Médio</p>
              <div className="text-2xl font-bold text-[#1a1a1a] mb-2">{formatCurrency(metrics.avgLimite)}</div>
              <p className="text-xs text-[#64748b]">Limite total disponível</p>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                <div className="text-xs">
                  <span className="text-[#64748b]">Com aumento</span>
                  <div className="font-medium text-[#1a1a1a]">
                    {formatPercentage(metrics.percentageComAumentoLimite)}
                  </div>
                </div>
              </div>
            </div>

            {/* Comportamento */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Comportamento</p>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-[#64748b] block mb-1">Compras Médias</span>
                  <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(metrics.avgCompras)}</div>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#64748b]">Com App</span>
                    <span className="font-medium text-[#1a1a1a]">{formatPercentage(metrics.percentageComApp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#64748b]">Ativados</span>
                    <span className="font-medium text-[#1a1a1a]">{metrics.totalAtivados.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DISTRIBUIÇÃO DE COMPRAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Distribuição de Compras</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Como a base se distribui por frequência de compras.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            {metrics.purchaseDistribution.map((dist) => (
              <div key={dist.range} className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-3">
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">{dist.range}</p>
                <div className="text-xl font-bold text-[#1a1a1a]">{formatPercentage(dist.percentage)}</div>
                <p className="text-xs text-[#94a3b8] mt-1">{dist.count.toLocaleString("pt-BR")} clientes</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. COMPARAÇÃO POR GRUPO DE COMPRA */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Comparação por Grupo de Compra</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Métricas de comportamento segmentadas por frequência de uso.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {metrics.purchaseGroupComparison.map((group) => (
              <div key={group.groupName} className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">{group.groupName}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Clientes</span>
                    <span className="font-medium text-[#1a1a1a]">{group.clientes.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Score Médio</span>
                    <span className="font-medium text-[#1a1a1a]">{formatNumber(group.avgScore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Limite Médio</span>
                    <span className="font-medium text-[#1a1a1a]">{formatCurrency(group.avgLimite)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">% Com App</span>
                    <span className="font-medium text-[#1a1a1a]">{formatPercentage(group.percentageComApp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. ANÁLISE DE RISCO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Análise de Risco</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Distribuição de concentração de risco por diferentes critérios.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Score Distribution */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3">Distribuição de Score</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Baixo (&lt;400)</span>
                    <span className="font-medium">{metrics.scoreDistribution.baixo}</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div 
                      className="bg-[#F44336] h-2 rounded"
                      style={{ width: `${Math.min((metrics.scoreDistribution.baixo / metrics.totalClientes) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Médio (400-700)</span>
                    <span className="font-medium">{metrics.scoreDistribution.medio}</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div 
                      className="bg-[#FF9800] h-2 rounded"
                      style={{ width: `${Math.min((metrics.scoreDistribution.medio / metrics.totalClientes) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Alto (≥700)</span>
                    <span className="font-medium">{metrics.scoreDistribution.alto}</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div 
                      className="bg-[#00C853] h-2 rounded"
                      style={{ width: `${Math.min((metrics.scoreDistribution.alto / metrics.totalClientes) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Insights */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3">Insights de Risco</p>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-[#0D47A1] text-xs">Score vs Comportamento:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    Clientes com score alto (≥700) representam {metrics.scoreDistribution.alto > 0 ? formatPercentage((metrics.scoreDistribution.alto / metrics.totalClientes) * 100) : "0%"} da base e apresentam menor risco.
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="font-medium text-[#E65100] text-xs">Adoção de Tecnologia:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    {formatPercentage(metrics.percentageComApp)} da base usa app, correlacionado com maior engajamento.
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-[#1B5E20] text-xs">Potencial de Crescimento:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    {metrics.totalAtivados.toLocaleString("pt-BR")} clientes ativados com oportunidade de aumento de limite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. SEGMENTAÇÃO DE CLIENTES */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Segmentação de Clientes</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise comportamental segmentada. Cada segmento possui características e oportunidades distintas.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Critérios de Classificação:</p>
            <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
              <li><span className="font-medium text-[#1a1a1a]">Negados:</span> não aprovados na base</li>
              <li><span className="font-medium text-[#1a1a1a]">Aprovados Não Ativados:</span> aprovado + 0 compras</li>
              <li><span className="font-medium text-[#1a1a1a]">Potencial:</span> 1 compra + bom perfil de crédito</li>
              <li><span className="font-medium text-[#1a1a1a]">Recorrentes:</span> 2+ compras</li>
              <li><span className="font-medium text-[#1a1a1a]">High Value:</span> 3+ compras + alto limite</li>
            </ul>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            {metrics.segments.map((segment) => {
              const colors = SEGMENT_COLORS[segment.id] || { bg: "#F7FAF8", accent: "#00C853", text: "#1a1a1a" };
              const segmentMetric = metrics.segmentMetrics.find((m) => m.segmentId === segment.id);

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
                  <p className="text-xs text-[#64748b] mt-1">{segmentMetric?.percentageOfBase.toFixed(1) || 0}% da base</p>

                  {segmentMetric && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.accent + "40" }}>
                      <div className="text-xs space-y-1 text-left">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Compras:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(segmentMetric.avgCompras)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Score:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(segmentMetric.avgScore)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Limite:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatCurrency(segmentMetric.avgLimite)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">App:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatPercentage(segmentMetric.percentageComApp)}</span>
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

      {/* 6. OPORTUNIDADES ESTRATÉGICAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Oportunidades Estratégicas</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise de potenciais de crescimento e expansão por segmento.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm font-medium text-[#0D47A1]">Ativar Aprovados Não Ativados</p>
              <p className="text-xs text-[#64748b] mt-1">
                {metrics.segmentMetrics.find((m) => m.segmentId === "aprovados-nao-ativados")?.totalClientes || 0} clientes aprovados aguardam ativação. Estratégia: campanhas de onboarding e educação de crédito.
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <p className="text-sm font-medium text-[#E65100]">Expandir Potencial</p>
              <p className="text-xs text-[#64748b] mt-1">
                {metrics.segmentMetrics.find((m) => m.segmentId === "potencial")?.totalClientes || 0} clientes com potencial de crescimento. Estratégia: limites aumentados e ofertas personalizadas.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm font-medium text-[#1B5E20]">Reter Recorrentes</p>
              <p className="text-xs text-[#64748b] mt-1">
                {metrics.segmentMetrics.find((m) => m.segmentId === "recorrentes")?.totalClientes || 0} clientes recorrentes formam base sólida. Estratégia: programas de fidelização e aumentos de limite automáticos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
