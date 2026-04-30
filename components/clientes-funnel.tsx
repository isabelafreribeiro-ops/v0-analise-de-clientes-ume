"use client";

import { useMemo } from "react";
import { TrendingUp, Users, UserCheck, ShoppingBag, Calendar, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  periodFrom: string;
  periodTo: string;
  onPeriodFromChange: (value: string) => void;
  onPeriodToChange: (value: string) => void;
  varejoFilter: string;
  onVarejoFilterChange: (value: string) => void;
}

function getSortKey(period: string): number {
  const [month, year] = period.split("/").map(Number);
  return year * 100 + month;
}

export function ClientesFunnel({ 
  periodFrom, 
  periodTo, 
  onPeriodFromChange, 
  onPeriodToChange,
  varejoFilter,
  onVarejoFilterChange
}: ClientesFunnelProps) {
  const { clientesData } = useData();

  // Get unique periods from data
  const periods = useMemo((): PeriodOption[] => {
    const periodsMap = new Map<string, PeriodOption>();
    
    clientesData.forEach((cliente) => {
      const date = cliente["Data de Entrada na Ume"];
      if (date) {
        const dateStr = String(date);
        let month: number | null = null;
        let year: number | null = null;
        
        const slashParts = dateStr.split("/");
        if (slashParts.length >= 3) {
          month = parseInt(slashParts[1], 10);
          year = parseInt(slashParts[2], 10);
        } else if (dateStr.includes("-")) {
          const dashParts = dateStr.split("-");
          if (dashParts.length >= 2) {
            year = parseInt(dashParts[0], 10);
            month = parseInt(dashParts[1], 10);
          }
        }
        
        if (month && year && month >= 1 && month <= 12) {
          const value = `${month.toString().padStart(2, "0")}/${year}`;
          const label = `${MONTH_NAMES[month - 1]}/${year}`;
          const sortKey = year * 100 + month;
          
          if (!periodsMap.has(value)) {
            periodsMap.set(value, { value, label, sortKey });
          }
        }
      }
    });
    
    return Array.from(periodsMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [clientesData]);

  const getSelectedLabel = (value: string) => {
    if (value === "all") return "Todos";
    const found = periods.find(p => p.value === value);
    return found ? found.label : value;
  };

  // Filter clients by period range AND varejo filter
  const filteredClientes = useMemo(() => {
    let filtered = clientesData;
    
    // Apply period filter
    if (periodFrom !== "all" || periodTo !== "all") {
      const fromKey = periodFrom !== "all" ? getSortKey(periodFrom) : 0;
      const toKey = periodTo !== "all" ? getSortKey(periodTo) : 999999;
      
      filtered = filtered.filter((cliente) => {
        const date = cliente["Data de Entrada na Ume"];
        if (!date) return false;
        
        const dateStr = String(date);
        let month: number | null = null;
        let year: number | null = null;
        
        const parts = dateStr.split("/");
        if (parts.length >= 3) {
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        } else if (dateStr.includes("-")) {
          const dateParts = dateStr.split("-");
          if (dateParts.length >= 2) {
            year = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10);
          }
        }
        
        if (!month || !year) return false;
        
        const clientKey = year * 100 + month;
        return clientKey >= fromKey && clientKey <= toKey;
      });
    }
    
    // Apply varejo filter
    if (varejoFilter !== "todos") {
      filtered = filtered.filter((cliente) => {
        const qtdVarejos = Number(cliente["Qtd de Varejos que já comprou"]) || 0;
        
        if (varejoFilter === "1") return qtdVarejos === 1;
        if (varejoFilter === "2") return qtdVarejos === 2;
        if (varejoFilter === "3+") return qtdVarejos >= 3;
        
        return true;
      });
    }
    
    return filtered;
  }, [clientesData, periodFrom, periodTo, varejoFilter]);

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

  const clearFilters = () => {
    onPeriodFromChange("all");
    onPeriodToChange("all");
  };

  const hasActiveFilters = periodFrom !== "all" || periodTo !== "all";

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
        <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-[#E2E8F0] pb-3">
          <Calendar className="h-3.5 w-3.5 text-[#64748b]" />
          <span className="text-xs font-medium text-[#64748b]">De:</span>
          <Select value={periodFrom} onValueChange={onPeriodFromChange}>
            <SelectTrigger className="h-8 w-32 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
              <span className="truncate">{getSelectedLabel(periodFrom)}</span>
            </SelectTrigger>
            <SelectContent className="border-[#E2E8F0] bg-white">
              <SelectItem value="all" className="text-xs text-[#1a1a1a]">
                Todos
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value} className="text-xs text-[#1a1a1a]">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs font-medium text-[#64748b]">Até:</span>
          <Select value={periodTo} onValueChange={onPeriodToChange}>
            <SelectTrigger className="h-8 w-32 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
              <span className="truncate">{getSelectedLabel(periodTo)}</span>
            </SelectTrigger>
            <SelectContent className="border-[#E2E8F0] bg-white">
              <SelectItem value="all" className="text-xs text-[#1a1a1a]">
                Todos
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value} className="text-xs text-[#1a1a1a]">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-[#64748b] hover:bg-[#F0F4F3] hover:text-[#1a1a1a]"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          <span className="text-xs font-medium text-[#64748b]">Varejos:</span>
          <Select value={varejoFilter} onValueChange={onVarejoFilterChange}>
            <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
              <span className="truncate">
                {varejoFilter === "todos" && "Todos"}
                {varejoFilter === "1" && "1 varejo"}
                {varejoFilter === "2" && "2 varejos"}
                {varejoFilter === "3+" && "3+ varejos"}
              </span>
            </SelectTrigger>
            <SelectContent className="border-[#E2E8F0] bg-white">
              <SelectItem value="todos" className="text-xs text-[#1a1a1a]">
                Todos
              </SelectItem>
              <SelectItem value="1" className="text-xs text-[#1a1a1a]">
                1 varejo
              </SelectItem>
              <SelectItem value="2" className="text-xs text-[#1a1a1a]">
                2 varejos
              </SelectItem>
              <SelectItem value="3+" className="text-xs text-[#1a1a1a]">
                3+ varejos
              </SelectItem>
            </SelectContent>
          </Select>
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
              {negadosMetric.percentage.toFixed(1)}% do total
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
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Clientes Ativos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {summaryMetrics.ativos.toLocaleString("pt-BR")}
            </div>
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
              {summaryMetrics.taxaConversao.toFixed(1)}%
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
              <div className="grid gap-3 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748b]">
                <div><span className="font-medium text-[#1a1a1a]">Total Solicitações:</span> todos que solicitaram crédito Ume</div>
                <div><span className="font-medium text-[#1a1a1a]">Aprovados:</span> tiveram crédito aprovado e limite definido</div>
                <div><span className="font-medium text-[#1a1a1a]">Ativados:</span> realizaram a primeira compra</div>
                <div><span className="font-medium text-[#1a1a1a]">Recorrentes:</span> realizaram mais de uma compra</div>
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

      {/* Insight */}
      <InsightCallout data={funnelData} title="clientes" />
    </div>
  );
}
