"use client";

import { TrendingUp, AlertCircle, MessageSquare, Send, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  segmentarClientes,
  calculateAggregatedMetrics,
  calculatePurchaseDistribution,
  calculateAgeDistribution,
  calculateGenderDistribution,
  formatBRNumber,
  parseNumber,
  parseBoolean,
  getColumnValue,
  calculatePercentage,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "high-value": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  "potencial": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  "negados": { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
};

const CHANNEL_ICONS = {
  push: Send,
  whatsapp: MessageSquare,
  sms: Phone,
};

function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1000000) return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000000) + "M";
  if (value >= 1000) return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1000) + "k";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

export function JornadaTab() {
  const { clientesData } = useData();

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a jornada recomendada.</p>
      </div>
    );
  }

  // Calculate metrics from raw data
  const aggregated = calculateAggregatedMetrics(clientesData);
  const segments = segmentarClientes(clientesData);
  const purchaseDistribution = calculatePurchaseDistribution(clientesData);
  const ageDistribution = calculateAgeDistribution(clientesData);
  const genderDistribution = calculateGenderDistribution(clientesData);

  // KPIs
  const totalClientes = clientesData.length;
  const totalAprovados = segments.filter((s) => s.id === "aprovados-nao-ativados").reduce((acc, s) => acc + s.customers.length, 0) +
    segments.filter((s) => s.id !== "aprovados-nao-ativados" && s.id !== "negados").reduce((acc, s) => acc + s.customers.length, 0);
  const totalNegados = segments.find((s) => s.id === "negados")?.customers.length || 0;
  const percentageAtivacao = totalAprovados > 0 ? ((totalClientes - totalAprovados) / totalAprovados) * 100 : 0;
  const percentageSemCompras = purchaseDistribution.find((d) => d.range === "0 compras")?.percentage || 0;
  const avgScore = aggregated?.avgScore || 0;
  const comApp = clientesData.filter((c) => parseBoolean(getColumnValue(c, ["tem app?", "tem app", "app"]))).length;
  const percentageComApp = (comApp / totalClientes) * 100;

  // Journey definitions
  const journeys = [
    {
      id: "aprovados-nao-ativados",
      name: "Aprovados Não Ativados",
      objetivo: "Gerar primeira compra",
      trigger: "Cliente aprovado + 0 compras",
      timeline: ["D0", "D1", "D3", "D7", "D14"],
      channels: ["push", "whatsapp", "sms"],
      fluxo: ["Push", "WhatsApp", "Push", "SMS", "WhatsApp"],
      detalhamento: [
        {
          momento: "D0",
          canal: "Push",
          mensagem: "Bem-vindo à Ume! Seu crédito está aprovado e pronto para usar.",
          acao: "Clique no app",
        },
        {
          momento: "D1",
          canal: "WhatsApp",
          mensagem: "Aproveite 15% de desconto na primeira compra hoje!",
          acao: "Realize primeira compra",
        },
        {
          momento: "D3",
          canal: "Push",
          mensagem: "Produtos em destaque aguardando você",
          acao: "Navegue catálogo",
        },
        {
          momento: "D7",
          canal: "SMS",
          mensagem: "Seu crédito vence em 7 dias. Use agora!",
          acao: "Compre antes do vencimento",
        },
        {
          momento: "D14",
          canal: "WhatsApp",
          mensagem: "Estatísticas mostram que 85% dos clientes economizam com Ume",
          acao: "Converta em cliente ativo",
        },
      ],
      resultadoEsperado: [
        "Aumento de ativação (primeira compra)",
        "Redução de clientes inativos",
        "Maior LTV",
      ],
    },
    {
      id: "potencial",
      name: "Potencial (1 compra)",
      objetivo: "Gerar segunda compra (criar hábito)",
      trigger: "Cliente com 1 compra",
      timeline: ["D0", "D3", "D7", "D14", "D30"],
      channels: ["push", "whatsapp"],
      fluxo: ["Push", "WhatsApp", "Push", "WhatsApp", "SMS"],
      detalhamento: [
        {
          momento: "D0",
          canal: "Push",
          mensagem: "Parabéns pela sua primeira compra!",
          acao: "Reconhecimento",
        },
        {
          momento: "D3",
          canal: "WhatsApp",
          mensagem: "Produtos que você pode aproveitar agora",
          acao: "Navegue recomendações",
        },
        {
          momento: "D7",
          canal: "Push",
          mensagem: "Frete grátis em compras acima de R$100",
          acao: "Realize segunda compra",
        },
        {
          momento: "D14",
          canal: "WhatsApp",
          mensagem: "Como está indo? Confira novas categorias",
          acao: "Mantenha engajamento",
        },
        {
          momento: "D30",
          canal: "SMS",
          mensagem: "Mês novo, ofertas novas! Aproveite",
          acao: "Compra recorrente",
        },
      ],
      resultadoEsperado: [
        "Aumento de frequência (2+ compras)",
        "Criação de hábito de compra",
        "Evolução para segmento Recorrentes",
      ],
    },
    {
      id: "recorrentes",
      name: "Recorrentes (2+ compras)",
      objetivo: "Aumentar frequência e ticket",
      trigger: "Cliente com 2+ compras",
      timeline: ["Semanal", "Bi-semanal", "Mensal", "Mensal", "Trimestral"],
      channels: ["push", "whatsapp", "sms"],
      fluxo: ["Push", "WhatsApp", "Push", "SMS", "Email"],
      detalhamento: [
        {
          momento: "Semanal",
          canal: "Push",
          mensagem: "Novidades da semana - categorias que você ama",
          acao: "Navegação semanal",
        },
        {
          momento: "Bi-semanal",
          canal: "WhatsApp",
          mensagem: "Desconto progressivo: 5% a cada compra",
          acao: "Cross-sell",
        },
        {
          momento: "Mensal",
          canal: "Push",
          mensagem: "Seu Limite aumentou! Aproveite novo crédito",
          acao: "Aumentar ticket",
        },
        {
          momento: "Mensal",
          canal: "SMS",
          mensagem: "Programa Fidelidade: acumule pontos",
          acao: "Programa de rewards",
        },
        {
          momento: "Trimestral",
          canal: "WhatsApp",
          mensagem: "Análise: Você economizou R$X este trimestre",
          acao: "Retenção por valor",
        },
      ],
      resultadoEsperado: [
        "Aumento de frequência de compra",
        "Aumento de ticket médio",
        "Redução de churn",
      ],
    },
    {
      id: "high-value",
      name: "High Value (VIP)",
      objetivo: "Retenção e maximizar LTV",
      trigger: "3+ compras + score alto + limite elevado",
      timeline: ["Quinzenal", "Mensal", "Mensal", "Trimestral", "Semestral"],
      channels: ["whatsapp", "push", "sms"],
      fluxo: ["WhatsApp", "Push", "SMS", "WhatsApp", "Personalized"],
      detalhamento: [
        {
          momento: "Quinzenal",
          canal: "WhatsApp",
          mensagem: "Acesso VIP: Novos produtos antes do lançamento",
          acao: "Exclusividade",
        },
        {
          momento: "Mensal",
          canal: "Push",
          mensagem: "Limite de crédito aumentado em R$X",
          acao: "Reconhecimento de valor",
        },
        {
          momento: "Mensal",
          canal: "SMS",
          mensagem: "Convite para evento exclusivo Ume VIP",
          acao: "Engajamento especial",
        },
        {
          momento: "Trimestral",
          canal: "WhatsApp",
          mensagem: "Seu cashback este trimestre: R$X",
          acao: "Benefício tangível",
        },
        {
          momento: "Semestral",
          canal: "Personalized",
          mensagem: "Analista dedicado para suas necessidades",
          acao: "Atendimento premium",
        },
      ],
      resultadoEsperado: [
        "Maximizar LTV",
        "Retenção de clientes premium",
        "Advocacy e referências",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Jornada do Cliente</h1>
        <p className="text-sm text-[#64748b] mt-2">
          Estratégia de CRM segmentada para acelerar evolução do cliente pelo ciclo de valor.
        </p>
      </div>

      {/* 1. EXECUTIVE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Taxa de Ativação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage((percentageAtivacao / (totalAprovados || 1)) * 100)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(totalAprovados)} de {formatNumber(totalClientes)} clientes</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">% Sem Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(percentageSemCompras)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Oportunidade de ativação</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(avgScore)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Perfil de risco geral</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">% com App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(percentageComApp)}</div>
            <p className="text-xs text-[#94a3b8] mt-1">Canal de engajamento</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. DIAGNÓSTICO DA BASE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Diagnóstico da Base</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-[#2196F3] bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0D47A1] flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Ativação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-[#1a1a1a] font-medium">Base altamente concentrada em clientes aprovados não ativados</p>
              <p className="text-[#64748b] text-xs">
                {formatPercentage(percentageSemCompras)} da base nunca realizou uma compra. Maior oportunidade de crescimento sem custo de aquisição.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#FF9800] bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#E65100] flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-[#1a1a1a] font-medium">Maioria dos clientes nunca realizou compra</p>
              <p className="text-[#64748b] text-xs">
                Criação de hábito é crítica. Jornada deve focar em remover fricção e incentivar primeira experiência.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#9C27B0] bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#4A148C] flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-[#1a1a1a] font-medium">Concentração em score baixo limita ativação</p>
              <p className="text-[#64748b] text-xs">
                Clientes com baixo score requerem jornada diferenciada: educação, incentivos maiores, canais mais diretos.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[#00C853] bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#1B5E20] flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Canal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-[#1a1a1a] font-medium">Baixa adoção de app reduz engajamento</p>
              <p className="text-[#64748b] text-xs">
                {formatPercentage(100 - percentageComApp)} sem app. Jornada deve incluir push para app além de SMS/WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. JORNADAS RECOMENDADAS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">Jornada Recomendada por Segmento</h2>
          <p className="text-sm text-[#64748b] mt-2">
            Cada segmento exige uma jornada diferente para evoluir no ciclo de valor. Abaixo estão as estratégias recomendadas.
          </p>
        </div>

        {journeys.map((journey) => (
          <Card key={journey.id} className="border-[#E2E8F0]">
            <CardHeader className="pb-3" style={{ backgroundColor: SEGMENT_COLORS[journey.id as keyof typeof SEGMENT_COLORS]?.bg || "#F7FAF8" }}>
              <CardTitle className="text-base font-bold" style={{ color: SEGMENT_COLORS[journey.id as keyof typeof SEGMENT_COLORS]?.accent || "#1a1a1a" }}>
                {journey.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Objetivo e Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">Objetivo</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{journey.objetivo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">Trigger</p>
                  <p className="text-sm font-medium text-[#1a1a1a]">{journey.trigger}</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Jornada (Timeline)</p>
                <div className="flex items-center justify-between bg-[#F7FAF8] p-3 rounded-lg">
                  {journey.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="text-center">
                        <p className="text-xs font-bold text-[#1a1a1a]">{step}</p>
                      </div>
                      {idx < journey.timeline.length - 1 && (
                        <div className="mx-2 h-1 w-4 bg-[#E2E8F0]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Canais */}
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Canais</p>
                <div className="flex flex-wrap gap-2">
                  {journey.channels.map((channel) => (
                    <div key={channel} className="px-3 py-1.5 rounded-full bg-[#F7FAF8] border border-[#E2E8F0] text-xs font-medium text-[#1a1a1a] capitalize flex items-center gap-1">
                      {channel === "push" && <Send className="h-3 w-3" />}
                      {channel === "whatsapp" && <MessageSquare className="h-3 w-3" />}
                      {channel === "sms" && <Phone className="h-3 w-3" />}
                      {channel}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fluxo */}
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Fluxo</p>
                <div className="flex flex-wrap gap-2">
                  {journey.fluxo.map((canal, idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="px-2.5 py-1 rounded-full bg-[#F7FAF8] border border-[#E2E8F0] text-xs font-medium text-[#1a1a1a] capitalize">
                        {canal}
                      </span>
                      {idx < journey.fluxo.length - 1 && (
                        <span className="mx-1.5 text-[#94a3b8] font-bold">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhamento */}
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-3">Detalhamento</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F7FAF8] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Momento</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Canal</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Mensagem</th>
                        <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Ação Esperada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {journey.detalhamento.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F7FAF8]">
                          <td className="px-3 py-2 font-medium text-[#1a1a1a]">{item.momento}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block px-2 py-1 rounded bg-[#F7FAF8] text-[#1a1a1a] font-medium capitalize">
                              {item.canal}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#64748b]">{item.mensagem}</td>
                          <td className="px-3 py-2 text-[#64748b]">{item.acao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resultado Esperado */}
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Resultado Esperado</p>
                <ul className="space-y-1">
                  {journey.resultadoEsperado.map((result, idx) => (
                    <li key={idx} className="text-sm text-[#1a1a1a] flex items-start gap-2">
                      <span className="text-[#00C853] font-bold mt-0.5">•</span>
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. EVOLUÇÃO DO CLIENTE */}
      <Card className="border-[#E2E8F0] bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#1a1a1a]">Evolução do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-center flex-1 min-w-32">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Stage 1</p>
              <div className="px-3 py-2 rounded-lg bg-[#E3F2FD] border border-[#2196F3]">
                <p className="text-sm font-bold text-[#0D47A1]">Não Ativado</p>
                <p className="text-xs text-[#1565C0] mt-1">0 compras</p>
              </div>
            </div>

            <span className="text-2xl text-[#64748b] font-bold">→</span>

            <div className="text-center flex-1 min-w-32">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Stage 2</p>
              <div className="px-3 py-2 rounded-lg bg-[#FFF3E0] border border-[#FF9800]">
                <p className="text-sm font-bold text-[#E65100]">Potencial</p>
                <p className="text-xs text-[#E65100] mt-1">1 compra</p>
              </div>
            </div>

            <span className="text-2xl text-[#64748b] font-bold">→</span>

            <div className="text-center flex-1 min-w-32">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Stage 3</p>
              <div className="px-3 py-2 rounded-lg bg-[#F3E5F5] border border-[#9C27B0]">
                <p className="text-sm font-bold text-[#4A148C]">Recorrente</p>
                <p className="text-xs text-[#6A1B9A] mt-1">2+ compras</p>
              </div>
            </div>

            <span className="text-2xl text-[#64748b] font-bold">→</span>

            <div className="text-center flex-1 min-w-32">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-2">Stage 4</p>
              <div className="px-3 py-2 rounded-lg bg-[#F0F4F3] border border-[#00C853]">
                <p className="text-sm font-bold text-[#001a0f]">High Value</p>
                <p className="text-xs text-[#00C853] mt-1">VIP</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#1a1a1a]">
              <span className="font-bold">Estratégia:</span> Clientes evoluem naturalmente através dos estágios. O papel do CRM é acelerar essa progressão através de jornadas segmentadas, removendo fricção e aumentando incentivos conforme o cliente demonstra valor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
