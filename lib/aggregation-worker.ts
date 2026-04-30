import type { ClienteRow } from "./types";
import { parseBRNumber } from "./parse-utils";

export interface AggregationResult {
  totalClientes: number;
  totalAprovados: number;
  totalNegados: number;
  totalAtivados: number;
  percentageAprovados: number;
  percentageAtivados: number;
  percentageComApp: number;
  avgScore: number;
  avgCompras: number;
  avgLimite: number;
  percentageComAumentoLimite: number;
  purchaseDistribution: { zero: number; um: number; dois: number; tresOuMais: number };
  scoreDistribution: { alto: number; medio: number; baixo: number };
  segments: { negados: number; aprovadosNaoAtivados: number; potencial: number; recorrentes: number; highValue: number };
  segmentAverages: {
    negados: { avgScore: number; avgCompras: number; avgLimite: number };
    aprovadosNaoAtivados: { avgScore: number; avgCompras: number; avgLimite: number };
    potencial: { avgScore: number; avgCompras: number; avgLimite: number };
    recorrentes: { avgScore: number; avgCompras: number; avgLimite: number };
    highValue: { avgScore: number; avgCompras: number; avgLimite: number };
  };
}

const CHUNK_SIZE = 5000;

function normalizeText(str: string): string {
  if (!str) return "";
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
}

function getColumnValue(row: ClienteRow, possibleNames: string[]): any {
  const normalized = possibleNames.map((name) => normalizeText(name));
  for (const [key, value] of Object.entries(row)) {
    if (normalized.includes(normalizeText(key))) {
      return value;
    }
  }
  return undefined;
}

function parseNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseBRNumber(val);
  return 0;
}

function parseBoolean(val: any): boolean {
  if (!val) return false;
  const str = String(val).toLowerCase().trim();
  return str === "sim" || str === "true" || str === "1" || str === "yes";
}

export async function aggregateFullDataset(clientesData: ClienteRow[]): Promise<AggregationResult> {
  if (!clientesData || clientesData.length === 0) {
    return getEmptyResult();
  }

  const result = {
    totalClientes: 0,
    totalAprovados: 0,
    totalNegados: 0,
    totalAtivados: 0,
    sumScore: 0,
    countScore: 0,
    sumCompras: 0,
    countCompras: 0,
    sumLimite: 0,
    countLimite: 0,
    comApp: 0,
    comAumentoLimite: 0,
    purchaseDistribution: { zero: 0, um: 0, dois: 0, tresOuMais: 0 },
    scoreDistribution: { alto: 0, medio: 0, baixo: 0 },
    segments: { negados: 0, aprovadosNaoAtivados: 0, potencial: 0, recorrentes: 0, highValue: 0 },
    segmentData: {
      negados: { sumScore: 0, countScore: 0, sumCompras: 0, countCompras: 0, sumLimite: 0, countLimite: 0 },
      aprovadosNaoAtivados: { sumScore: 0, countScore: 0, sumCompras: 0, countCompras: 0, sumLimite: 0, countLimite: 0 },
      potencial: { sumScore: 0, countScore: 0, sumCompras: 0, countCompras: 0, sumLimite: 0, countLimite: 0 },
      recorrentes: { sumScore: 0, countScore: 0, sumCompras: 0, countCompras: 0, sumLimite: 0, countLimite: 0 },
      highValue: { sumScore: 0, countScore: 0, sumCompras: 0, countCompras: 0, sumLimite: 0, countLimite: 0 },
    },
  };

  // Process in chunks
  for (let i = 0; i < clientesData.length; i += CHUNK_SIZE) {
    const chunk = clientesData.slice(i, Math.min(i + CHUNK_SIZE, clientesData.length));

    for (const cliente of chunk) {
      const situacao = normalizeText(getColumnValue(cliente, ["situação", "status", "situation"]) || "");
      const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras", "qtd compras"])) || 0;
      const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score", "score_credito"])) || 0;
      const limite = parseNumber(getColumnValue(cliente, ["limite total", "limite"])) || 0;
      const temApp = parseBoolean(getColumnValue(cliente, ["tem app?", "app", "tem_app"]));
      const aumentoLimite = parseBoolean(getColumnValue(cliente, ["já teve aumento de limite?", "aumento limite"]));

      result.totalClientes++;

      if (situacao.includes("negad")) {
        result.totalNegados++;
      } else if (situacao.includes("aprova")) {
        result.totalAprovados++;
        if (compras > 0) {
          result.totalAtivados++;
        }
      }

      if (score > 0) {
        result.sumScore += score;
        result.countScore++;
      }
      result.sumCompras += compras;
      result.countCompras++;
      if (limite > 0) {
        result.sumLimite += limite;
        result.countLimite++;
      }

      if (temApp) result.comApp++;
      if (aumentoLimite) result.comAumentoLimite++;

      if (compras === 0) result.purchaseDistribution.zero++;
      else if (compras === 1) result.purchaseDistribution.um++;
      else if (compras === 2) result.purchaseDistribution.dois++;
      else result.purchaseDistribution.tresOuMais++;

      if (score >= 700) result.scoreDistribution.alto++;
      else if (score >= 500) result.scoreDistribution.medio++;
      else if (score > 0) result.scoreDistribution.baixo++;

      let segment = "";
      if (situacao.includes("negad")) {
        segment = "negados";
        result.segments.negados++;
      } else if (compras === 0) {
        segment = "aprovadosNaoAtivados";
        result.segments.aprovadosNaoAtivados++;
      } else if (compras === 1) {
        segment = "potencial";
        result.segments.potencial++;
      } else if (compras === 2) {
        segment = "recorrentes";
        result.segments.recorrentes++;
      } else {
        segment = "highValue";
        result.segments.highValue++;
      }

      if (segment) {
        const segData = result.segmentData[segment as keyof typeof result.segmentData];
        if (score > 0) {
          segData.sumScore += score;
          segData.countScore++;
        }
        segData.sumCompras += compras;
        segData.countCompras++;
        if (limite > 0) {
          segData.sumLimite += limite;
          segData.countLimite++;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const percentageAprovados = result.totalClientes > 0 ? (result.totalAprovados / result.totalClientes) * 100 : 0;
  const percentageAtivados = result.totalAprovados > 0 ? (result.totalAtivados / result.totalAprovados) * 100 : 0;
  const percentageComApp = result.totalClientes > 0 ? (result.comApp / result.totalClientes) * 100 : 0;
  const percentageComAumentoLimite = result.totalClientes > 0 ? (result.comAumentoLimite / result.totalClientes) * 100 : 0;

  return {
    totalClientes: result.totalClientes,
    totalAprovados: result.totalAprovados,
    totalNegados: result.totalNegados,
    totalAtivados: result.totalAtivados,
    percentageAprovados,
    percentageAtivados,
    percentageComApp,
    percentageComAumentoLimite,
    avgScore: result.countScore > 0 ? result.sumScore / result.countScore : 0,
    avgCompras: result.countCompras > 0 ? result.sumCompras / result.countCompras : 0,
    avgLimite: result.countLimite > 0 ? result.sumLimite / result.countLimite : 0,
    purchaseDistribution: result.purchaseDistribution,
    scoreDistribution: result.scoreDistribution,
    segments: result.segments,
    segmentAverages: {
      negados: calculateSegmentAverages(result.segmentData.negados),
      aprovadosNaoAtivados: calculateSegmentAverages(result.segmentData.aprovadosNaoAtivados),
      potencial: calculateSegmentAverages(result.segmentData.potencial),
      recorrentes: calculateSegmentAverages(result.segmentData.recorrentes),
      highValue: calculateSegmentAverages(result.segmentData.highValue),
    },
  };
}

function calculateSegmentAverages(data: any) {
  return {
    avgScore: data.countScore > 0 ? data.sumScore / data.countScore : 0,
    avgCompras: data.countCompras > 0 ? data.sumCompras / data.countCompras : 0,
    avgLimite: data.countLimite > 0 ? data.sumLimite / data.countLimite : 0,
  };
}

function getEmptyResult(): AggregationResult {
  return {
    totalClientes: 0,
    totalAprovados: 0,
    totalNegados: 0,
    totalAtivados: 0,
    percentageAprovados: 0,
    percentageAtivados: 0,
    percentageComApp: 0,
    percentageComAumentoLimite: 0,
    avgScore: 0,
    avgCompras: 0,
    avgLimite: 0,
    purchaseDistribution: { zero: 0, um: 0, dois: 0, tresOuMais: 0 },
    scoreDistribution: { alto: 0, medio: 0, baixo: 0 },
    segments: { negados: 0, aprovadosNaoAtivados: 0, potencial: 0, recorrentes: 0, highValue: 0 },
    segmentAverages: {
      negados: { avgScore: 0, avgCompras: 0, avgLimite: 0 },
      aprovadosNaoAtivados: { avgScore: 0, avgCompras: 0, avgLimite: 0 },
      potencial: { avgScore: 0, avgCompras: 0, avgLimite: 0 },
      recorrentes: { avgScore: 0, avgCompras: 0, avgLimite: 0 },
      highValue: { avgScore: 0, avgCompras: 0, avgLimite: 0 },
    },
  };
}
