"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";

// ============================================================================
// Q5 CRÉDITO — Política de crédito proposta
// 
// Headcount e upside derivados da Base de Clientes (200.592 registros).
// Critérios de elegibilidade explicitados em cada regra.
// 
// Premissa de CAC: R$ 50/cliente é aplicado por SOLICITAÇÃO PROCESSADA
// (inclui custo de promotor/vendedor mesmo em casos negados). Por isso
// a base negada carrega R$ 7,59M de CAC sem retorno — é a alavanca de
// melhoria isolada mais relevante da operação.
// ============================================================================

// FORMATTERS
function formatNum(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatBRL(value: number, decimals: number = 1): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(abs / 1_000_000)} M`;
  } else if (abs >= 1_000) {
    formatted = `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(abs / 1_000)} mil`;
  } else {
    formatted = `R$ ${Math.round(abs)}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

// ============================================================================
// COMPONENT
// ============================================================================
export function CreditoTab() {
  const { clientesData } = useData();

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          Envie a Base de Clientes na aba Aquisição para visualizar a política de crédito.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TÍTULO */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Política de Crédito</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Como ajustar critérios de aprovação, limite e taxa para liberar margem sem aumentar risco.
        </p>
      </div>

      {/* HEADLINE — Card de impacto principal */}
      <Card className="border-2 border-[#00C853] bg-[#E8F5E9]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20]">
                Diagnóstico Central
              </p>
              <p className="text-lg font-bold text-[#1a1a1a] mt-1">
                Hoje 26,3% dos adimplentes receberam aumento de limite — limite virou gargalo, não risco.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Hoje</p>
                  <p className="text-2xl font-bold text-[#475569]">26,3%</p>
                  <p className="text-xs text-[#64748b]">11.343 de 43.188 adimplentes</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Meta sugerida</p>
                  <p className="text-2xl font-bold text-[#00C853]">50%</p>
                  <p className="text-xs text-[#64748b]">+10.251 clientes elegíveis</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Upside estimado</p>
                  <p className="text-2xl font-bold text-[#00C853]">R$ 1,1 M</p>
                  <p className="text-xs text-[#64748b]">juros incrementais/ano</p>
                </div>
              </div>
              <p className="text-xs text-[#1a1a1a] mt-4 leading-relaxed">
                <strong className="uppercase tracking-wider text-[10px] text-[#64748b]">Implicação:</strong>{" "}
                Ume Plus tem score médio 848 e limite médio de R$ 1.112 — adimplentes premium estão com
                limite menor que o segmento Potencial em alguns casos. A política de crédito atual é
                conservadora demais com quem já provou pagar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PREMISSA CAC */}
      <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9] p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1">
          Premissa metodológica
        </p>
        <p className="text-xs text-[#1a1a1a] leading-relaxed">
          <strong>CAC R$ 50/cliente é aplicado por solicitação processada</strong> — inclui custo de
          promotor/vendedor mesmo em casos negados. Por isso a base negada carrega{" "}
          <strong className="text-[#EF4444]">R$ 7,59 M de CAC sem retorno</strong> (151.855 negados × R$ 50).
          É a alavanca de melhoria isolada mais relevante da operação — refinar pré-aprovação reduz
          desperdício direto.
        </p>
      </div>

      {/* DIAGNÓSTICO DA POLÍTICA ATUAL */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Diagnóstico da Política Atual (inferido da base)</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Sem acesso ao manual interno, os 5 traços abaixo são lidos diretamente dos dados — eles
            descrevem como a política de crédito da Ume opera hoje, na prática.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Traço 1 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Traço 01 — Aprovação binária</p>
              <p className="text-sm font-bold text-[#1a1a1a] mt-1">Cutoff rígido em score 400</p>
              <p className="text-xs text-[#475569] mt-1">
                Sem zona cinzenta. Aprovados começam em score 400, negados terminam em 399. Não há aprovação condicional ou avaliação manual.
              </p>
            </div>

            {/* Traço 2 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Traço 02 — Limite não escala</p>
              <p className="text-sm font-bold text-[#1a1a1a] mt-1">~R$ 730 médio em todas as faixas de score</p>
              <p className="text-xs text-[#475569] mt-1">
                Score 500 → R$ 729 | Score 700 → R$ 726 | Score 900+ → R$ 727. Cliente AAA recebe o mesmo limite de cliente C. Score só decide aprovar/negar, não dimensiona.
              </p>
            </div>

            {/* Traço 3 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Traço 03 — Taxa flat</p>
              <p className="text-sm font-bold text-[#1a1a1a] mt-1">~11,5% a.m. para todo aprovado</p>
              <p className="text-xs text-[#475569] mt-1">
                Score 500 → 11,45% | Score 900+ → 11,50%. Política não é risk-based. Cobra demais de cliente premium e de menos de cliente arriscado.
              </p>
            </div>

            {/* Traço 4 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Traço 04 — Aumento por histórico</p>
              <p className="text-sm font-bold text-[#1a1a1a] mt-1">Dirigido por compras, não por score</p>
              <p className="text-xs text-[#475569] mt-1">
                Quem recebeu aumento tem 15,9 compras médias. Quem não recebeu, 1,7. Score idêntico nos dois grupos (775). Política só aumenta para quem provou na prática.
              </p>
            </div>

            {/* Traço 5 — DESTAQUE VERMELHO */}
            <div className="rounded border-l-4 border-[#EF4444] bg-[#FEF2F2] p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#991B1B]">Traço 05 — Zona morta da política</p>
                  <p className="text-sm font-bold text-[#1a1a1a] mt-1">
                    Score 400-549: 2.351 aprovados, <span className="text-[#EF4444]">100% inadimplência</span>
                  </p>
                  <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                    Adimplentes começam em score <strong>550</strong>, não em 400. Os 2.351 clientes aprovados na faixa
                    400-549 viraram <strong>todos</strong> inadimplentes — perda direta de <strong className="text-[#EF4444]">R$ 1,09 M</strong>{" "}
                    (R$ 117k CAC + R$ 975k perda de saldo). O cutoff atual está calibrado <strong>150 pontos abaixo</strong> do
                    ponto onde a base efetivamente paga.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#1a1a1a] rounded text-xs text-white leading-relaxed">
            <strong className="text-[#00C853]">Síntese:</strong>{" "}
            Política atual reduz tudo a uma decisão binária baseada em score, sem precificar risco nem dimensionar limite.
            O cutoff é frouxo (perda direta de R$ 1,09 M na zona 400-549) e a taxa/limite são uniformes (deixa receita na mesa em
            AAA, exposição em B/C). Cada uma das 4 regras propostas a seguir endereça um traço específico desse diagnóstico.
          </div>
        </CardContent>
      </Card>

      {/* 4 REGRAS — Grid 2x2 */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>4 Regras de Política de Crédito</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Critérios derivados da base — cada regra com headcount elegível e upside estimado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* REGRA 1 */}
            <div className="rounded border-l-4 border-[#00C853] bg-[#E8F5E9]/40 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider">
                  Regra 01 — Expansão
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#00C853]/20 text-[#1B5E20]">
                  Upside Alto
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
                💎 Aumento automático de limite
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Critério</p>
                  <p className="text-[#1a1a1a]">
                    Adimplente + ≥4 compras + recência ≤60d + score ≥700
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Ação</p>
                  <p className="text-[#1a1a1a]">+30% no limite, sem solicitação do cliente</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#00C853]/20">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Elegíveis</p>
                    <p className="text-lg font-bold text-[#00C853]">4.686</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Upside/ano</p>
                    <p className="text-lg font-bold text-[#00C853]">R$ 258 mil</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] italic mt-1">
                  Limite médio atual: R$ 1.112 | Score médio: 848 | 13,2 compras médias
                </p>
              </div>
            </div>

            {/* REGRA 2 */}
            <div className="rounded border-l-4 border-[#66BB6A] bg-[#F1F8E9]/40 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">
                  Regra 02 — Retenção
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#66BB6A]/20 text-[#2E7D32]">
                  Upside Médio
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
                🔁 Reativação de inativos
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Critério</p>
                  <p className="text-[#1a1a1a]">
                    Adimplente sem compra recente — segmentação por janela de inatividade
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Ação</p>
                  <p className="text-[#1a1a1a]">
                    90-180d: WhatsApp + SMS | &gt;180d: SMS only (custo controlado)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#66BB6A]/20">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Elegíveis</p>
                    <p className="text-lg font-bold text-[#2E7D32]">11.540</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Upside/ano</p>
                    <p className="text-lg font-bold text-[#2E7D32]">R$ 48 mil</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] italic mt-1">
                  4.641 entre 90-180d | 6.899 acima de 180d | 8% conversão estimada
                </p>
              </div>
            </div>

            {/* REGRA 3 */}
            <div className="rounded border-l-4 border-[#9CCC65] bg-[#F9FBE7]/40 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#558B2F] uppercase tracking-wider">
                  Regra 03 — Fidelização
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#9CCC65]/20 text-[#558B2F]">
                  Trade-off
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
                🎯 Ajuste de taxa por perfil
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Critério</p>
                  <p className="text-[#1a1a1a]">Score ≥800 + ≥6 compras adimplentes</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Ação</p>
                  <p className="text-[#1a1a1a]">
                    Reduzir taxa 1-2pp para retenção (de ~11,5% para ~10% a.m.)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#9CCC65]/20">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Elegíveis</p>
                    <p className="text-lg font-bold text-[#558B2F]">7.006</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Impacto</p>
                    <p className="text-sm font-bold text-[#558B2F]">Retenção LTV+</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] italic mt-1">
                  Trade: -10% receita juros unitário compensado por +retenção. Defesa contra concorrentes.
                </p>
              </div>
            </div>

            {/* REGRA 4 */}
            <div className="rounded border-l-4 border-[#475569] bg-[#F1F5F9]/60 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Regra 04 — Funil pré-aprovação
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#475569]/20 text-[#0F172A]">
                  Maior alavanca
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
                📋 Política de negados (escala)
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Score 300-449 → Reaplicação</p>
                  <p className="text-[#1a1a1a]">Reaplicar em 90 dias se score subiu — 5% conversão estimada</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Score &lt;300 → Bloqueio</p>
                  <p className="text-[#1a1a1a]">Bloquear nova solicitação por 6 meses — corta CAC desperdiçado</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#475569]/20">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Elegíveis (total)</p>
                    <p className="text-lg font-bold text-[#0F172A]">151.855</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Upside/ano</p>
                    <p className="text-lg font-bold text-[#0F172A]">R$ 323 mil</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] italic mt-1">
                  101k score 300-449 (reaplicar) + 51k score &lt;300 (bloqueio) | reduz R$ 2,5M CAC desperdiçado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABELA CONSOLIDADA */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Resumo Operacional — Priorização</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Visão consolidada: tamanho do segmento × upside × esforço de implementação.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0]">
                  <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Regra</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Elegíveis</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Upside/ano</th>
                  <th className="text-center py-2 px-2 font-semibold text-[#64748b]">Risco</th>
                  <th className="text-center py-2 px-2 font-semibold text-[#64748b]">Esforço</th>
                  <th className="text-center py-2 px-2 font-semibold text-[#1a1a1a]">Prioridade</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E8F0] bg-[#E8F5E9]/30">
                  <td className="py-2 px-2 font-medium">💎 R1 — Aumento de limite</td>
                  <td className="py-2 px-2 text-right">4.686</td>
                  <td className="py-2 px-2 text-right text-[#00C853] font-bold">R$ 258 mil</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#00C853] text-white text-[10px] font-bold">P1</span>
                  </td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]/40">
                  <td className="py-2 px-2 font-medium">📋 R4 — Funil de negados</td>
                  <td className="py-2 px-2 text-right">151.855</td>
                  <td className="py-2 px-2 text-right text-[#0F172A] font-bold">R$ 323 mil</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px]">Médio</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#00C853] text-white text-[10px] font-bold">P1</span>
                  </td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F9FBE7]/40">
                  <td className="py-2 px-2 font-medium">🎯 R3 — Ajuste de taxa</td>
                  <td className="py-2 px-2 text-right">7.006</td>
                  <td className="py-2 px-2 text-right text-[#558B2F] font-bold">Retenção+</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px]">Médio</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#94A3B8] text-white text-[10px] font-bold">P2</span>
                  </td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F1F8E9]/40">
                  <td className="py-2 px-2 font-medium">🔁 R2 — Reativação</td>
                  <td className="py-2 px-2 text-right">11.540</td>
                  <td className="py-2 px-2 text-right text-[#2E7D32] font-bold">R$ 48 mil</td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] text-[10px]">Baixo</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#94A3B8] text-white text-[10px] font-bold">P2</span>
                  </td>
                </tr>
                <tr className="bg-[#1a1a1a] text-white font-bold border-t-2 border-[#475569]">
                  <td className="py-3 px-2">Σ Total Programa</td>
                  <td className="py-3 px-2 text-right">175.087 elegíveis</td>
                  <td className="py-3 px-2 text-right text-[#00C853]">R$ 1,7 M+ /ano</td>
                  <td className="py-3 px-2 text-center" colSpan={3}>
                    <span className="text-xs">+ Retenção LTV (R3) + redução R$ 2,5M CAC desperdiçado (R4)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-[#F1F5F9] border border-[#94A3B8]/20 rounded text-xs text-[#475569]">
            💡 <strong>Sequência sugerida:</strong> R1 e R4 primeiro (P1) — risco baixo, alta alavancagem,
            implementação direta no funil de aprovação. R2 e R3 em fase 2 (P2) — exigem instrumentação de
            cohort tracking pra medir efeito de retenção.
          </div>
        </CardContent>
      </Card>

      {/* FOOTNOTE */}
      <div className="text-[10px] text-[#94a3b8] italic space-y-1">
        <p>* Headcount elegíveis derivado da Base de Clientes (200.592 registros) com critérios explicitados em cada regra.</p>
        <p>** Upside estimado com hipóteses conservadoras: R1 50% adesão × R$ 110 juros marginais; R2 8% conversão × R$ 130; R4 5% conversão × R$ 64.</p>
        <p>*** R3 não é quantificado em receita direta — defesa contra churn pra concorrentes.</p>
      </div>
    </div>
  );
}
