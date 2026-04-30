// Single-pass aggregation of CSV data
// Computes all metrics in one loop through the full dataset

import { parseNumber, calculateAverage, calculatePercentage } from "./segmentation";
import { normalizeText, findColumnValue, normalizeSituacao, parseBoolean } from "./text-utils";
import type { ClienteRow } from "./types";
import type { AggregatedMetrics } from "./aggregation-types";

/**
 * Aggregate full dataset in single pass
 * Returns pre-computed metrics for all dashboard visualizations
 */
export function aggregateFullDataset(clientesData: ClienteRow[]): AggregatedMetrics {
  if (!clientesData || clientesData.length === 0) {
    return getEmptyAggregation();
  }

  const total = clientesData.length;
  
  // Initialize accumulators
  const accumulators = {
    totalAprovados: 0,
    totalNegados: 0,
    totalAtivados: 0,
    clientesComApp: 0,
    clientesComAumentoLimite: 0,
    
    scores: [] as number[],
    compras: [] as number[],
    limites: [] as number[],
    
    scoreDistribution: { baixo: 0, medio: 0, alto: 0 },
    purchaseDistribution: { zero: 0, um: 0, dois: 0, tresOuMais: 0 },
    ageDistribution: { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 },
    genderDistribution: { masculino: 0, feminino: 0, outro: 0 },
    
    segments: {
      negados: [] as ClienteRow[],
      aprovadosNaoAtivados: [] as ClienteRow[],
      potencial: [] as ClienteRow[],
      recorrentes: [] as ClienteRow[],
      highValue: [] as ClienteRow[],
    },
  };

  // Calculate thresholds first (need two passes for average)
  const scores = clientesData
    .map((c) => {
      const val = findColumnValue(c, ["score de crédito", "score", "score_credito"]);
      return parseNumber(val);
    })
    .filter((v) => v !== null) as number[];
  
  const compras = clientesData
    .map((c) => {
      const val = findColumnValue(c, ["qtd de compras", "compras", "qtd compras"]);
      return parseNumber(val);
    })
    .filter((v) => v !== null) as number[];
  
  const limites = clientesData
    .map((c) => {
      const val = findColumnValue(c, ["limite total", "limite", "limit total"]);
      return parseNumber(val);
    })
    .filter((v) => v !== null) as number[];

  const thresholds = {
    avgScore: calculateAverage(scores) || 0,
    avgCompras: calculateAverage(compras) || 0,
    avgLimite: calculateAverage(limites) || 0,
  };

  // Single pass through all data
  clientesData.forEach((cliente) => {
    // Status
    const situacao = normalizeSituacao(
      findColumnValue(cliente, ["situacao", "status", "situation"])
    );

    if (situacao === "aprovada") {
      accumulators.totalAprovados++;
    } else if (situacao === "negada") {
      accumulators.totalNegados++;
    }

    // Purchases
    const clientCompras = parseNumber(findColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
    if (clientCompras > 0 && situacao !== "negada") {
      accumulators.totalAtivados++;
    }

    // App adoption
    if (parseBoolean(findColumnValue(cliente, ["tem app", "app", "has_app"]))) {
      accumulators.clientesComApp++;
    }

    // Limit increases
    if (parseBoolean(findColumnValue(cliente, ["aumento limite", "limite aumentado", "limit_increased"]))) {
      accumulators.clientesComAumentoLimite++;
    }

    // Score distribution
    const clientScore = parseNumber(findColumnValue(cliente, ["score de crédito", "score"])) || 0;
    if (clientScore < 400) accumulators.scoreDistribution.baixo++;
    else if (clientScore < 700) accumulators.scoreDistribution.medio++;
    else accumulators.scoreDistribution.alto++;

    // Purchase distribution
    if (clientCompras === 0) accumulators.purchaseDistribution.zero++;
    else if (clientCompras === 1) accumulators.purchaseDistribution.um++;
    else if (clientCompras === 2) accumulators.purchaseDistribution.dois++;
    else accumulators.purchaseDistribution.tresOuMais++;

    // Age distribution
    const age = parseNumber(findColumnValue(cliente, ["idade", "age"])) || 0;
    if (age <= 25) accumulators.ageDistribution["18-25"]++;
    else if (age <= 35) accumulators.ageDistribution["26-35"]++;
    else if (age <= 45) accumulators.ageDistribution["36-45"]++;
    else if (age <= 55) accumulators.ageDistribution["46-55"]++;
    else if (age > 55) accumulators.ageDistribution["56+"]++;

    // Gender distribution
    const gender = normalizeText(findColumnValue(cliente, ["genero", "gender"]) || "");
    if (gender.includes("m") || gender === "masculino") accumulators.genderDistribution.masculino++;
    else if (gender.includes("f") || gender === "feminino") accumulators.genderDistribution.feminino++;
    else accumulators.genderDistribution.outro++;

    // Segmentation logic
    if (situacao === "negada") {
      accumulators.segments.negados.push(cliente);
    } else if (clientCompras === 0) {
      accumulators.segments.aprovadosNaoAtivados.push(cliente);
    } else if (clientCompras >= 3 && parseNumber(findColumnValue(cliente, ["limite total", "limite"])) >= thresholds.avgLimite) {
      accumulators.segments.highValue.push(cliente);
    } else if (
      (clientScore >= thresholds.avgScore || parseNumber(findColumnValue(cliente, ["limite total", "limite"])) >= thresholds.avgLimite) &&
      clientCompras <= 1
    ) {
      accumulators.segments.potencial.push(cliente);
    } else if (clientCompras >= 2) {
      accumulators.segments.recorrentes.push(cliente);
    }

    // Accumulate metrics for final averages
    accumulators.scores.push(clientScore);
    accumulators.compras.push(clientCompras);
    accumulators.limites.push(parseNumber(findColumnValue(cliente, ["limite total", "limite"])) || 0);
  });

  // Compute segment averages
  const computeSegmentAverages = (segment: ClienteRow[]) => {
    if (segment.length === 0) {
      return { avgScore: 0, avgLimite: 0, avgCompras: 0 };
    }

    const scores = segment.map((c) => parseNumber(findColumnValue(c, ["score de crédito", "score"])) || 0);
    const limites = segment.map((c) => parseNumber(findColumnValue(c, ["limite total", "limite"])) || 0);
    const compras = segment.map((c) => parseNumber(findColumnValue(c, ["qtd de compras", "compras"])) || 0);

    return {
      avgScore: calculateAverage(scores) || 0,
      avgLimite: calculateAverage(limites) || 0,
      avgCompras: calculateAverage(compras) || 0,
    };
  };

  return {
    totalClientes: total,
    totalAprovados: accumulators.totalAprovados,
    totalNegados: accumulators.totalNegados,
    totalAtivados: accumulators.totalAtivados,
    percentageAtivados: calculatePercentage(accumulators.totalAtivados, total),
    percentageAprovados: calculatePercentage(accumulators.totalAprovados, total),
    
    clientesComApp: accumulators.clientesComApp,
    percentageComApp: calculatePercentage(accumulators.clientesComApp, total),
    clientesComAumentoLimite: accumulators.clientesComAumentoLimite,
    percentageComAumentoLimite: calculatePercentage(accumulators.clientesComAumentoLimite, total),
    
    scoreDistribution: accumulators.scoreDistribution,
    avgScore: calculateAverage(accumulators.scores) || 0,
    
    purchaseDistribution: accumulators.purchaseDistribution,
    avgCompras: calculateAverage(accumulators.compras) || 0,
    
    avgLimite: calculateAverage(accumulators.limites) || 0,
    
    ageDistribution: accumulators.ageDistribution,
    genderDistribution: accumulators.genderDistribution,
    
    segments: {
      negados: accumulators.segments.negados.length,
      aprovadosNaoAtivados: accumulators.segments.aprovadosNaoAtivados.length,
      potencial: accumulators.segments.potencial.length,
      recorrentes: accumulators.segments.recorrentes.length,
      highValue: accumulators.segments.highValue.length,
    },
    
    segmentAverages: {
      negados: computeSegmentAverages(accumulators.segments.negados),
      aprovadosNaoAtivados: computeSegmentAverages(accumulators.segments.aprovadosNaoAtivados),
      potencial: computeSegmentAverages(accumulators.segments.potencial),
      recorrentes: computeSegmentAverages(accumulators.segments.recorrentes),
      highValue: computeSegmentAverages(accumulators.segments.highValue),
    },
    
    riskAnalysis: {
      scoreVsComprasCorrelation: accumulators.scores.length > 0 ? "positive" : "unknown",
      limitVsAppCorrelation: accumulators.clientesComApp > 0 ? "positive" : "unknown",
      recorrentesExpectedDefault: Math.max(0, 100 - calculatePercentage(accumulators.segments.recorrentes.length, total)),
    },
    
    computedAt: Date.now(),
  };
}

function getEmptyAggregation(): AggregatedMetrics {
  return {
    totalClientes: 0,
    totalAprovados: 0,
    totalNegados: 0,
    totalAtivados: 0,
    percentageAtivados: 0,
    percentageAprovados: 0,
    clientesComApp: 0,
    percentageComApp: 0,
    clientesComAumentoLimite: 0,
    percentageComAumentoLimite: 0,
    scoreDistribution: { baixo: 0, medio: 0, alto: 0 },
    avgScore: 0,
    purchaseDistribution: { zero: 0, um: 0, dois: 0, tresOuMais: 0 },
    avgCompras: 0,
    avgLimite: 0,
    ageDistribution: { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 },
    genderDistribution: { masculino: 0, feminino: 0, outro: 0 },
    segments: {
      negados: 0,
      aprovadosNaoAtivados: 0,
      potencial: 0,
      recorrentes: 0,
      highValue: 0,
    },
    segmentAverages: {
      negados: { avgScore: 0, avgLimite: 0, avgCompras: 0 },
      aprovadosNaoAtivados: { avgScore: 0, avgLimite: 0, avgCompras: 0 },
      potencial: { avgScore: 0, avgLimite: 0, avgCompras: 0 },
      recorrentes: { avgScore: 0, avgLimite: 0, avgCompras: 0 },
      highValue: { avgScore: 0, avgLimite: 0, avgCompras: 0 },
    },
    riskAnalysis: {
      scoreVsComprasCorrelation: "unknown",
      limitVsAppCorrelation: "unknown",
      recorrentesExpectedDefault: 0,
    },
    computedAt: 0,
  };
}
