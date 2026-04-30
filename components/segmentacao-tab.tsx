"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  highValue: { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  potencial: { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  aprovadosNaoAtivados: { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  recorrentes: { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  negados: { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
};

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
  if (value >= 1000) return (value / 1000).toFixed(1) + "k";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return value.toFixed(1) + "%";
}

export function SegmentacaoTab() {
  const { aggregationResult, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Processando base de clientes...</p>
      </div>
    );
  }

  if (!aggregationResult) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a análise de segmentação.</p>
      </div>
    );
  }

  const r = aggregationResult;

  // Segments for cards - using aggregated data only
  const segmentsList = [
    {
      id: "highValue",
      name: "High Value",
      count: r.segments.highValue,
      colors: SEGMENT_COLORS.highValue,
    },
    {
      id: "potencial",
      name: "Potencial",
      count: r.segments.potencial,
      colors: SEGMENT_COLORS.potencial,
    },
    {
      id: "aprovadosNaoAtivados",
      name: "Aprovados Não Ativados",
      count: r.segments.aprovadosNaoAtivados,
      colors: SEGMENT_COLORS.aprovadosNaoAtivados,
    },
    {
      id: "recorrentes",
      name: "Recorrentes",
      count: r.segments.recorrentes,
      colors: SEGMENT_COLORS.recorrentes,
    },
    {
      id: "negados",
      name: "Negados",
      count: r.segments.negados,
      colors: SEGMENT_COLORS.negados,
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h1>
        <p className="text-sm text-[#64748b] mt-2">
          Análise consolidada da base com {formatNumber(r.totalClientes)} clientes.
        </p>
      </div>

      {/* 1. RESUMO EXECUTIVO - 3 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(r.percentageAtivados)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(r.totalAtivados)} de {formatNumber(r.totalAprovados)} aprovados</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">% com App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(r.percentageComApp)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Adoção digital</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(r.avgScore)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Perfil de risco</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. QUEM É O CLIENTE UME - 4 CARDS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Quem é o Cliente Ume</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Aprovados</p>
                <p className="text-lg font-bold text-[#00C853]">{formatPercentage((r.totalAprovados / r.totalClientes) * 100)}</p>
                <p className="text-xs text-[#94a3b8]">{formatNumber(r.totalAprovados)}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Negados</p>
                <p className="text-lg font-bold text-[#F44336]">{formatPercentage((r.totalNegados / r.totalClientes) * 100)}</p>
                <p className="text-xs text-[#94a3b8]">{formatNumber(r.totalNegados)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Score */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Médio</p>
                <p className="text-lg font-bold text-[#1a1a1a]">{formatNumber(r.avgScore)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-2">Distribuição</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Alto:</span>
                    <span className="font-medium">{formatNumber(r.scoreDistribution.alto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Médio:</span>
                    <span className="font-medium">{formatNumber(r.scoreDistribution.medio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Baixo:</span>
                    <span className="font-medium">{formatNumber(r.scoreDistribution.baixo)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crédito */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Limite Médio</p>
                <p className="text-lg font-bold text-[#1a1a1a]">{formatCurrency(r.avgLimite)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-1">Com Aumento</p>
                <p className="text-base font-bold text-[#1a1a1a]">{formatPercentage(r.percentageComAumentoLimite)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comportamento */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Compras Médias</p>
                <p className="text-lg font-bold text-[#1a1a1a]">{formatNumber(r.avgCompras)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-1">Com App</p>
                <p className="text-base font-bold text-[#1a1a1a]">{formatPercentage(r.percentageComApp)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. DISTRIBUIÇÃO DE COMPRAS - 4 CARDS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Distribuição de Compras</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">0 Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage((r.purchaseDistribution.zero / r.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(r.purchaseDistribution.zero)} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">1 Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage((r.purchaseDistribution.um / r.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(r.purchaseDistribution.um)} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">2 Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage((r.purchaseDistribution.dois / r.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(r.purchaseDistribution.dois)} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">3+ Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage((r.purchaseDistribution.tresOuMais / r.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(r.purchaseDistribution.tresOuMais)} clientes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. SEGMENTAÇÃO DE CLIENTES - 5 CARDS COLORIDOS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>

        <Card className="border-[#E2E8F0] bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-[#1E40AF] font-semibold mb-2">Critérios de Classificação</p>
            <div className="space-y-2 text-xs text-[#64748b]">
              <p>• <span className="font-medium text-[#1a1a1a]">Negados</span> → Situação = Negada</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Aprovados Não Ativados</span> → Compras = 0</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Potencial</span> → Compras = 1</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Recorrentes</span> → Compras = 2</p>
              <p>• <span className="font-medium text-[#1a1a1a]">High Value</span> → Compras ≥ 3</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {segmentsList.map((segment) => (
            <Card
              key={segment.id}
              className="border-2"
              style={{
                borderColor: segment.colors.accent,
                backgroundColor: segment.colors.bg,
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle
                  className="text-xs font-bold uppercase"
                  style={{ color: segment.colors.accent }}
                >
                  {segment.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="text-[#64748b] mb-1">Clientes</p>
                  <p className="text-lg font-bold" style={{ color: segment.colors.accent }}>
                    {formatNumber(segment.count)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] mb-1">% da Base</p>
                  <p className="font-medium" style={{ color: segment.colors.text }}>
                    {formatPercentage((segment.count / r.totalClientes) * 100)}
                  </p>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: segment.colors.accent + "40" }}>
                  <p className="text-[#64748b] mb-1">Score Médio</p>
                  <p className="font-medium" style={{ color: segment.colors.text }}>
                    {formatNumber(r.segmentAverages[segment.id as keyof typeof r.segmentAverages]?.avgScore || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] mb-1">Compras</p>
                  <p className="font-medium" style={{ color: segment.colors.text }}>
                    {formatNumber(r.segmentAverages[segment.id as keyof typeof r.segmentAverages]?.avgCompras || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] mb-1">Limite Médio</p>
                  <p className="text-sm font-medium" style={{ color: segment.colors.text }}>
                    {formatCurrency(r.segmentAverages[segment.id as keyof typeof r.segmentAverages]?.avgLimite || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. OPORTUNIDADES ESTRATÉGICAS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Oportunidades Estratégicas</h2>

        <div className="space-y-3">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#D97706]">Aprovados Não Ativados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Insight</p>
                <p className="text-[#64748b] text-xs">Maior oportunidade de crescimento (CAC já pago)</p>
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Ações</p>
                <ul className="text-[#64748b] list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>WhatsApp/SMS com incentivo</li>
                  <li>Desconto na primeira compra</li>
                  <li>Reativação de limite</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#2563EB]">Potencial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Insight</p>
                <p className="text-[#64748b] text-xs">Alta chance de virar recorrente</p>
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Ações</p>
                <ul className="text-[#64748b] list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>Incentivo segunda compra</li>
                  <li>Sugestões de produtos</li>
                  <li>Aumentos de limite gradual</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#16A34A]">Recorrentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Insight</p>
                <p className="text-[#64748b] text-xs">Base ativa com potencial de expansão</p>
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Ações</p>
                <ul className="text-[#64748b] list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>Fidelização e rewards</li>
                  <li>Cross-sell estratégico</li>
                  <li>Aumentos de limite</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#9333EA]">High Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Insight</p>
                <p className="text-[#64748b] text-xs">Clientes de maior valor</p>
              </div>
              <div>
                <p className="font-semibold text-[#1a1a1a]">Ações</p>
                <ul className="text-[#64748b] list-disc list-inside space-y-1 ml-2 text-xs">
                  <li>Aumento de limite premium</li>
                  <li>Benefícios exclusivos</li>
                  <li>Atendimento VIP</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
