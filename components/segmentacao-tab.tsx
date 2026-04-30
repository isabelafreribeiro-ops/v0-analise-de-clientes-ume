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
      {/* 1. QUEM É O CLIENTE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Quem é o Cliente Ume?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Status */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Status na Base</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748b]">Aprovados</span>
                  <span className="font-medium text-[#00C853]">{metrics.totalAprovados.toLocaleString("pt-BR")}</span>
                </div>
                <div className="text-xs text-[#94a3b8]">{formatPercentage(metrics.percentageAprovados)}</div>
                <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="text-sm text-[#64748b]">Negados</span>
                  <span className="font-medium text-[#F44336]">{metrics.totalNegados.toLocaleString("pt-BR")}</span>
                </div>
                <div className="text-xs text-[#94a3b8]">{formatPercentage(metrics.percentageAprovados === 100 ? 0 : 100 - metrics.percentageAprovados)}</div>
              </div>
            </div>

            {/* Crédito */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Perfil de Crédito</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Score Médio</span>
                  <span className="font-medium text-[#1a1a1a]">{formatNumber(metrics.avgScore)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Limite Médio</span>
                  <span className="font-medium text-[#1a1a1a]">{formatCurrency(metrics.avgLimite)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#64748b]">Com aumento limite</span>
                  <span className="font-medium text-[#1a1a1a]">{formatPercentage(metrics.percentageComAumentoLimite)}</span>
                </div>
              </div>
            </div>

            {/* Comportamento */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Comportamento</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Compras Médias</span>
                  <span className="font-medium text-[#1a1a1a]">{formatNumber(metrics.avgCompras)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Com App</span>
                  <span className="font-medium text-[#1a1a1a]">{formatPercentage(metrics.percentageComApp)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#64748b]">Ativados</span>
                  <span className="font-medium text-[#1a1a1a]">{metrics.totalAtivados.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DISTRIBUIÇÃO DE SCORE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Distribuição de Score de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#64748b]">Baixo (&lt;400)</span>
                <span className="font-medium text-[#1a1a1a]">{metrics.scoreDistribution.baixo}</span>
              </div>
              <div className="bg-[#E2E8F0] rounded h-2">
                <div 
                  className="bg-[#F44336] h-2 rounded"
                  style={{ width: `${Math.min((metrics.scoreDistribution.baixo / metrics.totalClientes) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#64748b]">Médio (400-700)</span>
                <span className="font-medium text-[#1a1a1a]">{metrics.scoreDistribution.medio}</span>
              </div>
              <div className="bg-[#E2E8F0] rounded h-2">
                <div 
                  className="bg-[#FF9800] h-2 rounded"
                  style={{ width: `${Math.min((metrics.scoreDistribution.medio / metrics.totalClientes) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#64748b]">Alto (≥700)</span>
                <span className="font-medium text-[#1a1a1a]">{metrics.scoreDistribution.alto}</span>
              </div>
              <div className="bg-[#E2E8F0] rounded h-2">
                <div 
                  className="bg-[#00C853] h-2 rounded"
                  style={{ width: `${Math.min((metrics.scoreDistribution.alto / metrics.totalClientes) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. SEGMENTAÇÃO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Segmentação de Clientes</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise comportamental segmentada com critérios definidos.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Critérios de Classificação:</p>
            <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
              <li><span className="font-medium text-[#1a1a1a]">Aprovados Não Ativados:</span> aprovado + 0 compras</li>
              <li><span className="font-medium text-[#1a1a1a]">Potencial:</span> 1 compra + bom perfil de crédito</li>
              <li><span className="font-medium text-[#1a1a1a]">Recorrentes:</span> 2+ compras</li>
              <li><span className="font-medium text-[#1a1a1a]">High Value:</span> 3+ compras + alto limite</li>
              <li><span className="font-medium text-[#1a1a1a]">Negados:</span> não aprovados na base</li>
            </ul>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            {[
              { id: "negados", name: "Negados", count: metrics.segments.negados },
              { id: "aprovados-nao-ativados", name: "Aprovados Não Ativados", count: metrics.segments.aprovadosNaoAtivados },
              { id: "potencial", name: "Potencial", count: metrics.segments.potencial },
              { id: "recorrentes", name: "Recorrentes", count: metrics.segments.recorrentes },
              { id: "high-value", name: "High Value", count: metrics.segments.highValue },
            ].map((segment) => {
              const colors = SEGMENT_COLORS[segment.id] || { bg: "#F7FAF8", accent: "#00C853", text: "#1a1a1a" };
              const percentage = (segment.count / metrics.totalClientes) * 100;
              const segKey = segment.id.replace(/-/g, "") as keyof typeof metrics.segmentAverages;
              const avgData = metrics.segmentAverages[segKey as any];

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
                  <p className="text-lg font-bold text-[#1a1a1a] mt-2">{segment.count}</p>
                  <p className="text-xs text-[#64748b] mt-1">{percentage.toFixed(1)}% da base</p>

                  {segment.count > 0 && avgData && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.accent + "40" }}>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Score:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(avgData.avgScore)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Limite:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatCurrency(avgData.avgLimite)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Compras:</span>
                          <span className="font-medium text-[#1a1a1a]">{formatNumber(avgData.avgCompras)}</span>
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

      {/* 4. ANÁLISE DE RISCO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Análise de Risco</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Correlação entre perfil de risco, comportamento e características.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">Score Distribution</p>
              <div className="space-y-2">
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <span className="text-xs font-medium text-[#B71C1C]">Baixo Risco:</span>
                  <p className="text-[#64748b] mt-1 text-xs">{formatPercentage((metrics.scoreDistribution.alto / metrics.totalClientes) * 100)} com score alto</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-xs font-medium text-[#E65100]">Médio Risco:</span>
                  <p className="text-[#64748b] mt-1 text-xs">{formatPercentage((metrics.scoreDistribution.medio / metrics.totalClientes) * 100)} com score médio</p>
                </div>
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="text-xs font-medium text-[#D84315]">Alto Risco:</span>
                  <p className="text-[#64748b] mt-1 text-xs">{formatPercentage((metrics.scoreDistribution.baixo / metrics.totalClientes) * 100)} com score baixo</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">Insights Operacionais</p>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-xs text-[#0D47A1]">Recorrência:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    {metrics.segments.recorrentes} clientes recorrentes (2+ compras) com menor risco de inadimplência
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-xs text-[#1B5E20]">Adoção de App:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    {formatPercentage(metrics.percentageComApp)} com app - correlação forte com confiança
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <span className="font-medium text-xs text-[#4A148C]">Limite Aumentado:</span>
                  <p className="text-[#64748b] mt-1 text-xs">
                    {formatPercentage(metrics.percentageComAumentoLimite)} tiveram aumento de limite
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. DISTRIBUIÇÃO DE COMPRAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Distribuição de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <div className="text-center">
              <div className="text-lg font-bold text-[#1a1a1a]">{metrics.purchaseDistribution.zero}</div>
              <p className="text-xs text-[#64748b] mt-1">0 compras</p>
              <p className="text-xs text-[#94a3b8]">{formatPercentage((metrics.purchaseDistribution.zero / metrics.totalClientes) * 100)}</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#1a1a1a]">{metrics.purchaseDistribution.um}</div>
              <p className="text-xs text-[#64748b] mt-1">1 compra</p>
              <p className="text-xs text-[#94a3b8]">{formatPercentage((metrics.purchaseDistribution.um / metrics.totalClientes) * 100)}</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#1a1a1a]">{metrics.purchaseDistribution.dois}</div>
              <p className="text-xs text-[#64748b] mt-1">2 compras</p>
              <p className="text-xs text-[#94a3b8]">{formatPercentage((metrics.purchaseDistribution.dois / metrics.totalClientes) * 100)}</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#1a1a1a]">{metrics.purchaseDistribution.tresOuMais}</div>
              <p className="text-xs text-[#64748b] mt-1">3+ compras</p>
              <p className="text-xs text-[#94a3b8]">{formatPercentage((metrics.purchaseDistribution.tresOuMais / metrics.totalClientes) * 100)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
