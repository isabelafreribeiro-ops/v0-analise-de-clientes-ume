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
}

function getSortKey(period: string): number {
  const [month, year] = period.split("/").map(Number);
  return year * 100 + month;
}

export function ClientesFunnel({ 
  periodFrom, 
  periodTo, 
  onPeriodFromChange, 
  onPeriodToChange 
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

  // Filter clients by period range
  const filteredClientes = useMemo(() => {
    if (periodFrom === "all" && periodTo === "all") return clientesData;
    
    const fromKey = periodFrom !== "all" ? getSortKey(periodFrom) : 0;
    const toKey = periodTo !== "all" ? getSortKey(periodTo) : 999999;
    
    return clientesData.filter((cliente) => {
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
  }, [clientesData, periodFrom, periodTo]);

  // Calculate funnel data
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredClientes.length === 0) return [];

    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovados = total - negados;
    const aprovadosInativos = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) === 0 && c.Situação !== "Negada"
    ).length;
    const primeiraCompra = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) >= 1
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
        name: "Negados",
        value: negados,
        percentage: total > 0 ? (negados / total) * 100 : 0,
        dropoffRate: 0,
      },
      {
        name: "Aprovados Inativos",
        value: aprovadosInativos,
        percentage: total > 0 ? (aprovadosInativos / total) * 100 : 0,
        dropoffRate: aprovados > 0 ? ((aprovados - aprovadosInativos - primeiraCompra) / aprovados) * 100 : 0,
      },
      {
        name: "Primeira Compra",
        value: primeiraCompra,
        percentage: total > 0 ? (primeiraCompra / total) * 100 : 0,
        dropoffRate: aprovados > 0 ? ((aprovados - primeiraCompra) / aprovados) * 100 : 0,
      },
      {
        name: "Recorrentes",
        value: recorrentes,
        percentage: total > 0 ? (recorrentes / total) * 100 : 0,
        dropoffRate: primeiraCompra > 0 ? ((primeiraCompra - recorrentes) / primeiraCompra) * 100 : 0,
      },
    ];

    return steps;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Aquisição de Clientes</h2>
          <p className="text-sm text-[#7a9e8a]">
            Análise do funil de aquisição e conversão de clientes Ume
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#7a9e8a]" />
          <span className="text-xs text-[#7a9e8a]">De:</span>
          <Select value={periodFrom} onValueChange={onPeriodFromChange}>
            <SelectTrigger className="h-7 w-[110px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
              <span className="truncate">{getSelectedLabel(periodFrom)}</span>
            </SelectTrigger>
            <SelectContent className="border-[#004d26] bg-[#002a14]">
              <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                Todos
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs text-[#7a9e8a]">Até:</span>
          <Select value={periodTo} onValueChange={onPeriodToChange}>
            <SelectTrigger className="h-7 w-[110px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
              <span className="truncate">{getSelectedLabel(periodTo)}</span>
            </SelectTrigger>
            <SelectContent className="border-[#004d26] bg-[#002a14]">
              <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                Todos
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
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
              className="h-7 px-2 text-[#7a9e8a] hover:bg-[#003d1f] hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Total Solicitações
            </CardTitle>
            <Users className="h-4 w-4 text-[#7a9e8a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summaryMetrics.total.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
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

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Clientes Ativos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summaryMetrics.ativos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
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
      <Card className="border-[#004d26] bg-[#002a14]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-[#00C853]" />
            Funil de Aquisição de Clientes
          </CardTitle>
          <CardDescription className="text-[#7a9e8a]">
            Visualização do funil completo de aquisição de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <FunnelChart data={funnelData} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-[#7a9e8a]/50" />
              <p className="text-lg font-medium text-[#7a9e8a]">
                Nenhum dado carregado
              </p>
              <p className="text-sm text-[#7a9e8a]/70">
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
