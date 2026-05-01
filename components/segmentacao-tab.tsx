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

export function SegmentacaoTab() {
  const { clientesData } = useData();

  // Filter states
  const [filterScore, setFilterScore] = useState("todos");
  const [filterAge, setFilterAge] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");

  // Parse utilities
  const parseNumber = (val: any): number => {
    if (!val) return 0;
    const parsed = Number(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Filter clients
  const filteredClientes = useMemo(() => {
    return clientesData.filter((c) => {
      // Score filter
      if (filterScore !== "todos") {
        const score = parseNumber(c.Score);
        if (filterScore === "0-300" && score > 300) return false;
        if (filterScore === "301-450" && (score <= 300 || score > 450)) return false;
        if (filterScore === "451-550" && (score <= 450 || score > 550)) return false;
        if (filterScore === "551+" && score <= 550) return false;
      }

      // Age filter
      if (filterAge !== "todas") {
        const age = parseNumber(c.Idade);
        if (filterAge === "18-25" && (age < 18 || age > 25)) return false;
        if (filterAge === "26-35" && (age < 26 || age > 35)) return false;
        if (filterAge === "36-50" && (age < 36 || age > 50)) return false;
        if (filterAge === "50+" && age < 50) return false;
      }

      // Status filter
      if (filterStatus !== "todos") {
        const isAprovado = c.Situação === "Aprovada";
        const qtdCompras = parseNumber(c["Qtd de Compras"]);
        const isAtivado = qtdCompras >= 1;
        const isRecorrente = qtdCompras >= 2;

        if (filterStatus === "Aprovados" && !isAprovado) return false;
        if (filterStatus === "Ativados" && !isAtivado) return false;
        if (filterStatus === "Recorrentes" && !isRecorrente) return false;
      }

      return true;
    });
  }, [clientesData, filterScore, filterAge, filterStatus]);

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    if (filteredClientes.length === 0) {
      return {
        totalClientes: 0,
        scoreMedia: 0,
        ticketMedia: 0,
        ltvMedia: 0,
        pctHighValue: 0,
      };
    }

    const scoreMedia = filteredClientes.reduce((sum, c) => sum + parseNumber(c.Score), 0) / filteredClientes.length;
    const tickets = filteredClientes.map((c) => parseNumber(c["Ticket Médio"]));
    const ticketMedia = tickets.reduce((a, b) => a + b, 0) / filteredClientes.length;
    const ticketMedian = [...tickets].sort((a, b) => a - b)[Math.floor(tickets.length / 2)];

    // LTV = sum of transactions per client
    const ltvData = filteredClientes.map((c) => ({
      qtd: parseNumber(c["Qtd de Compras"]),
      ticket: parseNumber(c["Ticket Médio"]),
    }));
    const ltvMedia = ltvData.reduce((sum, d) => sum + d.qtd * d.ticket, 0) / filteredClientes.length;

    // High Value = recorrentes (2+ compras) com ticket > mediana
    const highValue = filteredClientes.filter(
      (c) => parseNumber(c["Qtd de Compras"]) >= 2 && parseNumber(c["Ticket Médio"]) > ticketMedian
    ).length;
    const pctHighValue = (highValue / filteredClientes.length) * 100;

    return {
      totalClientes: filteredClientes.length,
      scoreMedia,
      ticketMedia,
      ltvMedia,
      pctHighValue,
    };
  }, [filteredClientes]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { label: "0-300", min: 0, max: 300 },
      { label: "301-450", min: 301, max: 450 },
      { label: "451-550", min: 451, max: 550 },
      { label: "551+", min: 551, max: 9999 },
    ];

    return ranges.map((range) => {
      const clients = filteredClientes.filter((c) => {
        const score = parseNumber(c.Score);
        return score >= range.min && score <= range.max;
      });

      const count = clients.length;
      const aprovados = clients.filter((c) => c.Situação === "Aprovada").length;
      const recorrentes = clients.filter((c) => parseNumber(c["Qtd de Compras"]) >= 2).length;
      const ticketMedio =
        clients.length > 0
          ? clients.reduce((sum, c) => sum + parseNumber(c["Ticket Médio"]), 0) / clients.length
          : 0;

      return {
        label: range.label,
        count,
        taxaAprovacao: count > 0 ? (aprovados / count) * 100 : 0,
        taxaRecorrencia: count > 0 ? (recorrentes / count) * 100 : 0,
        ticketMedio,
      };
    });
  }, [filteredClientes]);

  // Age distribution
  const ageDistribution = useMemo(() => {
    const ranges = [
      { label: "18-25", min: 18, max: 25 },
      { label: "26-35", min: 26, max: 35 },
      { label: "36-50", min: 36, max: 50 },
      { label: "50+", min: 50, max: 150 },
    ];

    return ranges.map((range) => {
      const clients = filteredClientes.filter((c) => {
        const age = parseNumber(c.Idade);
        return age >= range.min && age <= range.max;
      });

      const count = clients.length;
      const aprovados = clients.filter((c) => c.Situação === "Aprovada").length;
      const recorrentes = clients.filter((c) => parseNumber(c["Qtd de Compras"]) >= 2).length;
      const ticketMedio =
        clients.length > 0
          ? clients.reduce((sum, c) => sum + parseNumber(c["Ticket Médio"]), 0) / clients.length
          : 0;

      return {
        label: range.label,
        count,
        taxaAprovacao: count > 0 ? (aprovados / count) * 100 : 0,
        taxaRecorrencia: count > 0 ? (recorrentes / count) * 100 : 0,
        ticketMedio,
      };
    });
  }, [filteredClientes]);

  // Value-Risk Matrix: Score×Age segments
  const valueRiskSegments = useMemo(() => {
    const scoreRanges = [
      { label: "Baixo", min: 0, max: 300 },
      { label: "Médio", min: 301, max: 550 },
      { label: "Alto", min: 551, max: 9999 },
    ];
    const ageRanges = [
      { label: "18-25", min: 18, max: 25 },
      { label: "26-35", min: 26, max: 35 },
      { label: "36-50", min: 36, max: 50 },
      { label: "50+", min: 50, max: 150 },
    ];

    const segments = [];

    for (const scoreRange of scoreRanges) {
      for (const ageRange of ageRanges) {
        const clients = filteredClientes.filter((c) => {
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
        let color = "#EF4444"; // red

        if (scoreMedia >= 551) {
          if (ltvMedia >= 150) {
            quadrant = "Ouro";
            color = "#22c55e"; // green
          } else {
            quadrant = "Promissores";
            color = "#86efac"; // light green
          }
        } else if (scoreMedia >= 300) {
          if (ltvMedia >= 150) {
            quadrant = "Risco Calculado";
            color = "#FFF8E1"; // light yellow
          }
        }

        segments.push({
          scoreMedia,
          ltvMedia,
          volume: clients.length,
          label: `${ageRange.label} / ${scoreRange.label}`,
          quadrant,
          color,
        });
      }
    }

    return segments;
  }, [filteredClientes]);

  // Personas
  const personas = useMemo(() => {
    const recorrentePremium = filteredClientes.filter((c) => {
      const qtd = parseNumber(c["Qtd de Compras"]);
      const ticket = parseNumber(c["Ticket Médio"]);
      const tickets = filteredClientes.map((x) => parseNumber(x["Ticket Médio"]));
      const median = [...tickets].sort((a, b) => a - b)[Math.floor(tickets.length / 2)];
      return qtd >= 2 && ticket > median;
    });

    const compradorEventual = filteredClientes.filter((c) => {
      const qtd = parseNumber(c["Qtd de Compras"]);
      return qtd === 1 && c.Situação === "Aprovada";
    });

    const ativadorPerdido = filteredClientes.filter((c) => {
      const qtd = parseNumber(c["Qtd de Compras"]);
      return qtd === 0 && c.Situação === "Aprovada";
    });

    const negadoDeValor = filteredClientes.filter((c) => {
      const score = parseNumber(c.Score);
      return c.Situação === "Negada" && score >= 250;
    });

    const calcPersona = (clients: any[]) => {
      if (clients.length === 0) return { pct: 0, ticketMedio: 0, ltv: 0 };
      const ticketMedio = clients.reduce((sum, c) => sum + parseNumber(c["Ticket Médio"]), 0) / clients.length;
      const ltv = clients.reduce((sum, c) => sum + parseNumber(c["Qtd de Compras"]) * parseNumber(c["Ticket Médio"]), 0) / clients.length;
      return {
        pct: (clients.length / filteredClientes.length) * 100,
        ticketMedio,
        ltv,
      };
    };

    return [
      { name: "Recorrente Premium", ...calcPersona(recorrentePremium), acao: "Trilha VIP, limite elevado" },
      { name: "Comprador Eventual", ...calcPersona(compradorEventual), acao: "Estimular segunda compra" },
      { name: "Ativador Perdido", ...calcPersona(ativadorPerdido), acao: "Reativar com oferta" },
      { name: "Negado de Valor", ...calcPersona(negadoDeValor), acao: "Revisar critério de score" },
    ];
  }, [filteredClientes]);

  // Executive insight
  const insight = useMemo(() => {
    const ouro = valueRiskSegments.filter((s) => s.quadrant === "Ouro");
    const ouroVolume = ouro.reduce((sum, s) => sum + s.volume, 0);
    const ouroPct = (ouroVolume / filteredClientes.length) * 100;

    const ouroLTV = ouro.reduce((sum, s) => sum + s.ltvMedia * s.volume, 0);
    const totalLTV = valueRiskSegments.reduce((sum, s) => sum + s.ltvMedia * s.volume, 0);
    const ouroLTVPct = totalLTV > 0 ? (ouroLTV / totalLTV) * 100 : 0;

    return {
      ouroPct,
      ouroLTVPct,
    };
  }, [valueRiskSegments, filteredClientes.length]);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Quem são os clientes Ume — perfil, valor e risco por segmento.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-[#64748b]">Filtrar por:</span>

        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterScore === "todos" ? "Todos os Scores" : filterScore}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">
              Todos os Scores
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
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterAge === "todas" ? "Todas as Idades" : filterAge}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todas" className="text-xs">
              Todas as Idades
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
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterStatus === "todos" ? "Todos os Status" : filterStatus}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">
              Todos os Status
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

      <p className="text-xs text-[#64748b]">
        Analisando {metrics.totalClientes.toLocaleString("pt-BR")} clientes
        {(filterScore !== "todos" || filterAge !== "todas" || filterStatus !== "todos") &&
          ` (filtrados de ${clientesData.length.toLocaleString("pt-BR")})`}
      </p>

      {/* KPIs */}
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
            <Target className="h-4 w-4 text-[#22c55e]" />
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
            <div className="text-2xl font-bold text-[#1a1a1a]">
              R$ {Math.round(metrics.ticketMedia).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">LTV Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              R$ {Math.round(metrics.ltvMedia).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">% High Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#22c55e]">{metrics.pctHighValue.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* SCORE DISTRIBUTION */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Distribuição por Score</h3>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-2">
            {scoreDistribution.map((range) => (
              <Card key={range.label} className="border-[#E2E8F0] bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748b]">{range.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div>Aprovação: <span className="font-bold text-[#1a1a1a]">{range.taxaAprovacao.toFixed(0)}%</span></div>
                  <div>Recorrência: <span className="font-bold text-[#22c55e]">{range.taxaRecorrencia.toFixed(0)}%</span></div>
                  <div>Ticket: <span className="font-bold">R$ {Math.round(range.ticketMedio).toLocaleString("pt-BR")}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#22c55e" name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AGE DISTRIBUTION */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Distribuição por Idade</h3>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1 space-y-2">
            {ageDistribution.map((range) => (
              <Card key={range.label} className="border-[#E2E8F0] bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#64748b]">{range.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div>Aprovação: <span className="font-bold text-[#1a1a1a]">{range.taxaAprovacao.toFixed(0)}%</span></div>
                  <div>Recorrência: <span className="font-bold text-[#22c55e]">{range.taxaRecorrencia.toFixed(0)}%</span></div>
                  <div>Ticket: <span className="font-bold">R$ {Math.round(range.ticketMedio).toLocaleString("pt-BR")}</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" />
                <YAxis dataKey="label" type="category" width={50} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#22c55e" name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* VALUE-RISK MATRIX */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Matriz Valor × Risco</h3>
        <Card className="border-[#E2E8F0] bg-white p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="scoreMedia" name="Score Médio" />
              <YAxis dataKey="ltvMedia" name="LTV Médio" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="Segmentos" data={valueRiskSegments} fill="#22c55e">
                {valueRiskSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrant labels */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded p-3 bg-green-100 border border-green-300">
              <div className="font-bold text-green-900">OURO</div>
              <div className="text-green-800">Alto valor + Alto score</div>
            </div>
            <div className="rounded p-3 bg-green-50 border border-green-200">
              <div className="font-bold text-green-700">PROMISSORES</div>
              <div className="text-green-600">Baixo valor + Alto score</div>
            </div>
            <div className="rounded p-3 bg-yellow-50 border border-yellow-200">
              <div className="font-bold text-yellow-700">RISCO CALCULADO</div>
              <div className="text-yellow-600">Alto valor + Score médio</div>
            </div>
            <div className="rounded p-3 bg-red-50 border border-red-200">
              <div className="font-bold text-red-700">DESTRUIDORES</div>
              <div className="text-red-600">Baixo valor + Baixo score</div>
            </div>
          </div>
        </Card>

        {/* Matrix insight */}
        <Card className="border-l-4 border-[#22c55e] bg-gradient-to-r from-green-50 to-white p-4">
          <div className="text-sm">
            <p className="font-bold text-green-900">
              {insight.ouroPct.toFixed(1)}% dos clientes estão no quadrante OURO, gerando {insight.ouroLTVPct.toFixed(1)}% do LTV total.
            </p>
            <p className="text-xs text-green-800 mt-2">
              A política atual pode estar mirada no cliente médio, deixando de capturar o potencial do segmento high-value.
            </p>
          </div>
        </Card>
      </div>

      {/* PERSONAS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Personas Comportamentais</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {personas.map((persona) => (
            <Card key={persona.name} className="border-[#E2E8F0] bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-[#1a1a1a]">{persona.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="text-2xl font-bold text-[#22c55e]">{persona.pct.toFixed(1)}%</div>
                <div className="text-[#64748b]">
                  <div>Ticket médio: R$ {Math.round(persona.ticketMedio).toLocaleString("pt-BR")}</div>
                  <div>LTV estimado: R$ {Math.round(persona.ltv).toLocaleString("pt-BR")}</div>
                </div>
                <div className="border-t border-[#E2E8F0] pt-2 text-[#22c55e] font-medium">
                  {persona.acao}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* EXECUTIVE INSIGHT */}
      <Card className="border-l-4 border-[#FFC107] bg-gradient-to-r from-yellow-50 to-white">
        <CardHeader>
          <CardTitle className="text-[#D97706] flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Onde está o valor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#1a1a1a]">
              {insight.ouroPct.toFixed(1)}% dos clientes (quadrante Ouro) geram {insight.ouroLTVPct.toFixed(1)}% do LTV total.
            </p>
            <p className="text-sm text-[#64748b]">
              A concentração de valor sugere que a política atual está bem distribuída, mas há oportunidade de maximizar o
              segmento high-value com trilha diferenciada.
            </p>
          </div>
          <div className="border-t border-[#FFC107]/20 pt-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-[#D97706] mb-1">🎯 Ação sugerida:</p>
              <p className="text-sm text-[#64748b]">
                Implementar trilha dedicada para clientes Ouro: limite inicial mais elevado, comunicação VIP, follow-up
                pós-ativação e oferta de produtos premium.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
