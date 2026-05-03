"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Users, UserCheck, ShoppingBag, X, Info, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseNumber, getColumnValue } from "@/lib/segmentation";
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

  // AJUSTE 4: Add period filter state
  const [filterPeriodFrom, setFilterPeriodFrom] = useState("todos");
  const [filterPeriodTo, setFilterPeriodTo] = useState("todos");
  
  // MUDANÇA 3: Add score and age filter state
  const [filterScore, setFilterScore] = useState("todos");
  const [filterAge, setFilterAge] = useState("todos");

  // Extract available periods from "Data de Entrada na Ume" and
  // compute the maximum sortKey across BOTH "Data de Entrada na Ume"
  // and "Data da Última Compra" to cap the Período (fim) selector.
  const { availablePeriods, maxPeriodSortKey } = useMemo(() => {
    if (!clientesData || clientesData.length === 0) {
      return { availablePeriods: [], maxPeriodSortKey: 999999 };
    }

    function parseDateToSortKey(raw: any): number {
      if (!raw) return 0;
      const str = typeof raw === "string" ? raw : String(raw);
      let month: number, year: number;
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length >= 3) {
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        } else return 0;
      } else if (str.includes("-")) {
        const parts = str.split("-");
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      } else return 0;
      if (month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
        return year * 100 + month;
      }
      return 0;
    }

    // 1) Coletar TODOS os meses únicos de "Data de Entrada na Ume"
    const periodSet = new Set<string>();
    let maxEntrada = 0;
    let maxUltimaCompra = 0;

    clientesData.forEach((c) => {
      const dataEntrada = c["Data de Entrada na Ume"] || c["Data de Entrada"] || "";
      const skEntrada = parseDateToSortKey(dataEntrada);
      if (skEntrada > 0) {
        const month = skEntrada % 100;
        const year = Math.floor(skEntrada / 100);
        periodSet.add(`${month}/${year}`);
        if (skEntrada > maxEntrada) maxEntrada = skEntrada;
      }

      const dataUltima = c["Data da Última Compra"] || c["Data Ultima Compra"] || "";
      const skUltima = parseDateToSortKey(dataUltima);
      if (skUltima > maxUltimaCompra) maxUltimaCompra = skUltima;
    });

    // 2) Teto do filtro = min(maior entrada, maior última compra) — evita meses futuros
    const teto = Math.min(maxEntrada || 999999, maxUltimaCompra || 999999);

    const sorted = Array.from(periodSet)
      .map((p) => {
        const [month, year] = p.split("/").map(Number);
        return {
          value: p,
          label: `${MONTH_NAMES[month - 1]}/${year}`,
          sortKey: year * 100 + month,
        };
      })
      .filter((p) => p.sortKey <= teto) // remove meses futuros (sintéticos)
      .sort((a, b) => a.sortKey - b.sortKey);

    return { availablePeriods: sorted, maxPeriodSortKey: teto };
  }, [clientesData]);

  // Filter clientes based on period, score and age
  const filteredClientes = useMemo(() => {
    // Calculate period bounds for filtering
    const fromSortKey = filterPeriodFrom !== "todos" ? getSortKey(filterPeriodFrom) : 0;
    const toSortKey = filterPeriodTo !== "todos" ? getSortKey(filterPeriodTo) : 999999;

    return clientesData.filter((c) => {
      // AJUSTE 4: Apply period filter
      if (filterPeriodFrom !== "todos" || filterPeriodTo !== "todos") {
        const dataEntrada = c["Data de Entrada na Ume"] || c["Data de Entrada"] || "";
        if (dataEntrada) {
          let month: number, year: number;
          if (dataEntrada.includes("/")) {
            const parts = dataEntrada.split("/");
            if (parts.length >= 3) {
              month = parseInt(parts[1], 10);
              year = parseInt(parts[2], 10);
            } else {
              return false;
            }
          } else if (dataEntrada.includes("-")) {
            const parts = dataEntrada.split("-");
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
          } else {
            return false;
          }
          
          const clientSortKey = year * 100 + month;
          if (clientSortKey < fromSortKey || clientSortKey > toSortKey) {
            return false;
          }
        }
      }

      // Apply score filter
      if (filterScore !== "todos") {
        const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
        if (filterScore === "baixo" && score >= 400) return false;
        if (filterScore === "medio" && (score < 400 || score >= 700)) return false;
        if (filterScore === "alto" && score < 700) return false;
      }

      // Apply age filter
      if (filterAge !== "todos") {
        const idade = Number(c.Idade) || 0;
        if (filterAge === "menor25" && idade >= 25) return false;
        if (filterAge === "25a35" && (idade < 25 || idade > 35)) return false;
        if (filterAge === "35a50" && (idade < 35 || idade > 50)) return false;
        if (filterAge === "maior50" && idade <= 50) return false;
      }

      return true;
    });
  }, [clientesData, filterPeriodFrom, filterPeriodTo, filterScore, filterAge]);

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
        recorrentes: 0,
        umePlus: 0,
        qualidadeRecorrentes: 0,
      };
    }

    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovados = total - negados;
    const ativos = filteredClientes.filter((c) => Number(c["Qtd de Compras"]) >= 1).length;
    const taxaConversao = aprovados > 0 ? (ativos / aprovados) * 100 : 0;
    
    // MUDANÇA 1: Calculate "Qualidade dos Recorrentes" using same logic as Segmentação
    const recorrentes = filteredClientes.filter((c) => {
      const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
      const sit = String(getColumnValue(c, ["situação", "situacao", "status"]) || "").toLowerCase().trim();
      return compras >= 2 && (sit === "adimplente" || sit === "inadimplente");
    }).length;
    const umePlus = filteredClientes.filter((c) => {
      const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
      const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
      const sit = String(getColumnValue(c, ["situação", "situacao", "status"]) || "").toLowerCase().trim();
      return compras >= 3 && score >= 700 && sit === "adimplente";
    }).length;
    const qualidadeRecorrentes = recorrentes > 0 ? (umePlus / recorrentes) * 100 : 0;

    return { total, aprovados, ativos, taxaConversao, recorrentes, umePlus, qualidadeRecorrentes };
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
          
          {/* TESE CENTRAL */}
          <div className="mt-3 bg-[#F0FDF4]/60 border-l-2 border-l-[#00C853] rounded py-2 px-3">
            <p className="text-[10px] font-semibold text-[#00C853] uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-[#00C853]" /> Tese
            </p>
            <p className="text-sm italic text-[#1a1a1a] mt-1">
              De cada 100 solicitações, 24 são aprovadas e apenas 14 viram cliente pagante — embora 100% gerem custo de aquisição. As próximas análises mapeiam onde o funil vaza e como concentrar esforço onde realmente gera valor.
            </p>
          </div>
        </div>
        
        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-[#64748b]">Filtrar por:</span>
          
          {/* AJUSTE 2: Period filters with labels */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#3B82F6]">Período (início)</span>
            <Select value={filterPeriodFrom} onValueChange={setFilterPeriodFrom}>
              <SelectTrigger className="h-8 w-32 border-[#3B82F6] bg-white text-xs font-medium text-[#1a1a1a]">
                <span className="truncate">
                  {filterPeriodFrom === "todos" 
                    ? (availablePeriods.length > 0 ? availablePeriods[0]?.label : "Jan/2024")
                    : availablePeriods.find(p => p.value === filterPeriodFrom)?.label || filterPeriodFrom}
                </span>
              </SelectTrigger>
              <SelectContent className="border-[#E2E8F0] bg-white max-h-60">
                <SelectItem value="todos" className="text-xs">Início da base</SelectItem>
                {availablePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value} className="text-xs">
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#3B82F6]">Período (fim)</span>
            <Select value={filterPeriodTo} onValueChange={setFilterPeriodTo}>
              <SelectTrigger className="h-8 w-32 border-[#3B82F6] bg-white text-xs font-medium text-[#1a1a1a]">
                <span className="truncate">
                  {filterPeriodTo === "todos" 
                    ? (availablePeriods.length > 0 ? availablePeriods[availablePeriods.length - 1]?.label : "Abr/2026")
                    : availablePeriods.find(p => p.value === filterPeriodTo)?.label || filterPeriodTo}
                </span>
              </SelectTrigger>
              <SelectContent className="border-[#E2E8F0] bg-white max-h-60">
                <SelectItem value="todos" className="text-xs">Fim da base</SelectItem>
                {availablePeriods
                  .filter(p =>
                    p.sortKey <= maxPeriodSortKey &&
                    (filterPeriodFrom === "todos" || p.sortKey >= getSortKey(filterPeriodFrom))
                  )
                  .map((period) => (
                    <SelectItem key={period.value} value={period.value} className="text-xs">
                      {period.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
              <span className="truncate">
                {filterScore === "todos" ? "Todos os scores" : 
                 filterScore === "baixo" ? "Baixo (<400)" :
                 filterScore === "medio" ? "Médio (400-700)" :
                 "Alto (≥700)"}
              </span>
            </SelectTrigger>
            <SelectContent className="border-[#E2E8F0] bg-white">
              <SelectItem value="todos" className="text-xs">Todos os scores</SelectItem>
              <SelectItem value="baixo" className="text-xs">Baixo (&lt;400)</SelectItem>
              <SelectItem value="medio" className="text-xs">Médio (400-700)</SelectItem>
              <SelectItem value="alto" className="text-xs">Alto (≥700)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAge} onValueChange={setFilterAge}>
            <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
              <span className="truncate">
                {filterAge === "todos" ? "Todas as idades" :
                 filterAge === "menor25" ? "Menos de 25 anos" :
                 filterAge === "25a35" ? "25-35 anos" :
                 filterAge === "35a50" ? "35-50 anos" :
                 "50+ anos"}
              </span>
            </SelectTrigger>
            <SelectContent className="border-[#E2E8F0] bg-white">
              <SelectItem value="todos" className="text-xs">Todas as idades</SelectItem>
              <SelectItem value="menor25" className="text-xs">Menos de 25 anos</SelectItem>
              <SelectItem value="25a35" className="text-xs">25-35 anos</SelectItem>
              <SelectItem value="35a50" className="text-xs">35-50 anos</SelectItem>
              <SelectItem value="maior50" className="text-xs">50+ anos</SelectItem>
            </SelectContent>
          </Select>

          {(filterPeriodFrom !== "todos" || filterPeriodTo !== "todos" || filterScore !== "todos" || filterAge !== "todos") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterPeriodFrom("todos");
                setFilterPeriodTo("todos");
                setFilterScore("todos");
                setFilterAge("todos");
              }}
              className="h-8 px-2 text-xs text-[#64748b] hover:text-[#1a1a1a]"
            >
              <X className="mr-1 h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>
        
        {/* Snapshot info */}
        <div className="mt-4 text-xs text-[#64748b]">
          Análise sobre {filteredClientes.length.toLocaleString("pt-BR")} clientes
          {(filterPeriodFrom !== "todos" || filterPeriodTo !== "todos" || filterScore !== "todos" || filterAge !== "todos") && ` (filtrados de ${clientesData.length.toLocaleString("pt-BR")})`}
        </div>
        
        {/* AJUSTE 5: Informational note about varejo filter limitation */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-[#F1F5F9] px-3 py-2 text-xs text-[#475569]">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#3B82F6]" />
          <span>
            Filtro por varejo aplicável apenas à seção "Aquisição de Varejos" abaixo. 
            A Base de Clientes não vincula clientes a varejos específicos (apenas quantidade de varejos visitados) — 
            cruzamento por varejo individual exigiria base transacional adicional.
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-6">
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

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Qualidade dos Recorrentes
            </CardTitle>
            <UserCheck className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(summaryMetrics.qualidadeRecorrentes)}%
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {formatNumber(summaryMetrics.umePlus)} de {formatNumber(summaryMetrics.recorrentes)} recorrentes são Ume Plus (3+ compras, score ≥700, adimplentes)
            </p>
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
              // MUDANÇA 3: Hardcode to show "Aprovados → Ativados" transition (index 1 to 2)
              const aprovedToActivated = funnelData.length > 2 ? {
                de: funnelData[1].name,
                deDiff: funnelData[1].value,
                para: funnelData[2].name,
                paraDiff: funnelData[2].value,
                diff: funnelData[1].value - funnelData[2].value,
              } : null;

              if (!aprovedToActivated) return <p className="text-sm text-[#64748b]">Dados insuficientes para análise</p>;

              const pct = aprovedToActivated.deDiff > 0 ? (aprovedToActivated.diff / aprovedToActivated.deDiff) * 100 : 0;
              const label = `${aprovedToActivated.de} → ${aprovedToActivated.para}`;

              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[#64748b] mb-1">Etapa crítica:</p>
                    <p className="text-lg font-bold text-[#1a1a1a]">{label}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#64748b] font-semibold">Saída:</p>
                      <p className="text-2xl font-bold text-[#1a1a1a]">{aprovedToActivated.deDiff.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-2xl">→</span>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748b] font-semibold">Chegada:</p>
                      <p className="text-2xl font-bold text-[#1a1a1a]">{aprovedToActivated.paraDiff.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="bg-[#F59E0B]/10 rounded p-3 border border-[#F59E0B]/30">
                    <p className="text-sm font-bold text-[#D97706]">
                      {aprovedToActivated.diff.toLocaleString("pt-BR")} clientes perdidos ({pct.toFixed(1)}% de atrito)
                    </p>
                  </div>
                  
                  <div className="border-t border-[#F59E0B]/20 pt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-[#D97706] mb-1">💡 Hipótese:</p>
                      <p className="text-sm text-[#64748b]">Pode indicar atrito na ativação (ponto de venda), baixa percepção de valor da Ume vs. cartão tradicional, limite aprovado insuficiente para a primeira compra desejada, ou falta de follow-up do vendedor/promotor após aprovação.</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#D97706] mb-1">🎯 Ação sugerida:</p>
                      <p className="text-sm text-[#64748b]">Reforçar comunicação pós-aprovação (ver aba Jornada), treinar promotores no PDV para abordagem ativa, considerar limite mínimo mais flexível para primeira compra.</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
