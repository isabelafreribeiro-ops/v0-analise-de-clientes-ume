// Aggregated metrics computed once after CSV upload
// Used to render dashboard without recalculating from raw rows

export interface AggregatedMetrics {
  // Basic counts
  totalClientes: number;
  totalAprovados: number;
  totalNegados: number;
  totalAtivados: number;
  percentageAtivados: number;
  percentageAprovados: number;
  
  // App adoption
  clientesComApp: number;
  percentageComApp: number;
  clientesComAumentoLimite: number;
  percentageComAumentoLimite: number;
  
  // Credit score distribution
  scoreDistribution: {
    baixo: number; // < 400
    medio: number; // 400-700
    alto: number; // >= 700
  };
  avgScore: number;
  
  // Purchase behavior
  purchaseDistribution: {
    zero: number;
    um: number;
    dois: number;
    tresOuMais: number;
  };
  avgCompras: number;
  
  // Credit limit
  avgLimite: number;
  
  // Age distribution
  ageDistribution: {
    "18-25": number;
    "26-35": number;
    "36-45": number;
    "46-55": number;
    "56+": number;
  };
  
  // Gender distribution
  genderDistribution: {
    masculino: number;
    feminino: number;
    outro: number;
  };
  
  // Segments
  segments: {
    negados: number;
    aprovadosNaoAtivados: number;
    potencial: number;
    recorrentes: number;
    highValue: number;
  };
  
  segmentAverages: {
    negados: { avgScore: number; avgLimite: number; avgCompras: number };
    aprovadosNaoAtivados: { avgScore: number; avgLimite: number; avgCompras: number };
    potencial: { avgScore: number; avgLimite: number; avgCompras: number };
    recorrentes: { avgScore: number; avgLimite: number; avgCompras: number };
    highValue: { avgScore: number; avgLimite: number; avgCompras: number };
  };
  
  // Risk analysis
  riskAnalysis: {
    scoreVsComprasCorrelation: string;
    limitVsAppCorrelation: string;
    recorrentesExpectedDefault: number;
  };
  
  // Timestamps
  computedAt: number;
}
