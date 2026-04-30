"use client";

import { useState } from "react";
import { TrendingUp, AlertCircle, MessageSquare, Send, Phone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  formatBRNumber,
  parseNumber,
  parseBoolean,
  getColumnValue,
  calculatePercentage,
} from "@/lib/segmentation";
import type { ClienteRow } from "@/lib/types";

const SEGMENT_CONFIG: Record<string, { bg: string; accent: string; text: string; name: string; coverage: number }> = {
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1", name: "Aprovados Não Ativados", coverage: 0 },
  "potencial": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723", name: "Potencial (1 compra)", coverage: 0 },
  "recorrentes": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C", name: "Recorrentes (2+ compras)", coverage: 0 },
  "ume-plus": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f", name: "Ume Plus", coverage: 0 },
  "negados-recuperaveis": { bg: "#FFF9C4", accent: "#FBC02D", text: "#F57F17", name: "Negados Recuperáveis (Score 300-400)", coverage: 0 },
  "negados-alto-risco": { bg: "#FFEBEE", accent: "#E53935", text: "#B71C1C", name: "Negados Alto Risco (Score <300)", coverage: 0 },
  "inadimplentes": { bg: "#FCE4EC", accent: "#C2185B", text: "#880E4F", name: "Inadimplentes", coverage: 0 },
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
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) + "%";
}

// Calculate segment sizes from raw data
function calculateSegmentSizes(clientesData: ClienteRow[]) {
  if (!clientesData || clientesData.length === 0) {
    return {
      "aprovados-nao-ativados": 0,
      "potencial": 0,
      "recorrentes": 0,
      "ume-plus": 0,
      "negados-recuperaveis": 0,
      "negados-alto-risco": 0,
      "inadimplentes": 0,
    };
  }

  const sizes = {
    "aprovados-nao-ativados": 0,
    "potencial": 0,
    "recorrentes": 0,
    "ume-plus": 0,
    "negados-recuperaveis": 0,
    "negados-alto-risco": 0,
    "inadimplentes": 0,
  };

  clientesData.forEach((cliente) => {
    const situacao = String(getColumnValue(cliente, ["situação", "situacao", "status"]) || "").toLowerCase().trim();
    const compras = parseNumber(getColumnValue(cliente, ["qtd de compras", "compras"])) || 0;
    const score = parseNumber(getColumnValue(cliente, ["score de crédito", "score"])) || 0;

    // Inadimplentes
    if (situacao === "inadimplente") {
      sizes["inadimplentes"]++;
    }
    // Negados
    else if (situacao === "negada") {
      if (score >= 300 && score < 400) {
        sizes["negados-recuperaveis"]++;
      } else if (score < 300) {
        sizes["negados-alto-risco"]++;
      } else {
        sizes["negados-alto-risco"]++; // Default to alto risco if score >= 400
      }
    }
    // Approved (Adimplente or other)
    else {
      if (compras === 0) {
        sizes["aprovados-nao-ativados"]++;
      } else if (compras === 1) {
        sizes["potencial"]++;
      } else if (compras === 2) {
        sizes["recorrentes"]++;
      } else if (compras >= 3) {
        sizes["ume-plus"]++;
      }
    }
  });

  return sizes;
}

export function JornadaTab() {
  const { clientesData } = useData();
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<"all" | "baixo" | "medio" | "alto">("all");

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">Envie a Base de Clientes para visualizar a jornada recomendada.</p>
      </div>
    );
  }

  const segmentSizes = calculateSegmentSizes(clientesData);
  const totalClientes = clientesData.length;

  // Journey definitions - 7 segments covering 100%
  const journeys = [
    {
      id: "aprovados-nao-ativados",
      name: "Aprovados Não Ativados",
      size: segmentSizes["aprovados-nao-ativados"],
      objetivo: "Gerar primeira compra",
      trigger: "Cliente aprovado + 0 compras",
      timeline: ["D0", "D1", "D3", "D7", "D14"],
      channels: ["sms", "whatsapp"],
      fluxo: ["SMS", "WhatsApp", "SMS", "WhatsApp", "SMS"],
      scoreBased: {
        baixo: [
          { momento: "D0", canal: "SMS", mensagem: "Oi [NOME]! Seu crédito Ume foi aprovado. Use com inteligência: parcele só o que cabe na sua próxima renda. Veja: [LINK]", acao: "Educação responsável" },
          { momento: "D3", canal: "SMS", mensagem: "Dica: comece com uma compra pequena para ganhar confiança. Seu limite de R$[LIMITE] está pronto.", acao: "Primeira compra" },
        ],
        alto: [
          { momento: "D0", canal: "SMS", mensagem: "Parabéns! Você foi pré-aprovado com R$[LIMITE] — limite acima da média. Aproveite em até 12x: [LINK]", acao: "Reconhecimento" },
          { momento: "D3", canal: "SMS", mensagem: "[NOME], seu crédito Ume está liberado. Compre em 50+ lojas sem cartão.", acao: "Call to action" },
        ],
      },
      detalhamentoPadrao: [
        { momento: "D0", canal: "SMS", mensagem: "Parabéns! Seu crédito Ume de R$[LIMITE] está liberado. Compre em 50+ lojas perto de você.", acao: "Reconhecimento" },
        { momento: "D1", canal: "WhatsApp", mensagem: "Oi [NOME]! Seus R$[LIMITE] estão prontos. Veja as lojas Ume aqui perto: [LINK]", acao: "Visualizar varejos" },
        { momento: "D7", canal: "SMS", mensagem: "[NOME], seu crédito Ume ainda não foi usado. Compre em até 12x sem precisar de cartão.", acao: "Lembrete" },
      ],
      resultadoEsperado: ["Aumento de ativação (primeira compra)", "Conversão para cliente ativo"],
    },
    {
      id: "potencial",
      name: "Potencial (1 compra)",
      size: segmentSizes["potencial"],
      objetivo: "Gerar segunda compra (criar hábito)",
      trigger: "Cliente com 1 compra",
      timeline: ["D0", "D7", "D14", "D30"],
      channels: ["sms", "whatsapp"],
      fluxo: ["WhatsApp", "SMS", "WhatsApp", "SMS"],
      scoreBased: {
        baixo: [
          { momento: "D0", canal: "WhatsApp", mensagem: "Parabéns pela primeira compra! Você aprendeu a usar a Ume com segurança. Próxima compra em [DATA]: [LINK]", acao: "Reforço positivo" },
          { momento: "D14", canal: "SMS", mensagem: "[NOME], use seu crédito de forma responsável. Temos R$[LIMITE_RESTANTE] disponíveis pra você.", acao: "Educação + uso" },
        ],
        alto: [
          { momento: "D0", canal: "WhatsApp", mensagem: "Sucesso na primeira compra! Você tem R$[LIMITE_RESTANTE] sobrando em mais de 50 lojas Ume.", acao: "Cross-loja" },
          { momento: "D14", canal: "SMS", mensagem: "Boa compra, [NOME]! Parcelar em até 12x na Ume rende juro abaixo do cartão.", acao: "Value prop" },
        ],
      },
      detalhamentoPadrao: [
        { momento: "D0", canal: "WhatsApp", mensagem: "Parabéns! Primeira compra realizada com sucesso na Ume.", acao: "Reconhecimento" },
        { momento: "D7", canal: "SMS", mensagem: "[NOME], você ainda tem R$[LIMITE_RESTANTE] de crédito. Use em qualquer loja Ume.", acao: "Reminder" },
      ],
      resultadoEsperado: ["Aumento de frequência (2+ compras)", "Criação de hábito"],
    },
    {
      id: "recorrentes",
      name: "Recorrentes (2+ compras)",
      size: segmentSizes["recorrentes"],
      objetivo: "Aumentar frequência e ticket",
      trigger: "Cliente com 2+ compras",
      timeline: ["D0", "D15", "D30", "D60", "D90"],
      channels: ["sms", "whatsapp"],
      fluxo: ["SMS", "WhatsApp", "SMS", "WhatsApp", "SMS"],
      detalhamentoPadrao: [
        { momento: "D0", canal: "SMS", mensagem: "Compra registrada! Você tem R$[LIMITE_RESTANTE] disponível.", acao: "Reconhecimento" },
        { momento: "D15", canal: "WhatsApp", mensagem: "Seu histórico tá bom! Limite pode aumentar em breve: [LINK]", acao: "Antecipação" },
        { momento: "D30", canal: "SMS", mensagem: "[NOME], em 30 dias você usou R$[GMV] com taxa abaixo do cartão. Continue!", acao: "Retenção por valor" },
        { momento: "D60", canal: "WhatsApp", mensagem: "Bom histórico = limite maior. Seu novo limite: R$[NOVO_LIMITE]. Use onde quiser.", acao: "Benefício real" },
        { momento: "D90", canal: "SMS", mensagem: "Em 90 dias, você economizou R$[ECONOMIA] usando Ume. Parabéns!", acao: "Retenção acumulada" },
      ],
      resultadoEsperado: ["Aumento de frequência", "Aumento de ticket médio", "~24 toques/ano (não 60)"],
    },
    {
      id: "ume-plus",
      name: "Ume Plus",
      size: segmentSizes["ume-plus"],
      objetivo: "Retenção e maximizar LTV",
      trigger: "3+ compras + score alto",
      timeline: ["D0", "D30", "D60", "D90", "D180"],
      channels: ["whatsapp", "sms"],
      fluxo: ["WhatsApp", "SMS", "WhatsApp", "SMS", "WhatsApp"],
      detalhamentoPadrao: [
        { momento: "D0", canal: "WhatsApp", mensagem: "[NOME], limite aumentado automaticamente para R$[NOVO_LIMITE] pelo seu histórico impecável.", acao: "Reconhecimento automático" },
        { momento: "D30", canal: "SMS", mensagem: "Você pagou R$[PARCELAS_PAGAS] em parcelas no mês. Taxa: [TAXA_CLIENTE]% — abaixo da média.", acao: "ROI financeiro" },
        { momento: "D60", canal: "WhatsApp", mensagem: "[NOME], você pode antecipar parcelas com [X]% desconto. Economize R$[ECONOMIA_POTENCIAL]: [LINK]", acao: "Liquidez ao cliente" },
        { momento: "D90", canal: "SMS", mensagem: "Em 90 dias: R$[GMV_90D] em compras, score [NOVO_SCORE] (era [SCORE_ANTERIOR]). Você cresceu!", acao: "Gamificação" },
        { momento: "D180", canal: "WhatsApp", mensagem: "[NOME], você economizou R$[ECONOMIA_SEMESTRAL] vs. cartão tradicional. Atendimento prioritário disponível: [LINK]", acao: "Tier VIP confirmado" },
      ],
      resultadoEsperado: ["Maximização de LTV", "Redução de churn em alto valor", "Advocacy e indicações"],
    },
    {
      id: "negados-recuperaveis",
      name: "Negados Recuperáveis",
      size: segmentSizes["negados-recuperaveis"],
      objetivo: "Educação financeira + reaplicação",
      trigger: "Situação = Negada + Score 300-400",
      timeline: ["D0", "D30", "D90"],
      channels: ["sms"],
      fluxo: ["SMS", "SMS", "SMS"],
      detalhamentoPadrao: [
        { momento: "D0", canal: "SMS", mensagem: "Sua solicitação Ume não foi aprovada agora. Seu score pode subir: [LINK_EDUCACAO]", acao: "Educação financeira" },
        { momento: "D30", canal: "SMS", mensagem: "Dica: pagar contas em dia por 60 dias aumenta seu score. Reaplique na Ume em [DATA]: [LINK]", acao: "Reaplicação" },
        { momento: "D90", canal: "SMS", mensagem: "Seu perfil pode ter mudado. Refaça sua solicitação Ume em 3 min: [LINK]", acao: "Reconversão" },
      ],
      resultadoEsperado: ["5-10% de reaplicação aprovada em 90 dias"],
    },
    {
      id: "negados-alto-risco",
      name: "Negados Alto Risco",
      size: segmentSizes["negados-alto-risco"],
      objetivo: "Contenção de custo",
      trigger: "Situação = Negada + Score <300",
      timeline: ["D0"],
      channels: ["sms"],
      fluxo: ["SMS"],
      detalhamentoPadrao: [
        { momento: "D0", canal: "SMS", mensagem: "Ume: solicitação não aprovada. Tente novamente em 6 meses: [LINK_DICAS]", acao: "Sem follow-up" },
      ],
      resultadoEsperado: ["Contenção de custo"],
    },
    {
      id: "inadimplentes",
      name: "Inadimplentes",
      size: segmentSizes["inadimplentes"],
      objetivo: "Recuperar valor + regularização",
      trigger: "Situação = Inadimplente",
      timeline: ["D1", "D7", "D15", "D30"],
      channels: ["whatsapp", "sms"],
      fluxo: ["WhatsApp", "WhatsApp", "SMS", "SMS"],
      detalhamentoPadrao: [
        { momento: "D1", canal: "WhatsApp", mensagem: "Oi [NOME], notamos uma parcela em aberto. Posso ajudar com desconto? Responda SIM", acao: "Oportunidade" },
        { momento: "D7", canal: "WhatsApp", mensagem: "[NOME], temos opções de parcelamento da dívida com até [X]% de desconto: [LINK]", acao: "Negociação" },
        { momento: "D15", canal: "SMS", mensagem: "Regularize sua pendência e mantenha seu score. Negocie em: [LINK]", acao: "Urgência" },
        { momento: "D30", canal: "SMS", mensagem: "Última chance com desconto. Após esta data, score sofrerá impacto: [LINK]", acao: "Final" },
      ],
      resultadoEsperado: ["15-25% de recuperação parcial"],
    },
  ];

  // Calculate total coverage and percentages
  const totalSegments = journeys.reduce((sum, j) => sum + j.size, 0);
  const coverage = ((totalSegments / totalClientes) * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Jornada do Cliente</h1>
        <p className="text-sm text-[#64748b] mt-2">
          Estratégia de CRM segmentada para todos os 7 segmentos — cobertura {coverage}% da base ({formatNumber(totalClientes)} clientes).
        </p>
      </div>

      {/* Coverage Tag */}
      <div className="bg-gradient-to-r from-[#E3F2FD] to-[#F3E5F5] border border-[#2196F3]/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748b] uppercase">Cobertura da Base</p>
            <p className="text-xl font-bold text-[#1a1a1a] mt-1">{coverage}% ({formatNumber(totalSegments)} de {formatNumber(totalClientes)} clientes)</p>
          </div>
          <Users className="h-12 w-12 text-[#2196F3] opacity-20" />
        </div>
      </div>

      {/* Score Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedScoreFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedScoreFilter === "all"
              ? "bg-[#2196F3] text-white"
              : "bg-[#E2E8F0] text-[#64748b] hover:bg-[#D0D8E0]"
          }`}
        >
          Todos os Scores
        </button>
        <button
          onClick={() => setSelectedScoreFilter("baixo")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedScoreFilter === "baixo"
              ? "bg-[#E53935] text-white"
              : "bg-[#E2E8F0] text-[#64748b] hover:bg-[#D0D8E0]"
          }`}
        >
          Score Baixo (&lt;400)
        </button>
        <button
          onClick={() => setSelectedScoreFilter("alto")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedScoreFilter === "alto"
              ? "bg-[#00C853] text-white"
              : "bg-[#E2E8F0] text-[#64748b] hover:bg-[#D0D8E0]"
          }`}
        >
          Score Alto (≥700)
        </button>
      </div>

      {/* 7 Segment Cards */}
      <div className="grid grid-cols-1 gap-6">
        {journeys.map((journey) => {
          const config = SEGMENT_CONFIG[journey.id];
          const percentage = ((journey.size / totalClientes) * 100).toFixed(1);

          return (
            <Card key={journey.id} className={`border-l-4`} style={{ borderLeftColor: config.accent, backgroundColor: config.bg }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg" style={{ color: config.text }}>
                      {journey.name}
                    </CardTitle>
                    <p className="text-xs mt-1" style={{ color: config.text, opacity: 0.8 }}>
                      {formatNumber(journey.size)} clientes ({percentage}% da base)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#64748b] font-semibold">Objetivo</p>
                    <p className="text-[#1a1a1a] font-medium mt-1">{journey.objetivo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-semibold">Trigger</p>
                    <p className="text-[#1a1a1a] font-medium mt-1 text-xs">{journey.trigger}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-semibold">Timeline</p>
                    <p className="text-[#1a1a1a] font-medium mt-1 text-xs">{journey.timeline.join(" → ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-semibold">Canais</p>
                    <p className="text-[#1a1a1a] font-medium mt-1 text-xs">{journey.channels.join(", ").toUpperCase()}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  <p className="text-xs text-[#64748b] font-semibold uppercase">Fluxo de Mensagens</p>
                  {journey.scoreBased && selectedScoreFilter !== "all" ? (
                    journey.scoreBased[selectedScoreFilter as "baixo" | "alto"]?.map((msg, idx) => (
                      <div key={idx} className="text-xs bg-white/60 p-2 rounded border border-[#E2E8F0]">
                        <p className="font-medium text-[#1a1a1a]">{msg.momento} ({msg.canal})</p>
                        <p className="text-[#64748b] mt-1 italic">"{msg.mensagem}"</p>
                      </div>
                    ))
                  ) : (
                    journey.detalhamentoPadrao.map((msg, idx) => (
                      <div key={idx} className="text-xs bg-white/60 p-2 rounded border border-[#E2E8F0]">
                        <p className="font-medium text-[#1a1a1a]">{msg.momento} ({msg.canal})</p>
                        <p className="text-[#64748b] mt-1 italic">"{msg.mensagem}"</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Expected Results */}
                <div className="bg-white/40 p-2 rounded border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748b] font-semibold uppercase mb-1">Resultado Esperado</p>
                  <ul className="text-xs text-[#1a1a1a] space-y-0.5">
                    {journey.resultadoEsperado.map((resultado, idx) => (
                      <li key={idx}>• {resultado}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Checklist */}
      <Card className="border-[#E2E8F0] bg-[#F7FAF8]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#64748b] uppercase">Checklist de Implementação</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-[#1a1a1a]">
          <p>✓ Soma de tamanhos dos 7 segmentos = {formatNumber(totalSegments)} clientes</p>
          <p>✓ Negados recebem APENAS SMS (custo controlado em ~R${(segmentSizes["negados-recuperaveis"] * 0.03 + segmentSizes["negados-alto-risco"] * 0.03).toFixed(0)})</p>
          <p>✓ Mensagens de Inadimplentes nunca mencionam "VIP" ou "Plus"</p>
          <p>✓ Score baixo NUNCA recebe oferta de aumento de limite</p>
          <p>✓ Personalização por score aplicada em {(selectedScoreFilter !== "all" ? "3 segmentos" : "0 segmentos")} de aprovados</p>
        </CardContent>
      </Card>

      {/* Behavioral Triggers Section */}
      <div className="border-t border-[#E2E8F0] pt-8">
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Gatilhos Comportamentais (Event-Based)</h2>
        <p className="text-sm text-[#64748b] mb-6">
          Estes eventos têm prioridade sobre a jornada time-based. Quando ambos disparam no mesmo dia, envie apenas a mensagem do gatilho.
        </p>

        <div className="grid grid-cols-1 gap-6">
          {/* Trigger A: Abandono de Carrinho */}
          <Card className="border-l-4" style={{ borderLeftColor: "#FF9800", backgroundColor: "#FFF3E0" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho A: Abandono de Carrinho/Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Cliente clicou em mensagem ou abriu app, mas não completou compra em 24h</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Potencial, Recorrentes, Ume Plus</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">FLUXO</p>
                <ul className="text-sm text-[#1a1a1a] space-y-2">
                  <li>• <strong>24h:</strong> WhatsApp — "Vi que você estava de olho em uma compra. Seu crédito Ume de R$[LIMITE] segue disponível — finalize aqui: [LINK]"</li>
                  <li>• <strong>72h (se não converteu):</strong> SMS — "[NOME], seu crédito Ume continua reservado. Finalize a compra: [LINK]"</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Recuperação de ~10-15% dos abandonos</p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger B: Inatividade Prolongada */}
          <Card className="border-l-4" style={{ borderLeftColor: "#E53935", backgroundColor: "#FFEBEE" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho B: Inatividade Prolongada (Churn Precoce)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Recorrente ou Ume Plus sem compra há 60 dias (ajustável)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Recorrentes, Ume Plus</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">MENSAGEM</p>
                <p className="text-sm text-[#1a1a1a]"><strong>WhatsApp:</strong> "[NOME], faz [N] dias que você não usa a Ume. Seu limite de R$[LIMITE] continua aqui. Algo mudou? [LINK_FAQ_OU_SUPORTE]"</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Recuperação de ~5-8% dos inátivos</p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger C: Aproximação de Vencimento */}
          <Card className="border-l-4" style={{ borderLeftColor: "#1976D2", backgroundColor: "#E3F2FD" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho C: Aproximação de Vencimento de Parcela</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Parcela vence em 3 dias</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Todos os aprovados (com parcelas ativas)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">MENSAGEM</p>
                <p className="text-sm text-[#1a1a1a]"><strong>Push (se tem app) ou SMS:</strong> "Sua parcela Ume de R$[VALOR] vence em 3 dias. Pague ou antecipe com desconto: [LINK]"</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Redução de inadimplência, aumento de antecipações</p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger D: Primeiro Uso de Novo Varejo */}
          <Card className="border-l-4" style={{ borderLeftColor: "#9C27B0", backgroundColor: "#F3E5F5" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho D: Primeiro Uso de Novo Varejo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Cliente compra em varejo Ume novo na rede</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Recorrentes, Ume Plus</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">MENSAGEM</p>
                <p className="text-sm text-[#1a1a1a]"><strong>Push:</strong> "Bem-vindo à [VAREJO]! Você acabou de descobrir mais um lugar pra usar Ume."</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Cross-loja de 8-12%, diversificação de uso</p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger E: Aumento Automático de Limite */}
          <Card className="border-l-4" style={{ borderLeftColor: "#00C853", backgroundColor: "#F0F4F3" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho E: Aumento Automático de Limite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Limite total foi aumentado pelo motor de crédito</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Todos os aprovados (com histórico positivo)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">MENSAGEM</p>
                <p className="text-sm text-[#1a1a1a]"><strong>WhatsApp:</strong> "Boas notícias [NOME]: seu limite Ume passou de R$[LIMITE_ANTIGO] para R$[LIMITE_NOVO] pelo seu bom histórico. Use onde quiser: [LINK]"</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Aumento de AOV 15-25%, retenção reforçada</p>
              </div>
            </CardContent>
          </Card>

          {/* Trigger F: Recuperação Pós-Inadimplência */}
          <Card className="border-l-4" style={{ borderLeftColor: "#FBC02D", backgroundColor: "#FFF9C4" }}>
            <CardHeader>
              <CardTitle className="text-lg">Gatilho F: Recuperação Pós-Inadimplência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">TRIGGER</p>
                <p className="text-sm text-[#1a1a1a]">Cliente que estava Inadimplente regularizou</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">SEGMENTOS APLICÁVEIS</p>
                <p className="text-sm text-[#1a1a1a]">Inadimplentes (transição para ativo)</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">FLUXO</p>
                <ul className="text-sm text-[#1a1a1a] space-y-2">
                  <li>• <strong>SMS:</strong> "[NOME], débito quitado! Seu crédito Ume está reativado com limite de R$[NOVO_LIMITE]. Bom retorno!"</li>
                  <li>• <strong>WhatsApp (1 dia depois):</strong> "Bem-vindo de volta! Seu histórico limpo abre oportunidades. Comece sua jornada Ume novamente: [LINK]"</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">RESULTADO ESPERADO</p>
                <p className="text-sm text-[#1a1a1a]">Retenção de ~40-50% dos recuperados, reativação suave</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
