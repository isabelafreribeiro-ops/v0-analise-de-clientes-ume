"use client";

import { useMemo, useState } from "react";
import { Users, TrendingUp, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  segmentarClientes,
  calculateSegmentMetrics,
  generateSegmentInsights,
  calculateThresholds,
  calculatePurchaseDistribution,
  calculatePurchaseGroupComparison,
  parseNumericField,
  type Segment,
  type SegmentMetrics,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "high-value": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  "potencial-alto": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes-leves": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  "baixo-valor": { bg: "#FCE4EC", accent: "#E91E63", text: "#880E4F" },
  negados: { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
  "outros-aprovados": { bg: "#F5F5F5", accent: "#9E9E9E", text: "#424242" },
};

const SEGMENT_ORDER = [
  "negados",
  "aprovados-nao-ativados",
  "high-value",
  "potencial-alto",
  "recorrentes-leves",
  "baixo-valor",
  "outros-aprovados",
];

export function SegmentacaoTab() {
  const { clientesData } = useData();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const ROWS_PER_PAGE = 50;

  const { segments, metrics, thresholds, insights, distribution, comparison } = useMemo(() => {
    if (!clientesData || clientesData.length === 0) {
      return {
        segments: [],
        metrics: [],
        thresholds: null,
        insights: [],
        distribution: [],
        comparison: [],
      };
    }

    const segs = segmentarClientes(clientesData);
    const thr = calculateThresholds(clientesData);
    const mets = calculateSegmentMetrics(segs, clientesData.length);
    const insi = generateSegmentInsights(mets, thr);
    const dist = calculatePurchaseDistribution(clientesData);
    const comp = calculatePurchaseGroupComparison(clientesData);

    return {
      segments: segs,
      metrics: mets,
      thresholds: thr,
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

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F7FAF8]">
        <Users className="mb-3 h-8 w-8 text-[#cbd5e1]" />
        <p className="text-base font-medium text-[#64748b]">Nenhum dado de clientes disponível</p>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Carregue a Base de Clientes para visualizar a segmentação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Análise comportamental da base de clientes em {clientesData.length.toLocaleString("pt-BR")} registros
        </p>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Insights Principais</h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-3"
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-[#00C853] mt-0.5" />
                <p className="text-sm text-[#64748b]">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment Criteria Explanation */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Como os segmentos foram definidos</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sortedMetrics.map((metric) => (
            <div key={metric.segmentId} className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-3">
              <p className="text-xs font-medium text-[#1a1a1a]">{metric.segmentName}</p>
              <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
                {segments.find((s) => s.id === metric.segmentId)?.description}
              </p>
            </div>
          ))}
        </div>

        {/* Calculated Thresholds */}
        {thresholds && (
          <div className="mt-3 rounded-lg bg-[#F7FAF8] p-3">
            <p className="text-xs font-medium text-[#1a1a1a]">Limiares calculados (percentis)</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
              <div>
                <span className="text-[#94a3b8]">p75 compras:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">{thresholds.p75Compras.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">p75 limite:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">
                  R$ {thresholds.p75Limite.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[#94a3b8]">p75 score:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">{thresholds.p75Score.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">mediana limite:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">
                  R$ {thresholds.p50Limite.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[#94a3b8]">mediana score:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">{thresholds.p50Score.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-[#94a3b8]">mediana compras:</span>
                <span className="ml-1 font-semibold text-[#1a1a1a]">{thresholds.p50Compras.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Distribution */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Distribuição de Compras</h3>
        <div className="space-y-2">
          {distribution.map((dist, idx) => (
            <div key={idx} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a]">{dist.range}</span>
                <span className="text-xs font-semibold text-[#64748b]">{dist.count.toLocaleString("pt-BR")}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full bg-[#00C853]"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">{dist.percentage.toFixed(1)}% da base</div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Group Comparison */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Comparação por Grupo de Compras</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left px-3 py-2 font-semibold text-[#1a1a1a]">Grupo</th>
                <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Clientes</th>
                <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Limite Médio</th>
                <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Score Médio</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1a1a1a]">% com App</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1a1a1a]">% Aumento</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((comp, idx) => (
                <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                  <td className="px-3 py-2 text-[#1a1a1a] font-medium">{comp.group}</td>
                  <td className="text-right px-3 py-2 text-[#64748b]">{comp.count.toLocaleString("pt-BR")}</td>
                  <td className="text-right px-3 py-2 text-[#64748b]">
                    R$ {comp.avgLimite.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="text-right px-3 py-2 text-[#64748b]">{comp.avgScore.toFixed(0)}</td>
                  <td className="text-center px-3 py-2 text-[#64748b]">{comp.percentageComApp.toFixed(0)}%</td>
                  <td className="text-center px-3 py-2 text-[#64748b]">{comp.percentageComAumento.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8] italic">
          Clientes com 2+ compras são usados como proxy de recorrência, pois já demonstraram mais de uma experiência de uso do crédito.
        </p>
      </div>

      {/* Segment Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">Segmentos ({metrics.length})</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {sortedMetrics.map((metric) => (
            <button
              key={metric.segmentId}
              onClick={() => {
                setSelectedSegmentId(metric.segmentId);
                setPageIndex(0);
              }}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                selectedSegmentId === metric.segmentId
                  ? "border-[#00C853] bg-[#F0F4F3]"
                  : "border-[#E2E8F0] hover:border-[#cbd5e1]"
              }`}
              style={{
                backgroundColor:
                  selectedSegmentId === metric.segmentId
                    ? SEGMENT_COLORS[metric.segmentId]?.bg
                    : "white",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#1a1a1a]">{metric.segmentName}</span>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: SEGMENT_COLORS[metric.segmentId]?.accent }}
                />
              </div>
              <div className="text-xs text-[#64748b]">
                {metric.totalClientes.toLocaleString("pt-BR")} clientes ({metric.percentageOfBase.toFixed(1)}%)
              </div>
              <div className="mt-2 text-xs text-[#94a3b8] line-clamp-2">
                Compras: {metric.avgCompras.toFixed(1)} | Limite: R$
                {metric.avgLimite.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      {activeSegment ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Clientes do segmento: {activeSegment.name} ({filteredCustomers.length})
            </h3>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#cbd5e1]" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageIndex(0);
              }}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-sm text-[#1a1a1a] placeholder-[#cbd5e1] focus:border-[#00C853] focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F7FAF8] border-b border-[#E2E8F0]">
                  <th className="text-left px-3 py-2 font-semibold text-[#1a1a1a]">Nome</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Compras</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Limite Total</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Limite Disp.</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Score</th>
                  <th className="text-center px-3 py-2 font-semibold text-[#1a1a1a]">App</th>
                  <th className="text-center px-3 py-2 font-semibold text-[#1a1a1a]">Aumento</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1a1a1a]">Taxa Juros</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((customer, idx) => (
                    <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="px-3 py-2 text-[#1a1a1a] font-medium">{customer["Nome"] || "—"}</td>
                      <td className="text-right px-3 py-2 text-[#64748b]">
                        {parseNumericField(customer["Qtd de Compras"])?.toFixed(0) || "—"}
                      </td>
                      <td className="text-right px-3 py-2 text-[#64748b]">
                        {parseNumericField(customer["Limite Total"])
                          ? `R$ ${parseNumericField(customer["Limite Total"])!.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                      <td className="text-right px-3 py-2 text-[#64748b]">
                        {parseNumericField(customer["Limite Disponível"])
                          ? `R$ ${parseNumericField(customer["Limite Disponível"])!.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                      <td className="text-right px-3 py-2 text-[#64748b]">
                        {parseNumericField(customer["Score de Crédito"])?.toFixed(0) || "—"}
                      </td>
                      <td className="text-center px-3 py-2 text-[#64748b]">
                        {customer["Tem App?"]?.toString().toLowerCase() === "sim" ||
                        customer["Tem App?"] === "1" ||
                        customer["Tem App?"] === 1
                          ? "Sim"
                          : "Não"}
                      </td>
                      <td className="text-center px-3 py-2 text-[#64748b]">
                        {customer["Já teve Aumento de limite?"]?.toString().toLowerCase() === "sim" ||
                        customer["Já teve Aumento de limite?"] === "1" ||
                        customer["Já teve Aumento de limite?"] === 1
                          ? "Sim"
                          : "Não"}
                      </td>
                      <td className="text-right px-3 py-2 text-[#64748b]">
                        {parseNumericField(customer["Taxa de Juros Média (ao mês)"])?.toFixed(2) || "—"}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-center text-sm text-[#94a3b8]">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCustomers.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">
                Exibindo {pageIndex * ROWS_PER_PAGE + 1} a {Math.min((pageIndex + 1) * ROWS_PER_PAGE, filteredCustomers.length)} de {filteredCustomers.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  className="rounded px-2 py-1 text-xs font-medium text-[#1a1a1a] border border-[#E2E8F0] hover:bg-[#F7FAF8] disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPageIndex(pageIndex + 1)}
                  disabled={(pageIndex + 1) * ROWS_PER_PAGE >= filteredCustomers.length}
                  className="rounded px-2 py-1 text-xs font-medium text-[#1a1a1a] border border-[#E2E8F0] hover:bg-[#F7FAF8] disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F7FAF8]">
          <p className="text-sm text-[#64748b]">Selecione um segmento para visualizar os clientes</p>
        </div>
      )}
    </div>
  );
}
