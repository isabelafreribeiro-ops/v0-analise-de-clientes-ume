"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { Target, AlertTriangle, Lightbulb, Crown, Repeat2, ClipboardList, Shield } from "lucide-react";

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
        
        {/* TESE CENTRAL */}
        <div className="mt-3 bg-[#F0FDF4]/60 border-l-2 border-l-[#00C853] rounded py-2 px-3">
          <p className="text-[10px] font-semibold text-[#00C853] uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="h-4 w-4 text-[#00C853]" /> Tese
          </p>
          <p className="text-sm italic text-[#1a1a1a] mt-1">
            A política atual deixa receita na mesa em ambos os lados — limite/taxa flat para os top, e cutoff frouxo deixa entrar 2.351 que somam R$ 1,09M de perda direta. As 4 regras corrigem ambas as pontas.
          </p>
        </div>
      </div>

      {/* DIAGNÓSTICO DA POLÍTICA ATUAL */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>Diagnóstico da Política Atual (inferido da base)</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Como a política de crédito da Ume opera hoje, lida diretamente dos dados.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* Traço 1 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Cutoff de aprovação</p>
              <p className="text-2xl font-bold text-[#1a1a1a] mt-1">Score 400</p>
              <p className="text-[11px] text-[#475569] mt-1 leading-snug">Binário — sem zona cinzenta nem revisão manual.</p>
            </div>

            {/* Traço 2 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Limite médio</p>
              <p className="text-2xl font-bold text-[#1a1a1a] mt-1">R$ 730</p>
              <p className="text-[11px] text-[#475569] mt-1 leading-snug">Em qualquer faixa de score. Score 500 = score 1000.</p>
            </div>

            {/* Traço 3 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Taxa de juros</p>
              <p className="text-2xl font-bold text-[#1a1a1a] mt-1">11,5% a.m.</p>
              <p className="text-[11px] text-[#475569] mt-1 leading-snug">Flat — não é risk-based, não premia AAA.</p>
            </div>

            {/* Traço 4 */}
            <div className="rounded border-l-4 border-[#94A3B8] bg-[#F1F5F9]/60 p-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Aumento de limite</p>
              <p className="text-2xl font-bold text-[#1a1a1a] mt-1">15,9 vs 1,7</p>
              <p className="text-[11px] text-[#475569] mt-1 leading-snug">Compras médias (com vs sem aumento). Score igual.</p>
            </div>
          </div>

          {/* Traço 5 — DESTAQUE VERMELHO (zona morta) */}
          <div className="rounded border-l-4 border-[#EF4444] bg-[#FEF2F2] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-[#EF4444]" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-[#991B1B] uppercase tracking-wider">Zona morta da política</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="text-2xl font-bold text-[#EF4444]">R$ 1,09 M</p>
                  <p className="text-xs text-[#475569]">perda direta · 2.351 clientes · 100% inadimplência</p>
                </div>
                <p className="text-[11px] text-[#1a1a1a] mt-1 leading-snug">
                  Adimplentes começam em <strong>score 550</strong>, não em 400. Cutoff calibrado <strong>150 pontos abaixo</strong> do que a base efetivamente paga.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-[#1a1a1a] rounded text-xs text-white leading-snug">
            <strong className="text-[#00C853]">Síntese:</strong>{" "}
            Aprovação binária, limite e taxa uniformes, cutoff 150pts frouxo. Cada regra a seguir endereça um traço.
          </div>
        </CardContent>
      </Card>

      {/* HEADLINE — Card de impacto principal (tese central) */}
      <Card className="border-2 border-[#00C853] bg-[#E8F5E9]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Target className="w-10 h-10 shrink-0 text-[#00C853]" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E20]">
                Tese Central
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

      {/* 4 REGRAS — Grid 2x2 */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>5 Regras de Política de Crédito</CardTitle>
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
                <Crown className="h-4 w-4 inline-block text-[#475569] mr-1" /> Aumento automático de limite
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
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Evidência</p>
                  <p className="text-xs text-[#1a1a1a]">Ume Plus tem score médio 848 mas limite médio de R$ 1.112 — pouco acima do segmento Potencial (R$ 561). Limite virou gargalo de receita, não de risco.</p>
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
                <Repeat2 className="h-4 w-4 inline-block text-[#475569] mr-1" /> Reativação de inativos
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
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Evidência</p>
                  <p className="text-xs text-[#1a1a1a]">11.540 adimplentes (26,7% da base aprovada) sem compra há 90+ dias. CAC já pago — reativar é mais barato que aquisição nova.</p>
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
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3 flex items-center gap-1">
                <Target className="w-4 h-4" /> Ajuste de taxa por perfil
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
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Evidência</p>
                  <p className="text-xs text-[#1a1a1a]">Taxa atual é flat ~11,5% em todas as faixas de score (500 → 11,45%; 900+ → 11,50%). Política não é risk-based — cliente AAA paga o mesmo que cliente B. Espaço para premiar fidelidade.</p>
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
                <ClipboardList className="h-4 w-4 inline-block text-[#475569] mr-1" /> Política de negados (escala)
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Score 300-549 → Reaplicação</p>
                  <p className="text-[#1a1a1a]">Reaplicar em 90 dias se score subir acima de 550 — 5% conversão estimada</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Score &lt;300 → Bloqueio</p>
                  <p className="text-[#1a1a1a]">Bloquear nova solicitação por 6 meses — corta CAC desperdiçado</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Evidência</p>
                  <p className="text-xs text-[#1a1a1a]">Zona morta da política (score 400-549): 2.351 aprovados, 100% inadimplência, R$ 1,09M perda direta. Cutoff atual está calibrado 150 pontos abaixo do score onde a base efetivamente paga (550).</p>
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
                  101k score 300-549 (reaplicar) + 51k score &lt;300 (bloqueio) | reduz R$ 2,5M CAC desperdiçado
                </p>
              </div>
            </div>

            {/* REGRA 05 */}
            <div className="rounded border-l-4 border-[#00C853] bg-[#E8F5E9]/40 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider">
                  Regra 05 — Cutoff
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded bg-[#00C853]/20 text-[#1B5E20]">
                  Upside Direto
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
                <Shield className="h-4 w-4 inline-block text-[#475569] mr-1" /> Subir cutoff de aprovação para score 550
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Critério</p>
                  <p className="text-[#1a1a1a]">Score &lt; 550 → Negado automático (hoje cutoff é 400)</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Ação</p>
                  <p className="text-[#1a1a1a]">Reduzir aprovação na zona 400-549 — onde 100% dos clientes aprovados viraram inadimplentes</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">Evidência</p>
                  <p className="text-xs text-[#1a1a1a]">Faixa de score 400-549 hoje tem 2.351 clientes aprovados, ZERO adimplentes e 100% inadimplência. Adimplentes da base começam em score 550. O cutoff atual (400) está 150 pontos abaixo do score onde a base efetivamente paga.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#00C853]/20">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Elegíveis (a serem reprovados)</p>
                    <p className="text-lg font-bold text-[#1B5E20]">2.351</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase">Upside/ano</p>
                    <p className="text-lg font-bold text-[#00C853]">R$ 1,09 mi</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748b] italic mt-1">
                  Lucro líquido — zero adimplente nessa faixa, zero perda de receita
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
                  <td className="py-2 px-2 font-medium"><Crown className="h-4 w-4 inline-block text-[#475569] mr-1" /> R1 — Aumento de limite</td>
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
                  <td className="py-2 px-2 font-medium"><ClipboardList className="h-4 w-4 inline-block text-[#475569] mr-1" /> R4 — Funil de negados</td>
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
                  <td className="py-2 px-2 font-medium"><span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> R3 — Ajuste de taxa</span></td>
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
                  <td className="py-2 px-2 font-medium"><Repeat2 className="h-4 w-4 inline-block text-[#475569] mr-1" /> R2 — Reativação</td>
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
                <tr className="border-b border-[#E2E8F0] bg-[#E8F5E9]/30">
                  <td className="py-2 px-2 font-medium"><Shield className="h-4 w-4 inline-block text-[#475569] mr-1" /> R5 — Cutoff</td>
                  <td className="py-2 px-2 text-right">2.351</td>
                  <td className="py-2 px-2 text-right text-[#00C853] font-bold">R$ 1,09 M</td>
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
                <tr className="bg-[#1a1a1a] text-white font-bold border-t-2 border-[#475569]">
                  <td className="py-3 px-2">Σ Total Programa</td>
                  <td className="py-3 px-2 text-right">178.238 elegíveis</td>
                  <td className="py-3 px-2 text-right text-[#00C853]">R$ 2,8 M+ /ano</td>
                  <td className="py-3 px-2 text-center" colSpan={3}>
                    <span className="text-xs">+ Retenção LTV (R3) + redução R$ 2,5M CAC desperdiçado (R4)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-[#F1F5F9] border border-[#94A3B8]/20 rounded text-xs text-[#475569] flex items-start gap-2">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[#475569]" />
            <span><strong>Sequência sugerida:</strong> R1, R4 e R5 primeiro (P1) — ataque ao funil de aprovação. R2 e R3 fase 2 (P2).</span>
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
