"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  calculatePurchaseDistribution,
  calculatePurchaseGroupComparison,
  calculateAgeDistribution,
  calculateGenderDistribution,
  calculateRetailerDistribution,
  parseNumber,
  parseBoolean,
  getColumnValue,
  calculateAverage,
  calculatePercentage,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

// ============================================================================
// 7-SEGMENT CONFIG — must mirror jornada-tab.tsx for visual consistency
// ============================================================================
const SEGMENT_CONFIG = {
  "aprovados-nao-ativados": {
    bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1",
    label: "Aprovados Não Ativados",
    criterio: "Aprovado + 0 compras",
  },
  "potencial": {
    bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723",
    label: "Potencial",
    criterio: "Aprovado + 1 compra",
  },
  "recorrentes": {
    bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C",
    label: "Recorrentes",
    criterio: "Aprovado + 2+ compras (sem critério Plus)",
  },
  "ume-plus": {
    bg: "#F0F4F3", accent: "#00C853", text: "#001a0f",
    label: "Ume Plus",
    criterio: "3+ compras + score ≥700 + limite ≥R$1.000",
  },
  "negados-recuperaveis": {
    bg: "#FFF9C4", accent: "#FBC02D", text: "#F57F17",
    label: "Negados Recuperáveis",
    criterio: "Negada + score ≥300",
  },
  "negados-alto-risco": {
    bg: "#FFEBEE", accent: "#E53935", text: "#B71C1C",
    label: "Negados Alto Risco",
    criterio: "Negada + score <300",
  },
  "inadimplentes": {
    bg: "#FCE4EC", accent: "#C2185B", text: "#880E4F",
    label: "Inadimplentes",
    criterio: "Situação = Inadimplente",
  },
} as const;

const SEGMENT_ORDER = [
  "aprovados-nao-ativados",
  "potencial",
  "recorrentes",
  "ume-plus",
  "negados-recuperaveis",
  "negados-alto-risco",
  "inadimplentes",
] as const;

type SegmentId = typeof SEGMENT_ORDER[number];

// ============================================================================
// FORMATTERS
// ============================================================================
function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000) return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000000) + "M";
  if (value >= 1000) return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000) + "k";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

// ============================================================================
// SEGMENT CLASSIFIER — single source of truth, must match jornada-tab.tsx
// ============================================================================
function classifySegment(cliente: ClienteRow): SegmentId {
  const situacao = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "")
    .toLowerCase()
    .trim();
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score"])) || 0;
  const limite = parseNumber(getColumnValue(cliente, ["limite total", "limite"])) || 0;

  if (situacao === "inadimplente") return "inadimplentes";
  if (situacao === "negada") {
    return score < 300 ? "negados-alto-risco" : "negados-recuperaveis";
  }
  // Adimplente / aprovado
  if (compras === 0) return "aprovados-nao-ativados";
  if (compras === 1) return "potencial";
  if (compras >= 3 && score >= 700 && limite >= 1000) return "ume-plus";
  return "recorrentes";
}

interface SegmentMetric {
  id: SegmentId;
  count: number;
  pctOfBase: number;
  avgScore: number | null;
  avgLimite: number | null;
  avgCompras: number | null;
  pctComApp: number;
  customers: ClienteRow[];
}

function computeSegmentMetrics(clientesData: ClienteRow[]): SegmentMetric[] {
  const groups: Record<SegmentId, ClienteRow[]> = {
    "aprovados-nao-ativados": [],
    "potencial": [],
    "recorrentes": [],
    "ume-plus": [],
    "negados-recuperaveis": [],
    "negados-alto-risco": [],
    "inadimplentes": [],
  };

  clientesData.forEach((c) => {
    groups[classifySegment(c)].push(c);
  });

  const total = clientesData.length;
  return SEGMENT_ORDER.map((id) => {
    const customers = groups[id];
    const comAppCount = customers.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
    ).length;
    return {
      id,
      count: customers.length,
      pctOfBase: total > 0 ? (customers.length / total) * 100 : 0,
      avgScore: calculateAverage(customers.map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))),
      avgLimite: calculateAverage(customers.map((c) => parseNumber(getColumnValue(c, ["limite total", "limite"])))),
      avgCompras: calculateAverage(customers.map((c) => parseNumber(getColumnValue(c, ["qtd de compras", "compras"])))),
      pctComApp: customers.length > 0 ? (comAppCount / customers.length) * 100 : 0,
      customers,
    };
  });
}

// ============================================================================
// COMPONENT
// ============================================================================
export function SegmentacaoTab() {
  const { clientesData } = useData();

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          Envie a Base de Clientes para visualizar a análise de segmentação.
        </p>
      </div>
    );
  }

  // === COMPUTED ===
  const segmentMetrics = useMemo(() => computeSegmentMetrics(clientesData), [clientesData]);
  const distribution = useMemo(() => calculatePurchaseDistribution(clientesData), [clientesData]);
  const groupComparison = useMemo(() => calculatePurchaseGroupComparison(clientesData), [clientesData]);
  const ageDistribution = useMemo(() => calculateAgeDistribution(clientesData), [clientesData]);
  const genderDistribution = useMemo(() => calculateGenderDistribution(clientesData), [clientesData]);
  const retailerDistribution = useMemo(() => calculateRetailerDistribution(clientesData), [clientesData]);

  // KPI metrics
  const kpis = useMemo(() => {
    const findSeg = (id: SegmentId) => segmentMetrics.find((s) => s.id === id);

    const negadosRec = findSeg("negados-recuperaveis")?.count || 0;
    const negadosAlto = findSeg("negados-alto-risco")?.count || 0;
    const inadimp = findSeg("inadimplentes")?.count || 0;
    const aprovNaoAtivados = findSeg("aprovados-nao-ativados")?.count || 0;
    const potencial = findSeg("potencial")?.count || 0;
    const recorrentes = findSeg("recorrentes")?.count || 0;
    const umePlus = findSeg("ume-plus")?.count || 0;

    const totalNegados = negadosRec + negadosAlto;
    const totalAprovados = clientesData.length - totalNegados;
    const totalAtivados = potencial + recorrentes + umePlus + inadimp;
    const taxaAtivacao = totalAprovados > 0 ? (totalAtivados / totalAprovados) * 100 : 0;

    const comApp = clientesData.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
    ).length;
    const appAdoptionPct = (comApp / clientesData.length) * 100;

    const avgScore = calculateAverage(
      clientesData.map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
    );

    return {
      negadosRec,
      negadosAlto,
      inadimp,
      totalNegados,
      totalAprovados,
      aprovNaoAtivados,
      totalAtivados,
      taxaAtivacao,
      appAdoptionPct,
      avgScore,
    };
  }, [segmentMetrics, clientesData]);

  const scoreDistribution = useMemo(() => {
    const scores = clientesData
      .map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
      .filter((s) => s !== null) as number[];
    return {
      low: scores.filter((s) => s < 400).length,
      medium: scores.filter((s) => s >= 400 && s < 700).length,
      high: scores.filter((s) => s >= 700).length,
    };
  }, [clientesData]);

  const avgLimite = useMemo(
    () => calculateAverage(clientesData.map((c) => parseNumber(getColumnValue(c, ["limite total", "limite"])))),
    [clientesData]
  );

  const avgCompras = useMemo(
    () => calculateAverage(clientesData.map((c) => parseNumber(getColumnValue(c, ["qtd de compras", "compras"])))),
    [clientesData]
  );

  const percentageComAumento = useMemo(() => {
    const count = clientesData.filter((c) =>
      parseBoolean(getColumnValue(c, ["aumento limite", "limite aumentado"]))
    ).length;
    return calculatePercentage(count, clientesData.length);
  }, [clientesData]);

  // === RENDER ===
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Análise consultiva da base Ume — 7 segmentos consistentes com a aba Jornada e Rentabilidade.
        </p>
      </div>

      {/* 1. INSIGHTS EXECUTIVOS */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(kpis.taxaAtivacao)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">de aprovados ativados • Gargalo de conversão</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">App Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(kpis.appAdoptionPct)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">com aplicativo • Canal digital</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(kpis.avgScore)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">base total • Perfil de risco</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. QUEM É O CLIENTE UME */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Quem é o Cliente Ume?</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Perfil demográfico, comportamental e de crédito da base.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Demographics */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">👤 Demografia</p>
              <div className="space-y-2 text-xs">
                {ageDistribution.map((g) => (
                  <div key={g.group} className="flex justify-between">
                    <span className="text-[#64748b]">{g.group}</span>
                    <span className="font-medium text-[#1a1a1a]">
                      {g.count} ({new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(g.percentage)}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                {genderDistribution.map((g) => (
                  <div key={g.gender} className="flex justify-between text-xs">
                    <span className="text-[#64748b]">{g.gender}</span>
                    <span className="font-medium text-[#1a1a1a]">
                      {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(g.percentage)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">💳 Crédito</p>
              <div className="space-y-2 text-xs mb-3">
                <div>
                  <span className="text-[#64748b] block mb-1">Score</span>
                  <div className="flex justify-between font-medium text-[#1a1a1a]">
                    <span>Baixo: {formatNumber(scoreDistribution.low)}</span>
                    <span>Médio: {formatNumber(scoreDistribution.medium)}</span>
                    <span>Alto: {formatNumber(scoreDistribution.high)}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-[#64748b]">Limite Médio</span>
                <div className="font-medium text-[#1a1a1a]">{formatCurrency(avgLimite)}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-xs">
                <span className="text-[#64748b]">Com aumento de limite</span>
                <div className="font-medium text-[#1a1a1a]">{formatPercentage(percentageComAumento)}</div>
              </div>
            </div>

            {/* Channel & Behavior */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">📱 Canal & Comportamento</p>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#64748b] block mb-1">Com App</span>
                  <span className="font-medium text-[#1a1a1a] block">{formatPercentage(kpis.appAdoptionPct)}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block mb-1">Compras Médias</span>
                  <span className="font-medium text-[#1a1a1a] block">{formatNumber(avgCompras)}</span>
                </div>
                <div>
                  <span className="text-[#64748b] block mb-1">Varejos</span>
                  <div className="space-y-1">
                    {retailerDistribution.map((r) => (
                      <div key={r.group} className="flex justify-between">
                        <span className="text-[#94a3b8]">{r.group}</span>
                        <span className="font-medium text-[#1a1a1a]">
                          {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(r.percentage)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona */}
          <div className="mt-6 p-4 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">🎯 Cliente Predominante</p>
            <p className="text-sm text-[#1a1a1a]">
              {ageDistribution.length > 0 ? ageDistribution[0].group : "Cliente"} com {Math.round(kpis.avgScore || 0)} de score,{" "}
              {formatPercentage(kpis.appAdoptionPct)} de adoção de app e comportamento de{" "}
              {distribution.length > 0 ? distribution[0].range : "baixo volume"}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. DIAGNÓSTICO DA BASE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Diagnóstico da Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">Análise dos principais desafios e oportunidades da base.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Activation */}
            <div className="p-4 bg-[#E3F2FD] rounded border border-[#2196F3]/20">
              <p className="text-xs font-semibold text-[#0D47A1] uppercase mb-2">📊 Ativação</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{formatPercentage(kpis.taxaAtivacao)}</div>
              <p className="text-xs text-[#64748b] mt-1">Taxa de ativação dos aprovados</p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {formatNumber(kpis.aprovNaoAtivados)} aprovados aguardando primeira compra — maior gargalo de conversão.
              </p>
            </div>

            {/* Engagement */}
            <div className="p-4 bg-[#FFF3E0] rounded border border-[#FF9800]/20">
              <p className="text-xs font-semibold text-[#3E2723] uppercase mb-2">🛍️ Engajamento</p>
              <div className="text-lg font-bold text-[#1a1a1a]">
                {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
                  distribution.find((d) => d.range === "0 compras")?.percentage || 0
                )}
                %
              </div>
              <p className="text-xs text-[#64748b] mt-1">Sem compras (negados + não ativados)</p>
              <p className="text-xs text-[#94a3b8] mt-2">
                Base altamente concentrada em baixa frequência — necessário ativar e engajar.
              </p>
            </div>

            {/* Credit & Risk */}
            <div className="p-4 bg-[#F3E5F5] rounded border border-[#9C27B0]/20">
              <p className="text-xs font-semibold text-[#4A148C] uppercase mb-2">💳 Crédito & Risco</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{formatNumber(scoreDistribution.low)}</div>
              <p className="text-xs text-[#64748b] mt-1">Clientes com score baixo (&lt;400)</p>
              <p className="text-xs text-[#94a3b8] mt-2">
                Perfil de risco mais alto impacta ativação e limite — necessário credit enhancement.
              </p>
            </div>

            {/* Status — agora mostra breakdown de negados + inadimplentes */}
            <div className="p-4 bg-[#FFEBEE] rounded border border-[#F44336]/20">
              <p className="text-xs font-semibold text-[#B71C1C] uppercase mb-2">🚫 Fora da Base Ativa</p>
              <div className="text-lg font-bold text-[#1a1a1a]">{formatNumber(kpis.totalNegados + kpis.inadimp)}</div>
              <p className="text-xs text-[#64748b] mt-1">Negados + Inadimplentes</p>
              <p className="text-xs text-[#94a3b8] mt-2">
                {formatNumber(kpis.negadosRec)} recuperáveis · {formatNumber(kpis.negadosAlto)} alto risco ·{" "}
                {formatNumber(kpis.inadimp)} inadimplentes — revisar política de crédito e cobrança.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. DISTRIBUIÇÃO DE COMPRAS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Distribuição de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.range} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-[#64748b]">{d.range}</div>
                <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                  <div className="bg-[#00C853] h-2 rounded" style={{ width: `${Math.min(d.percentage, 100)}%` }} />
                </div>
                <div className="w-24 text-xs text-right font-medium text-[#1a1a1a]">
                  {formatNumber(d.count)} (
                  {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(d.percentage)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. COMPARAÇÃO POR GRUPO */}
      {groupComparison.length > 0 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>Comparação por Grupo de Compras</CardTitle>
            <p className="text-xs text-[#64748b] mt-2">
              Clientes com maior frequência apresentam melhor perfil de risco e adoção de canal.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Grupo</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Count</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Score Médio</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Limite Médio</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">% Com App</th>
                  </tr>
                </thead>
                <tbody>
                  {groupComparison.map((g) => (
                    <tr key={g.group} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 text-[#64748b] font-medium">{g.group}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatNumber(g.count)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatNumber(g.avgScore)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatCurrency(g.avgLimite)}</td>
                      <td className="py-2 px-2 text-right text-[#64748b]">{formatPercentage(g.percentageComApp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. SEGMENTAÇÃO — 7 cards consistentes com Jornada */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Segmentação de Clientes (7 segmentos)</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Análise comportamental segmentada — cobertura 100% da base. Cada segmento corresponde diretamente a uma
            jornada de CRM (aba Jornada) e a um nível de rentabilidade (aba Rentabilidade).
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Critérios de Segmentação:</p>
            <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
              {SEGMENT_ORDER.map((id) => (
                <li key={id}>
                  <span className="font-medium" style={{ color: SEGMENT_CONFIG[id].accent }}>
                    {SEGMENT_CONFIG[id].label}:
                  </span>{" "}
                  {SEGMENT_CONFIG[id].criterio}
                </li>
              ))}
            </ul>
          </div>

          {/* 7 cards: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {segmentMetrics.map((seg) => {
              const cfg = SEGMENT_CONFIG[seg.id];
              return (
                <div
                  key={seg.id}
                  className="p-3 rounded border-l-4 transition hover:shadow-md"
                  style={{
                    backgroundColor: cfg.bg,
                    borderLeftColor: cfg.accent,
                  }}
                >
                  <p className="text-xs font-semibold uppercase truncate" style={{ color: cfg.accent }}>
                    {cfg.label}
                  </p>
                  <p className="text-xl font-bold text-[#1a1a1a] mt-2">{formatNumber(seg.count)}</p>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
                      seg.pctOfBase
                    )}
                    % da base
                  </p>

                  <div className="mt-3 pt-3 border-t" style={{ borderColor: cfg.accent + "33" }}>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Compras:</span>
                        <span className="font-medium text-[#1a1a1a]">{formatNumber(seg.avgCompras)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Score:</span>
                        <span className="font-medium text-[#1a1a1a]">{formatNumber(seg.avgScore)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Limite:</span>
                        <span className="font-medium text-[#1a1a1a]">{formatCurrency(seg.avgLimite)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">App:</span>
                        <span className="font-medium text-[#1a1a1a]">{formatPercentage(seg.pctComApp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with checksum */}
          <div className="mt-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0] text-xs text-[#64748b]">
            ✓ Soma dos 7 segmentos: {formatNumber(segmentMetrics.reduce((s, m) => s + m.count, 0))} clientes ={" "}
            {formatNumber(clientesData.length)} total — cobertura 100%.
          </div>
        </CardContent>
      </Card>

      {/* 7. ANÁLISE DE RISCO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Análise de Risco</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Correlação entre perfil de risco, comportamento de compras e características do cliente.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Score distribution */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">⚠️ Distribuição de Score</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Baixo (&lt;400)</span>
                    <span className="font-medium text-[#1a1a1a]">{formatNumber(scoreDistribution.low)} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div
                      className="bg-[#F44336] h-2 rounded"
                      style={{ width: `${Math.min((scoreDistribution.low / clientesData.length) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Médio (400-700)</span>
                    <span className="font-medium text-[#1a1a1a]">{formatNumber(scoreDistribution.medium)} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div
                      className="bg-[#FF9800] h-2 rounded"
                      style={{ width: `${Math.min((scoreDistribution.medium / clientesData.length) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748b]">Alto (≥700)</span>
                    <span className="font-medium text-[#1a1a1a]">{formatNumber(scoreDistribution.high)} clientes</span>
                  </div>
                  <div className="bg-[#E2E8F0] rounded h-2">
                    <div
                      className="bg-[#00C853] h-2 rounded"
                      style={{ width: `${Math.min((scoreDistribution.high / clientesData.length) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk insights */}
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">📊 Insights de Risco</p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-[#0D47A1]">Score vs Compras:</span>
                  <p className="text-[#64748b] mt-1">
                    Clientes Ume Plus têm score médio {formatNumber(segmentMetrics.find((s) => s.id === "ume-plus")?.avgScore)}{" "}
                    e média de {formatNumber(segmentMetrics.find((s) => s.id === "ume-plus")?.avgCompras)} compras.
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="font-medium text-[#E65100]">Limite vs App:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatPercentage(kpis.appAdoptionPct)} da base usa app — concentração em segmentos pós-compra
                    (~70% adesão).
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-[#1B5E20]">Recorrência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(
                      (segmentMetrics.find((s) => s.id === "recorrentes")?.count || 0) +
                        (segmentMetrics.find((s) => s.id === "ume-plus")?.count || 0)
                    )}{" "}
                    clientes ativos recorrentes — base com menor inadimplência esperada.
                  </p>
                </div>
                <div className="p-2 bg-pink-50 rounded border border-pink-200">
                  <span className="font-medium text-[#880E4F]">Inadimplência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(kpis.inadimp)} inadimplentes (
                    {formatPercentage((kpis.inadimp / clientesData.length) * 100)} da base) — perda direta de principal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. OPORTUNIDADES ESTRATÉGICAS — 7 cards alinhados com Jornada */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Oportunidades Estratégicas</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Recomendações de ação para cada um dos 7 segmentos. Detalhamento da jornada disponível na aba Jornada.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Aprovados Não Ativados */}
            <SegmentOpportunityCard
              segmentId="aprovados-nao-ativados"
              count={kpis.aprovNaoAtivados}
              total={clientesData.length}
              insight="Maior oportunidade de crescimento — CAC já pago, basta ativar. ROI marginal alto."
              acoes={[
                "Reengajamento via SMS + WhatsApp (sem Push: 0,6% têm app)",
                "Abordagem em ponto de venda no varejo parceiro",
                "Oferta de desconto na primeira compra",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="potencial"
              count={segmentMetrics.find((s) => s.id === "potencial")?.count || 0}
              total={clientesData.length}
              insight="Janela crítica de hábito — 30 dias após 1ª compra define se vira recorrente. Maior ROI em campanha."
              acoes={[
                "Incentivo de segunda compra dentro de 30 dias",
                "Personalização por score (educação se baixo, oferta se alto)",
                "Acompanhamento pós-primeira compra com WhatsApp",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="recorrentes"
              count={segmentMetrics.find((s) => s.id === "recorrentes")?.count || 0}
              total={clientesData.length}
              insight="Maior contribuição absoluta de rentabilidade da base — foco em retenção e expansão de ticket."
              acoes={[
                "Aumento de limite proativo por bom histórico",
                "Cross-loja e diversificação de varejos",
                "Cadência quinzenal (não semanal) para evitar fadiga",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="ume-plus"
              count={segmentMetrics.find((s) => s.id === "ume-plus")?.count || 0}
              total={clientesData.length}
              insight="Core de rentabilidade — maior valor por cliente. Foco absoluto em retenção e advocacia."
              acoes={[
                "Limite aumentado automático (sem ação do cliente)",
                "Taxa de juros reduzida vs. média da base",
                "Comunicação com placeholders dinâmicos (economia, score, GMV)",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="negados-recuperaveis"
              count={kpis.negadosRec}
              total={clientesData.length}
              insight="Maior segmento da base — score 300-400 pode subir. Educação financeira como ponte para reaplicação."
              acoes={[
                "Apenas SMS (custo controlado, sem WhatsApp)",
                "Conteúdo educativo: como subir score em 60-90 dias",
                "Reaplicação automática sugerida em D+90",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="negados-alto-risco"
              count={kpis.negadosAlto}
              total={clientesData.length}
              insight="Score <300 — baixa probabilidade de aprovação no curto prazo. Contenção de custo."
              acoes={[
                "1 único SMS de comunicação (custo mínimo)",
                "Sem follow-up de reengajamento",
                "Reanálise apenas em 6+ meses",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="inadimplentes"
              count={kpis.inadimp}
              total={clientesData.length}
              insight="Perda direta de principal — recuperação parcial via negociação tem ROI alto se rápido."
              acoes={[
                "Jornada de cobrança: WhatsApp humanizado + SMS formal",
                "Oferta de parcelamento da dívida com desconto",
                "Reativação suave após regularização (Gatilho F)",
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: Strategic opportunity card per segment
// ============================================================================
interface SegmentOpportunityCardProps {
  segmentId: SegmentId;
  count: number;
  total: number;
  insight: string;
  acoes: string[];
}

function SegmentOpportunityCard({ segmentId, count, total, insight, acoes }: SegmentOpportunityCardProps) {
  const cfg = SEGMENT_CONFIG[segmentId];
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div
      className="p-4 rounded border-l-4 transition hover:shadow-md"
      style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.accent }}
    >
      <div className="mb-2">
        <p className="text-sm font-semibold" style={{ color: cfg.text }}>
          {cfg.label}
        </p>
        <p className="text-xs text-[#64748b] mt-1">
          {formatNumber(count)} clientes •{" "}
          {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(pct)}% da base
        </p>
      </div>
      <p className="text-xs text-[#1a1a1a] font-medium mb-1 mt-3">Insight:</p>
      <p className="text-xs text-[#64748b] mb-3">{insight}</p>
      <p className="text-xs text-[#1a1a1a] font-medium mb-1">Ações:</p>
      <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
        {acoes.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
