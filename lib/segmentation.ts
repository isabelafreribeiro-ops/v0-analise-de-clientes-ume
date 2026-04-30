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

// Helper: parse date to Date object
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  // Try parsing ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try DD/MM/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// Calculate average values for a subset of customers
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

  const avgCompras = clientes.reduce((sum, c) => sum + (c["Qtd de Compras"] || 0), 0) / clientes.length;
  const avgLimite = clientes.reduce((sum, c) => sum + (c["Limite Total"] || 0), 0) / clientes.length;
  const avgScore = clientes.reduce((sum, c) => sum + (c["Score de Crédito"] || 0), 0) / clientes.length;
  const avgTaxaJuros = clientes.reduce((sum, c) => sum + (c["Taxa de Juros Média (ao mês)"] || 0), 0) / clientes.length;
  
  const comApp = clientes.filter((c) => c["Tem App?"]?.toLowerCase() === "sim" || c["Tem App?"] === "1").length;
  const percentageComApp = (comApp / clientes.length) * 100;
  
  const comAumento = clientes.filter((c) => c["Já teve Aumento de limite?"]?.toLowerCase() === "sim" || c["Já teve Aumento de limite?"] === "1").length;
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

// Main segmentation function
export function segmentarClientes(clientes: ClienteRow[]): Segment[] {
  if (!clientes || clientes.length === 0) {
    return [];
  }

  // Calculate base averages
  const baseAverages = calculateAverages(clientes);

  const segments: Segment[] = [];

  // 1. High Value: Qtd de Compras > 2, Limite acima da média, Taxa acima da média
  const highValue = clientes.filter(
    (c) =>
      (c["Qtd de Compras"] || 0) > 2 &&
      (c["Limite Total"] || 0) > baseAverages.avgLimite &&
      (c["Taxa de Juros Média (ao mês)"] || 0) > baseAverages.avgTaxaJuros
  );
  segments.push({
    id: "high-value",
    name: "High Value",
    description: "Clientes com alto volume de compras e limite elevado",
    customers: highValue,
  });

  // 2. Potencial Alto: Score acima da média, Limite acima da média, Qtd Compras <= 2
  const potentialAlto = clientes.filter(
    (c) =>
      (c["Score de Crédito"] || 0) > baseAverages.avgScore &&
      (c["Limite Total"] || 0) > baseAverages.avgLimite &&
      (c["Qtd de Compras"] || 0) <= 2
  );
  segments.push({
    id: "potencial-alto",
    name: "Potencial Alto",
    description: "Clientes com bom score mas baixa atividade",
    customers: potentialAlto,
  });

  // 3. Aprovados Não Ativados: Situação != "Negada", Qtd Compras = 0
  const aprovadosNaoAtivados = clientes.filter(
    (c) =>
      (c["Situação"]?.toLowerCase() !== "negada" || !c["Situação"]) &&
      (c["Qtd de Compras"] || 0) === 0
  );
  segments.push({
    id: "aprovados-nao-ativados",
    name: "Aprovados Não Ativados",
    description: "Clientes aprovados que ainda não compraram",
    customers: aprovadosNaoAtivados,
  });

  // 4. Recorrentes Leves: Qtd Compras entre 1 e 2
  const recurrentesLeves = clientes.filter(
    (c) => {
      const qtd = c["Qtd de Compras"] || 0;
      return qtd >= 1 && qtd <= 2;
    }
  );
  segments.push({
    id: "recorrentes-leves",
    name: "Recorrentes Leves",
    description: "Clientes com 1-2 compras",
    customers: recurrentesLeves,
  });

  // 5. Baixo Valor: Qtd Compras = 1, Limite abaixo da média
  const baixoValor = clientes.filter(
    (c) =>
      (c["Qtd de Compras"] || 0) === 1 &&
      (c["Limite Total"] || 0) < baseAverages.avgLimite
  );
  segments.push({
    id: "baixo-valor",
    name: "Baixo Valor",
    description: "Clientes com pouquíssimo volume e limite reduzido",
    customers: baixoValor,
  });

  // 6. Negados: Situação = "Negada"
  const negados = clientes.filter((c) => c["Situação"]?.toLowerCase() === "negada");
  segments.push({
    id: "negados",
    name: "Negados",
    description: "Clientes que tiveram solicitação rejeitada",
    customers: negados,
  });

  return segments;
}

// Calculate metrics for all segments
export function calculateSegmentMetrics(segments: Segment[]): SegmentMetrics[] {
  const totalClientes = segments.reduce((sum, s) => sum + s.customers.length, 0);

  return segments.map((segment) => {
    const avgs = calculateAverages(segment.customers);

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      totalClientes: segment.customers.length,
      percentageOfBase: totalClientes > 0 ? (segment.customers.length / totalClientes) * 100 : 0,
      avgCompras: avgs.avgCompras,
      avgLimite: avgs.avgLimite,
      avgScore: avgs.avgScore,
      avgTaxaJuros: avgs.avgTaxaJuros,
      percentageComApp: avgs.percentageComApp,
      percentageComAumento: avgs.percentageComAumento,
    };
  });
}

// Generate business insights from segments
export function generateSegmentInsights(metrics: SegmentMetrics[]): string[] {
  const insights: string[] = [];

  // Sort by size
  const bySize = [...metrics].sort((a, b) => b.totalClientes - a.totalClientes);

  // Insight 1: Largest segment opportunity
  if (bySize.length > 0) {
    const largest = bySize[0];
    insights.push(
      `"${largest.segmentName}" é o maior segmento com ${largest.totalClientes} clientes (${largest.percentageOfBase.toFixed(1)}% da base).`
    );
  }

  // Insight 2: Aprovados não ativados opportunity
  const aprovadosNaoAtivados = metrics.find((m) => m.segmentId === "aprovados-nao-ativados");
  if (aprovadosNaoAtivados && aprovadosNaoAtivados.totalClientes > 0) {
    insights.push(
      `"Aprovados Não Ativados" representam ${aprovadosNaoAtivados.percentageOfBase.toFixed(1)}% da base e são uma grande oportunidade de crescimento.`
    );
  }

  // Insight 3: High value concentration
  const highValue = metrics.find((m) => m.segmentId === "high-value");
  if (highValue && highValue.totalClientes > 0) {
    insights.push(
      `Clientes "High Value" concentram o maior potencial de receita com limite médio de R$ ${highValue.avgLimite.toLocaleString("pt-BR")}.`
    );
  }

  // Insight 4: App adoption correlation
  const appAdopters = metrics.filter((m) => m.percentageComApp > 50);
  if (appAdopters.length > 0) {
    const avgEngagement = appAdopters.reduce((sum, m) => sum + m.avgCompras, 0) / appAdopters.length;
    insights.push(
      `Segmentos com alta adoção de app (${appAdopters[0].percentageComApp.toFixed(0)}%+) mostram ${avgEngagement.toFixed(1)} compras em média.`
    );
  }

  // Insight 5: Negados volume
  const negados = metrics.find((m) => m.segmentId === "negados");
  if (negados && negados.totalClientes > 0) {
    insights.push(`${negados.totalClientes} clientes foram negados, representando oportunidade de revisão de política.`);
  }

  return insights.slice(0, 3); // Return top 3 insights
}
