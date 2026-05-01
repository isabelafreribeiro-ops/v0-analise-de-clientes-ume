"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";

// Type definitions
interface AggregatedSegment {
  scoreRange: string;
  ageRange: string;
  count: number;
  scoreMedia: number;
  ltvMedia: number;
  taxaAprovacao: number;
  taxaRecorrencia: number;
  ticketMedio: number;
}

interface PreAggregatedData {
  scoreDistribution: Array<any>;
  ageDistribution: Array<any>;
  valueRiskSegments: Array<any>;
  personasData: {
    recurrentePremium: number;
    compradorEventual: number;
    ativadorPerdido: number;
    negadoValor: number;
  };
  globalMetrics: {
    totalClientes: number;
    scoreMedia: number;
    ticketMedia: number;
    ltvMedia: number;
    pctHighValue: number;
  };
}

export function SegmentacaoTab() {
  const { clientesData } = useData();
  const [filterScore, setFilterScore] = useState("todos");
  const [filterAge, setFilterAge] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [isProcessing, setIsProcessing] = useState(true);

  // Utilities
  const parseNumber = (val: any): number => {
    if (!val) return 0;
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // PRE-AGGREGATION: Calculate all metrics ONCE from raw data
  // This runs only when clientesData changes, not on every filter change
  const preAggregated = useMemo(() => {
    // Set processing state at start (via setTimeout to batch React updates)
    if (clientesData && clientesData.length > 0) {
      setTimeout(() => setIsProcessing(false), 10);
    }

    if (!clientesData || clientesData.length === 0) {
      return null;
    }

    const scoreRanges = [
      { label: "0-300", min: 0, max: 300 },
      { label: "301-450", min: 301, max: 450 },
      { label: "451-550", min: 451, max: 550 },
      { label: "551+", min: 551, max: 9999 },
    ];

    const ageRanges = [
      { label: "18-25", min: 18, max: 25 },
      { label: "26-35", min: 26, max: 35 },
      { label: "36-50", min: 36, max: 50 },
      { label: "50+", min: 50, max: 150 },
    ];

    // Score distribution
    const scoreDistribution = scoreRanges.map((range) => {
      const clients = clientesData.filter((c) => {
        const score = parseNumber(c.Score);
        return score >= range.min && score <= range.max;
      });

      const count = clients.length;
      const aprovados = clients.filter((c) => c.Situação === "Aprovada").length;
      const recorrentes = clients.filter((c) => parseNumber(c["Qtd de Compras"]) >= 2).length;
      const ticketMedio =
        count > 0 ? clients.reduce((sum, c) => sum + parseNumber(c["Ticket Médio"]), 0) / count : 0;

      return {
        label: range.label,
        count,
        taxaAprovacao: count > 0 ? (aprovados / count) * 100 : 0,
        taxaRecorrencia: count > 0 ? (recorrentes / count) * 100 : 0,
        ticketMedio,
      };
    });

    // Age distribution
    const ageDistribution = ageRanges.map((range) => {
      const clients = clientesData.filter((c) => {
        const age = parseNumber(c.Idade);
        return age >= range.min && age <= range.max;
      });

      const count = clients.length;
      const aprovados = clients.filter((c) => c.Situação === "Aprovada").length;
      const recorrentes = clients.filter((c) => parseNumber(c["Qtd de Compras"]) >= 2).length;
      const ticketMedio =
        count > 0 ? clients.reduce((sum, c) => sum + parseNumber(c["Ticket Médio"]), 0) / count : 0;

      return {
        label: range.label,
        count,
        taxaAprovacao: count > 0 ? (aprovados / count) * 100 : 0,
        taxaRecorrencia: count > 0 ? (recorrentes / count) * 100 : 0,
        ticketMedio,
      };
    });

    // Value-Risk Matrix (AGGREGATED - max 12 bubbles)
    const valueRiskSegments: any[] = [];
    for (const scoreRange of scoreRanges) {
      for (const ageRange of ageRanges) {
        const clients = clientesData.filter((c) => {
          const score = parseNumber(c.Score);
          const age = parseNumber(c.Idade);
          return score >= scoreRange.min && score <= scoreRange.max && age >= ageRange.min && age <= ageRange.max;
        });

        if (clients.length === 0) continue;

        const scoreMedia = clients.reduce((sum, c) => sum + parseNumber(c.Score), 0) / clients.length;
        const ltvMedia =
          clients.reduce((sum, c) => sum + parseNumber(c["Qtd de Compras"]) * parseNumber(c["Ticket Médio"]), 0) /
          clients.length;

        let quadrant = "Destruidores";
        let color = "#EF4444";

        if (scoreMedia >= 551) {
          if (ltvMedia >= 150) {
            quadrant = "Ouro";
            color = "#22c55e";
          } else {
            quadrant = "Promissores";
            color = "#86efac";
          }
        } else if (scoreMedia >= 300) {
          if (ltvMedia >= 150) {
            quadrant = "Risco Calculado";
            color = "#FFF8E1";
          }
        }

        valueRiskSegments.push({
          scoreMedia,
          ltvMedia,
          volume: clients.length,
          label: `${ageRange.label} / ${scoreRange.label}`,
          quadrant,
          color,
        });
      }
    }

    // Personas
    const recurrentePremium = clientesData.filter((c) => {
      const qtd = parseNumber(c["Qtd de Compras"]);
      const ticket = parseNumber(c["Ticket Médio"]);
      const ticketMedian = 1000; // approximate
      return qtd >= 2 && ticket > ticketMedian;
    }).length;

    const compradorEventual = clientesData.filter((c) => parseNumber(c["Qtd de Compras"]) === 1).length;

    const ativadorPerdido = clientesData.filter((c) => {
      return c.Situação === "Aprovada" && parseNumber(c["Qtd de Compras"]) === 0;
    }).length;

    const negadoValor = clientesData.filter((c) => {
      return c.Situação !== "Aprovada" && parseNumber(c.Score) >= 250;
    }).length;

    // Global metrics
    const scoreMedia = clientesData.reduce((sum, c) => sum + parseNumber(c.Score), 0) / clientesData.length;
    const tickets = clientesData.map((c) => parseNumber(c["Ticket Médio"]));
    const ticketMedia = tickets.reduce((a, b) => a + b, 0) / clientesData.length;
    const ticketMedian = [...tickets].sort((a, b) => a - b)[Math.floor(tickets.length / 2)];
    const ltvMedia =
      clientesData.reduce((sum, c) => sum + parseNumber(c["Qtd de Compras"]) * parseNumber(c["Ticket Médio"]), 0) /
      clientesData.length;
    const highValue = clientesData.filter(
      (c) => parseNumber(c["Qtd de Compras"]) >= 2 && parseNumber(c["Ticket Médio"]) > ticketMedian
    ).length;
    const pctHighValue = (highValue / clientesData.length) * 100;

    return {
      scoreDistribution,
      ageDistribution,
      valueRiskSegments,
      personasData: {
        recurrentePremium,
        compradorEventual,
        ativadorPerdido,
        negadoValor,
      },
      globalMetrics: {
        totalClientes: clientesData.length,
        scoreMedia,
        ticketMedia,
        ltvMedia,
        pctHighValue,
      },
    };
  }, [clientesData]); // Only recalculates when data loads

  // Apply filters to pre-aggregated data
  const metrics = useMemo(() => {
    if (!preAggregated) {
      return {
        totalClientes: 0,
        scoreMedia: 0,
        ticketMedia: 0,
        ltvMedia: 0,
        pctHighValue: 0,
      };
    }

    let filtered = [...clientesData];

    // Apply score filter
    if (filterScore !== "todos") {
      const ranges: any = {
        "0-300": { min: 0, max: 300 },
        "301-450": { min: 301, max: 450 },
        "451-550": { min: 451, max: 550 },
        "551+": { min: 551, max: 9999 },
      };
      const range = ranges[filterScore];
      filtered = filtered.filter((c) => {
        const score = parseNumber(c.Score);
        return score >= range.min && score <= range.max;
      });
    }

    // Apply age filter
    if (filterAge !== "todas") {
      const ranges: any = {
        "18-25": { min: 18, max: 25 },
        "26-35": { min: 26, max: 35 },
        "36-50": { min: 36, max: 50 },
        "50+": { min: 50, max: 150 },
      };
      const range = ranges[filterAge];
      filtered = filtered.filter((c) => {
        const age = parseNumber(c.Idade);
        return age >= range.min && age <= range.max;
      });
    }

    // Apply status filter
    if (filterStatus !== "todos") {
      filtered = filtered.filter((c) => {
        const isAprovado = c.Situação === "Aprovada";
        const qtdCompras = parseNumber(c["Qtd de Compras"]);
        const isAtivado = qtdCompras >= 1;
        const isRecorrente = qtdCompras >= 2;

        if (filterStatus === "Aprovados") return isAprovado;
        if (filterStatus === "Ativados") return isAtivado;
        if (filterStatus === "Recorrentes") return isRecorrente;
        return true;
      });
    }

    if (filtered.length === 0) {
      return {
        totalClientes: 0,
        scoreMedia: 0,
        ticketMedia: 0,
        ltvMedia: 0,
        pctHighValue: 0,
      };
    }

    // Quick calculation on filtered set
    const scoreMedia = filtered.reduce((sum, c) => sum + parseNumber(c.Score), 0) / filtered.length;
    const tickets = filtered.map((c) => parseNumber(c["Ticket Médio"]));
    const ticketMedia = tickets.reduce((a, b) => a + b, 0) / filtered.length;
    const ticketMedian = [...tickets].sort((a, b) => a - b)[Math.floor(tickets.length / 2)];
    const ltvMedia =
      filtered.reduce((sum, c) => sum + parseNumber(c["Qtd de Compras"]) * parseNumber(c["Ticket Médio"]), 0) /
      filtered.length;
    const highValue = filtered.filter(
      (c) => parseNumber(c["Qtd de Compras"]) >= 2 && parseNumber(c["Ticket Médio"]) > ticketMedian
    ).length;
    const pctHighValue = (highValue / filtered.length) * 100;

    return {
      totalClientes: filtered.length,
      scoreMedia,
      ticketMedia,
      ltvMedia,
      pctHighValue,
    };
  }, [filterScore, filterAge, filterStatus, clientesData]);

  // Derived metrics from pre-aggregated data (very fast)
  const scoreDistribution = useMemo(() => {
    if (!preAggregated) return [];
    return preAggregated.scoreDistribution;
  }, [preAggregated]);

  const ageDistribution = useMemo(() => {
    if (!preAggregated) return [];
    return preAggregated.ageDistribution;
  }, [preAggregated]);

  const valueRiskSegments = useMemo(() => {
    if (!preAggregated) return [];
    return preAggregated.valueRiskSegments;
  }, [preAggregated]);

  const personas = useMemo(() => {
    if (!preAggregated) {
      return [
        { label: "Recorrente Premium", count: 0, pct: 0, color: "#22c55e" },
        { label: "Comprador Eventual", count: 0, pct: 0, color: "#60a5fa" },
        { label: "Ativador Perdido", count: 0, pct: 0, color: "#f59e0b" },
        { label: "Negado de Valor", count: 0, pct: 0, color: "#ef4444" },
      ];
    }

    const data = preAggregated.personasData;
    const total = clientesData.length;

    return [
      {
        label: "Recorrente Premium",
        count: data.recurrentePremium,
        pct: (data.recurrentePremium / total) * 100,
        color: "#22c55e",
      },
      {
        label: "Comprador Eventual",
        count: data.compradorEventual,
        pct: (data.compradorEventual / total) * 100,
        color: "#60a5fa",
      },
      {
        label: "Ativador Perdido",
        count: data.ativadorPerdido,
        pct: (data.ativadorPerdido / total) * 100,
        color: "#f59e0b",
      },
      {
        label: "Negado de Valor",
        count: data.negadoValor,
        pct: (data.negadoValor / total) * 100,
        color: "#ef4444",
      },
    ];
  }, [preAggregated, clientesData.length]);

  if (!preAggregated || isProcessing) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#22c55e]"></div>
          <p className="text-sm text-[#64748b]">Processando dados da segmentação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* TÍTULO */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Análise de segmentação da base — perfil, comportamento e oportunidades por grupo.
        </p>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#E2E8F0]">
        <span className="text-xs font-medium text-[#64748b]">Filtrar por:</span>

        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
            <span className="truncate">
              {filterScore === "todos"
                ? "Todos os scores"
                : filterScore === "0-300"
                  ? "0-300"
                  : filterScore === "301-450"
                    ? "301-450"
                    : filterScore === "451-550"
                      ? "451-550"
                      : "551+"}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">
              Todos os scores
            </SelectItem>
            <SelectItem value="0-300" className="text-xs">
              0-300
            </SelectItem>
            <SelectItem value="301-450" className="text-xs">
              301-450
            </SelectItem>
            <SelectItem value="451-550" className="text-xs">
              451-550
            </SelectItem>
            <SelectItem value="551+" className="text-xs">
              551+
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
            <span className="truncate">
              {filterAge === "todas"
                ? "Todas as idades"
                : filterAge === "18-25"
                  ? "18-25"
                  : filterAge === "26-35"
                    ? "26-35"
                    : filterAge === "36-50"
                      ? "36-50"
                      : "50+"}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todas" className="text-xs">
              Todas as idades
            </SelectItem>
            <SelectItem value="18-25" className="text-xs">
              18-25
            </SelectItem>
            <SelectItem value="26-35" className="text-xs">
              26-35
            </SelectItem>
            <SelectItem value="36-50" className="text-xs">
              36-50
            </SelectItem>
            <SelectItem value="50+" className="text-xs">
              50+
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
            <span className="truncate">
              {filterStatus === "todos"
                ? "Todos os status"
                : filterStatus === "Aprovados"
                  ? "Aprovados"
                  : filterStatus === "Ativados"
                    ? "Ativados"
                    : "Recorrentes"}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">
              Todos os status
            </SelectItem>
            <SelectItem value="Aprovados" className="text-xs">
              Aprovados
            </SelectItem>
            <SelectItem value="Ativados" className="text-xs">
              Ativados
            </SelectItem>
            <SelectItem value="Recorrentes" className="text-xs">
              Recorrentes
            </SelectItem>
          </SelectContent>
        </Select>

        {(filterScore !== "todos" || filterAge !== "todas" || filterStatus !== "todos") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterScore("todos");
              setFilterAge("todas");
              setFilterStatus("todos");
            }}
            className="h-8 px-2 text-xs text-[#64748b] hover:text-[#1a1a1a]"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Clientes Analisados</CardTitle>
            <Users className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{metrics.totalClientes.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{Math.round(metrics.scoreMedia)}</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">R$ {Math.round(metrics.ticketMedia).toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">LTV Médio</CardTitle>
            <Target className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">R$ {Math.round(metrics.ltvMedia).toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">% High Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#22c55e]">
              {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
                metrics.pctHighValue
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SCORE DISTRIBUTION */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Distribuição por Score</h3>
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#22c55e" name="Clientes" />
                <Bar yAxisId="right" dataKey="taxaAprovacao" fill="#60a5fa" name="Taxa Aprovação %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AGE DISTRIBUTION */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Distribuição por Idade</h3>
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#22c55e" name="Clientes" />
                <Bar yAxisId="right" dataKey="taxaRecorrencia" fill="#f59e0b" name="Taxa Recorrência %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* VALUE-RISK MATRIX */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Matriz Valor × Risco (Score vs LTV)</h3>
        <Card className="border-[#E2E8F0] bg-white">
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" dataKey="scoreMedia" name="Score Médio" />
                <YAxis type="number" dataKey="ltvMedia" name="LTV Médio" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Segmentos" data={valueRiskSegments} fill="#22c55e">
                  {valueRiskSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* PERSONAS */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Personas Comportamentais</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {personas.map((persona) => (
            <Card key={persona.label} className="border-l-4" style={{ borderLeftColor: persona.color }}>
              <CardHeader>
                <CardTitle className="text-base text-[#1a1a1a]">{persona.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: persona.color }}>
                  {persona.count.toLocaleString("pt-BR")}
                </div>
                <p className="mt-1 text-xs text-[#64748b]">{persona.pct.toFixed(1)}% da base</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* INSIGHT CARD */}
      <Card className="border-l-4 border-[#f59e0b] bg-gradient-to-r from-[#FFFBEB] to-white">
        <CardHeader>
          <CardTitle className="text-[#D97706]">💡 Insight Executivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#64748b]">
          <p>
            <strong>Ouro (High Score + High Value)</strong> representa a minoria mas com maior ROI. Concentre esforços de retenção.
          </p>
          <p>
            <strong>Promissores (High Score + Low Value)</strong> têm potencial — ativações focadas no ticket médio resultarão em migração para Ouro.
          </p>
          <p>
            <strong>Ativador Perdido</strong> mostra aprovações que não ativam — revisar fluxo pós-aprovação (jornada).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
