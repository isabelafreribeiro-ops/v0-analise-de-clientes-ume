"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useData } from "@/lib/data-context";
import {
  processarBase,
  aggregateBySegment,
  calcularKpis,
  buildWhaleCurve,
  calcularParetoSummary,
  calcularInsights,
  getTopBottomClientes,
  buildWaterfallV2,
  getTopVarejos,
  SEGMENT_META,
} from "@/lib/rentabilidade";

// ============================================================================
// FORMATTERS
// ============================================================================
function formatNum(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatBRL(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
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

function formatPct(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}%`;
}

// ============================================================================
// COMPONENT
// ============================================================================
export function RentabilidadeTab() {
  const { clientesData, varejoData } = useData();
  const [varejoExpanded, setVarejoExpanded] = useState(false);

  // Empty state
  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          Envie a Base de Clientes e a Base de Varejo na aba Aquisição para visualizar a análise de
          rentabilidade.
        </p>
      </div>
    );
  }

  // === CÁLCULO PRINCIPAL — uma vez via useMemo ===
  const processed = useMemo(() => processarBase(clientesData), [clientesData]);
  const kpis = useMemo(() => calcularKpis(processed, varejoData || []), [processed, varejoData]);
  const segmentos = useMemo(() => aggregateBySegment(processed), [processed]);
  const whaleCurve = useMemo(() => buildWhaleCurve(processed), [processed]);
  const pareto = useMemo(() => calcularParetoSummary(processed), [processed]);
  const insights = useMemo(() => calcularInsights(processed, kpis), [processed, kpis]);
  const { top, bottom, topAvg, bottomAvg } = useMemo(
    () => getTopBottomClientes(processed, 10),
    [processed]
  );
  const waterfall = useMemo(() => buildWaterfallV2(processed, kpis), [processed, kpis]);
  const pctRecJurosSobreMdr = kpis.receitaMdrTotal > 0 ? kpis.receitaJurosTotal / kpis.receitaMdrTotal : 0;
  const topVarejos = useMemo(
    () => getTopVarejos(varejoData || [], pctRecJurosSobreMdr, 10),
    [varejoData, pctRecJurosSobreMdr]
  );

  return (
    <div className="space-y-6">
      {/* TÍTULO */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Rentabilidade por Cliente</h2>
        <p className="text-sm text-[#64748b] mt-1">
          P&L unitário automatizado — geradores e destruidores de valor.
        </p>
      </div>

      {/* KPIs — 4 CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <KpiCard
          label="Margem Contribuição"
          value={formatBRL(kpis.margemContribuicaoTotal)}
          sub="margem clientes"
          accent="#00C853"
          bg="#E8F5E9"
        />
        <KpiCard
          label="EBITDA Estimado"
          value={formatBRL(kpis.ebitdaEstimado)}
          sub="após custos varejo"
          accent="#66BB6A"
          bg="#F1F8E9"
        />
        <KpiCard
          label="Margem/Cliente"
          value={formatBRL(kpis.margemMediaCliente, 0)}
          sub="média da base"
          accent="#9CCC65"
          bg="#F9FBE7"
        />
        <KpiCard
          label="Destruidores"
          value={formatPct(kpis.pctDestruidores)}
          sub="destroem valor"
          accent="#EF4444"
          bg="#FEF2F2"
        />
      </div>

      {/* SEÇÃO 1: P&L UNITÁRIO POR SEGMENTO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>1. P&L Unitário por Segmento</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Decomposição da margem de contribuição por segmento. Receita de juros calculada com
            Tabela Price usando taxa e parcelas individuais de cada cliente.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0]">
                  <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Segmento</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Headcount</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Rec. MDR</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Rec. Juros</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">CAC</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Msg.</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Inadimp.</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#1a1a1a]">Margem Total</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#1a1a1a]">Margem/Cliente</th>
                </tr>
              </thead>
              <tbody>
                {segmentos.map((s) => {
                  const isTotal = s.id === "total";
                  const meta = isTotal ? null : SEGMENT_META[s.id as keyof typeof SEGMENT_META];
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-[#E2E8F0] ${
                        isTotal ? "bg-[#F1F5F9] font-bold border-t-2 border-[#94A3B8]" : ""
                      }`}
                      style={{
                        backgroundColor: !isTotal && meta ? `${meta.bg}80` : undefined,
                      }}
                    >
                      <td className="py-2 px-2 font-medium">
                        <span className="mr-1">{s.icon}</span> {s.label}
                      </td>
                      <td className="py-2 px-2 text-right">{formatNum(s.headcount)}</td>
                      <td className="py-2 px-2 text-right text-[#00C853]">
                        {s.receitaMdr > 0 ? formatBRL(s.receitaMdr) : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-[#00C853]">
                        {s.receitaJuros > 0 ? formatBRL(s.receitaJuros) : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-[#EF4444]">{formatBRL(s.cac)}</td>
                      <td className="py-2 px-2 text-right text-[#EF4444]">
                        {s.custoMsg !== 0 ? formatBRL(s.custoMsg) : "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-[#EF4444]">
                        {s.perdaInad !== 0 ? formatBRL(s.perdaInad) : "—"}
                      </td>
                      <td
                        className="py-2 px-2 text-right font-bold"
                        style={{ color: s.margemTotal >= 0 ? "#00C853" : "#EF4444" }}
                      >
                        {formatBRL(s.margemTotal)}
                      </td>
                      <td
                        className="py-2 px-2 text-right font-bold"
                        style={{ color: s.margemPorCliente >= 0 ? "#00C853" : "#EF4444" }}
                      >
                        {formatBRL(s.margemPorCliente, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded text-xs text-[#991B1B]">
            ⚠️ <strong>Premissa de Inadimplência:</strong> 80% do saldo em aberto é considerado
            perda. 20% representa recuperação esperada via cobrança (benchmark fintech BR).
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: WHALE CURVE */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>2. Concentração de Valor (Whale Curve)</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Clientes ordenados por margem decrescente. Mostra graficamente a concentração extrema de
            valor — poucos clientes geram a maior parte da margem, enquanto muitos destroem valor.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={whaleCurve} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C853" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#00C853" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="pctClientes"
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  stroke="#94A3B8"
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v) => `R$ ${(v / 1_000_000).toFixed(0)}M`}
                  stroke="#94A3B8"
                  fontSize={11}
                />
                <Tooltip
                  formatter={(value: any) => [formatBRL(value), "Margem cumulativa"]}
                  labelFormatter={(label: any) => `${Number(label).toFixed(1)}% dos clientes`}
                  contentStyle={{ fontSize: 12 }}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="margemCumulativa"
                  stroke="#00C853"
                  strokeWidth={2}
                  fill="url(#gradientGreen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-[#E8F5E9] border-l-4 border-[#00C853] rounded">
              <p className="text-[10px] font-semibold text-[#1B5E20] uppercase">Top 10%</p>
              <p className="text-lg font-bold text-[#00C853]">{formatBRL(pareto.top10pctMargem)}</p>
              <p className="text-xs text-[#64748b]">gera o caixa</p>
            </div>
            <div className="p-3 bg-[#F1F8E9] border-l-4 border-[#66BB6A] rounded">
              <p className="text-[10px] font-semibold text-[#2E7D32] uppercase">Pico em ~12%</p>
              <p className="text-lg font-bold text-[#66BB6A]">{formatBRL(pareto.picoValor)}</p>
              <p className="text-xs text-[#64748b]">margem máxima</p>
            </div>
            <div className="p-3 bg-[#FEF2F2] border-l-4 border-[#EF4444] rounded">
              <p className="text-[10px] font-semibold text-[#991B1B] uppercase">Bottom 10%</p>
              <p className="text-lg font-bold text-[#EF4444]">{formatBRL(pareto.bottom10pctMargem)}</p>
              <p className="text-xs text-[#64748b]">pior performance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3: 5 INSIGHTS */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>3. Insights-Chave de Rentabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Headline */}
          {insights[0] && (
            <div
              className="p-5 rounded border-l-4 mb-4"
              style={{ backgroundColor: insights[0].bgColor, borderLeftColor: insights[0].accentColor }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{insights[0].icon}</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: insights[0].accentColor }}>
                    Insight {insights[0].numero} — Headline
                  </p>
                  <p className="text-lg font-bold text-[#1a1a1a] mt-1">{insights[0].titulo}</p>
                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-3xl font-bold" style={{ color: insights[0].accentColor }}>
                      {insights[0].valorPrincipal}
                    </span>
                    <span className="text-lg font-semibold text-[#475569]">→ {insights[0].valorSecundario}</span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">{insights[0].subLabel}</p>
                  <p className="text-xs text-[#1a1a1a] mt-3 leading-relaxed">
                    <strong className="uppercase tracking-wider text-[10px] text-[#64748b]">Implicação:</strong>{" "}
                    {insights[0].implicacao}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4 menores em grid */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {insights.slice(1).map((i) => (
              <div
                key={i.numero}
                className="p-4 rounded border-l-4"
                style={{ backgroundColor: i.bgColor, borderLeftColor: i.accentColor }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-2xl">{i.icon}</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: i.accentColor }}>
                    Insight {i.numero}
                  </p>
                </div>
                <p className="text-xs font-bold text-[#1a1a1a] leading-snug">{i.titulo}</p>
                <p className="text-xl font-bold mt-2" style={{ color: i.accentColor }}>
                  {i.valorPrincipal}
                </p>
                <p className="text-[10px] text-[#64748b] mt-0.5">{i.subLabel}</p>
                <p className="text-[10px] text-[#1a1a1a] mt-2 leading-relaxed italic">{i.implicacao}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 4: TOP 10 / BOTTOM 10 */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>4. Top 10 e Bottom 10 — Clientes Individuais</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Os clientes que mais geram e mais destroem valor. Spread de{" "}
            {topAvg && bottomAvg && bottomAvg !== 0
              ? `${Math.abs(topAvg / bottomAvg).toFixed(1)}x`
              : "—"}{" "}
            entre média do top e bottom.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top */}
            <div className="border-l-4 border-[#00C853] bg-[#E8F5E9]/30 rounded p-3">
              <p className="text-sm font-bold text-[#1B5E20] mb-2">🏆 Top 10 — Geradores de Valor</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#00C853]/20">
                    <th className="text-left py-1 text-[#64748b]">Cliente</th>
                    <th className="text-left py-1 text-[#64748b]">Seg.</th>
                    <th className="text-right py-1 text-[#64748b]">Margem</th>
                    <th className="text-right py-1 text-[#64748b]">Comp.</th>
                    <th className="text-right py-1 text-[#64748b]">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((c, i) => (
                    <tr key={i} className="border-b border-[#00C853]/10">
                      <td className="py-1 truncate max-w-[100px]">{c.nome}</td>
                      <td className="py-1">{c.icon}</td>
                      <td className="py-1 text-right font-bold text-[#00C853]">{formatBRL(c.margem, 0)}</td>
                      <td className="py-1 text-right text-[#475569]">{c.compras}</td>
                      <td className="py-1 text-right text-[#475569]">{c.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-[#1B5E20] mt-2 font-semibold">
                Média Top 10: {formatBRL(topAvg, 0)}/cliente
              </p>
            </div>

            {/* Bottom */}
            <div className="border-l-4 border-[#EF4444] bg-[#FEF2F2]/30 rounded p-3">
              <p className="text-sm font-bold text-[#991B1B] mb-2">📉 Bottom 10 — Destruidores de Valor</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#EF4444]/20">
                    <th className="text-left py-1 text-[#64748b]">Cliente</th>
                    <th className="text-left py-1 text-[#64748b]">Seg.</th>
                    <th className="text-right py-1 text-[#64748b]">Margem</th>
                    <th className="text-right py-1 text-[#64748b]">Comp.</th>
                    <th className="text-right py-1 text-[#64748b]">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {bottom.map((c, i) => (
                    <tr key={i} className="border-b border-[#EF4444]/10">
                      <td className="py-1 truncate max-w-[100px]">{c.nome}</td>
                      <td className="py-1">{c.icon}</td>
                      <td className="py-1 text-right font-bold text-[#EF4444]">{formatBRL(c.margem, 0)}</td>
                      <td className="py-1 text-right text-[#475569]">{c.compras}</td>
                      <td className="py-1 text-right text-[#475569]">{c.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-[#991B1B] mt-2 font-semibold">
                Média Bottom 10: {formatBRL(bottomAvg, 0)}/cliente
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#F1F5F9] border border-[#94A3B8]/20 rounded text-xs text-[#475569]">
            💡 <strong>Spread expressivo entre top e bottom</strong> — política de crédito atual
            aprova clientes que geram milhares vs clientes que destroem outros milhares. Ajuste de
            critérios pode liberar caixa expressivo (vide Q5).
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 5: WATERFALL P&L CONSOLIDADO */}
      <Card className="border-[#E2E8F0]">
        <CardHeader>
          <CardTitle>5. P&L Consolidado da Ume</CardTitle>
          <p className="text-xs text-[#64748b] mt-2">
            Visão consolidada: margem dos clientes menos custos do portfólio de varejos resulta no
            EBITDA estimado da operação.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {waterfall.map((line, idx) => {
              const isFinal = line.isFinal;
              const isSubtotal = line.isSubtotal;
              const colorMap: Record<string, string> = {
                verde: "#00C853",
                vermelho: "#EF4444",
                neutro: "#475569",
                verde_escuro: "#1B5E20",
                verde_destaque: "#00C853",
              };
              const valorColor = colorMap[line.cor] || "#1a1a1a";

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    isFinal
                      ? "bg-[#E8F5E9] border-2 border-[#00C853] mt-2"
                      : isSubtotal
                      ? "border-t-2 border-[#94A3B8] mt-2 font-bold bg-[#F8FAFC]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className={`w-6 text-center font-bold ${
                        isFinal ? "text-lg" : "text-sm"
                      }`}
                      style={{ color: valorColor }}
                    >
                      {line.tipo}
                    </span>
                    <span
                      className={
                        isFinal ? "text-base font-extrabold text-[#1B5E20]" : isSubtotal ? "text-sm" : "text-xs"
                      }
                    >
                      {line.descricao}
                    </span>
                  </div>
                  <span
                    className={`font-bold tabular-nums ${
                      isFinal ? "text-xl text-[#00C853]" : isSubtotal ? "text-base" : "text-sm"
                    }`}
                    style={{ color: valorColor }}
                  >
                    {formatBRL(line.valor)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-1 text-[10px] text-[#64748b] italic">
            <p>* Premissa: 20% recuperação via cobrança (benchmark fintech BR)</p>
            <p>
              ** {formatPct(kpis.pctReceitaDeJuros, 0)} da receita total vem de juros — Ume é
              fundamentalmente uma fintech de crédito, não uma processadora de pagamentos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 6: VAREJO (BÔNUS COLLAPSIBLE) */}
      <Card className="border-[#E2E8F0]">
        <CardHeader
          className="cursor-pointer hover:bg-[#F8FAFC]"
          onClick={() => setVarejoExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>6. Bônus: Rentabilidade por Varejo</CardTitle>
            <span className="text-sm text-[#64748b]">
              {varejoExpanded ? "▲ Recolher" : "▼ Expandir análise"}
            </span>
          </div>
        </CardHeader>
        {varejoExpanded && (
          <CardContent>
            <p className="text-xs text-[#64748b] mb-4">
              Análise complementar — quais varejos parceiros geram mais volume e quais carregam custo
              desproporcional. Visão estimada baseada na Base de Varejo.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Varejo</th>
                    <th className="text-left py-2 px-2 font-semibold text-[#64748b]">Segmento</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Originação Total</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Trans. Recor./mês</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Conversões/mês</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#64748b]">Custo Op./ano</th>
                    <th className="text-right py-2 px-2 font-semibold text-[#1a1a1a]">Margem Estimada</th>
                  </tr>
                </thead>
                <tbody>
                  {topVarejos.map((v, i) => (
                    <tr key={i} className="border-b border-[#E2E8F0] hover:bg-[#F7FAF8]">
                      <td className="py-2 px-2 font-medium">{v.nome}</td>
                      <td className="py-2 px-2 text-[#64748b]">{v.segmento}</td>
                      <td className="py-2 px-2 text-right">{formatBRL(v.originacaoTotal, 0)}</td>
                      <td className="py-2 px-2 text-right">{formatNum(v.transacoesRecorrentes)}</td>
                      <td className="py-2 px-2 text-right">{formatNum(v.transacoesConversoes)}</td>
                      <td className="py-2 px-2 text-right text-[#EF4444]">-{formatBRL(v.custoOpAnual, 0)}</td>
                      <td
                        className="py-2 px-2 text-right font-bold"
                        style={{ color: v.margemEstimada >= 0 ? "#00C853" : "#EF4444" }}
                      >
                        {formatBRL(v.margemEstimada, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-[#F1F5F9] border border-[#94A3B8]/20 rounded text-xs text-[#475569]">
              ⚠️ <strong>Limitação:</strong> a base não permite atribuição direta cliente→varejo.
              Análise estima margem por varejo proporcionalmente ao volume originado, usando o mesmo
              ratio juros/MDR da Ume consolidada. Recomendação Q5: implementar rastreamento
              cliente→varejo para análise mais precisa.
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT
// ============================================================================
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  accent: string;
  bg: string;
}

function KpiCard({ label, value, sub, accent, bg }: KpiCardProps) {
  return (
    <div
      className="p-4 rounded border-l-4 transition hover:shadow-md"
      style={{ backgroundColor: bg, borderLeftColor: accent }}
    >
      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[10px] text-[#94a3b8] mt-0.5">{sub}</p>
    </div>
  );
}
