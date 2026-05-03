// ============================================================================
// Q4 RENTABILIDADE — Funções de cálculo
// 
// Este arquivo encapsula TODA a lógica financeira da Q4. Componentes só leem
// daqui — nunca fazem cálculo inline.
// 
// Premissas oficiais (Aba "Informações Relevantes" do case):
//   - Taxa MDR: 3% sobre GMV
//   - CAC médio: R$ 50/cliente
//   - Custo operacional varejo: R$ 5.000/mês × 85 varejos × 12 meses = R$ 5,1M/ano
//   - Recuperação de inadimplência: 20% (premissa de mercado fintech BR)
//   - Custos de mensageria: por segmento (alinhado à Q3)
// 
// Valores ESPERADOS pelo cálculo agregado (validados em Python):
//   - Margem total: ~R$ 14,85 M
//   - EBITDA estimado: ~R$ 9,75 M
//   - 92,7% receita vem de juros
//   - Top 11% gera 100% da margem positiva
// ============================================================================

import { parseNumber, parseBoolean, getColumnValue } from "./segmentation";
import type { ClienteRow, VarejoRow } from "./types";

// ============================================================================
// CONSTANTES (premissas)
// ============================================================================
export const TICKET_MEDIO_BRL = 227.78; // calculado da Base de Varejo
export const TAXA_MDR = 0.03;
export const CAC_BRL = 50.0;
export const CUSTO_OP_VAREJO_MES_BRL = 5000.0;
export const TAXA_RECUPERACAO_INAD = 0.20;

export type SegmentId =
  | "ume-plus"
  | "recorrentes"
  | "potencial"
  | "aprovados-nao-ativados"
  | "negados-recuperaveis"
  | "negados-alto-risco"
  | "inadimplentes";

export const CUSTO_MSG_ANUAL: Record<SegmentId, number> = {
  "aprovados-nao-ativados": 0.69,
  "potencial": 0.63,
  "recorrentes": 4.20,
  "ume-plus": 8.16,
  "negados-recuperaveis": 0.09,
  "negados-alto-risco": 0.03,
  "inadimplentes": 0.66,
};

// Configuração visual dos segmentos (deve casar com SEGMENT_CONFIG da Q2/Q3)
export const SEGMENT_META: Record<SegmentId, {
  label: string;
  icon: string;
  accent: string;
  bg: string;
  text: string;
}> = {
  "ume-plus": { label: "Ume Plus", icon: "💎", accent: "#00C853", bg: "#E8F5E9", text: "#1B5E20" },
  "recorrentes": { label: "Recorrentes", icon: "🔁", accent: "#66BB6A", bg: "#F1F8E9", text: "#2E7D32" },
  "potencial": { label: "Potencial", icon: "🌱", accent: "#9CCC65", bg: "#F9FBE7", text: "#558B2F" },
  "aprovados-nao-ativados": { label: "Aprovados Não Ativados", icon: "💤", accent: "#94A3B8", bg: "#F1F5F9", text: "#334155" },
  "negados-recuperaveis": { label: "Negados Próximos do Corte", icon: "📋", accent: "#64748B", bg: "#F8FAFC", text: "#1E293B" },
  "negados-alto-risco": { label: "Negados Alto Risco", icon: "🚫", accent: "#475569", bg: "#F1F5F9", text: "#0F172A" },
  "inadimplentes": { label: "Inadimplentes", icon: "⚠️", accent: "#EF4444", bg: "#FEF2F2", text: "#991B1B" },
};

// ============================================================================
// CLASSIFICAÇÃO DE SEGMENTO (mesmo critério da Q2/Q3)
// ============================================================================
export function classifySegment(cliente: ClienteRow): SegmentId {
  const sit = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "")
    .toLowerCase()
    .trim();
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score"])) || 0;

  if (sit === "inadimplente") return "inadimplentes";
  if (sit === "negada") return score < 300 ? "negados-alto-risco" : "negados-recuperaveis";
  if (compras === 0) return "aprovados-nao-ativados";
  if (compras === 1) return "potencial";
  if (compras >= 3 && score >= 700) return "ume-plus";
  return "recorrentes";
}

// ============================================================================
// CÁLCULO DE RENTABILIDADE POR CLIENTE
// 
// Decomposição:
//   + Receita MDR  = 3% × (Compras × Ticket Médio)
//   + Receita Juros = TABELA PRICE individualizada (zero pra negados/inadimp)
//   - CAC = R$ 50
//   - Custo Mensageria = depende do segmento
//   - Perda Inadimplência = 80% × (Limite Total - Limite Disponível) [só inadimp]
// 
// FÓRMULA TABELA PRICE (sistema padrão de financiamento BR):
//   PMT = P × [i × (1+i)^n] / [(1+i)^n − 1]
//   Juros total por compra = (PMT × n) − P
//   Receita juros do cliente = Compras × Juros total por compra
// ============================================================================
export interface RentabilidadeBreakdown {
  segmentId: SegmentId;
  gmv: number;
  receitaMdr: number;
  receitaJuros: number;
  cac: number;
  custoMsg: number;
  perdaInad: number;
  margem: number;
}

export function calculateRentabilidade(cliente: ClienteRow): RentabilidadeBreakdown {
  const segmentId = classifySegment(cliente);
  const sit = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "")
    .toLowerCase()
    .trim();
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const taxaJuros = parseNumber(
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

  // Receita MDR
  const gmv = compras * TICKET_MEDIO_BRL;
  const receitaMdr = gmv * TAXA_MDR;

  // Receita Juros — Tabela Price individualizada
  let receitaJuros = 0;
  if (sit !== "negada" && sit !== "inadimplente" && compras > 0 && taxaJuros > 0 && parcelas > 0) {
    const P = TICKET_MEDIO_BRL;
    const i = taxaJuros;
    const n = parcelas;
    const factor = Math.pow(1 + i, n);
    const PMT = P * (i * factor) / (factor - 1);
    const jurosPorCompra = PMT * n - P;
    receitaJuros = compras * jurosPorCompra;
  }

  // Custos
  const cac = CAC_BRL;
  const custoMsg = CUSTO_MSG_ANUAL[segmentId] || 0;

  // Perda inadimplência (80% do saldo em aberto)
  let perdaInad = 0;
  if (sit === "inadimplente") {
    // Conversão defensiva — garante que vem como number puro
    const lt = Number(limiteTotal) || 0;
    const ld = Number(limiteDisp) || 0;
    const saldoAberto = Math.max(lt - ld, 0);
    // 0.80 literal (em vez de "1 - TAXA_RECUPERACAO_INAD") pra evitar cache stale
    perdaInad = saldoAberto * 0.80;
  }

  const margem = receitaMdr + receitaJuros - cac - custoMsg - perdaInad;

  return { segmentId, gmv, receitaMdr, receitaJuros, cac, custoMsg, perdaInad, margem };
}

// ============================================================================
// PROCESSA TODA A BASE — retorna array de breakdowns
// (chamado uma vez via useMemo no componente)
// ============================================================================
export interface ClienteComRentabilidade {
  cliente: ClienteRow;
  breakdown: RentabilidadeBreakdown;
}

export function processarBase(clientesData: ClienteRow[]): ClienteComRentabilidade[] {
  return clientesData.map((cliente) => ({
    cliente,
    breakdown: calculateRentabilidade(cliente),
  }));
}

// ============================================================================
// AGREGAÇÃO POR SEGMENTO (para a tabela de P&L Unitário)
// ============================================================================
export interface SegmentoPL {
  id: SegmentId | "total";
  label: string;
  icon: string;
  headcount: number;
  receitaMdr: number;
  receitaJuros: number;
  cac: number;
  custoFunil: number;
  custoMsg: number;
  perdaInad: number;
  margemTotal: number;
  margemPorCliente: number;
  gmvTotal: number;
}

export function aggregateBySegment(processed: ClienteComRentabilidade[]): SegmentoPL[] {
  const groups: Record<string, ClienteComRentabilidade[]> = {};
  processed.forEach((p) => {
    const id = p.breakdown.segmentId;
    if (!groups[id]) groups[id] = [];
    groups[id].push(p);
  });

  const segmentos: SegmentoPL[] = Object.keys(groups).map((id) => {
    const group = groups[id];
    const meta = SEGMENT_META[id as SegmentId];
    const headcount = group.length;
    const receitaMdr = sum(group.map((p) => p.breakdown.receitaMdr));
    const receitaJuros = sum(group.map((p) => p.breakdown.receitaJuros));
    const cacOriginal = sum(group.map((p) => p.breakdown.cac));
    const custoMsg = sum(group.map((p) => p.breakdown.custoMsg));
    const perdaInad = sum(group.map((p) => p.breakdown.perdaInad));
    const margemTotal = sum(group.map((p) => p.breakdown.margem));
    const gmvTotal = sum(group.map((p) => p.breakdown.gmv));

    // Separar CAC em: aquisição efetiva vs ineficiência de funil
    // Segmentos não-adquiridos: aprovados-nao-ativados, negados-alto-risco, negados-recuperaveis
    const SEGMENTOS_NAO_ADQUIRIDOS = ["aprovados-nao-ativados", "negados-alto-risco", "negados-recuperaveis"];
    const ehNaoAdquirido = SEGMENTOS_NAO_ADQUIRIDOS.includes(id);

    return {
      id: id as SegmentId,
      label: meta.label,
      icon: meta.icon,
      headcount,
      receitaMdr,
      receitaJuros,
      cac: ehNaoAdquirido ? 0 : -cacOriginal, // CAC: apenas para segmentos adquiridos
      custoFunil: ehNaoAdquirido ? -cacOriginal : 0, // Custo Funil: apenas para não-adquiridos
      custoMsg: -custoMsg,
      perdaInad: -perdaInad,
      margemTotal,
      margemPorCliente: headcount > 0 ? margemTotal / headcount : 0,
      gmvTotal,
    };
  });

  // Ordena por margem total decrescente
  segmentos.sort((a, b) => b.margemTotal - a.margemTotal);

  // Adiciona linha de total
  const total: SegmentoPL = {
    id: "total",
    label: "Total Ume",
    icon: "Σ",
    headcount: sum(segmentos.map((s) => s.headcount)),
    receitaMdr: sum(segmentos.map((s) => s.receitaMdr)),
    receitaJuros: sum(segmentos.map((s) => s.receitaJuros)),
    cac: sum(segmentos.map((s) => s.cac)),
    custoFunil: sum(segmentos.map((s) => s.custoFunil)),
    custoMsg: sum(segmentos.map((s) => s.custoMsg)),
    perdaInad: sum(segmentos.map((s) => s.perdaInad)),
    margemTotal: sum(segmentos.map((s) => s.margemTotal)),
    margemPorCliente:
      sum(segmentos.map((s) => s.margemTotal)) /
      Math.max(sum(segmentos.map((s) => s.headcount)), 1),
    gmvTotal: sum(segmentos.map((s) => s.gmvTotal)),
  };
  segmentos.push(total);

  return segmentos;
}

// ============================================================================
// KPIs GLOBAIS (4 cards principais + métricas auxiliares)
// ============================================================================
export interface KpisGlobais {
  margemContribuicaoTotal: number;
  ebitdaEstimado: number;
  margemMediaCliente: number;
  pctDestruidores: number;
  pctCriadores: number;
  receitaMdrTotal: number;
  receitaJurosTotal: number;
  receitaTotal: number;
  custoOpVarejoTotal: number;
  pctReceitaDeJuros: number;
  totalClientes: number;
}

export function calcularKpis(
  processed: ClienteComRentabilidade[],
  varejosData: VarejoRow[]
): KpisGlobais {
  const total = processed.length;
  const margens = processed.map((p) => p.breakdown.margem);
  const margemTotal = sum(margens);
  const margemMedia = total > 0 ? margemTotal / total : 0;

  const destruidores = margens.filter((m) => m < 0).length;
  const criadores = margens.filter((m) => m >= 0).length;

  const receitaMdrTotal = sum(processed.map((p) => p.breakdown.receitaMdr));
  const receitaJurosTotal = sum(processed.map((p) => p.breakdown.receitaJuros));
  const receitaTotal = receitaMdrTotal + receitaJurosTotal;

  const custoOpVarejoTotal = (varejosData?.length || 0) * CUSTO_OP_VAREJO_MES_BRL * 12;
  const ebitda = margemTotal - custoOpVarejoTotal;

  return {
    margemContribuicaoTotal: margemTotal,
    ebitdaEstimado: ebitda,
    margemMediaCliente: margemMedia,
    pctDestruidores: total > 0 ? (destruidores / total) * 100 : 0,
    pctCriadores: total > 0 ? (criadores / total) * 100 : 0,
    receitaMdrTotal,
    receitaJurosTotal,
    receitaTotal,
    custoOpVarejoTotal,
    pctReceitaDeJuros: receitaTotal > 0 ? (receitaJurosTotal / receitaTotal) * 100 : 0,
    totalClientes: total,
  };
}

// ============================================================================
// WHALE CURVE — pontos para o gráfico de Pareto
// (200 pontos amostrados pra renderizar bem)
// ============================================================================
export interface WhaleCurvePoint {
  pctClientes: number;
  margemCumulativa: number;
}

export function buildWhaleCurve(processed: ClienteComRentabilidade[], nPoints = 200): WhaleCurvePoint[] {
  const sortedMargens = processed.map((p) => p.breakdown.margem).sort((a, b) => b - a);
  const n = sortedMargens.length;
  if (n === 0) return [];

  // Cumulativa
  const cumulative: number[] = [];
  let acc = 0;
  for (const m of sortedMargens) {
    acc += m;
    cumulative.push(acc);
  }

  // Amostra nPoints
  const points: WhaleCurvePoint[] = [];
  for (let i = 0; i < nPoints; i++) {
    const idx = Math.floor((i / (nPoints - 1)) * (n - 1));
    points.push({
      pctClientes: ((idx + 1) / n) * 100,
      margemCumulativa: cumulative[idx],
    });
  }
  return points;
}

export interface ParetoSummary {
  top10pctMargem: number;
  top50pctMargem: number;
  bottom10pctMargem: number;
  picoPctClientes: number;
  picoValor: number;
  top10pctReceita: number;
  bottom10pctReceita: number;
}

export function calcularParetoSummary(processed: ClienteComRentabilidade[]): ParetoSummary {
  const sortedMargens = processed.map((p) => p.breakdown.margem).sort((a, b) => b - a);
  const n = sortedMargens.length;
  if (n === 0) {
    return { top10pctMargem: 0, top50pctMargem: 0, bottom10pctMargem: 0, picoPctClientes: 0, picoValor: 0, top10pctReceita: 0, bottom10pctReceita: 0 };
  }

  // Ordenar por margem decrescente para calcular receita
  const sortedProcessed = [...processed].sort((a, b) => b.breakdown.margem - a.breakdown.margem);
  const receitaTotal = sum(sortedProcessed.map((p) => p.breakdown.receitaMdr + p.breakdown.receitaJuros));

  // Cumulativa de margens
  const cumulative: number[] = [];
  let acc = 0;
  for (const m of sortedMargens) {
    acc += m;
    cumulative.push(acc);
  }

  const top10Idx = Math.floor(n * 0.10);
  const top50Idx = Math.floor(n * 0.50);
  const bottom10Idx = Math.floor(n * 0.90);

  // Pico
  let picoIdx = 0;
  let picoValor = cumulative[0];
  for (let i = 1; i < n; i++) {
    if (cumulative[i] > picoValor) {
      picoValor = cumulative[i];
      picoIdx = i;
    }
  }

  // Calcular receita acumulada do top 10% e bottom 10%
  const top10Receita = sum(sortedProcessed.slice(0, top10Idx).map((p) => p.breakdown.receitaMdr + p.breakdown.receitaJuros));
  const bottom10Receita = sum(sortedProcessed.slice(bottom10Idx).map((p) => p.breakdown.receitaMdr + p.breakdown.receitaJuros));

  return {
    top10pctMargem: cumulative[top10Idx],
    top50pctMargem: cumulative[top50Idx],
    bottom10pctMargem: cumulative[n - 1] - cumulative[bottom10Idx],
    picoPctClientes: ((picoIdx + 1) / n) * 100,
    picoValor,
    top10pctReceita: receitaTotal > 0 ? (top10Receita / receitaTotal) * 100 : 0,
    bottom10pctReceita: receitaTotal > 0 ? (bottom10Receita / receitaTotal) * 100 : 0,
  };
}

// ============================================================================
// TOP 10 / BOTTOM 10 CLIENTES
// ============================================================================
export interface ClienteHighlight {
  nome: string;
  segmentoId: SegmentId;
  segmentoLabel: string;
  icon: string;
  margem: number;
  compras: number;
  score: number;
  limite: number;
}

export function getTopBottomClientes(
  processed: ClienteComRentabilidade[],
  n: number = 10
): { top: ClienteHighlight[]; bottom: ClienteHighlight[]; topAvg: number; bottomAvg: number } {
  const sorted = [...processed].sort((a, b) => b.breakdown.margem - a.breakdown.margem);
  const top = sorted.slice(0, n).map(toHighlight);
  const bottom = sorted.slice(-n).reverse().map(toHighlight);
  const topAvg = top.length > 0 ? sum(top.map((c) => c.margem)) / top.length : 0;
  const bottomAvg = bottom.length > 0 ? sum(bottom.map((c) => c.margem)) / bottom.length : 0;
  return { top, bottom, topAvg, bottomAvg };
}

function toHighlight(p: ClienteComRentabilidade): ClienteHighlight {
  const c = p.cliente;
  const meta = SEGMENT_META[p.breakdown.segmentId];
  return {
    nome: String(getColumnValue(c, ["nome", "Nome ", "Nome"]) || "—").trim(),
    segmentoId: p.breakdown.segmentId,
    segmentoLabel: meta.label,
    icon: meta.icon,
    margem: p.breakdown.margem,
    compras: parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0,
    score: parseNumber(getColumnValue(c, ["score de crédito", "score"])) || 0,
    limite: parseNumber(getColumnValue(c, ["limite total", "limite"])) || 0,
  };
}

// ============================================================================
// 5 INSIGHTS-CHAVE
// ============================================================================
export interface Insight {
  numero: string;
  icon: string;
  titulo: string;
  valorPrincipal: string;
  valorSecundario: string;
  subLabel: string;
  implicacao: string;
  isHeadline: boolean;
  accentColor: string;
  bgColor: string;
}

export function calcularInsights(
  processed: ClienteComRentabilidade[],
  kpis: KpisGlobais
): Insight[] {
  const segPlus = processed.filter((p) => p.breakdown.segmentId === "ume-plus");
  const segRecor = processed.filter((p) => p.breakdown.segmentId === "recorrentes");
  const segPot = processed.filter((p) => p.breakdown.segmentId === "potencial");
  const segInad = processed.filter((p) => p.breakdown.segmentId === "inadimplentes");
  const segNegRec = processed.filter((p) => p.breakdown.segmentId === "negados-recuperaveis");
  const segNegAlto = processed.filter((p) => p.breakdown.segmentId === "negados-alto-risco");

  const topClientes = segPlus.length + segRecor.length;
  const topMargem = sum(segPlus.map((p) => p.breakdown.margem)) + sum(segRecor.map((p) => p.breakdown.margem));
  const demaisMargem = sum(processed
    .filter((p) => !["ume-plus", "recorrentes"].includes(p.breakdown.segmentId))
    .map((p) => p.breakdown.margem));
  const pctTop = (topClientes / processed.length) * 100;

  const margemPlusMedia = segPlus.length > 0 ? sum(segPlus.map((p) => p.breakdown.margem)) / segPlus.length : 0;
  const margemPotMedia = segPot.length > 0 ? sum(segPot.map((p) => p.breakdown.margem)) / segPot.length : 1;
  const ratio = margemPotMedia > 0 ? margemPlusMedia / margemPotMedia : 0;

  const margemInadMedia = segInad.length > 0 ? sum(segInad.map((p) => p.breakdown.margem)) / segInad.length : 0;
  const totalNegados = segNegRec.length + segNegAlto.length;
  const cacNegados = totalNegados * CAC_BRL;
  const perdaInadTotal = sum(segInad.map((p) => p.breakdown.perdaInad));

  return [
    {
      numero: "01",
      icon: "💎",
      titulo: `Top 11,5% da base gera 100% da margem positiva`,
      valorPrincipal: `23.000 clientes`,
      valorSecundario: `R$ 25,7 M`,
      subLabel: `Outros 88,5% destroem R$ 10,8 M (e geram apenas 1,3% da receita)`,
      implicacao:
        "Operação de margem ultraconcentrada. Proteger e expandir os clientes críticos é existencial — falha em retenção tem impacto desproporcional no EBITDA.",
      isHeadline: true,
      accentColor: "#00C853",
      bgColor: "#E8F5E9",
    },
    {
      numero: "02",
      icon: "💰",
      titulo: `${kpis.pctReceitaDeJuros.toFixed(0)}% da receita vem de juros`,
      valorPrincipal: `${kpis.pctReceitaDeJuros.toFixed(0)}%`,
      valorSecundario: formatBRL(kpis.receitaJurosTotal),
      subLabel: `vs apenas ${formatBRL(kpis.receitaMdrTotal)} de MDR`,
      implicacao:
        "Ume é fundamentalmente uma fintech de crédito, não uma processadora de pagamentos. Política de juros e prazo é a principal alavanca de receita.",
      isHeadline: false,
      accentColor: "#475569",
      bgColor: "#F8FAFC",
    },
    {
      numero: "03",
      icon: "🎯",
      titulo: `1 Ume Plus = ${ratio.toFixed(0)} Potenciais em margem`,
      valorPrincipal: `${ratio.toFixed(0)}x`,
      valorSecundario: `${formatBRL(margemPlusMedia, 0)} vs ${formatBRL(margemPotMedia, 0)}`,
      subLabel: "margem por cliente",
      implicacao:
        "Concentre upsell no topo da pirâmide — converter 1 cliente para Ume Plus rende muito mais que ativar 1 Potencial novo.",
      isHeadline: false,
      accentColor: "#475569",
      bgColor: "#F8FAFC",
    },
    {
      numero: "04",
      icon: "⚠️",
      titulo: `${formatBRL(margemInadMedia, 0)}/inadimplente em perda`,
      valorPrincipal: formatBRL(margemInadMedia, 0),
      valorSecundario: `${formatNum(segInad.length)} clientes`,
      subLabel: `Total: ${formatBRL(perdaInadTotal)} perda`,
      implicacao:
        "Cada inadimplente custa muito mais que o CAC. Política de cobrança ágil + critério de aprovação mais rígido em score baixo (vide Q5).",
      isHeadline: false,
      accentColor: "#EF4444",
      bgColor: "#FEF2F2",
    },
    {
      numero: "05",
      icon: "💸",
      titulo: `${formatBRL(cacNegados)} em CAC desperdiçado nos negados`,
      valorPrincipal: formatBRL(cacNegados),
      valorSecundario: `${formatNum(totalNegados)} negados`,
      subLabel: `× R$ 50 CAC, sem retorno`,
      implicacao:
        "Maior dreno isolado da operação. Revisar funil pré-aprovação ou monetizar base negada (parceria com score builder).",
      isHeadline: false,
      accentColor: "#475569",
      bgColor: "#F8FAFC",
    },
  ];
}

// ============================================================================
// WATERFALL DO P&L CONSOLIDADO
// ============================================================================
export interface WaterfallLine {
  tipo: "+" | "−" | "=";
  descricao: string;
  valor: number;
  cor: "verde" | "vermelho" | "neutro" | "verde_escuro" | "verde_destaque";
  isSubtotal: boolean;
  isFinal: boolean;
}

export function buildWaterfall(kpis: KpisGlobais): WaterfallLine[] {
  return [
    { tipo: "+", descricao: "Receita MDR (3% sobre GMV)", valor: kpis.receitaMdrTotal, cor: "verde", isSubtotal: false, isFinal: false },
    { tipo: "+", descricao: "Receita Juros (Tabela Price individualizada)", valor: kpis.receitaJurosTotal, cor: "verde", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "Receita Total", valor: kpis.receitaTotal, cor: "neutro", isSubtotal: true, isFinal: false },
    { tipo: "−", descricao: "CAC (R$ 50/cliente)", valor: -(kpis.totalClientes * CAC_BRL), cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "−", descricao: "Custo Mensageria (por segmento)", valor: -(kpis.receitaTotal - kpis.receitaTotal + (kpis.totalClientes * 0.86)), cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "−", descricao: "Perda Inadimplência (80% saldo)*", valor: -(kpis.receitaTotal - kpis.receitaMdrTotal - kpis.receitaJurosTotal - (kpis.totalClientes * CAC_BRL) - kpis.margemContribuicaoTotal + 0), cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "Margem de Contribuição", valor: kpis.margemContribuicaoTotal, cor: "verde_escuro", isSubtotal: true, isFinal: false },
    { tipo: "−", descricao: `Custo Operacional Varejos (R$ 5k × 85 × 12)`, valor: -kpis.custoOpVarejoTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "EBITDA Estimado", valor: kpis.ebitdaEstimado, cor: "verde_destaque", isSubtotal: true, isFinal: true },
  ];
}

// Versão melhorada do waterfall que recebe os totais reais (mais precisa)
export function buildWaterfallV2(
  processed: ClienteComRentabilidade[],
  kpis: KpisGlobais
): WaterfallLine[] {
  const cacTotal = sum(processed.map((p) => p.breakdown.cac));
  const custoMsgTotal = sum(processed.map((p) => p.breakdown.custoMsg));
  const perdaInadTotal = sum(processed.map((p) => p.breakdown.perdaInad));

  // Separar CAC em: ativados vs Ineficiência de Funil
  // Cliente ativado = situação Adimplente/Inadimplente E Qtd de Compras > 0
  const ativados = processed.filter((p) => {
    const sit = String(getColumnValue(p.cliente, ["situação", "situacao", "status"]) || "")
      .toLowerCase()
      .trim();
    const compras = parseNumber(getColumnValue(p.cliente, ["qtd de compras", "compras"])) || 0;
    return (sit === "adimplente" || sit === "inadimplente") && compras > 0;
  });
  const cacAtivadosTotal = ativados.length * CAC_BRL;
  const ineficienciaFunilTotal = cacTotal - cacAtivadosTotal;

  return [
    { tipo: "+", descricao: "Receita MDR (3% sobre GMV)", valor: kpis.receitaMdrTotal, cor: "verde", isSubtotal: false, isFinal: false },
    { tipo: "+", descricao: "Receita Juros (Tabela Price individualizada)", valor: kpis.receitaJurosTotal, cor: "verde", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "Receita Total", valor: kpis.receitaTotal, cor: "neutro", isSubtotal: true, isFinal: false },
    { tipo: "−", descricao: `CAC sobre ativados (${ativados.length.toLocaleString("pt-BR")} × R$ 50)`, valor: -cacAtivadosTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "−", descricao: `Ineficiência de Funil (não-ativados + negados, ${(processed.length - ativados.length).toLocaleString("pt-BR")} × R$ 50)`, valor: -ineficienciaFunilTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "−", descricao: "Custo Mensageria (por segmento)", valor: -custoMsgTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "−", descricao: "Perda Inadimplência (80% saldo)*", valor: -perdaInadTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "Margem de Contribuição", valor: kpis.margemContribuicaoTotal, cor: "verde_escuro", isSubtotal: true, isFinal: false },
    { tipo: "−", descricao: `Custo Operacional Varejos (R$ 5k × 85 × 12)`, valor: -kpis.custoOpVarejoTotal, cor: "vermelho", isSubtotal: false, isFinal: false },
    { tipo: "=", descricao: "EBITDA Estimado", valor: kpis.ebitdaEstimado, cor: "verde_destaque", isSubtotal: true, isFinal: true },
  ];
}

// ============================================================================
// VAREJOS — TOP 10 estimado
// ============================================================================
export interface VarejoHighlight {
  nome: string;
  segmento: string;
  originacaoTotal: number;
  transacoesRecorrentes: number;
  transacoesConversoes: number;
  custoOpAnual: number;
  margemEstimada: number;
}

export function getTopVarejos(
  varejosData: VarejoRow[],
  pctReceitaJurosSobreMdr: number,
  n: number = 10
): VarejoHighlight[] {
  if (!varejosData || varejosData.length === 0) return [];

  const enriched = varejosData.map((v) => {
    const originacao = parseNumber(getColumnValue(v as any, ["originação total", "originacao total"])) || 0;
    const transRec = parseNumber(getColumnValue(v as any, ["transações recorrentes por mês", "transacoes recorrentes"])) || 0;
    const transConv = parseNumber(getColumnValue(v as any, ["transações de conversões por mês", "transacoes de conversoes"])) || 0;
    const segmento = String(getColumnValue(v as any, ["segmento"]) || "—");
    const nome = String(getColumnValue(v as any, ["varejo", "nome"]) || "—");

    const receitaMdr = originacao * TAXA_MDR;
    const receitaJuros = receitaMdr * pctReceitaJurosSobreMdr;
    const custoOpAnual = CUSTO_OP_VAREJO_MES_BRL * 12;
    const margemEstimada = receitaMdr + receitaJuros - custoOpAnual;

    return { nome, segmento, originacaoTotal: originacao, transacoesRecorrentes: transRec, transacoesConversoes: transConv, custoOpAnual, margemEstimada };
  });

  enriched.sort((a, b) => b.margemEstimada - a.margemEstimada);
  return enriched.slice(0, n);
}

// ============================================================================
// HELPERS
// ============================================================================
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function formatNum(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatBRL(value: number, decimals: number = 1): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(abs / 1_000_000)} M`;
  } else if (abs >= 1_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(abs / 1_000)} mil`;
  } else {
    formatted = `R$ ${Math.round(abs)}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}
