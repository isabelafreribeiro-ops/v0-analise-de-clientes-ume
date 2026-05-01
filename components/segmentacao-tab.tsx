"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  calculatePurchaseDistribution,
  calculatePurchaseGroupComparison,
  calculateAgeDistribution,
  calculateGenderDistribution,
  parseNumber,
  parseBoolean,
  getColumnValue,
  calculateAverage,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

// ============================================================================
// 7-SEGMENT CONFIG — must mirror jornada-tab.tsx for visual consistency
// ============================================================================
const SEGMENT_CONFIG = {
  "aprovados-nao-ativados": {
    bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1",
    icon: "🔵",
    label: "Aprovados Não Ativados",
    criterio: "Aprovado + 0 compras",
  },
  "potencial": {
    bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723",
    icon: "🟠",
    label: "Potencial",
    criterio: "Aprovado + 1 compra",
  },
  "recorrentes": {
    bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C",
    icon: "🟣",
    label: "Recorrentes",
    criterio: "Aprovado + 2+ compras (sem critério Plus)",
  },
  "ume-plus": {
    bg: "#F0F4F3", accent: "#00C853", text: "#001a0f",
    icon: "🟢",
    label: "Ume Plus",
    criterio: "3+ compras + score ≥700",
  },
  "negados-recuperaveis": {
    bg: "#FFF9C4", accent: "#FBC02D", text: "#F57F17",
    icon: "🟡",
    label: "Negados Recuperáveis",
    criterio: "Negada + score ≥300",
  },
  "negados-alto-risco": {
    bg: "#FFEBEE", accent: "#E53935", text: "#B71C1C",
    icon: "🔴",
    label: "Negados Alto Risco",
    criterio: "Negada + score <300",
  },
  "inadimplentes": {
    bg: "#FCE4EC", accent: "#C2185B", text: "#880E4F",
    icon: "🩷",
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
// FINANCIAL ASSUMPTIONS — must match Q4 (Rentabilidade) calculations
// ============================================================================
const TICKET_MEDIO_BRL = 227.78;
const TAXA_PROCESSAMENTO = 0.03;
const CAC_BRL = 50.0;
const CUSTO_MSG_ANUAL: Record<SegmentId, number> = {
  "aprovados-nao-ativados": 0.69,
  "potencial": 0.63,
  "recorrentes": 4.20,
  "ume-plus": 8.16,
  "negados-recuperaveis": 0.09,
  "negados-alto-risco": 0.03,
  "inadimplentes": 0.66,
};

// ============================================================================
// FORMATTERS — using "M" for millions
// ============================================================================
function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000)
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000000) + "M";
  if (value >= 1000)
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000) + "k";
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

function formatPercentage(value: number | null, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + "%";
}

function formatBRL(value: number): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(abs / 1_000_000)} M`;
  } else if (abs >= 1_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(abs / 1_000)} mil`;
  } else {
    formatted = `R$ ${Math.round(abs)}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

// ============================================================================
// SEGMENT CLASSIFIER — relaxed Ume Plus criterion (no limite filter)
// ============================================================================
function classifySegment(cliente: ClienteRow): SegmentId {
  const situacao = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "")
    .toLowerCase()
    .trim();
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score"])) || 0;

  if (situacao === "inadimplente") return "inadimplentes";
  if (situacao === "negada") {
    return score < 300 ? "negados-alto-risco" : "negados-recuperaveis";
  }
  if (compras === 0) return "aprovados-nao-ativados";
  if (compras === 1) return "potencial";
  // Ume Plus: 3+ compras + score alto. Limite removido pois é consequência do bom uso, não pré-requisito.
  if (compras >= 3 && score >= 700) return "ume-plus";
  return "recorrentes";
}

// ============================================================================
// RENTABILITY ESTIMATOR (per cliente) — same formula as Q4
// ============================================================================
function estimateRentabilidade(cliente: ClienteRow): number {
  const segmentId = classifySegment(cliente);
  const situacao = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "")
    .toLowerCase()
    .trim();
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const taxa =
    parseNumber(
      getColumnValue(cliente, [
        "taxa de juros média ( ao mês)",
        "taxa de juros média",
        "taxa juros",
        "taxa de juros",
      ])
    ) || 0;
  const parcelas = parseNumber(getColumnValue(cliente, ["n. médio de parcelas", "parcelas"])) || 0;
  const limiteTotal = parseNumber(getColumnValue(cliente, ["limite total", "limite"])) || 0;
  const limiteDisp = parseNumber(getColumnValue(cliente, ["limite disponível", "limite disponivel"])) || 0;

  const gmv = compras * TICKET_MEDIO_BRL;
  const receitaProc = gmv * TAXA_PROCESSAMENTO;

  let receitaJuros = 0;
  if (situacao !== "negada" && situacao !== "inadimplente" && taxa && parcelas && compras > 0) {
    receitaJuros = (compras * TICKET_MEDIO_BRL * taxa * (parcelas + 1)) / 2;
  }

  const perdaInad = situacao === "inadimplente" ? Math.max(limiteTotal - limiteDisp, 0) : 0;
  const msgCost = CUSTO_MSG_ANUAL[segmentId] || 0;

  return receitaProc + receitaJuros - CAC_BRL - perdaInad - msgCost;
}

// ============================================================================
// SEGMENT METRICS COMPUTATION
// ============================================================================
interface SegmentMetric {
  id: SegmentId;
  count: number;
  pctOfBase: number;
  avgScore: number | null;
  avgLimite: number | null;
  avgCompras: number | null;
  pctComApp: number;
  rentTotalBRL: number;
  rentMediaBRL: number;
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
    const rentTotal = customers.reduce((sum, c) => sum + estimateRentabilidade(c), 0);
    return {
      id,
      count: customers.length,
      pctOfBase: total > 0 ? (customers.length / total) * 100 : 0,
      avgScore: calculateAverage(
        customers.map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
      ),
      avgLimite: calculateAverage(
        customers.map((c) => parseNumber(getColumnValue(c, ["limite total", "limite"])))
      ),
      avgCompras: calculateAverage(
        customers.map((c) => parseNumber(getColumnValue(c, ["qtd de compras", "compras"])))
      ),
      pctComApp: customers.length > 0 ? (comAppCount / customers.length) * 100 : 0,
      rentTotalBRL: rentTotal,
      rentMediaBRL: customers.length > 0 ? rentTotal / customers.length : 0,
      customers,
    };
  });
}

// Helper for median
function calculateMedian(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[mid - 1] + valid[mid]) / 2 : valid[mid];
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

  const segmentMetrics = useMemo(() => computeSegmentMetrics(clientesData), [clientesData]);

  // Aprovados-only cohort (Adimplente + Inadimplente — quem já passou pela aprovação)
  const aprovadosCohort = useMemo(
    () =>
      clientesData.filter((c) => {
        const sit = String(getColumnValue(c, ["situação", "situacao", "status"]) || "")
          .toLowerCase()
          .trim();
        return sit !== "negada";
      }),
    [clientesData]
  );

  // Active customers (those who actually purchased — for behavioral metrics)
  const ativosCohort = useMemo(
    () =>
      aprovadosCohort.filter(
        (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) > 0
      ),
    [aprovadosCohort]
  );

  // Distributions
  const distribution = useMemo(() => calculatePurchaseDistribution(clientesData), [clientesData]);
  const groupComparison = useMemo(() => calculatePurchaseGroupComparison(clientesData), [clientesData]);
  const ageDistribution = useMemo(() => calculateAgeDistribution(aprovadosCohort), [aprovadosCohort]);
  const genderDistribution = useMemo(() => calculateGenderDistribution(aprovadosCohort), [aprovadosCohort]);

  // === KPIs DO CLIENTE UME (todos com cohort de aprovados) ===
  const clienteUmeKpis = useMemo(() => {
    const idadeMediana = calculateMedian(
      aprovadosCohort.map((c) => parseNumber(getColumnValue(c, ["idade"])))
    );
    const avgScore = calculateAverage(
      aprovadosCohort.map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
    );
    const avgParcelas = calculateAverage(
      aprovadosCohort.map((c) => parseNumber(getColumnValue(c, ["n. médio de parcelas", "parcelas"])))
    );
    const avgJuros = calculateAverage(
      aprovadosCohort.map((c) =>
        parseNumber(
          getColumnValue(c, ["taxa de juros média ( ao mês)", "taxa de juros média", "taxa juros"])
        )
      )
    );
    const comApp = aprovadosCohort.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
    ).length;
    const appAdoption = aprovadosCohort.length > 0 ? (comApp / aprovadosCohort.length) * 100 : 0;
    const avgComprasAtivos = calculateAverage(
      ativosCohort.map((c) => parseNumber(getColumnValue(c, ["qtd de compras", "compras"])))
    );
    const comAumento = aprovadosCohort.filter((c) =>
      parseBoolean(
        getColumnValue(c, ["já teve aumento de limite?", "aumento limite", "limite aumentado"])
      )
    ).length;
    const pctAumentoLimite = aprovadosCohort.length > 0 ? (comAumento / aprovadosCohort.length) * 100 : 0;

    return {
      idadeMediana,
      avgScore,
      avgParcelas,
      avgJuros,
      appAdoption,
      avgComprasAtivos,
      pctAumentoLimite,
      ticketMedio: TICKET_MEDIO_BRL,
    };
  }, [aprovadosCohort, ativosCohort]);

  // Top age group label
  const topAgeGroup = ageDistribution.length > 0 ? ageDistribution[0].group : "—";
  const topGenderLabel =
    genderDistribution.length > 0
      ? genderDistribution.reduce((a, b) => (a.percentage > b.percentage ? a : b)).gender
      : "—";

  // === INSIGHTS-CHAVE (4 correlações) ===
  const insight1 = useMemo(() => {
    const sem = clientesData.filter(
      (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) === 0
    );
    const com = clientesData.filter(
      (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) > 0
    );
    const appSem = sem.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
    ).length;
    const appCom = com.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
    ).length;
    const pctSem = sem.length > 0 ? (appSem / sem.length) * 100 : 0;
    const pctCom = com.length > 0 ? (appCom / com.length) * 100 : 0;
    const multiplier = pctSem > 0 ? pctCom / pctSem : 0;
    return { pctSem, pctCom, multiplier };
  }, [clientesData]);

  const scoreDistribution = useMemo(() => {
    const scores = clientesData
      .map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
      .filter((s): s is number => s !== null) as number[];
    return {
      low: scores.filter((s) => s < 400).length,
      medium: scores.filter((s) => s >= 400 && s < 700).length,
      high: scores.filter((s) => s >= 700).length,
    };
  }, [clientesData]);

  const insight2 = useMemo(() => {
    const total = clientesData.length;
    return {
      pctLow: (scoreDistribution.low / total) * 100,
      pctMid: (scoreDistribution.medium / total) * 100,
      pctHigh: (scoreDistribution.high / total) * 100,
    };
  }, [clientesData, scoreDistribution]);

  const getSeg = (id: SegmentId) => segmentMetrics.find((s) => s.id === id);

  const insight3 = useMemo(() => {
    const rec = getSeg("recorrentes");
    const plus = getSeg("ume-plus");
    const positivos = (rec?.rentTotalBRL || 0) + (plus?.rentTotalBRL || 0);
    const negativos = segmentMetrics
      .filter((s) => s.id !== "recorrentes" && s.id !== "ume-plus")
      .reduce((sum, s) => sum + s.rentTotalBRL, 0);
    const totalAtivos = (rec?.count || 0) + (plus?.count || 0);
    const pctAtivos = clientesData.length > 0 ? (totalAtivos / clientesData.length) * 100 : 0;
    return { positivos, negativos, totalAtivos, pctAtivos };
  }, [segmentMetrics, clientesData]);

  const insight4 = useMemo(() => {
    const totalNegados =
      (getSeg("negados-recuperaveis")?.count || 0) + (getSeg("negados-alto-risco")?.count || 0);
    return {
      totalNegados,
      custoCAC: -totalNegados * CAC_BRL,
    };
  }, [segmentMetrics]);

  return (
    <div className="space-y-6">
      {/* ===================================================================
          TÍTULO + PERGUNTA-ÂNCORA
          =================================================================== */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Construção do raciocínio analítico que justifica a estratégia de segmentação Ume.
        </p>
      </div>

      <Card className="border-[#E2E8F0] bg-gradient-to-r from-[#F0F9F4] via-white to-[#F7FAF8]">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❓</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Pergunta-âncora
              </p>
              <p className="text-base font-semibold text-[#1a1a1a] leading-relaxed">
                Quem é o cliente Ume e onde estão as oportunidades de crescimento na base?
              </p>
              <p className="text-xs text-[#64748b] mt-2">
                Para responder: caracterizamos o perfil, identificamos correlações comportamentais e
                derivamos uma segmentação acionável.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 1: QUEM É O CLIENTE UME (KPIs + persona)
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>1. Quem é o Cliente Ume?</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Perfil dos {formatNumber(aprovadosCohort.length)} clientes aprovados — quem efetivamente usa
            ou pode usar o produto. Métricas comportamentais (compras médias) baseadas em{" "}
            {formatNumber(ativosCohort.length)} clientes ativos.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPI Grid: 8 cards (2 rows × 4) */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <KpiCard label="Idade Mediana" value={`${clienteUmeKpis.idadeMediana?.toFixed(0) || "—"} anos`} />
            <KpiCard label="Score Médio" value={formatNumber(clienteUmeKpis.avgScore)} sub="0-1000" />
            <KpiCard label="Ticket Médio" value={formatCurrency(clienteUmeKpis.ticketMedio)} sub="por compra" />
            <KpiCard
              label="N. Parcelas"
              value={clienteUmeKpis.avgParcelas ? clienteUmeKpis.avgParcelas.toFixed(1) : "—"}
              sub="médio por compra"
            />
            <KpiCard
              label="Taxa de Juros"
              value={
                clienteUmeKpis.avgJuros
                  ? formatPercentage(clienteUmeKpis.avgJuros * 100, 1)
                  : "—"
              }
              sub="ao mês"
            />
            <KpiCard label="App Adoption" value={formatPercentage(clienteUmeKpis.appAdoption)} sub="entre aprovados" />
            <KpiCard
              label="Compras Médias"
              value={clienteUmeKpis.avgComprasAtivos ? clienteUmeKpis.avgComprasAtivos.toFixed(1) : "—"}
              sub={`entre ${formatNumber(ativosCohort.length)} ativos`}
            />
            <KpiCard
              label="Aumento de Limite"
              value={formatPercentage(clienteUmeKpis.pctAumentoLimite)}
              sub="já recebido"
            />
          </div>

          {/* Persona em prosa */}
          <div className="p-4 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">🎯 Cliente Ume Predominante</p>
            <p className="text-sm text-[#1a1a1a] leading-relaxed">
              <span className="font-semibold">{topGenderLabel}</span>, faixa de{" "}
              <span className="font-semibold">{topAgeGroup}</span>, score médio{" "}
              <span className="font-semibold">{Math.round(clienteUmeKpis.avgScore || 0)}</span> (perfil
              de risco{" "}
              {(clienteUmeKpis.avgScore || 0) >= 700 ? "bom" : (clienteUmeKpis.avgScore || 0) >= 400 ? "médio" : "baixo"}
              ), parcela em <span className="font-semibold">~{clienteUmeKpis.avgParcelas?.toFixed(0) || "—"}x</span>{" "}
              com taxa de{" "}
              <span className="font-semibold">
                {clienteUmeKpis.avgJuros ? formatPercentage(clienteUmeKpis.avgJuros * 100, 1) : "—"}
              </span>{" "}
              ao mês. Quando ativo, compra em média{" "}
              <span className="font-semibold">
                {clienteUmeKpis.avgComprasAtivos?.toFixed(1) || "—"} vezes
              </span>{" "}
              com ticket de <span className="font-semibold">{formatCurrency(clienteUmeKpis.ticketMedio)}</span> —
              equivalente a{" "}
              <span className="font-semibold">
                {formatCurrency((clienteUmeKpis.avgComprasAtivos || 0) * clienteUmeKpis.ticketMedio)}
              </span>{" "}
              de GMV gerado por cliente ativo. Tem app instalado em{" "}
              <span className="font-semibold">{formatPercentage(clienteUmeKpis.appAdoption)}</span> dos
              casos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 2: DISTRIBUIÇÃO DE COMPRAS (contexto)
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>2. Distribuição de Compras na Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            A base é altamente concentrada em zero compras — combinação de negados (que não puderam
            comprar) e aprovados que ainda não ativaram.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribution.map((d) => (
              <div key={d.range} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-[#64748b]">{d.range}</div>
                <div className="flex-1 bg-[#E2E8F0] rounded h-2">
                  <div className="bg-[#00C853] h-2 rounded" style={{ width: `${Math.min(d.percentage, 100)}%` }} />
                </div>
                <div className="w-28 text-xs text-right font-medium text-[#1a1a1a]">
                  {formatNumber(d.count)} (
                  {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(d.percentage)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 3: 4 INSIGHTS-CHAVE
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>3. Insights-Chave da Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Quatro correlações que orientam a estratégia de segmentação. Cada uma justifica uma
            dimensão da segmentação proposta.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* INSIGHT 1: App */}
            <InsightCard
              icon="📱"
              numero="01"
              accent="#2196F3"
              bg="#E3F2FD"
              titulo="O app é o maior diferenciador comportamental"
              shockValue={`${formatPercentage(insight1.pctSem)} → ${formatPercentage(insight1.pctCom)}`}
              shockLabel={`Salto de ${insight1.multiplier.toFixed(0)}x na adoção do app entre quem nunca comprou e quem comprou pelo menos uma vez.`}
              implicacao="Ter o app não é correlação fraca — é praticamente um proxy de ativação. Sub-segmentar por status de app deveria informar a estratégia de aquisição."
            />

            {/* INSIGHT 2: Score */}
            <InsightCard
              icon="📊"
              numero="02"
              accent="#FF9800"
              bg="#FFF3E0"
              titulo="Score é destino — base bipolar, não normal"
              shockValue={`${formatPercentage(insight2.pctLow, 0)} | ${formatPercentage(insight2.pctMid, 0)} | ${formatPercentage(insight2.pctHigh, 0)}`}
              shockLabel={`Distribuição score: baixo (<400) | médio (400-700) | alto (≥700). A maioria absoluta é negada por score, e a "classe média" quase não existe.`}
              implicacao="Não há cliente médio — a base é polarizada. Estratégia uniforme falha. Sub-segmentação por score dentro dos aprovados é obrigatória."
            />

            {/* INSIGHT 3: 10% gera 100% */}
            <InsightCard
              icon="💎"
              numero="03"
              accent="#00C853"
              bg="#F0F4F3"
              titulo={`${formatPercentage(insight3.pctAtivos)} da base sustenta 100% da rentabilidade`}
              shockValue={`${formatNumber(insight3.totalAtivos)} → ${formatBRL(insight3.positivos)}`}
              shockLabel={`Recorrentes + Ume Plus geram ${formatBRL(insight3.positivos)}. Os outros 90% somam ${formatBRL(insight3.negativos)}.`}
              implicacao="Operação de margem concentrada. Proteger e expandir os 10% críticos vale mais que ativar os 90% restantes — embora os dois não sejam mutuamente exclusivos."
            />

            {/* INSIGHT 4: CAC dos negados */}
            <InsightCard
              icon="💸"
              numero="04"
              accent="#E53935"
              bg="#FFEBEE"
              titulo="CAC dos negados é a maior sangria silenciosa"
              shockValue={formatBRL(insight4.custoCAC)}
              shockLabel={`${formatNumber(insight4.totalNegados)} negados × R$ ${CAC_BRL.toFixed(0)} CAC pago = perda anual sem retorno.`}
              implicacao="Maior dreno isolado da operação — maior que a inadimplência. Política de aprovação ou monetização da base negada (ex: parceria com score builder) pode liberar caixa expressivo."
            />
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 4: COMPARAÇÃO POR GRUPO DE COMPRAS (evidência dos insights)
          =================================================================== */}
      {groupComparison.length > 0 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>4. Evidência Quantitativa</CardTitle>
            <p className="text-xs text-[#64748b] mt-2">
              Dados que sustentam os Insights 01-02: clientes com maior frequência têm
              simultaneamente score mais alto, limite maior e adoção massiva do app.
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
                      <td className="py-2 px-2 text-right text-[#64748b]">
                        {formatPercentage(g.percentageComApp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================================
          SEÇÃO 5: HIPÓTESE DE SEGMENTAÇÃO (transição)
          =================================================================== */}
      <Card className="border-l-4 border-[#00C853] bg-gradient-to-r from-[#F0F4F3] to-white">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#001a0f] uppercase tracking-wide mb-2">
                Hipótese de Segmentação
              </p>
              <p className="text-sm text-[#1a1a1a] leading-relaxed">
                Os 4 insights apontam para 2 eixos principais de diferenciação:{" "}
                <span className="font-semibold">status no funil</span> (negado / aprovado / ativo / recorrente)
                e <span className="font-semibold">qualidade de risco</span> (score). Combinando os dois,
                derivamos <span className="font-semibold">7 segmentos acionáveis</span> com cobertura de
                100% da base — cada um com perfil financeiro, comportamental e de risco distintos, e
                com estratégias de CRM e crédito específicas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 6: OS 7 SEGMENTOS
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>5. Os 7 Segmentos</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Aplicação da hipótese — cada segmento corresponde a uma jornada de CRM (aba Jornada) e a
            um nível de rentabilidade (aba Rentabilidade).
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] mb-2">Critérios de Segmentação:</p>
            <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
              {SEGMENT_ORDER.map((id) => (
                <li key={id}>
                  <span className="mr-1">{SEGMENT_CONFIG[id].icon}</span>
                  <span className="font-medium" style={{ color: SEGMENT_CONFIG[id].accent }}>
                    {SEGMENT_CONFIG[id].label}:
                  </span>{" "}
                  {SEGMENT_CONFIG[id].criterio}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {segmentMetrics.map((seg) => {
              const cfg = SEGMENT_CONFIG[seg.id];
              return (
                <div
                  key={seg.id}
                  className="p-3 rounded border-l-4 transition hover:shadow-md"
                  style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.accent }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <p className="text-xs font-semibold uppercase truncate" style={{ color: cfg.accent }}>
                      {cfg.label}
                    </p>
                  </div>
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
                      <div
                        className="flex justify-between pt-1 mt-1 border-t"
                        style={{ borderColor: cfg.accent + "33" }}
                      >
                        <span className="text-[#64748b]">Rent. média:</span>
                        <span
                          className="font-bold"
                          style={{ color: seg.rentMediaBRL >= 0 ? "#00C853" : "#E53935" }}
                        >
                          {formatBRL(seg.rentMediaBRL)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0] text-xs text-[#64748b]">
            ✓ Soma dos 7 segmentos: {formatNumber(segmentMetrics.reduce((s, m) => s + m.count, 0))} clientes ={" "}
            {formatNumber(clientesData.length)} total — cobertura 100%.
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 7: ANÁLISE DE RISCO
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>6. Análise de Risco</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Distribuição de score na base e implicações para política de crédito.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">⚠️ Distribuição de Score</p>
              <div className="space-y-2">
                <ScoreBar
                  label="Baixo (<400)"
                  count={scoreDistribution.low}
                  total={clientesData.length}
                  color="#F44336"
                />
                <ScoreBar
                  label="Médio (400-700)"
                  count={scoreDistribution.medium}
                  total={clientesData.length}
                  color="#FF9800"
                />
                <ScoreBar
                  label="Alto (≥700)"
                  count={scoreDistribution.high}
                  total={clientesData.length}
                  color="#00C853"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase">📊 Insights de Risco</p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium text-[#0D47A1]">Score vs Compras:</span>
                  <p className="text-[#64748b] mt-1">
                    Ume Plus tem score médio {formatNumber(getSeg("ume-plus")?.avgScore || 0)} e{" "}
                    {formatNumber(getSeg("ume-plus")?.avgCompras || 0)} compras médias.
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <span className="font-medium text-[#1B5E20]">Recorrência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(
                      (getSeg("recorrentes")?.count || 0) + (getSeg("ume-plus")?.count || 0)
                    )}{" "}
                    clientes ativos recorrentes — base com menor inadimplência esperada.
                  </p>
                </div>
                <div className="p-2 bg-pink-50 rounded border border-pink-200">
                  <span className="font-medium text-[#880E4F]">Inadimplência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(getSeg("inadimplentes")?.count || 0)} inadimplentes — perda direta
                    estimada de {formatBRL(Math.abs(getSeg("inadimplentes")?.rentTotalBRL || 0))} em
                    principal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SEÇÃO 8: OPORTUNIDADES ESTRATÉGICAS
          =================================================================== */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>7. Oportunidades Estratégicas</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Recomendações de ação por segmento, com impacto financeiro estimado. Detalhamento das
            jornadas na aba Jornada; modelagem completa na aba Rentabilidade.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <SegmentOpportunityCard
              segmentId="aprovados-nao-ativados"
              count={getSeg("aprovados-nao-ativados")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("aprovados-nao-ativados")?.rentTotalBRL || 0}
              impactLabel="CAC desperdiçado"
              insight="Maior oportunidade de crescimento — CAC já pago, basta ativar. Cada conversão recupera R$ 50 e gera receita futura."
              acoes={[
                "Reengajamento via SMS + WhatsApp (sem Push: 0,6% têm app)",
                "Abordagem em ponto de venda no varejo parceiro",
                "Oferta de desconto na primeira compra",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="potencial"
              count={getSeg("potencial")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("potencial")?.rentTotalBRL || 0}
              impactLabel="Rentabilidade atual"
              insight="Janela crítica de hábito — 30 dias após 1ª compra define se vira recorrente. Maior ROI marginal em campanha."
              acoes={[
                "Incentivo de segunda compra dentro de 30 dias",
                "Personalização por score (educação se baixo, oferta se alto)",
                "Acompanhamento pós-primeira compra com WhatsApp",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="recorrentes"
              count={getSeg("recorrentes")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("recorrentes")?.rentTotalBRL || 0}
              impactLabel="Maior contribuição absoluta"
              insight="Maior contribuição de rentabilidade da base — foco em retenção e expansão de ticket. Proteger é prioridade."
              acoes={[
                "Aumento de limite proativo por bom histórico",
                "Cross-loja e diversificação de varejos",
                "Cadência quinzenal (não semanal) para evitar fadiga",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="ume-plus"
              count={getSeg("ume-plus")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("ume-plus")?.rentTotalBRL || 0}
              impactLabel="Maior valor unitário"
              insight="Core de rentabilidade — maior valor por cliente. Foco absoluto em retenção e advocacia."
              acoes={[
                "Limite aumentado automático (sem ação do cliente)",
                "Taxa de juros reduzida vs. média da base",
                "Comunicação com placeholders dinâmicos (economia, score, GMV)",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="negados-recuperaveis"
              count={getSeg("negados-recuperaveis")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("negados-recuperaveis")?.rentTotalBRL || 0}
              impactLabel="Maior dreno isolado"
              insight="Maior segmento da base — score 300-400 pode subir. Educação financeira como ponte para reaplicação."
              acoes={[
                "Apenas SMS (custo controlado, sem WhatsApp)",
                "Conteúdo educativo: como subir score em 60-90 dias",
                "Reaplicação automática sugerida em D+90",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="negados-alto-risco"
              count={getSeg("negados-alto-risco")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("negados-alto-risco")?.rentTotalBRL || 0}
              impactLabel="CAC sem retorno"
              insight="Score <300 — baixa probabilidade de aprovação no curto prazo. Contenção de custo é a estratégia."
              acoes={[
                "1 único SMS de comunicação (custo mínimo)",
                "Sem follow-up de reengajamento",
                "Reanálise apenas em 6+ meses",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="inadimplentes"
              count={getSeg("inadimplentes")?.count || 0}
              total={clientesData.length}
              rentTotal={getSeg("inadimplentes")?.rentTotalBRL || 0}
              impactLabel="Perda de principal"
              insight="Perda direta de principal — recuperação parcial via negociação tem ROI alto se feita rapidamente."
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
// SUB-COMPONENTS
// ============================================================================

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="p-3 rounded border border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-[#1a1a1a] mt-1">{value}</p>
      {sub && <p className="text-[10px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  );
}

interface InsightCardProps {
  icon: string;
  numero: string;
  accent: string;
  bg: string;
  titulo: string;
  shockValue: string;
  shockLabel: string;
  implicacao: string;
}

function InsightCard({ icon, numero, accent, bg, titulo, shockValue, shockLabel, implicacao }: InsightCardProps) {
  return (
    <div
      className="p-5 rounded border-l-4 transition hover:shadow-md"
      style={{ backgroundColor: bg, borderLeftColor: accent }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            Insight {numero}
          </p>
          <p className="text-sm font-bold text-[#1a1a1a] mt-1 leading-snug">{titulo}</p>
        </div>
      </div>

      {/* Shock value */}
      <div
        className="p-3 rounded mb-3 text-center"
        style={{
          backgroundColor: "white",
          border: `1px solid ${accent}33`,
        }}
      >
        <p className="text-2xl font-bold leading-tight" style={{ color: accent }}>
          {shockValue}
        </p>
        <p className="text-xs text-[#64748b] mt-1">{shockLabel}</p>
      </div>

      {/* Implication */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
          Implicação
        </p>
        <p className="text-xs text-[#1a1a1a] leading-relaxed">{implicacao}</p>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function ScoreBar({ label, count, total, color }: ScoreBarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#64748b]">{label}</span>
        <span className="font-medium text-[#1a1a1a]">
          {formatNumber(count)} ({formatPercentage(pct, 1)})
        </span>
      </div>
      <div className="bg-[#E2E8F0] rounded h-2">
        <div className="h-2 rounded" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface SegmentOpportunityCardProps {
  segmentId: SegmentId;
  count: number;
  total: number;
  rentTotal: number;
  impactLabel: string;
  insight: string;
  acoes: string[];
}

function SegmentOpportunityCard({
  segmentId,
  count,
  total,
  rentTotal,
  impactLabel,
  insight,
  acoes,
}: SegmentOpportunityCardProps) {
  const cfg = SEGMENT_CONFIG[segmentId];
  const pct = total > 0 ? (count / total) * 100 : 0;
  const isPositive = rentTotal >= 0;

  return (
    <div
      className="p-4 rounded border-l-4 transition hover:shadow-md"
      style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.accent }}
    >
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xl leading-none">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: cfg.text }}>
            {cfg.label}
          </p>
          <p className="text-xs text-[#64748b] mt-0.5">
            {formatNumber(count)} clientes • {formatPercentage(pct, 1)} da base
          </p>
        </div>
      </div>

      <div
        className="p-2 mb-3 rounded text-center"
        style={{
          backgroundColor: isPositive ? "rgba(0, 200, 83, 0.1)" : "rgba(229, 57, 53, 0.1)",
          border: `1px solid ${isPositive ? "rgba(0, 200, 83, 0.3)" : "rgba(229, 57, 53, 0.3)"}`,
        }}
      >
        <p className="text-[10px] uppercase font-semibold tracking-wide text-[#64748b]">{impactLabel}</p>
        <p className="text-lg font-bold mt-0.5" style={{ color: isPositive ? "#00C853" : "#E53935" }}>
          {formatBRL(rentTotal)}
        </p>
      </div>

      <p className="text-xs text-[#1a1a1a] font-medium mb-1">Insight:</p>
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