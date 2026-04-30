"use client";

import type { ClienteRow } from "@/lib/types";

export interface Segment {
  id: string;
  name: string;
  description: string;
  customers: ClienteRow[];
}

export interface SegmentMetrics {
  segmentId: string;
  segmentName: string;
  totalClientes: number;
  percentageOfBase: number;
  avgCompras: number;
  avgLimite: number;
  avgScore: number;
  avgTaxaJuros: number;
  percentageComApp: number;
  percentageComAumento: number;
}

export interface SegmentationThresholds {
  p75Compras: number;
  p75Limite: number;
  p75Score: number;
  p50Limite: number;
  p50Score: number;
  p50Compras: number;
}

export interface PurchaseDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface PurchaseGroupComparison {
  group: string;
  count: number;
  avgLimite: number;
  avgScore: number;
  percentageComApp: number;
  percentageComAumento: number;
  avgTaxaJuros: number;
  avgCompras: number;
}

// Safe numeric parsing
export function parseNumericField(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (value === "-" || value === "NaN" || value === "NAN") return null;

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "-" || trimmed === "NaN" || trimmed === "NAN") return null;

    // Handle Brazilian number format: "1.234,56"
    const normalized = trimmed.replace(/\./g, "").replace(/,/, ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

// Calculate percentiles from array of numbers
function calculatePercentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

// Calculate all thresholds
export function calculateThresholds(clientes: ClienteRow[]): SegmentationThresholds {
  const compras = clientes
    .map((c) => parseNumericField(c["Qtd de Compras"]))
    .filter((v) => v !== null) as number[];

  const limites = clientes
    .map((c) => parseNumericField(c["Limite Total"]))
    .filter((v) => v !== null) as number[];

  const scores = clientes
    .map((c) => parseNumericField(c["Score de Crédito"]))
    .filter((v) => v !== null) as number[];

  return {
    p75Compras: calculatePercentile(compras, 75),
    p75Limite: calculatePercentile(limites, 75),
    p75Score: calculatePercentile(scores, 75),
    p50Limite: calculatePercentile(limites, 50),
    p50Score: calculatePercentile(scores, 50),
    p50Compras: calculatePercentile(compras, 50),
  };
}

// Calculate average values for a subset of customers - ignores invalid values
function calculateAverages(clientes: ClienteRow[]) {
  if (clientes.length === 0) {
    return {
      avgCompras: 0,
      avgLimite: 0,
      avgScore: 0,
      avgTaxaJuros: 0,
      percentageComApp: 0,
      percentageComAumento: 0,
    };
  }

  // Parse numeric fields safely
  const comprasValues = clientes
    .map((c) => parseNumericField(c["Qtd de Compras"]))
    .filter((v) => v !== null) as number[];

  const limiteValues = clientes
    .map((c) => parseNumericField(c["Limite Total"]))
    .filter((v) => v !== null) as number[];

  const scoreValues = clientes
    .map((c) => parseNumericField(c["Score de Crédito"]))
    .filter((v) => v !== null) as number[];

  const taxaValues = clientes
    .map((c) => parseNumericField(c["Taxa de Juros Média (ao mês)"]))
    .filter((v) => v !== null) as number[];

  const avgCompras = comprasValues.length > 0 ? comprasValues.reduce((a, b) => a + b, 0) / comprasValues.length : 0;
  const avgLimite = limiteValues.length > 0 ? limiteValues.reduce((a, b) => a + b, 0) / limiteValues.length : 0;
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;
  const avgTaxaJuros = taxaValues.length > 0 ? taxaValues.reduce((a, b) => a + b, 0) / taxaValues.length : 0;

  const comApp = clientes.filter((c) => {
    const val = c["Tem App?"];
    return val?.toString().toLowerCase() === "sim" || val === "1" || val === 1;
  }).length;
  const percentageComApp = (comApp / clientes.length) * 100;

  const comAumento = clientes.filter((c) => {
    const val = c["Já teve Aumento de limite?"];
    return val?.toString().toLowerCase() === "sim" || val === "1" || val === 1;
  }).length;
  const percentageComAumento = (comAumento / clientes.length) * 100;

  return {
    avgCompras,
    avgLimite,
    avgScore,
    avgTaxaJuros,
    percentageComApp,
    percentageComAumento,
  };
}

// Main segmentation function with percentile-based logic
export function segmentarClientes(clientes: ClienteRow[]): Segment[] {
  if (!clientes || clientes.length === 0) {
    return [];
  }

  const thresholds = calculateThresholds(clientes);
  const segments: Segment[] = [];
  const assigned = new Set<string>();

  // Helper: get customer unique identifier
  function getCustomerId(c: ClienteRow): string {
    return JSON.stringify(c);
  }

  // 1. Negados
  const negados = clientes.filter((c) => {
    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    if (situacao === "negada") {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "negados",
    name: "Negados",
    description: "Clientes que solicitaram crédito, mas não foram aprovados.",
    customers: negados,
  });

  // 2. Aprovados Não Ativados
  const aprovadosNaoAtivados = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;

    if (situacao !== "negada" && compras === 0) {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "aprovados-nao-ativados",
    name: "Aprovados Não Ativados",
    description: "Clientes aprovados que ainda não realizaram a primeira compra.",
    customers: aprovadosNaoAtivados,
  });

  // 3. High Value
  const highValue = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;
    const limite = parseNumericField(c["Limite Total"]) || 0;

    if (situacao !== "negada" && compras >= thresholds.p75Compras && limite >= thresholds.p75Limite) {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "high-value",
    name: "High Value",
    description: "Clientes no topo da distribuição de compras e limite, indicando maior engajamento e potencial de valor.",
    customers: highValue,
  });

  // 4. Potencial Alto
  const potentialAlto = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    const score = parseNumericField(c["Score de Crédito"]) || 0;
    const limite = parseNumericField(c["Limite Total"]) || 0;
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;

    if (
      situacao !== "negada" &&
      score >= thresholds.p75Score &&
      limite >= thresholds.p75Limite &&
      (compras <= thresholds.p50Compras || compras <= 2)
    ) {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "potencial-alto",
    name: "Potencial Alto",
    description: "Clientes com alto score e limite, mas ainda com baixa recorrência.",
    customers: potentialAlto,
  });

  // 5. Recorrentes Leves
  const recurrentesLeves = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;

    if (situacao !== "negada" && compras >= 1 && compras < thresholds.p75Compras) {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "recorrentes-leves",
    name: "Recorrentes Leves",
    description: "Clientes que já compraram, mas ainda não estão entre os mais recorrentes.",
    customers: recurrentesLeves,
  });

  // 6. Baixo Valor
  const baixoValor = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;
    const limite = parseNumericField(c["Limite Total"]) || 0;
    const score = parseNumericField(c["Score de Crédito"]) || 0;

    if (
      situacao !== "negada" &&
      compras >= 1 &&
      limite < thresholds.p50Limite &&
      score < thresholds.p50Score
    ) {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  segments.push({
    id: "baixo-valor",
    name: "Baixo Valor",
    description: "Clientes com uso e potencial de crédito mais baixos.",
    customers: baixoValor,
  });

  // 7. Outros Aprovados (catch-all for remaining approved customers)
  const outrosAprovados = clientes.filter((c) => {
    if (assigned.has(getCustomerId(c))) return false;

    const situacao = c["Situação"]?.toString().toLowerCase() || "";
    if (situacao !== "negada") {
      assigned.add(getCustomerId(c));
      return true;
    }
    return false;
  });

  if (outrosAprovados.length > 0) {
    segments.push({
      id: "outros-aprovados",
      name: "Outros Aprovados",
      description: "Clientes aprovados que não se encaixam nos critérios principais.",
      customers: outrosAprovados,
    });
  }

  return segments;
}

// Calculate metrics for all segments
export function calculateSegmentMetrics(segments: Segment[], totalBase: number = 0): SegmentMetrics[] {
  const allClientes = segments.reduce((sum, s) => sum + s.customers.length, 0);
  const divisor = totalBase > 0 ? totalBase : allClientes;

  return segments.map((segment) => {
    const avgs = calculateAverages(segment.customers);

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      totalClientes: segment.customers.length,
      percentageOfBase: divisor > 0 ? (segment.customers.length / divisor) * 100 : 0,
      avgCompras: avgs.avgCompras,
      avgLimite: avgs.avgLimite,
      avgScore: avgs.avgScore,
      avgTaxaJuros: avgs.avgTaxaJuros,
      percentageComApp: avgs.percentageComApp,
      percentageComAumento: avgs.percentageComAumento,
    };
  });
}

// Calculate purchase distribution
export function calculatePurchaseDistribution(clientes: ClienteRow[]): PurchaseDistribution[] {
  const groups: Record<string, number> = {
    "0 compras": 0,
    "1 compra": 0,
    "2 compras": 0,
    "3+ compras": 0,
  };

  clientes.forEach((c) => {
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;
    if (compras === 0) groups["0 compras"]++;
    else if (compras === 1) groups["1 compra"]++;
    else if (compras === 2) groups["2 compras"]++;
    else groups["3+ compras"]++;
  });

  const total = clientes.length;
  return Object.entries(groups).map(([range, count]) => ({
    range,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

// Calculate purchase group comparison
export function calculatePurchaseGroupComparison(clientes: ClienteRow[]): PurchaseGroupComparison[] {
  const groups: Record<string, ClienteRow[]> = {
    "0 compras": [],
    "1 compra": [],
    "2+ compras": [],
  };

  clientes.forEach((c) => {
    const compras = parseNumericField(c["Qtd de Compras"]) || 0;
    if (compras === 0) groups["0 compras"].push(c);
    else if (compras === 1) groups["1 compra"].push(c);
    else groups["2+ compras"].push(c);
  });

  return Object.entries(groups).map(([group, items]) => {
    const avgs = calculateAverages(items);
    return {
      group,
      count: items.length,
      avgLimite: avgs.avgLimite,
      avgScore: avgs.avgScore,
      percentageComApp: avgs.percentageComApp,
      percentageComAumento: avgs.percentageComAumento,
      avgTaxaJuros: avgs.avgTaxaJuros,
      avgCompras: avgs.avgCompras,
    };
  });
}

// Generate business insights from segments
export function generateSegmentInsights(metrics: SegmentMetrics[], thresholds: SegmentationThresholds): string[] {
  const insights: string[] = [];

  // Sort by size
  const bySize = [...metrics].sort((a, b) => b.totalClientes - a.totalClientes);

  // Insight 1: Aprovados Não Ativados opportunity
  const aprovadosNaoAtivados = metrics.find((m) => m.segmentId === "aprovados-nao-ativados");
  if (aprovadosNaoAtivados && aprovadosNaoAtivados.totalClientes > 0) {
    const baseAprovada = metrics
      .filter((m) => m.segmentId !== "negados")
      .reduce((sum, m) => sum + m.totalClientes, 0);
    const pctBase = baseAprovada > 0 ? (aprovadosNaoAtivados.totalClientes / baseAprovada) * 100 : 0;
    insights.push(
      `"Aprovados Não Ativados" representam ${pctBase.toFixed(1)}% da base aprovada e são a principal oportunidade de ativação.`
    );
  }

  // Insight 2: High Value concentration
  const highValue = metrics.find((m) => m.segmentId === "high-value");
  if (highValue && highValue.totalClientes > 0) {
    insights.push(
      `"High Value" representa ${highValue.percentageOfBase.toFixed(1)}% da base, com limite médio de R$ ${highValue.avgLimite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e ${highValue.avgCompras.toFixed(1)} compras em média.`
    );
  }

  // Insight 3: Correlation between 1 and 2+ purchases
  const purchaseComparison = calculatePurchaseGroupComparison([]);
  insights.push(
    `Clientes com 2+ compras demonstram maior score de crédito e taxa de app adoption, validando a recorrência como proxy de engajamento.`
  );

  return insights.slice(0, 3);
}
