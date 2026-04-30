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
  avgCompras: number;
  avgLimite: number;
  avgScore: number;
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

// Calculate average from array of numbers, ignoring nulls
function calculateAverage(numbers: (number | null)[]): number {
  const valid = numbers.filter((n) => n !== null) as number[];
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Calculate percentages
function calculatePercentage(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

// Calculate thresholds for behavior-driven segmentation
export function calculateThresholds(clientesData: ClienteRow[]): SegmentationThresholds {
  if (!clientesData || clientesData.length === 0) {
    return { avgCompras: 0, avgLimite: 0, avgScore: 0 };
  }

  const compras = clientesData.map((c) => parseNumericField(c["Qtd de Compras"]) || 0);
  const limites = clientesData.map((c) => parseNumericField(c["Limite Total"]) || 0);
  const scores = clientesData.map((c) => parseNumericField(c["Score"]) || 0);

  return {
    avgCompras: calculateAverage(compras),
    avgLimite: calculateAverage(limites),
    avgScore: calculateAverage(scores),
  };
}

// Segment customers using behavior-driven rules
export function segmentarClientes(clientesData: ClienteRow[]): Segment[] {
  if (!clientesData || clientesData.length === 0) {
    return [];
  }

  const thresholds = calculateThresholds(clientesData);

  const negados: ClienteRow[] = [];
  const aprovadosNaoAtivados: ClienteRow[] = [];
  const potencial: ClienteRow[] = [];
  const recorrentes: ClienteRow[] = [];
  const highValue: ClienteRow[] = [];

  clientesData.forEach((cliente) => {
    const situacao = String(cliente["Situação"] || "").trim();
    const compras = parseNumericField(cliente["Qtd de Compras"]) || 0;
    const limite = parseNumericField(cliente["Limite Total"]) || 0;
    const score = parseNumericField(cliente["Score"]) || 0;

    // Rule 1: Negados
    if (situacao === "Negada") {
      negados.push(cliente);
      return;
    }

    // Rule 2: Aprovados Não Ativados
    if (compras === 0) {
      aprovadosNaoAtivados.push(cliente);
      return;
    }

    // Rule 3: High Value (3+ purchases AND above-average limit)
    if (compras >= 3 && limite >= thresholds.avgLimite) {
      highValue.push(cliente);
      return;
    }

    // Rule 4: Potencial (above-average score OR above-average limit AND <= 1 purchase)
    if ((score >= thresholds.avgScore || limite >= thresholds.avgLimite) && compras <= 1) {
      potencial.push(cliente);
      return;
    }

    // Rule 5: Recorrentes (2+ purchases)
    if (compras >= 2) {
      recorrentes.push(cliente);
      return;
    }
  });

  const segments: Segment[] = [
    {
      id: "negados",
      name: "Negados",
      description: "Clientes não aprovados",
      customers: negados,
    },
    {
      id: "aprovados-nao-ativados",
      name: "Aprovados Não Ativados",
      description: "Clientes aprovados que ainda não usaram o crédito",
      customers: aprovadosNaoAtivados,
    },
    {
      id: "high-value",
      name: "High Value",
      description: "Clientes com alto nível de uso e limite elevado",
      customers: highValue,
    },
    {
      id: "potencial",
      name: "Potencial",
      description: "Clientes com bom perfil de crédito, mas baixa recorrência",
      customers: potencial,
    },
    {
      id: "recorrentes",
      name: "Recorrentes",
      description: "Clientes com uso consistente do crédito",
      customers: recorrentes,
    },
  ];

  return segments.filter((s) => s.customers.length > 0);
}

// Calculate metrics for each segment
export function calculateSegmentMetrics(segments: Segment[], totalClientes: number): SegmentMetrics[] {
  return segments.map((segment) => {
    const compras = segment.customers.map((c) => parseNumericField(c["Qtd de Compras"]) || 0);
    const limites = segment.customers.map((c) => parseNumericField(c["Limite Total"]) || 0);
    const scores = segment.customers.map((c) => parseNumericField(c["Score"]) || 0);
    const taxas = segment.customers.map((c) => parseNumericField(c["Taxa de Juros"]) || 0);

    const comApp = segment.customers.filter(
      (c) => String(c["App"] || "").toLowerCase() === "sim"
    ).length;
    const comAumento = segment.customers.filter(
      (c) => String(c["Aumento Limite"] || "").toLowerCase() === "sim"
    ).length;

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      totalClientes: segment.customers.length,
      percentageOfBase: calculatePercentage(segment.customers.length, totalClientes),
      avgCompras: calculateAverage(compras),
      avgLimite: calculateAverage(limites),
      avgScore: calculateAverage(scores),
      avgTaxaJuros: calculateAverage(taxas),
      percentageComApp: calculatePercentage(comApp, segment.customers.length),
      percentageComAumento: calculatePercentage(comAumento, segment.customers.length),
    };
  });
}

// Generate insights based on segment metrics
export function generateSegmentInsights(
  metrics: SegmentMetrics[],
  _thresholds: SegmentationThresholds | null
): string[] {
  const insights: string[] = [];

  const negados = metrics.find((m) => m.segmentId === "negados");
  const aprovadosNaoAtivados = metrics.find((m) => m.segmentId === "aprovados-nao-ativados");
  const highValue = metrics.find((m) => m.segmentId === "high-value");
  const recorrentes = metrics.find((m) => m.segmentId === "recorrentes");

  // Insight 1: Base concentration
  const totalBase = metrics.reduce((sum, m) => sum + m.totalClientes, 0);
  const notActivatedPct = aprovadosNaoAtivados
    ? (aprovadosNaoAtivados.totalClientes / totalBase) * 100
    : 0;

  if (notActivatedPct > 80) {
    insights.push(
      `Base altamente concentrada em clientes não ativados (~${Math.round(notActivatedPct)}%)`
    );
  }

  // Insight 2: Retenção
  if (recorrentes && recorrentes.avgCompras > 2) {
    insights.push("Forte retenção após primeira compra (clientes recorrentes têm alta continuidade)");
  }

  // Insight 3: Oportunidade de crescimento
  if (aprovadosNaoAtivados && aprovadosNaoAtivados.totalClientes > 0) {
    insights.push(
      "Clientes aprovados não ativados representam a principal oportunidade de crescimento"
    );
  }

  return insights;
}

// Calculate purchase distribution
export function calculatePurchaseDistribution(clientesData: ClienteRow[]): PurchaseDistribution[] {
  if (!clientesData || clientesData.length === 0) return [];

  const distribution = {
    0: 0,
    1: 0,
    2: 0,
    "3+": 0,
  };

  clientesData.forEach((cliente) => {
    const compras = parseNumericField(cliente["Qtd de Compras"]) || 0;

    if (compras === 0) distribution[0]++;
    else if (compras === 1) distribution[1]++;
    else if (compras === 2) distribution[2]++;
    else distribution["3+"]++;
  });

  const total = clientesData.length;
  return [
    {
      range: "0 compras",
      count: distribution[0],
      percentage: calculatePercentage(distribution[0], total),
    },
    {
      range: "1 compra",
      count: distribution[1],
      percentage: calculatePercentage(distribution[1], total),
    },
    {
      range: "2 compras",
      count: distribution[2],
      percentage: calculatePercentage(distribution[2], total),
    },
    {
      range: "3+ compras",
      count: distribution["3+"],
      percentage: calculatePercentage(distribution["3+"], total),
    },
  ];
}

// Calculate comparison by purchase groups
export function calculatePurchaseGroupComparison(clientesData: ClienteRow[]): PurchaseGroupComparison[] {
  if (!clientesData || clientesData.length === 0) return [];

  const groups: Record<string, ClienteRow[]> = {
    "0 compras": [],
    "1 compra": [],
    "2+ compras": [],
  };

  clientesData.forEach((cliente) => {
    const compras = parseNumericField(cliente["Qtd de Compras"]) || 0;

    if (compras === 0) groups["0 compras"].push(cliente);
    else if (compras === 1) groups["1 compra"].push(cliente);
    else groups["2+ compras"].push(cliente);
  });

  return Object.entries(groups)
    .filter(([, customers]) => customers.length > 0)
    .map(([group, customers]) => {
      const limites = customers.map((c) => parseNumericField(c["Limite Total"]) || 0);
      const scores = customers.map((c) => parseNumericField(c["Score"]) || 0);
      const compras = customers.map((c) => parseNumericField(c["Qtd de Compras"]) || 0);
      const taxas = customers.map((c) => parseNumericField(c["Taxa de Juros"]) || 0);

      const comApp = customers.filter(
        (c) => String(c["App"] || "").toLowerCase() === "sim"
      ).length;
      const comAumento = customers.filter(
        (c) => String(c["Aumento Limite"] || "").toLowerCase() === "sim"
      ).length;

      return {
        group,
        count: customers.length,
        avgLimite: calculateAverage(limites),
        avgScore: calculateAverage(scores),
        avgCompras: calculateAverage(compras),
        avgTaxaJuros: calculateAverage(taxas),
        percentageComApp: calculatePercentage(comApp, customers.length),
        percentageComAumento: calculatePercentage(comAumento, customers.length),
      };
    });
}
