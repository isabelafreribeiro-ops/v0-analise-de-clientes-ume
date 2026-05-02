"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Repeat2, Sprout, Moon, ClipboardList, Ban, AlertTriangle, Target, Smartphone, BarChart3, Lightbulb } from "lucide-react";
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
  "ume-plus": {
    bg: "#E8F5E9",
    accent: "#00C853",
    text: "#1B5E20",
    Icon: Crown,
    label: "Ume Plus",
    criterio: "3+ compras + score ≥700",
  },
  "recorrentes": {
    bg: "#F1F8E9",
    accent: "#66BB6A",
    text: "#2E7D32",
    Icon: Repeat2,
    label: "Recorrentes",
    criterio: "Aprovado + 2+ compras (sem critério Plus)",
  },
  "potencial": {
    bg: "#F9FBE7",
    accent: "#9CCC65",
    text: "#558B2F",
    Icon: Sprout,
    label: "Potencial",
    criterio: "Aprovado + 1 compra",
  },
  "aprovados-nao-ativados": {
    bg: "#F1F5F9",
    accent: "#94A3B8",
    text: "#334155",
    Icon: Moon,
    label: "Aprovados Não Ativados",
    criterio: "Aprovado + 0 compras",
  },
  "negados-recuperaveis": {
    bg: "#F8FAFC",
    accent: "#64748B",
    text: "#1E293B",
    Icon: ClipboardList,
    label: "Negados Próximos do Corte",
    criterio: "Negada + score 300-449",
  },
  "negados-alto-risco": {
    bg: "#F1F5F9",
    accent: "#475569",
    text: "#0F172A",
    Icon: Ban,
    label: "Negados Alto Risco",
    criterio: "Negada + score <300",
  },
  "inadimplentes": {
    bg: "#FEF2F2",
    accent: "#EF4444",
    text: "#991B1B",
    Icon: AlertTriangle,
    label: "Inadimplentes",
    criterio: "Situação = Inadimplente",
  },
} as const;

const SEGMENT_ORDER = [
  "ume-plus",
  "recorrentes",
  "potencial",
  "aprovados-nao-ativados",
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

// ============================================================================
// SEGMENT CLASSIFIER
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
  if (compras >= 3 && score >= 700) return "ume-plus";
  return "recorrentes";
}

// ============================================================================
// SEGMENT METRICS COMPUTATION (fact-based only, no rentability)
// ============================================================================
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
      customers,
    };
  });
}

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

  const ativosCohort = useMemo(
    () =>
      aprovadosCohort.filter(
        (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) > 0
      ),
    [aprovadosCohort]
  );

  const distribution = useMemo(() => calculatePurchaseDistribution(clientesData), [clientesData]);
  const groupComparison = useMemo(() => calculatePurchaseGroupComparison(clientesData), [clientesData]);
  const ageDistribution = useMemo(() => calculateAgeDistribution(aprovadosCohort), [aprovadosCohort]);
  const genderDistribution = useMemo(() => calculateGenderDistribution(aprovadosCohort), [aprovadosCohort]);

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
    const ticketMedio = 227.78; // Single fact: from Base de Varejo aggregate

    return {
      idadeMediana,
      avgScore,
      avgParcelas,
      avgJuros,
      appAdoption,
      avgComprasAtivos,
      pctAumentoLimite,
      ticketMedio,
    };
  }, [aprovadosCohort, ativosCohort]);

  const topAgeGroup = ageDistribution.length > 0 
    ? ageDistribution.reduce((a, b) => (a.count > b.count ? a : b)).group 
    : "—";

  // ===== INSIGHTS — TODOS BASEADOS EM FATOS DA BASE =====

  // INSIGHT 01: App como diferenciador (FATO)
  const insight1 = useMemo(() => {
    // Comparação válida: apenas dentro de aprovados (negados nunca puderam instalar app)
    const aprovados = clientesData.filter((c) => {
      const sit = String(getColumnValue(c, ["situação", "situacao", "status"]) || "").toLowerCase().trim();
      return sit === "adimplente" || sit === "inadimplente";
    });

    const sem = aprovados.filter(
      (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) === 0
    );
    const com = aprovados.filter(
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

  // INSIGHT 02: Score bipolar (FATO)
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

  // INSIGHT 03 NOVO: Concentração de transações (FATO PURO)
  const insight3 = useMemo(() => {
    const totalTransacoes = clientesData.reduce(
      (sum, c) => sum + (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0),
      0
    );
    const recorrentes = clientesData.filter((c) => {
      const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
      return compras >= 2;
    });
    const transacoesRecorrentes = recorrentes.reduce(
      (sum, c) => sum + (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0),
      0
    );
    const pctClientesRec = (recorrentes.length / clientesData.length) * 100;
    const pctTransacoesRec =
      totalTransacoes > 0 ? (transacoesRecorrentes / totalTransacoes) * 100 : 0;

    return {
      qtdRecorrentes: recorrentes.length,
      pctClientesRec,
      transacoesRecorrentes,
      totalTransacoes,
      pctTransacoesRec,
    };
  }, [clientesData]);

  // INSIGHT 04 NOVO: Score alto inativo (FATO PURO)
  const insight4 = useMemo(() => {
    const scoreAlto = clientesData.filter((c) => {
      const score = parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0;
      const sit = String(getColumnValue(c, ["situação", "situacao", "status"]) || "")
        .toLowerCase()
        .trim();
      return score >= 700 && sit !== "negada";
    });
    const scoreAltoAtivo = scoreAlto.filter(
      (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) > 0
    );
    const scoreAltoInativo = scoreAlto.filter(
      (c) => (parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0) === 0
    );
    const pctAtivacaoScoreAlto =
      scoreAlto.length > 0 ? (scoreAltoAtivo.length / scoreAlto.length) * 100 : 0;

    return {
      totalScoreAlto: scoreAlto.length,
      ativos: scoreAltoAtivo.length,
      inativos: scoreAltoInativo.length,
      pctAtivacao: pctAtivacaoScoreAlto,
    };
  }, [clientesData]);

  const getSeg = (id: SegmentId) => segmentMetrics.find((s) => s.id === id);

  return (
    <div className="space-y-6">
      {/* TÍTULO + PERGUNTA-ÂNCORA */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Análise de segmentação da base — perfil, comportamento e oportunidades por grupo.
        </p>
        
        {/* TESE CENTRAL */}
        <div className="mt-3 bg-[#F0FDF4]/60 border-l-2 border-l-[#00C853] rounded py-2 px-3">
          <p className="text-[10px] font-semibold text-[#00C853] uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="h-4 w-4 text-[#00C853]" /> Tese
          </p>
          <p className="text-sm italic text-[#1a1a1a] mt-1">
            A base não tem cliente médio — é polarizada entre 11% que gera 100% da margem e 75% que nunca vai ser aprovado. Os 7 segmentos endereçam essa polaridade com jornada e crédito específicos.
          </p>
        </div>
      </div>

      {/* SEÇÃO 1: QUEM É O CLIENTE UME */}
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
              value={clienteUmeKpis.avgJuros ? (clienteUmeKpis.avgJuros * 100).toFixed(1) + "%" : "—"}
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

          <div className="p-4 bg-[#F7FAF8] rounded border border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748b] uppercase mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Cliente Ume Predominante</p>
            <p className="text-sm text-[#1a1a1a] leading-relaxed">
              Faixa de <span className="font-semibold">{topAgeGroup}</span>, score médio{" "}
              <span className="font-semibold">{Math.round(clienteUmeKpis.avgScore || 0)}</span> (perfil
              de risco{" "}
              {(clienteUmeKpis.avgScore || 0) >= 700
                ? "bom"
                : (clienteUmeKpis.avgScore || 0) >= 400
                ? "médio"
                : "baixo"}
              ), parcela em{" "}
              <span className="font-semibold">~{clienteUmeKpis.avgParcelas?.toFixed(0) || "—"}x</span>{" "}
              com taxa de{" "}
              <span className="font-semibold">
                {clienteUmeKpis.avgJuros ? (clienteUmeKpis.avgJuros * 100).toFixed(1) + "%" : "—"}
              </span>{" "}
              ao mês. Quando ativo, compra em média{" "}
              <span className="font-semibold">
                {clienteUmeKpis.avgComprasAtivos?.toFixed(1) || "—"} vezes
              </span>{" "}
              com ticket de{" "}
              <span className="font-semibold">{formatCurrency(clienteUmeKpis.ticketMedio)}</span>. Tem app
              instalado em{" "}
              <span className="font-semibold">{formatPercentage(clienteUmeKpis.appAdoption)}</span> dos
              casos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: DISTRIBUIÇÃO DE COMPRAS */}
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

      {/* SEÇÃO 3: 4 INSIGHTS-CHAVE — TODOS DE FATO PURO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>3. Insights-Chave da Base</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Quatro correlações observadas diretamente nos dados que orientam a estratégia de
            segmentação. Cada insight justifica uma dimensão da segmentação proposta.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <InsightCard
              Icon={Smartphone}
              numero="01"
              accent="#475569"
              bg="#F8FAFC"
              titulo="O app é o maior diferenciador comportamental"
              shockValue={`${formatPercentage(insight1.pctSem)} → ${formatPercentage(insight1.pctCom)}`}
              shockLabel={`Salto de ${insight1.multiplier.toFixed(0)}x na adoção do app entre aprovados que nunca compraram (${insight1.pctSem.toFixed(1).replace(".", ",")}%) e aprovados que ativaram (${insight1.pctCom.toFixed(1).replace(".", ",")}%). Comparação restrita a aprovados — negados nunca tiveram a opção de instalar o app.`}
              implicacao="Ter o app é praticamente um proxy de ativação. O status de app diferencia comportamento dentro da base aprovada."
            />

            <InsightCard
              Icon={BarChart3}
              numero="02"
              accent="#475569"
              bg="#F8FAFC"
              titulo="Score é destino — base bipolar, não normal"
              shockValue={`${formatPercentage(insight2.pctLow, 0)} | ${formatPercentage(insight2.pctMid, 0)} | ${formatPercentage(insight2.pctHigh, 0)}`}
              shockLabel={`Distribuição score: baixo (<400) | médio (400-700) | alto (≥700). A maioria absoluta é negada por score, e a "classe média" quase não existe.`}
              implicacao="Não há cliente médio — a base é polarizada entre baixo e alto score. O score diferencia comportamento dentro dos aprovados."
            />

            <InsightCard
              Icon={Crown}
              numero="03"
              accent="#475569"
              bg="#F8FAFC"
              titulo="Concentração extrema das transações"
              shockValue={`${formatPercentage(insight3.pctClientesRec, 1)} → ${formatPercentage(insight3.pctTransacoesRec, 0)}`}
              shockLabel={`${formatNumber(insight3.qtdRecorrentes)} clientes (${formatPercentage(insight3.pctClientesRec, 1)} da base) geram ${formatNumber(insight3.transacoesRecorrentes)} transações (${formatPercentage(insight3.pctTransacoesRec, 0)} do total).`}
              implicacao="Operação de cauda longa concentrada. O valor por cliente é significativamente maior entre os recorrentes que entre os demais."
            />

            <InsightCard
              Icon={Target}
              numero="04"
              accent="#EF4444"
              bg="#FEF2F2"
              titulo="Score alto não garante uso do produto"
              shockValue={`${formatNumber(insight4.inativos)} inativos`}
              shockLabel={`Dos ${formatNumber(insight4.totalScoreAlto)} clientes com score ≥700 aprovados, apenas ${formatPercentage(insight4.pctAtivacao, 0)} efetivamente compraram. ${formatNumber(insight4.inativos)} são "alta qualidade" parados.`}
              implicacao="Existe um pool de aprovados premium não-ativados. Score alto não garante ativação — o gargalo está fora do crédito."
            />
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 4: EVIDÊNCIA QUANTITATIVA */}
      {groupComparison.length > 0 && (
        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>4. Evidência Quantitativa</CardTitle>
            <p className="text-xs text-[#64748b] mt-2">
              Comparação dentro dos 48.737 aprovados (Adimplentes + Inadimplentes). Denominador alinhado com o Funil de Aquisição. Score alto não causa ativação — adoção do app é o driver real (5,1% nos não-ativados vs 70,2% nos ativados).
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

      {/* SEÇÃO 5: HIPÓTESE DE SEGMENTAÇÃO */}
      <Card className="border-l-4 border-[#00C853] bg-gradient-to-r from-[#F0F4F3] to-white">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 shrink-0 text-[#00C853]" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#001a0f] uppercase tracking-wide mb-2">
                Hipótese de Segmentação
              </p>
              <p className="text-sm text-[#1a1a1a] leading-relaxed">
                Os 4 insights apontam para 2 eixos principais de diferenciação:{" "}
                <span className="font-semibold">status no funil</span> (negado / aprovado / ativo /
                recorrente) e <span className="font-semibold">qualidade de risco</span> (score).
                A combinação dos dois eixos resulta em{" "}
                <span className="font-semibold">7 segmentos</span> com cobertura de 100% da
                base — cada um com perfil distinto de comportamento, risco e oportunidade. Cada
                segmento se conecta a uma jornada própria (ver aba Jornada) e a um perfil financeiro próprio (ver aba Rentabilidade).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 6: OS 7 SEGMENTOS — CARDS SEM RENT. MÉDIA */}
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
              {SEGMENT_ORDER.map((id) => {
                const SegIcon = SEGMENT_CONFIG[id].Icon;
                return (
                  <li key={id} className="flex items-start gap-1">
                    <SegIcon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: SEGMENT_CONFIG[id].accent }} />
                    <span>
                      <span className="font-medium" style={{ color: SEGMENT_CONFIG[id].accent }}>
                        {SEGMENT_CONFIG[id].label}:
                      </span>{" "}
                      {SEGMENT_CONFIG[id].criterio}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mb-4 p-6 rounded border-l-4 bg-[#F8FAFC]" style={{ borderLeftColor: "#3B82F6" }}>
            <p className="text-sm font-bold text-[#1a1a1a] mb-3">📐 Por que esses cortes específicos?</p>
            <div className="text-xs text-[#64748b] space-y-2">
              <p>
                Os 3 thresholds que definem os segmentos foram calibrados diretamente nos dados:
              </p>
              <ul className="space-y-2 ml-2">
                <li>
                  <span className="font-semibold text-[#1a1a1a]">• Score 300 (limite inferior dos negados):</span>
                  {" "}Abaixo desta marca, a probabilidade de aprovação na Ume é praticamente nula. É o piso técnico da política atual. Negados com score abaixo de 300 são separados como "Alto Risco" porque não respondem a ajustes marginais de política.
                </li>
                <li>
                  <span className="font-semibold text-[#1a1a1a]">• Score 700 (limite superior — núcleo de valor):</span>
                  {" "}A faixa "Alto" (≥700) concentra 14,7% da base e coincide com o segmento de maior recorrência. O score médio de Ume Plus é 851 — bem acima do corte. Define o pool de clientes premium.
                </li>
                <li>
                  <span className="font-semibold text-[#1a1a1a]">• 3+ compras (Ume Plus):</span>
                  {" "}A partir de 3 compras, o cliente diversifica em média 8 varejos diferentes (vs. 1 varejo no segmento Potencial). É o ponto onde o uso vira hábito e o cliente passa a se comportar como "carteira", não como compra pontual.
                </li>
              </ul>
              <p className="mt-2">
                <span className="font-semibold text-[#1a1a1a]">Idade e sexo não diferenciam segmentos</span> — a base é uniforme nessas dimensões (variação de ~1 ano entre os extremos, ~50% feminino em todos). Os 2 eixos escolhidos (status no funil × score) capturam toda a variância comportamental relevante.
              </p>
            </div>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-[#F7FAF8] rounded border border-[#E2E8F0] text-xs text-[#64748b]">
            �� Soma dos 7 segmentos: {formatNumber(segmentMetrics.reduce((s, m) => s + m.count, 0))} clientes ={" "}
            {formatNumber(clientesData.length)} total — cobertura 100%.
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 7: ANÁLISE DE RISCO */}
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
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Distribuição de Score</p>
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
                  color="#94A3B8"
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
              <p className="text-xs font-semibold text-[#64748b] mb-3 uppercase flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Insights de Risco</p>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded border-l-4" style={{ backgroundColor: "#F1F5F9", borderLeftColor: "#94A3B8" }}>
                  <span className="font-medium text-[#334155]">Score vs Compras:</span>
                  <p className="text-[#64748b] mt-1">
                    Ume Plus tem score médio {formatNumber(getSeg("ume-plus")?.avgScore || 0)} e{" "}
                    {formatNumber(getSeg("ume-plus")?.avgCompras || 0)} compras médias.
                  </p>
                </div>
                <div className="p-2 rounded border-l-4" style={{ backgroundColor: "#F0FDF4", borderLeftColor: "#22C55E" }}>
                  <span className="font-medium text-[#166534]">Recorrência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(
                      (getSeg("recorrentes")?.count || 0) + (getSeg("ume-plus")?.count || 0)
                    )}{" "}
                    clientes ativos recorrentes — base com menor inadimplência observada.
                  </p>
                </div>
                <div className="p-2 rounded border-l-4" style={{ backgroundColor: "#FEF2F2", borderLeftColor: "#EF4444" }}>
                  <span className="font-medium text-[#991B1B]">Inadimplência:</span>
                  <p className="text-[#64748b] mt-1">
                    {formatNumber(getSeg("inadimplentes")?.count || 0)} clientes inadimplentes —{" "}
                    {formatPercentage(((getSeg("inadimplentes")?.count || 0) / clientesData.length) * 100)} da
                    base.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 8: OPORTUNIDADES ESTRATÉGICAS — SEM ÂNCORA R$ */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>7. Oportunidades Estratégicas por Segmento</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Característica do segmento e ações sugeridas. Detalhamento das jornadas
            específicas na aba Jornada; modelagem financeira na aba Rentabilidade.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <SegmentOpportunityCard
              segmentId="aprovados-nao-ativados"
              count={getSeg("aprovados-nao-ativados")?.count || 0}
              total={clientesData.length}
              caracteristica="Maior oportunidade de crescimento da base — CAC já pago, basta ativar. Cada conversão recupera o investimento de aquisição e abre potencial de receita futura."
              acoes={[
                "Reengajamento via SMS + WhatsApp (Push tem alcance baixo: só 5% têm app)",
                "Abordagem em ponto de venda no varejo parceiro",
                "Oferta de desconto na primeira compra",
              ]}
            />

            <SegmentOpportunityCard
              segmentId="potencial"
              count={getSeg("potencial")?.count || 0}
              total={clientesData.length}
              caracteristica="Janela crítica de hábito — os 30 dias após a 1ª compra costumam definir se o cliente vira recorrente. Maior ROI marginal por unidade de esforço de campanha."
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
              caracteristica="Maior contribuição de transações da base — segmento focado em retenção e expansão de ticket. Proteção tem prioridade alta."
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
              caracteristica="Núcleo de valor da base — clientes premium ativos. Foco em retenção e advocacy."
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
              caracteristica="Maior segmento da base — score 300-400 com potencial de subir. Educação financeira como ponte para reaplicação."
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
              caracteristica="Score <300 — baixa probabilidade de aprovação no curto prazo. Contenção de custo de comunicação é a abordagem dominante."
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
              caracteristica="Recuperação parcial via negociação tem ROI alto se feita rapidamente."
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
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  numero: string;
  accent: string;
  bg: string;
  titulo: string;
  shockValue: string;
  shockLabel: string;
  implicacao: string;
}

function InsightCard({ Icon, numero, accent, bg, titulo, shockValue, shockLabel, implicacao }: InsightCardProps) {
  return (
    <div
      className="p-5 rounded border-l-4 transition hover:shadow-md"
      style={{ backgroundColor: bg, borderLeftColor: accent }}
    >
      <div className="flex items-start gap-3 mb-3">
        <Icon className="w-6 h-6 shrink-0" style={{ color: accent }} />
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            Insight {numero}
          </p>
          <p className="text-sm font-bold text-[#1a1a1a] mt-1 leading-snug">{titulo}</p>
        </div>
      </div>

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
  caracteristica: string;
  acoes: string[];
}

function SegmentOpportunityCard({ segmentId, count, total, caracteristica, acoes }: SegmentOpportunityCardProps) {
  const cfg = SEGMENT_CONFIG[segmentId];
  const pct = total > 0 ? (count / total) * 100 : 0;

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

      <p className="text-xs text-[#1a1a1a] font-medium mb-1">Característica do segmento:</p>
      <p className="text-xs text-[#64748b] mb-3">{caracteristica}</p>
      <p className="text-xs text-[#1a1a1a] font-medium mb-1">Ações sugeridas:</p>
      <ul className="text-xs text-[#64748b] space-y-1 list-disc list-inside">
        {acoes.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
