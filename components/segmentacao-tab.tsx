"use client";

import { useMemo, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  segmentarClientes,
  calculateSegmentMetrics,
  generateSegmentInsights,
  calculateThresholds,
  calculatePurchaseDistribution,
  calculatePurchaseGroupComparison,
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

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  "high-value":
    "Clientes com alto nível de uso e limite elevado. Maior potencial de receita e engagement.",
  "potencial":
    "Clientes com bom perfil de crédito, mas baixa recorrência. Oportunidade de ativação.",
  "aprovados-nao-ativados":
    "Clientes aprovados que ainda não usaram o crédito. Maior desafio de ativação.",
  "recorrentes":
    "Clientes com uso consistente do crédito (2+ compras). Alto nível de engajamento.",
  "negados": "Clientes que não foram aprovados na avaliação de crédito.",
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
  const ROWS_PER_PAGE = 50;

  const { segments, metrics, insights, distribution, comparison } = useMemo(() => {
    if (!clientesData || clientesData.length === 0) {
      return {
        segments: [],
        metrics: [],
        insights: [],
        distribution: [],
        comparison: [],
      };
    }

    const segs = segmentarClientes(clientesData);
    const mets = calculateSegmentMetrics(segs, clientesData.length);
    const insi = generateSegmentInsights(mets, null);
    const dist = calculatePurchaseDistribution(clientesData);
    const comp = calculatePurchaseGroupComparison(clientesData);

    return {
      segments: segs,
      metrics: mets,
      insights: insi,
      distribution: dist,
      comparison: comp,
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
      const nome = c["Nome"]?.toString().toLowerCase() || "";
      return nome.includes(search);
    });
  }, [activeSegment, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    const start = pageIndex * ROWS_PER_PAGE;
    return filteredCustomers.slice(start, start + ROWS_PER_PAGE);
  }, [filteredCustomers, pageIndex]);

  const totalPages = Math.ceil(filteredCustomers.length / ROWS_PER_PAGE);

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          Nenhum dado de clientes disponível. Por favor, envie o arquivo &quot;Base de Clientes&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Objective */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Entender o perfil dos clientes da Ume, identificar segmentos comportamentais relevantes e mapear oportunidades de crescimento, ativação e monetização.
        </p>
      </div>

      {/* 1. INSIGHTS EXECUTIVOS */}
      {insights.length > 0 && (
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#1a1a1a]">Insights Executivos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#64748b]">
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#00C853] mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 2. PERFIL DA BASE */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Perfil da Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-1">Quem são os clientes da Ume?</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Score Distribution */}
            <div>
              <p className="text-xs font-medium text-[#64748b] mb-2">Distribuição de Score</p>
              {(() => {
                const lowScore = clientesData.filter((c) => {
                  const score = parseNumber(getColumnValue(c, ["score de crédito", "score", "score_credito"]));
                  return score !== null && score < 400;
                }).length;
                const mediumScore = clientesData.filter((c) => {
                  const score = parseNumber(getColumnValue(c, ["score de crédito", "score", "score_credito"]));
                  return score !== null && score >= 400 && score < 700;
                }).length;
                const highScore = clientesData.filter((c) => {
                  const score = parseNumber(getColumnValue(c, ["score de crédito", "score", "score_credito"]));
                  return score !== null && score >= 700;
                }).length;
                const total = lowScore + mediumScore + highScore;

                return (
                  <div className="space-y-1">
                    {lowScore > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-xs text-[#64748b]">Baixo</div>
                        <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                          <div
                            className="bg-[#F44336] h-2 rounded"
                            style={{ width: `${total > 0 ? (lowScore / total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-right text-[#64748b]">
                          {total > 0 ? ((lowScore / total) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    )}
                    {mediumScore > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-xs text-[#64748b]">Médio</div>
                        <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                          <div
                            className="bg-[#FF9800] h-2 rounded"
                            style={{ width: `${total > 0 ? (mediumScore / total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-right text-[#64748b]">
                          {total > 0 ? ((mediumScore / total) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    )}
                    {highScore > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-12 text-xs text-[#64748b]">Alto</div>
                        <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                          <div
                            className="bg-[#00C853] h-2 rounded"
                            style={{ width: `${total > 0 ? (highScore / total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="w-12 text-xs text-right text-[#64748b]">
                          {total > 0 ? ((highScore / total) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* App Adoption */}
            <div>
              <p className="text-xs font-medium text-[#64748b] mb-2">Adoção de App</p>
              {(() => {
                const comApp = clientesData.filter((c) =>
                  parseBoolean(getColumnValue(c, ["tem app", "app", "has app"]))
                ).length;
                const total = clientesData.length;
                const pct = ((comApp / total) * 100).toFixed(1);

                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 text-xs text-[#64748b]">Com App</div>
                      <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                        <div className="bg-[#00C853] h-2 rounded" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-xs text-right text-[#64748b]">{pct}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 text-xs text-[#64748b]">Sem App</div>
                      <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                        <div
                          className="bg-[#CBD5E1] h-2 rounded"
                          style={{ width: `${100 - parseFloat(pct)}%` }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right text-[#64748b]">
                        {(100 - parseFloat(pct)).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. DISTRIBUIÇÃO DE COMPRAS */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Distribuição de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.range} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748b]">{item.range}</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">
                    {item.count} clientes ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded h-2">
                  <div className="bg-[#00C853] h-2 rounded" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
            <p className="mt-4 text-xs text-[#64748b] italic">
              A base é altamente concentrada em clientes sem compras, indicando desafio de ativação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. COMPARAÇÃO POR GRUPO DE COMPRAS */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Comparação por Grupo de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Grupo</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Clientes</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Avg Limite</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Avg Score</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Com App</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Taxa Juros</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.group} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                    <td className="py-2 px-2 text-[#1a1a1a] font-medium">{row.group}</td>
                    <td className="py-2 px-2 text-[#64748b]">{row.count}</td>
                    <td className="py-2 px-2 text-[#64748b]">{formatNumber(row.avgLimite)}</td>
                    <td className="py-2 px-2 text-[#64748b]">{formatNumber(row.avgScore)}</td>
                    <td className="py-2 px-2 text-[#64748b]">{row.percentageComApp.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-[#64748b]">{row.avgTaxaJuros.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[#64748b] italic">
            Clientes com 2+ compras apresentam maior score e adoção de app, indicando maior engajamento e potencial de valor.
          </p>
        </CardContent>
      </Card>

      {/* 5. SEGMENTAÇÃO DE CLIENTES */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Segmentação de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedMetrics.map((metric) => {
              const colors = SEGMENT_COLORS[metric.segmentId] || {
                bg: "#F5F5F5",
                accent: "#9E9E9E",
                text: "#424242",
              };
              const isSelected = selectedSegmentId === metric.segmentId;

              return (
                <div
                  key={metric.segmentId}
                  onClick={() => setSelectedSegmentId(metric.segmentId)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected
                      ? `border-[${colors.accent}] bg-[${colors.bg}]`
                      : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                  style={{
                    backgroundColor: isSelected ? colors.bg : "#FFFFFF",
                    borderColor: isSelected ? colors.accent : "#E2E8F0",
                  }}
                >
                  <div className="font-medium text-[#1a1a1a]">{metric.segmentName}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>
                    {metric.totalClientes}
                  </div>
                  <div className="text-xs text-[#64748b] mt-1">{metric.percentageOfBase.toFixed(1)}% da base</div>
                  <div className="text-xs text-[#64748b] mt-2">
                    Avg: {metric.avgCompras.toFixed(1)} compras
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 6. EXPLICAÇÃO DOS SEGMENTOS */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Como os Segmentos foram Definidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(SEGMENT_DESCRIPTIONS).map(([segmentId, description]) => (
              <div key={segmentId} className="pb-4 border-b border-[#E2E8F0] last:border-0">
                <div className="font-medium text-[#1a1a1a]">{segmentId === "high-value" ? "High Value" : segmentId === "aprovados-nao-ativados" ? "Aprovados Não Ativados" : segmentId === "potencial" ? "Potencial" : segmentId === "recorrentes" ? "Recorrentes" : "Negados"}</div>
                <p className="text-sm text-[#64748b] mt-1">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#94a3b8] italic">
            A segmentação foi construída com base em regras comportamentais e de crédito, priorizando interpretabilidade e valor de negócio.
          </p>
        </CardContent>
      </Card>

      {/* 7. INSIGHTS POR SEGMENTO */}
      {activeSegment && (
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#1a1a1a]">Insights - {activeSegment.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {activeSegment.id === "aprovados-nao-ativados" && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#2196F3] mt-0.5" />
                    <span>Maior oportunidade de ativação do portfólio</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#2196F3] mt-0.5" />
                    <span>Foco em melhorar experiência de onboarding e engajamento inicial</span>
                  </li>
                </>
              )}
              {activeSegment.id === "high-value" && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#00C853] mt-0.5" />
                    <span>Concentra maior potencial de receita</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#00C853] mt-0.5" />
                    <span>Priorizar retenção e ofertas de limite aumentado</span>
                  </li>
                </>
              )}
              {activeSegment.id === "recorrentes" && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#9C27B0] mt-0.5" />
                    <span>Alto nível de engajamento e confiança estabelecida</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#9C27B0] mt-0.5" />
                    <span>Potencial de upgrade para High Value</span>
                  </li>
                </>
              )}
              {activeSegment.id === "potencial" && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#FF9800] mt-0.5" />
                    <span>Bom perfil de crédito, mas com baixa recorrência</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#FF9800] mt-0.5" />
                    <span>Foco em conversão para compras recorrentes</span>
                  </li>
                </>
              )}
              {activeSegment.id === "negados" && (
                <>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#F44336] mt-0.5" />
                    <span>Clientes não aprovados na avaliação de risco</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748b]">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#F44336] mt-0.5" />
                    <span>Considerar estratégias de reabilitação de crédito</span>
                  </li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 8. TABELA DE CLIENTES */}
      {activeSegment && (
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader>
            <div className="space-y-3">
              <CardTitle className="text-base font-semibold text-[#1a1a1a]">
                Clientes do Segmento: {activeSegment.name}
              </CardTitle>
              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-lg px-3 py-2 bg-[#F7FAF8]">
                <Search className="h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPageIndex(0);
                  }}
                  className="flex-1 bg-transparent text-sm outline-none text-[#1a1a1a]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Nome</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Compras</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Limite Total</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Score</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">App</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-[#64748b]">Taxa Juros</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((cliente, idx) => (
                    <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 text-[#1a1a1a] font-medium">
                        {String(getColumnValue(cliente, ["nome", "name"]) || "—")}
                      </td>
                      <td className="py-2 px-2 text-[#64748b]">
                        {formatNumber(parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])))}
                      </td>
                      <td className="py-2 px-2 text-[#64748b]">
                        {formatCurrency(parseNumber(getColumnValue(cliente, ["limite total", "limite", "limit total"])))}
                      </td>
                      <td className="py-2 px-2 text-[#64748b]">
                        {formatNumber(parseNumber(getColumnValue(cliente, ["score de crédito", "score", "score_credito"])))}
                      </td>
                      <td className="py-2 px-2 text-[#64748b]">
                        {parseBoolean(getColumnValue(cliente, ["tem app", "app", "has app"])) ? "Sim" : "Não"}
                      </td>
                      <td className="py-2 px-2 text-[#64748b]">
                        {formatPercentage(parseNumber(getColumnValue(cliente, ["taxa de juros média (ao mês)", "taxa de juros", "taxa juros", "interest rate"])))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-[#64748b]">
                  Página {pageIndex + 1} de {totalPages} ({filteredCustomers.length} clientes)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                    disabled={pageIndex === 0}
                    className="px-3 py-1 text-xs border border-[#E2E8F0] rounded text-[#64748b] disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
                    disabled={pageIndex === totalPages - 1}
                    className="px-3 py-1 text-xs border border-[#E2E8F0] rounded text-[#64748b] disabled:opacity-50"
                  >
                    Próxima
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
