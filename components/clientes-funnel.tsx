"use client";

import { useMemo } from "react";
import { TrendingUp, Users, UserCheck, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { InsightCallout } from "./insight-callout";
import type { FunnelStep } from "@/lib/types";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

interface PeriodOption {
  value: string;
  label: string;
  sortKey: number;
}

interface ClientesFunnelProps {
  periodFrom?: string;
  periodTo?: string;
  onPeriodFromChange?: (value: string) => void;
  onPeriodToChange?: (value: string) => void;
  varejoFilter?: string;
  onVarejoFilterChange?: (value: string) => void;
}

function getSortKey(period: string): number {
  const [month, year] = period.split("/").map(Number);
  return year * 100 + month;
}

export function ClientesFunnel({ }: ClientesFunnelProps) {
  const { clientesData } = useData();

  // Get unique periods from data
  const periods = useMemo((): PeriodOption[] => {
    return [];
  }, []);

  const getSelectedLabel = (value: string) => {
    if (value === "all") return "Todos";
    return value;
  };

  // Use all clients - no filtering
  const filteredClientes = clientesData;

  // Calculate funnel data (4 steps: Solicitações → Aprovados → Ativados → Recorrentes)
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredClientes.length === 0) return [];

    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovados = total - negados;
    const ativados = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) >= 1 && c.Situação !== "Negada"
    ).length;
    const recorrentes = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) > 1
    ).length;

    const steps: FunnelStep[] = [
      {
        name: "Total Solicitações",
        value: total,
        percentage: 100,
        dropoffRate: 0,
      },
      {
        name: "Aprovados",
        value: aprovados,
        percentage: total > 0 ? (aprovados / total) * 100 : 0,
        dropoffRate: total > 0 ? ((negados) / total) * 100 : 0,
      },
      {
        name: "Ativados",
        value: ativados,
        percentage: total > 0 ? (ativados / total) * 100 : 0,
        dropoffRate: aprovados > 0 ? ((aprovados - ativados) / aprovados) * 100 : 0,
      },
      {
        name: "Recorrentes",
        value: recorrentes,
        percentage: total > 0 ? (recorrentes / total) * 100 : 0,
        dropoffRate: ativados > 0 ? ((ativados - recorrentes) / ativados) * 100 : 0,
      },
    ];

    return steps;
  }, [filteredClientes]);

  // Negados metric
  const negadosMetric = useMemo(() => {
    if (filteredClientes.length === 0) {
      return { count: 0, percentage: 0 };
    }
    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    return {
      count: negados,
      percentage: total > 0 ? (negados / total) * 100 : 0,
    };
  }, [filteredClientes]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (filteredClientes.length === 0) {
      return {
        total: 0,
        aprovados: 0,
        ativos: 0,
        taxaConversao: 0,
      };
    }

    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovados = total - negados;
    const ativos = filteredClientes.filter((c) => Number(c["Qtd de Compras"]) >= 1).length;
    const taxaConversao = aprovados > 0 ? (ativos / aprovados) * 100 : 0;

    return { total, aprovados, ativos, taxaConversao };
  }, [filteredClientes]);

  const hasData = clientesData.length > 0;

  return (
    <div className="space-y-6">
      {/* Title and Filters */}
      <div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Aquisição de Clientes</h2>
          <p className="text-sm text-[#64748b]">
            Análise do funil de aquisição e conversão de clientes Ume
          </p>
        </div>
        
        {/* Filter Toolbar */}
        <div className="mt-4 text-xs text-[#64748b]">
          Análise sobre snapshot completo da base — {clientesData.length.toLocaleString("pt-BR")} clientes
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Total Solicitações
            </CardTitle>
            <Users className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {summaryMetrics.total.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">100% do total</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Negados
            </CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {negadosMetric.count.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(negadosMetric.percentage)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Aprovados
            </CardTitle>
            <UserCheck className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {summaryMetrics.aprovados.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {summaryMetrics.total > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((summaryMetrics.aprovados / summaryMetrics.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Clientes Ativados
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {summaryMetrics.ativos.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {summaryMetrics.total > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((summaryMetrics.ativos / summaryMetrics.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(summaryMetrics.taxaConversao)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
            <Users className="h-5 w-5 text-[#00C853]" />
            Funil de Aquisição de Clientes
          </CardTitle>
          <CardDescription className="text-[#64748b]">
            Visualização do funil completo de aquisição de clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasData ? (
            <>
              <FunnelChart data={funnelData} />
              
              {/* Metric Descriptions */}
              <div className="space-y-2 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748b]">
                <div><span className="font-medium text-[#1a1a1a]">Total Solicitações:</span> clientes que solicitaram crédito Ume.</div>
                <div><span className="font-medium text-[#1a1a1a]">Aprovados:</span> clientes com crédito aprovado e limite definido.</div>
                <div><span className="font-medium text-[#1a1a1a]">Ativados:</span> clientes que realizaram a primeira compra.</div>
                <div><span className="font-medium text-[#1a1a1a]">Recorrentes:</span> clientes com mais de uma compra.</div>
                <div><span className="font-medium text-[#1a1a1a]">Negados:</span> clientes que solicitaram crédito, mas não foram aprovados.</div>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-[#cbd5e1]" />
              <p className="text-lg font-medium text-[#64748b]">
                Nenhum dado carregado
              </p>
              <p className="text-sm text-[#94a3b8]">
                Faça upload da Base de Clientes para visualizar o funil
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maior Perda Identificada */}
      {hasData && funnelData.length > 1 && (
        <Card className="border-l-4 border-[#F59E0B] bg-gradient-to-r from-[#FFFBEB] to-white">
          <CardHeader>
            <CardTitle className="text-[#D97706] flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Maior Perda Identificada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              let maiorPerda = { label: "", diff: 0, pct: 0, de: "", para: "", deDiff: 0, paraDiff: 0 };
              
              for (let i = 0; i < funnelData.length - 1; i++) {
                const diff = funnelData[i].value - funnelData[i + 1].value;
                const pct = funnelData[i].value > 0 ? (diff / funnelData[i].value) * 100 : 0;
                
                if (diff > maiorPerda.diff) {
                  maiorPerda = {
                    label: `${funnelData[i].name} → ${funnelData[i + 1].name}`,
                    diff,
                    pct,
                    de: funnelData[i].name,
                    para: funnelData[i + 1].name,
                    deDiff: funnelData[i].value,
                    paraDiff: funnelData[i + 1].value
                  };
                }
              }

              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Etapa crítica:</p>
                    <p className="text-lg font-bold text-[#1a1a1a]">{maiorPerda.label}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#64748b] font-semibold">Saída:</p>
                      <p className="text-2xl font-bold text-[#1a1a1a]">{maiorPerda.deDiff.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-2xl">→</span>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] font-semibold">Chegada:</p>
                      <p className="text-2xl font-bold text-[#1a1a1a]">{maiorPerda.paraDiff.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="bg-[#F59E0B]/10 rounded p-3 border border-[#F59E0B]/30">
                    <p className="text-sm font-bold text-[#D97706]">
                      {maiorPerda.diff.toLocaleString("pt-BR")} clientes perdidos ({maiorPerda.pct.toFixed(1)}% de atrito)
                    </p>
                  </div>
                  
                  <div className="border-t border-[#F59E0B]/20 pt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-[#D97706] mb-1">💡 Hipótese:</p>
                      <p className="text-sm text-[#64748b]">Concentração de perdas nesta etapa indica oportunidade de otimização — revisar critérios e fluxo.</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#D97706] mb-1">🎯 Ação sugerida:</p>
                      <p className="text-sm text-[#64748b]">Analisar motivos da perda nesta etapa e testar intervenções pontuais.</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Insight */}
      <InsightCallout data={funnelData} title="clientes" />
    </div>
  );
}
