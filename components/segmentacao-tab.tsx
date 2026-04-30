"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/parse-utils";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "negados": { bg: "#FEE2E2", accent: "#DC2626", text: "#7F1D1D" },
  "aprovados-nao-ativados": { bg: "#FEF3C7", accent: "#D97706", text: "#78350F" },
  "potencial": { bg: "#DBEAFE", accent: "#2563EB", text: "#1E3A8A" },
  "recorrentes": { bg: "#DCFCE7", accent: "#16A34A", text: "#15803D" },
  "high-value": { bg: "#E9D5FF", accent: "#9333EA", text: "#4C0519" },
};

type SafeNumber = number | undefined | null;

function safeNumber(val: SafeNumber): number {
  if (val === null || val === undefined || isNaN(val)) return 0;
  return val;
}

function safeFormat(val: SafeNumber): string {
  const num = safeNumber(val);
  return num === 0 && val !== 0 ? "—" : formatNumber(num);
}

function safeCurrency(val: SafeNumber): string {
  const num = safeNumber(val);
  return num === 0 && val !== 0 ? "—" : formatCurrency(num);
}

function safePercentage(val: SafeNumber): string {
  const num = safeNumber(val);
  if (num === 0 && val !== 0) return "0%";
  return formatPercentage(num);
}

export function SegmentacaoTab() {
  const { aggregatedMetrics } = useData();

  if (!aggregatedMetrics) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a análise de segmentação.</p>
      </div>
    );
  }

  const m = aggregatedMetrics;

  // Segments for the cards
  const segmentsList = [
    {
      id: "negados",
      name: "Negados",
      count: m.segments.negados,
      avgScore: m.segmentAverages.negados.avgScore,
      avgCompras: m.segmentAverages.negados.avgCompras,
      avgLimite: m.segmentAverages.negados.avgLimite,
      colors: SEGMENT_COLORS["negados"],
    },
    {
      id: "aprovados-nao-ativados",
      name: "Aprovados Não Ativados",
      count: m.segments.aprovadosNaoAtivados,
      avgScore: m.segmentAverages.aprovadosNaoAtivados.avgScore,
      avgCompras: m.segmentAverages.aprovadosNaoAtivados.avgCompras,
      avgLimite: m.segmentAverages.aprovadosNaoAtivados.avgLimite,
      colors: SEGMENT_COLORS["aprovados-nao-ativados"],
    },
    {
      id: "potencial",
      name: "Potencial",
      count: m.segments.potencial,
      avgScore: m.segmentAverages.potencial.avgScore,
      avgCompras: m.segmentAverages.potencial.avgCompras,
      avgLimite: m.segmentAverages.potencial.avgLimite,
      colors: SEGMENT_COLORS["potencial"],
    },
    {
      id: "recorrentes",
      name: "Recorrentes",
      count: m.segments.recorrentes,
      avgScore: m.segmentAverages.recorrentes.avgScore,
      avgCompras: m.segmentAverages.recorrentes.avgCompras,
      avgLimite: m.segmentAverages.recorrentes.avgLimite,
      colors: SEGMENT_COLORS["recorrentes"],
    },
    {
      id: "high-value",
      name: "High Value",
      count: m.segments.highValue,
      avgScore: m.segmentAverages.highValue.avgScore,
      avgCompras: m.segmentAverages.highValue.avgCompras,
      avgLimite: m.segmentAverages.highValue.avgLimite,
      colors: SEGMENT_COLORS["high-value"],
    },
  ];

  const purchaseGroups = [
    { name: "0 compras", count: m.purchaseDistribution.zero, pct: (m.purchaseDistribution.zero / m.totalClientes) * 100 },
    { name: "1 compra", count: m.purchaseDistribution.um, pct: (m.purchaseDistribution.um / m.totalClientes) * 100 },
    { name: "2+ compras", count: m.purchaseDistribution.dois + m.purchaseDistribution.tresOuMais, pct: ((m.purchaseDistribution.dois + m.purchaseDistribution.tresOuMais) / m.totalClientes) * 100 },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h1>
        <p className="text-sm text-[#64748b] mt-2">
          Entendimento da base Ume para identificar perfil, comportamento e oportunidades de crescimento.
        </p>
      </div>

      {/* 1. RESUMO EXECUTIVO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{safePercentage(m.percentageAtivados)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(m.totalAtivados)} de {formatNumber(m.totalAprovados)} aprovados</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">% com App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{safePercentage(m.percentageComApp)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(m.clientesComApp)} clientes</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{safeFormat(m.avgScore)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Perfil de risco</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. QUEM É O CLIENTE UME */}
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
                <p className="text-lg font-bold text-[#00C853]">{safePercentage(m.percentageAprovados)}</p>
                <p className="text-xs text-[#94a3b8]">{formatNumber(m.totalAprovados)}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b] mb-1">Negados</p>
                <p className="text-lg font-bold text-[#F44336]">{safePercentage((m.totalNegados / m.totalClientes) * 100)}</p>
                <p className="text-xs text-[#94a3b8]">{formatNumber(m.totalNegados)}</p>
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
                <p className="text-lg font-bold text-[#1a1a1a]">{safeFormat(m.avgScore)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-2">Distribuição</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Alto:</span>
                    <span className="font-medium">{m.scoreDistribution.alto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Médio:</span>
                    <span className="font-medium">{m.scoreDistribution.medio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Baixo:</span>
                    <span className="font-medium">{m.scoreDistribution.baixo}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limite */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-[#64748b] mb-1">Limite Médio</p>
                <p className="text-lg font-bold text-[#1a1a1a]">{safeCurrency(m.avgLimite)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-1">Com Aumento</p>
                <p className="text-base font-bold text-[#1a1a1a]">{safePercentage(m.percentageComAumentoLimite)}</p>
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
                <p className="text-lg font-bold text-[#1a1a1a]">{safeFormat(m.avgCompras)}</p>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748b] mb-1">Com App</p>
                <p className="text-base font-bold text-[#1a1a1a]">{safePercentage(m.percentageComApp)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. DIAGNÓSTICO DA BASE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Diagnóstico da Base</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E2E8F0] bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#0D47A1]">Ativação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0D47A1]">{safePercentage(m.percentageAtivados)}</div>
              <p className="text-xs text-[#64748b] mt-1">{formatNumber(m.totalAtivados)} ativados</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#E65100]">Engajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#E65100]">{safePercentage((m.purchaseDistribution.zero / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#64748b] mt-1">sem compras</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] bg-red-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#B71C1C]">Crédito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#B71C1C]">{safePercentage((m.scoreDistribution.baixo / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#64748b] mt-1">score baixo</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] bg-gray-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#374151]">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#374151]">{safePercentage((m.totalNegados / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#64748b] mt-1">negados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. DISTRIBUIÇÃO DE COMPRAS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Distribuição de Compras</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">0 Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{safePercentage((m.purchaseDistribution.zero / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(m.purchaseDistribution.zero)} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">1 Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{safePercentage((m.purchaseDistribution.um / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(m.purchaseDistribution.um)} clientes</p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#64748b]">2+ Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1a1a1a]">{safePercentage(((m.purchaseDistribution.dois + m.purchaseDistribution.tresOuMais) / m.totalClientes) * 100)}</div>
              <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(m.purchaseDistribution.dois + m.purchaseDistribution.tresOuMais)} clientes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. COMPARAÇÃO POR GRUPO DE COMPRA */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Comportamento por Grupo</h2>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7FAF8] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-[#64748b]">Grupo</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#64748b]">Clientes</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#64748b]">Score Médio</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#64748b]">Limite Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {purchaseGroups.map((group) => (
                    <tr key={group.name} className="hover:bg-[#F7FAF8]">
                      <td className="px-4 py-3 text-[#1a1a1a] font-medium">{group.name}</td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]">{formatNumber(group.count)}</td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]">—</td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. SEGMENTAÇÃO DE CLIENTES */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>

        <Card className="border-[#E2E8F0] bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-xs text-[#1E40AF] font-semibold mb-2">Critérios de Classificação</p>
            <div className="space-y-2 text-xs text-[#64748b]">
              <p>• <span className="font-medium text-[#1a1a1a]">Negados</span> → Situação = Negada</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Aprovados Não Ativados</span> → Compras = 0</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Potencial</span> → Compras = 1</p>
              <p>• <span className="font-medium text-[#1a1a1a]">Recorrentes</span> → Compras ≥ 2</p>
              <p>• <span className="font-medium text-[#1a1a1a]">High Value</span> → Compras ≥ 3 + score/limite alto</p>
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
                  <p
                    className="font-medium"
                    style={{ color: segment.colors.text }}
                  >
                    {safePercentage((segment.count / m.totalClientes) * 100)}
                  </p>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: segment.colors.accent + "40" }}>
                  <p className="text-[#64748b] mb-1">Score Médio</p>
                  <p className="font-medium" style={{ color: segment.colors.text }}>
                    {safeFormat(segment.avgScore)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] mb-1">Compras</p>
                  <p className="font-medium" style={{ color: segment.colors.text }}>
                    {safeFormat(segment.avgCompras)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b] mb-1">Limite Médio</p>
                  <p className="text-sm font-medium" style={{ color: segment.colors.text }}>
                    {safeCurrency(segment.avgLimite)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 7. OPORTUNIDADES ESTRATÉGICAS */}
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
