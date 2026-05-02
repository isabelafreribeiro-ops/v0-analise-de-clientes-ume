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

export interface GlobalMetrics {
  totalClientes: number;
  totalAprovados: number;
  totalNegados: number;
  totalAtivados: number;
  taxaAprovacao: number; // clientes com Situação ∈ {Adimplente, Inadimplente} / total
  taxaAtivacao: number; // aprovados com Qtd de Compras > 0 / total de aprovados
  scoreMediaGeral: number; // média de "Score de Crédito" em todas as linhas
  scoreMediaAprovados: number; // média filtrando Situação ∈ {Adimplente, Inadimplente}
  appAdoptionGeral: number; // "Tem App?" = "Sim" / total
  appAdoptionAprovados: number; // "Tem App?" = "Sim" / aprovados
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

// Safe numeric parsing - returns null for invalid/missing values
export function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();

    // Handle empty, dash, NaN strings
    if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "nan") {
      return null;
    }

    // Remove currency symbol
    let cleaned = trimmed.replace(/R\$\s?/g, "");

    // Detectar e remover sinal de porcentagem (taxa "8,16%" → 0.0816)
    const isPercent = cleaned.includes("%");
    cleaned = cleaned.replace(/%/g, "").trim();

    // Handle Brazilian number format: "1.234,56" → convert to 1234.56
    if (cleaned.includes(",")) {
      // Formato BR com decimal: "1.234,56" → 1234.56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      // Inteiro com separador de milhar BR: "1.500" → 1500, "12.345" → 12345
      cleaned = cleaned.replace(/\./g, "");
    }
    // Senão: deixa como está (decimal anglo "1.5" ou inteiro "1500")

    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return null;
    return isPercent ? parsed / 100 : parsed;
  }

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  return null;
}

// Parse boolean from CSV with proper Unicode normalization (handles "sim", "Não", true, 1, etc.)
export function parseBoolean(value: any): boolean {
  if (!value) return false;

  const v = String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, ""); // Remove all spaces

  return ["sim", "true", "1", "yes", "s", "y"].includes(v);
}

// Parse rejection (opposite of boolean for "Tem App?" logic)
export function hasRejected(value: any): boolean {
  if (!value) return false;
  let v = String(value).toLowerCase().trim();
  // Normalize accents
  v = v.replace(/ã/g, "a").replace(/ç/g, "c");
  return v === "nao" || v === "false" || v === "0" || v === "no";
}

// Normalize "Situação" field for consistent comparison
export function normalizeSituacao(value: any): "aprovada" | "negada" | "unknown" {
  if (!value) return "unknown";
  
  let v = String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "");

  // Map variations to standard values
  if (v.includes("negada") || v.includes("nao") || v.includes("rejeitada") || v.includes("rejected")) {
    return "negada";
  }
  
  if (v.includes("aprovada") || v.includes("approved") || v.includes("ativa")) {
    return "aprovada";
  }

  return "unknown";
}

// Filter valid numbers from array (removes null, undefined, NaN)
export function filterValidNumbers(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
}

// Format number to Brazilian locale (e.g., 1234.56 → 1.234,56)
export function formatBRNumber(value: number | null): string {
  if (value === null) return "—";
  
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatted;
}

// Normalize CSV header names for consistent access
export function normalizeHeaders<T extends Record<string, any>>(row: T): T {
  const normalized: Record<string, any> = {};

  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const normalizedKey = key.trim().toLowerCase();
      normalized[normalizedKey] = row[key];
    }
  }

  return normalized as T;
}

// Safe accessor for CSV columns with multiple possible names
export function getColumnValue(
  row: any,
  possibleNames: string[]
): string | number | boolean | null {
  const normalized = normalizeHeaders(row);

  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim();
    if (normalizedName in normalized) {
      return normalized[normalizedName];
    }
  }

  return null;
}

// Calculate average from array, ignoring nulls
export function calculateAverage(values: (number | null)[]): number | null {
  const valid = values.filter((v) => v !== null) as number[];
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Calculate percentage
export function calculatePercentage(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

// Calculate thresholds for behavior-driven segmentation
export function calculateThresholds(clientesData: ClienteRow[]): SegmentationThresholds {
  if (!clientesData || clientesData.length === 0) {
    return { avgCompras: 0, avgLimite: 0, avgScore: 0 };
  }

  // Use sample for large datasets (> 50k) to avoid performance issues
  const dataToAnalyze = sampleDataForAnalysis(clientesData, 50000);

  // Map column names for safe access
  const compras = dataToAnalyze.map((c) => {
    const val = getColumnValue(c, ["qtd de compras", "compras", "qtd compras", "numero de compras"]);
    return parseNumber(val);
  });

  const limites = dataToAnalyze.map((c) => {
    const val = getColumnValue(c, ["limite total", "limite", "limit total", "limite_total"]);
    return parseNumber(val);
  });

  const scores = dataToAnalyze.map((c) => {
    const val = getColumnValue(c, ["score de crédito", "score", "score_credito", "credit score"]);
    return parseNumber(val);
  });

  return {
    avgCompras: calculateAverage(compras) || 0,
    avgLimite: calculateAverage(limites) || 0,
    avgScore: calculateAverage(scores) || 0,
  };
}

// Sample data for large datasets - maintains statistical representativeness
function sampleDataForAnalysis(
  data: ClienteRow[],
  maxSize: number = 50000
): ClienteRow[] {
  if (data.length <= maxSize) {
    return data;
  }

  // Stratified random sampling
  const sampleRate = maxSize / data.length;
  const sampled: ClienteRow[] = [];

  for (let i = 0; i < data.length; i++) {
    if (Math.random() < sampleRate) {
      sampled.push(data[i]);
    }
  }

  return sampled.length > 0 ? sampled : [data[0]];
}

// Segment customers using behavior-driven rules
export function segmentarClientes(clientesData: ClienteRow[]): Segment[] {
  if (!clientesData || clientesData.length === 0) {
    return [];
  }

  // Use sample for large datasets to avoid performance issues
  const dataToAnalyze = sampleDataForAnalysis(clientesData, 50000);
  const thresholds = calculateThresholds(dataToAnalyze);

  const negados: ClienteRow[] = [];
  const aprovadosNaoAtivados: ClienteRow[] = [];
  const potencial: ClienteRow[] = [];
  const recorrentes: ClienteRow[] = [];
  const highValue: ClienteRow[] = [];

  // Segment using the sample data
  dataToAnalyze.forEach((cliente) => {
    const situacaoRaw = getColumnValue(cliente, ["situacao", "status", "situation"]);
    const situacao = normalizeSituacao(situacaoRaw);
    const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])) || 0;
    const limite = parseNumber(getColumnValue(cliente, ["limite total", "limite", "limit total"])) || 0;
    const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score", "score_credito"])) || 0;

    // Rule 1: Negados
    if (situacao === "negada") {
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
    const compras = segment.customers.map((c) =>
      parseNumber(getColumnValue(c, ["qtd de compras", "compras", "qtd compras"]))
    );
    const limites = segment.customers.map((c) =>
      parseNumber(getColumnValue(c, ["limite total", "limite", "limit total"]))
    );
    const scores = segment.customers.map((c) =>
      parseNumber(getColumnValue(c, ["score de crédito", "score", "score_credito"]))
    );
    const taxas = segment.customers.map((c) =>
      parseNumber(getColumnValue(c, ["taxa de juros média (ao mês)", "taxa de juros", "taxa juros", "interest rate"]))
    );

    const comApp = segment.customers.filter((c) =>
      parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app", "has app"]))
    ).length;

    const comAumento = segment.customers.filter((c) =>
      parseBoolean(getColumnValue(c, ["aumento limite", "limite aumentado", "limit increase"]))
    ).length;

    const avgComprasVal = calculateAverage(compras) || 0;
    const avgLimiteVal = calculateAverage(limites) || 0;
    const avgScoreVal = calculateAverage(scores) || 0;
    const avgTaxaVal = calculateAverage(taxas) || 0;

    return {
      segmentId: segment.id,
      segmentName: segment.name,
      totalClientes: segment.customers.length,
      percentageOfBase: calculatePercentage(segment.customers.length, totalClientes),
      avgCompras: avgComprasVal,
      avgLimite: avgLimiteVal,
      avgScore: avgScoreVal,
      avgTaxaJuros: avgTaxaVal,
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

  // Use sample for large datasets
  const dataToAnalyze = sampleDataForAnalysis(clientesData, 50000);

  const distribution = {
    0: 0,
    1: 0,
    2: 0,
    "3+": 0,
  };

  dataToAnalyze.forEach((cliente) => {
    const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])) || 0;

    if (compras === 0) distribution[0]++;
    else if (compras === 1) distribution[1]++;
    else if (compras === 2) distribution[2]++;
    else distribution["3+"]++;
  });

  const total = dataToAnalyze.length;
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

  // HEADCOUNT: usar base completa para contagem real
  const fullGroups: Record<string, ClienteRow[]> = {
    "0 compras": [],
    "1 compra": [],
    "2+ compras": [],
  };

  clientesData.forEach((cliente) => {
    const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])) || 0;
    if (compras === 0) fullGroups["0 compras"].push(cliente);
    else if (compras === 1) fullGroups["1 compra"].push(cliente);
    else fullGroups["2+ compras"].push(cliente);
  });

  // MÉTRICAS QUALITATIVAS: usar sample para performance
  const sampleGroups: Record<string, ClienteRow[]> = {
    "0 compras": [],
    "1 compra": [],
    "2+ compras": [],
  };

  const dataToAnalyze = sampleDataForAnalysis(clientesData, 50000);
  dataToAnalyze.forEach((cliente) => {
    const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])) || 0;
    if (compras === 0) sampleGroups["0 compras"].push(cliente);
    else if (compras === 1) sampleGroups["1 compra"].push(cliente);
    else sampleGroups["2+ compras"].push(cliente);
  });

  return Object.entries(fullGroups)
    .filter(([, customers]) => customers.length > 0)
    .map(([group, customers]) => {
      // customers = grupo completo (para headcount)
      // sampleCustomers = sample do grupo (para médias)
      const sampleCustomers = sampleGroups[group] || [];
      // Usar sampleCustomers para calcular médias (performance)
      const limites = sampleCustomers.map((c) =>
        parseNumber(getColumnValue(c, ["limite total", "limite", "limit total"]))
      );
      const scores = sampleCustomers.map((c) =>
        parseNumber(getColumnValue(c, ["score de crédito", "score", "score_credito"]))
      );
      const comprasArr = sampleCustomers.map((c) =>
        parseNumber(getColumnValue(c, ["qtd de compras", "compras", "qtd compras"]))
      );
      const taxas = sampleCustomers.map((c) =>
        parseNumber(getColumnValue(c, ["taxa de juros média (ao mês)", "taxa de juros", "taxa juros", "interest rate"]))
      );

      const comApp = sampleCustomers.filter((c) =>
        parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app", "has app"]))
      ).length;

      const comAumento = sampleCustomers.filter((c) =>
        parseBoolean(getColumnValue(c, ["aumento limite", "limite aumentado", "limit increase"]))
      ).length;

      return {
        group,
        count: customers.length, // HEADCOUNT: base completa
        avgLimite: calculateAverage(limites) || 0,
        avgScore: calculateAverage(scores) || 0,
        avgCompras: calculateAverage(comprasArr) || 0,
        avgTaxaJuros: calculateAverage(taxas) || 0,
        percentageComApp: calculatePercentage(comApp, sampleCustomers.length), // % sobre sample
        percentageComAumento: calculatePercentage(comAumento, sampleCustomers.length),
      };
    });
}

// Calculate proxy de valor: Qtd Compras × N. Médio Parcelas × Taxa Juros × Limite Total
export function calculateProxyDeValor(cliente: ClienteRow): number | null {
  const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
  const parcelas = parseNumber(getColumnValue(cliente, ["n. médio de parcelas", "num medio parcelas", "n parcelas"])) || 1;
  const taxa = parseNumber(getColumnValue(cliente, ["taxa de juros média (ao mês)", "taxa juros", "taxa"])) || 0;
  const limite = parseNumber(getColumnValue(cliente, ["limite total", "limite"])) || 0;

  if (compras === 0 || limite === 0) return null;
  return compras * parcelas * taxa * limite;
}

// Distribution by age groups
export interface AgeDistribution {
  group: string;
  count: number;
  percentage: number;
}

export function calculateAgeDistribution(clientesData: ClienteRow[]): AgeDistribution[] {
  if (!clientesData || clientesData.length === 0) return [];

  const groups = {
    "<25": 0,
    "25-35": 0,
    "35-50": 0,
    "50+": 0,
  };

  clientesData.forEach((c) => {
    const age = parseNumber(getColumnValue(c, ["idade", "age"])) || 0;
    if (age < 25) groups["<25"]++;
    else if (age < 35) groups["25-35"]++;
    else if (age < 50) groups["35-50"]++;
    else groups["50+"]++;
  });

  const total = clientesData.length;
  return [
    { group: "< 25 anos", count: groups["<25"], percentage: calculatePercentage(groups["<25"], total) },
    { group: "25 - 35 anos", count: groups["25-35"], percentage: calculatePercentage(groups["25-35"], total) },
    { group: "35 - 50 anos", count: groups["35-50"], percentage: calculatePercentage(groups["35-50"], total) },
    { group: "50+ anos", count: groups["50+"], percentage: calculatePercentage(groups["50+"], total) },
  ];
}

// Gender distribution
export interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

export function calculateGenderDistribution(clientesData: ClienteRow[]): GenderDistribution[] {
  if (!clientesData || clientesData.length === 0) return [];

  const genders: Record<string, number> = {};

  clientesData.forEach((c) => {
    const sexo = String(getColumnValue(c, ["sexo", "gender"]) || "").trim().toUpperCase();
    genders[sexo] = (genders[sexo] || 0) + 1;
  });

  const total = clientesData.length;
  return Object.entries(genders)
    .map(([gender, count]) => ({
      gender: gender || "N/A",
      count,
      percentage: calculatePercentage(count, total),
    }))
    .sort((a, b) => b.count - a.count);
}

// Retailer count distribution
export interface RetailerDistribution {
  group: string;
  count: number;
  percentage: number;
}

export function calculateRetailerDistribution(clientesData: ClienteRow[]): RetailerDistribution[] {
  if (!clientesData || clientesData.length === 0) return [];

  const groups = {
    "0": 0,
    "1": 0,
    "2": 0,
    "3+": 0,
  };

  clientesData.forEach((c) => {
    const qty = parseNumber(getColumnValue(c, ["qtd de varejos que já comprou", "num varejos", "retailers"])) || 0;
    if (qty === 0) groups["0"]++;
    else if (qty === 1) groups["1"]++;
    else if (qty === 2) groups["2"]++;
    else groups["3+"]++;
  });

  const total = clientesData.length;
  return [
    { group: "0 varejos", count: groups["0"], percentage: calculatePercentage(groups["0"], total) },
    { group: "1 varejo", count: groups["1"], percentage: calculatePercentage(groups["1"], total) },
    { group: "2 varejos", count: groups["2"], percentage: calculatePercentage(groups["2"], total) },
    { group: "3+ varejos", count: groups["3+"], percentage: calculatePercentage(groups["3+"], total) },
  ];
}

// Cohort analysis by entry month
// Format date YYYY-MM to Portuguese format (e.g., "Jan/23")
export function formatMonthDisplay(dateStr: string): string {
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const parts = dateStr.split("-");
  if (parts.length !== 2) return dateStr;
  
  const month = parseInt(parts[1], 10);
  const year = parts[0].slice(-2);
  
  if (month < 1 || month > 12) return dateStr;
  return `${monthNames[month - 1]}/${year}`;
}

export interface CohortMetrics {
  month: string;
  monthDisplay: string;
  totalClientes: number;
  percentageAprovados: number;
  percentageAtivados: number;
  percentageRecorrentes: number;
  avgScore: number;
  avgLimite: number;
}

export function calculateCohortAnalysis(clientesData: ClienteRow[]): CohortMetrics[] {
  if (!clientesData || clientesData.length === 0) return [];

  const cohorts: Record<string, ClienteRow[]> = {};

  clientesData.forEach((c) => {
    const dataEntrada = String(getColumnValue(c, ["data de entrada na ume", "data entrada", "entry date"]) || "");
    if (dataEntrada) {
      const monthKey = dataEntrada.substring(0, 7); // Extract YYYY-MM
      if (!cohorts[monthKey]) cohorts[monthKey] = [];
      cohorts[monthKey].push(c);
    }
  });

  return Object.entries(cohorts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, customers]) => {
      const aprovados = customers.filter((c) => {
        const situacao = String(getColumnValue(c, ["situacao", "status"]) || "").toLowerCase();
        return situacao !== "negada";
      }).length;

      const ativados = customers.filter((c) => {
        const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
        return compras > 0;
      }).length;

      const recorrentes = customers.filter((c) => {
        const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
        return compras >= 2;
      }).length;

      const scores = customers.map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])));
      const limites = customers.map((c) => parseNumber(getColumnValue(c, ["limite total", "limite"])));

      return {
        month,
        monthDisplay: formatMonthDisplay(month),
        totalClientes: customers.length,
        percentageAprovados: calculatePercentage(aprovados, customers.length),
        percentageAtivados: calculatePercentage(ativados, customers.length),
        percentageRecorrentes: calculatePercentage(recorrentes, customers.length),
        avgScore: calculateAverage(scores) || 0,
        avgLimite: calculateAverage(limites) || 0,
      };
    });
}

// Pre-aggregated metrics for performance optimization
export interface AggregatedMetrics {
  totalClientes: number;
  totalAprovados: number;
  totalNegados: number;
  totalAtivados: number;
  percentageAtivados: number;
  percentageAprovados: number;
  segments: SegmentMetrics[];
  distributions: {
    purchases: PurchaseDistribution[];
    age: AgeDistribution[];
    gender: GenderDistribution[];
    retailers: RetailerDistribution[];
    purchaseGroups: PurchaseGroupComparison[];
  };
  insights: string[];
}

export function calculateAggregatedMetrics(clientesData: ClienteRow[]): AggregatedMetrics {
  if (!clientesData || clientesData.length === 0) {
    return {
      totalClientes: 0,
      totalAprovados: 0,
      totalNegados: 0,
      totalAtivados: 0,
      percentageAtivados: 0,
      percentageAprovados: 0,
      segments: [],
      distributions: {
        purchases: [],
        age: [],
        gender: [],
        retailers: [],
        purchaseGroups: [],
      },
      insights: [],
    };
  }

  // Calculate base metrics
  const totalClientes = clientesData.length;
  const totalAprovados = clientesData.filter((c) => {
    const situacao = normalizeSituacao(getColumnValue(c, ["situacao", "status"]));
    return situacao === "aprovada";
  }).length;
  const totalNegados = totalClientes - totalAprovados;
  const totalAtivados = clientesData.filter((c) => {
    const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
    return compras > 0;
  }).length;

  // Calculate segments and metrics
  const segments = segmentarClientes(clientesData);
  const segmentMetrics = calculateSegmentMetrics(segments, totalClientes);

  // Generate insights
  const thresholds = calculateThresholds(clientesData);
  const insights = generateSegmentInsights(segmentMetrics, thresholds);

  // Calculate all distributions
  const purchases = calculatePurchaseDistribution(clientesData);
  const age = calculateAgeDistribution(clientesData);
  const gender = calculateGenderDistribution(clientesData);
  const retailers = calculateRetailerDistribution(clientesData);
  const purchaseGroups = calculatePurchaseGroupComparison(clientesData);

  return {
    totalClientes,
    totalAprovados,
    totalNegados,
    totalAtivados,
    percentageAtivados: calculatePercentage(totalAtivados, totalClientes),
    percentageAprovados: calculatePercentage(totalAprovados, totalClientes),
    segments: segmentMetrics,
    distributions: {
      purchases,
      age,
      gender,
      retailers,
      purchaseGroups,
    },
    insights,
  };
}

// GLOBAL METRICS LAYER — Always operates on full dataset, never sampled
// Returns the canonical metrics used across all dashboard cards
export function calculateGlobalMetrics(clientesData: ClienteRow[]): GlobalMetrics {
  if (!clientesData || clientesData.length === 0) {
    return {
      totalClientes: 0,
      totalAprovados: 0,
      totalNegados: 0,
      totalAtivados: 0,
      taxaAprovacao: 0,
      taxaAtivacao: 0,
      scoreMediaGeral: 0,
      scoreMediaAprovados: 0,
      appAdoptionGeral: 0,
      appAdoptionAprovados: 0,
    };
  }

  const totalClientes = clientesData.length;

  // Approved = Situação ∈ {Adimplente, Inadimplente}
  const aprovados = clientesData.filter((c) => {
    const situacao = String(getColumnValue(c, ["situação", "situacao", "status"]) || "")
      .toLowerCase()
      .trim();
    return situacao === "adimplente" || situacao === "inadimplente";
  });

  const totalAprovados = aprovados.length;
  const totalNegados = totalClientes - totalAprovados;

  // Activated = Aprovados with Qtd de Compras > 0
  const totalAtivados = aprovados.filter((c) => {
    const compras = parseNumber(getColumnValue(c, ["qtd de compras", "compras"])) || 0;
    return compras > 0;
  }).length;

  // Taxa de Aprovação = approved / total
  const taxaAprovacao = calculatePercentage(totalAprovados, totalClientes);

  // Taxa de Ativação = activated / approved
  const taxaAtivacao = totalAprovados > 0 ? calculatePercentage(totalAtivados, totalAprovados) : 0;

  // Score Médio (geral) = average of all scores
  const allScores = clientesData
    .map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
    .filter((s) => s !== null && s !== 0) as number[];
  const scoreMediaGeral = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

  // Score Médio (aprovados) = average of scores for approved customers
  const aprovadosScores = aprovados
    .map((c) => parseNumber(getColumnValue(c, ["score de crédito", "score"])))
    .filter((s) => s !== null && s !== 0) as number[];
  const scoreMediaAprovados = aprovadosScores.length > 0 ? aprovadosScores.reduce((a, b) => a + b, 0) / aprovadosScores.length : 0;

  // App Adoption (geral) = "Tem App?" = "Sim" / total
  const comAppGeral = clientesData.filter((c) =>
    parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
  ).length;
  const appAdoptionGeral = calculatePercentage(comAppGeral, totalClientes);

  // App Adoption (aprovados) = "Tem App?" = "Sim" / approved
  const comAppAprovados = aprovados.filter((c) =>
    parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))
  ).length;
  const appAdoptionAprovados = totalAprovados > 0 ? calculatePercentage(comAppAprovados, totalAprovados) : 0;

  return {
    totalClientes,
    totalAprovados,
    totalNegados,
    totalAtivados,
    taxaAprovacao,
    taxaAtivacao,
    scoreMediaGeral,
    scoreMediaAprovados,
    appAdoptionGeral,
    appAdoptionAprovados,
  };
}
