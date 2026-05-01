"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function RentabilidadeTab() {
  const { rentabilidadeData } = useData();
  const [varejoExpanded, setVarejoExpanded] = useState(false);

  if (!rentabilidadeData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12">
        <p className="text-lg font-semibold text-[#1a1a1a] mb-2">📋 Dados não carregados</p>
        <p className="text-sm text-[#64748b]">Envie o arquivo rentabilidade_v2_agregado.json para visualizar a análise de rentabilidade.</p>
      </div>
    );
  }

  const kpis = rentabilidadeData.kpis_globais || {};
  const segmentos = rentabilidadeData.por_segmento || [];
  const whaleCurve = rentabilidadeData.whale_curve || [];
  const pareto = rentabilidadeData.pareto_summary || {};
  const insights = rentabilidadeData.insights || [];
  const topClientes = rentabilidadeData.top_10_clientes || [];
  const bottomClientes = rentabilidadeData.bottom_10_clientes || [];
  const waterfall = rentabilidadeData.waterfall || [];
  const varejos = rentabilidadeData.varejos_top_10 || [];

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

  return (
    <div className="space-y-8">
      {/* 0. PERGUNTA-ÂNCORA */}
      <Card style={{ backgroundColor: "#E8F5E9", borderLeft: `4px solid #00C853` }}>
        <CardContent className="pt-6">
          <p className="text-lg font-bold text-[#1B5E20] mb-2">❓ PERGUNTA-ÂNCORA</p>
          <p className="text-base font-semibold text-[#1a1a1a] mb-3">Qual a rentabilidade real por cliente Ume? Onde está concentrado o valor e onde está sendo destruído?</p>
          <p className="text-sm text-[#334155]">
            Para responder: aplicamos um P&L unitário (receita MDR + juros − CAC − mensageria − inadimplência) calculado com Tabela Price individualizada por cliente. Custo operacional dos varejos tratado em P&L separado.
          </p>
        </CardContent>
      </Card>

      {/* 1. KPIs DA UME */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">1. KPIs da Ume</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card style={{ backgroundColor: "#E8F5E9" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#1B5E20] uppercase mb-2">Margem Contribuição</p>
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.margem_contribuicao_total || 0)}</p>
              <p className="text-xs text-[#334155]">margem clientes</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#E8F5E9" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#1B5E20] uppercase mb-2">EBITDA Estimado</p>
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.ebitda_estimado || 0)}</p>
              <p className="text-xs text-[#334155]">após custos varejo</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#E8F5E9" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#1B5E20] uppercase mb-2">Margem/Cliente</p>
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.margem_media_cliente || 0)}</p>
              <p className="text-xs text-[#334155]">média da base</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#FEF2F2" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#991B1B] uppercase mb-2">Destruidores</p>
              <p className="text-3xl font-extrabold text-[#EF4444] mb-1">{formatPercent(kpis.pct_destruidores || 0)}%</p>
              <p className="text-xs text-[#334155]">destroem valor</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. P&L UNITÁRIO POR SEGMENTO */}
      <Card>
        <CardHeader>
          <CardTitle>2. P&L Unitário por Segmento</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">Decomposição da margem de contribuição por segmento. Receita de juros calculada com Tabela Price usando taxa e parcelas individuais de cada cliente.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#F1F5F9" }}>
                  <th className="text-left p-2 font-semibold text-[#1a1a1a]">Segmento</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Headcount</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Receita MDR</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Receita Juros</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">CAC</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Mensageria</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Inadimp.</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Margem Total</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Margem/Cliente</th>
                </tr>
              </thead>
              <tbody>
                {segmentos.map((seg: any, idx: number) => (
                  <tr key={idx} style={{ backgroundColor: seg.bg || "#FFFFFF", opacity: 0.3 }} className="border-b border-[#E2E8F0]">
                    <td className="p-2 font-medium">{seg.icon} {seg.segmento}</td>
                    <td className="text-center p-2">{new Intl.NumberFormat("pt-BR").format(seg.headcount || 0)}</td>
                    <td className="text-center p-2 text-[#00C853] font-semibold">{formatMoney(seg.receita_mdr || 0)}</td>
                    <td className="text-center p-2 text-[#00C853] font-semibold">{formatMoney(seg.receita_juros || 0)}</td>
                    <td className="text-center p-2 text-[#EF4444] font-semibold">{formatMoney(seg.cac || 0)}</td>
                    <td className="text-center p-2 text-[#EF4444] font-semibold">{formatMoney(seg.mensageria || 0)}</td>
                    <td className="text-center p-2 text-[#EF4444] font-semibold">{formatMoney(seg.inadimplencia || 0)}</td>
                    <td className="text-right p-2 font-bold" style={{ color: (seg.margem_total || 0) >= 0 ? "#00C853" : "#EF4444" }}>
                      {formatMoney(seg.margem_total || 0)}
                    </td>
                    <td className="text-right p-2 font-bold" style={{ color: (seg.margem_cliente || 0) >= 0 ? "#00C853" : "#EF4444" }}>
                      {formatMoney(seg.margem_cliente || 0)}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "3px double #E2E8F0", backgroundColor: "#F1F5F9" }}>
                  <td colSpan={8} className="p-2 font-bold text-[#1a1a1a]">TOTAL UME</td>
                  <td className="text-right p-2 font-extrabold text-[#00C853]">{formatMoney(kpis.margem_media_cliente || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 bg-[#FFF9C4] p-3 rounded text-xs text-[#1a1a1a]">
            ⚠️ <strong>Premissa de Inadimplência:</strong> 80% do saldo em aberto é considerado perda. 20% representa recuperação esperada via cobrança (benchmark fintech BR).
          </div>
        </CardContent>
      </Card>

      {/* 3. WHALE CURVE */}
      <Card>
        <CardHeader>
          <CardTitle>3. Concentração de Valor (Whale Curve)</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">Clientes ordenados por margem decrescente. Mostra graficamente a concentração extrema de valor.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={whaleCurve}>
              <defs>
                <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="pct_clientes" label={{ value: "% de Clientes", position: "insideBottom", offset: -10 }} />
              <YAxis label={{ value: "Margem Cumulativa (R$)", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Area type="monotone" dataKey="margem_cumulativa" stroke="#00C853" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card style={{ backgroundColor: "#E8F5E9" }}>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#1B5E20] font-semibold uppercase">TOP 10%</p>
                <p className="text-2xl font-bold text-[#00C853] mt-1">{formatMoney(pareto.top_10_margem || 0)}</p>
                <p className="text-xs text-[#334155]">gera o caixa</p>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: "#F1F5F9" }}>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#334155] font-semibold uppercase">META 50%</p>
                <p className="text-2xl font-bold text-[#475569] mt-1">{formatMoney(pareto.meta_50_margem || 0)}</p>
                <p className="text-xs text-[#334155]">ponto equilíbrio</p>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: "#FEF2F2" }}>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#991B1B] font-semibold uppercase">BOTTOM 10%</p>
                <p className="text-2xl font-bold text-[#EF4444] mt-1">{formatMoney(pareto.bottom_10_margem || 0)}</p>
                <p className="text-xs text-[#334155]">pior performance</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 4. 5 INSIGHTS-CHAVE */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">4. Insights-Chave de Rentabilidade</h2>
        {insights.length > 0 && (
          <>
            <Card style={{ backgroundColor: "#E8F5E9", borderLeft: `4px solid #00C853` }} className="mb-4">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold text-[#1B5E20]">{insights[0].numero}</p>
                <p className="text-xl font-bold text-[#1a1a1a] mt-2 mb-3">{insights[0].titulo}</p>
                <p className="text-3xl font-extrabold text-[#00C853] mb-1">{insights[0].valor}</p>
                <p className="text-xs text-[#334155]">{insights[0].sub_label}</p>
                <p className="text-sm italic text-[#64748b] mt-3">{insights[0].implicacao}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {insights.slice(1).map((insight: any, idx: number) => (
                <Card key={idx} style={{ backgroundColor: insight.bg || "#F1F5F9" }}>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold" style={{ color: insight.accent }}>{insight.numero}</p>
                    <p className="text-sm font-bold text-[#1a1a1a] mt-2 mb-2">{insight.titulo}</p>
                    <p className="text-lg font-extrabold" style={{ color: insight.accent }}>{insight.valor}</p>
                    <p className="text-xs text-[#334155]">{insight.sub_label}</p>
                    <p className="text-xs italic text-[#64748b] mt-2">{insight.implicacao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 5. TOP 10 / BOTTOM 10 */}
      <Card>
        <CardHeader>
          <CardTitle>5. Top 10 e Bottom 10 — Clientes Individuais</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">Os clientes que mais geram e mais destroem valor. Spread de ~6x entre média do top e bottom.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TOP 10 */}
            <div style={{ backgroundColor: "#E8F5E9", borderLeft: `4px solid #00C853` }} className="p-4 rounded">
              <p className="text-sm font-bold text-[#1B5E20] mb-3">🏆 Top 10 — Geradores de Valor</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-1">Cliente</th>
                      <th className="text-center p-1">Segmento</th>
                      <th className="text-right p-1">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.map((cliente: any, idx: number) => (
                      <tr key={idx} className="border-b border-[#C8E6C9]">
                        <td className="p-1 truncate">{cliente.nome}</td>
                        <td className="text-center p-1 text-[#334155]">{cliente.segmento}</td>
                        <td className="text-right p-1 font-bold text-[#00C853]">{formatMoney(cliente.margem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#1B5E20] font-semibold mt-3">Média Top 10: {formatMoney(topClientes.reduce((sum: number, c: any) => sum + (c.margem || 0), 0) / (topClientes.length || 1))}/cliente</p>
            </div>

            {/* BOTTOM 10 */}
            <div style={{ backgroundColor: "#FEF2F2", borderLeft: `4px solid #EF4444` }} className="p-4 rounded">
              <p className="text-sm font-bold text-[#991B1B] mb-3">📉 Bottom 10 — Destruidores de Valor</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-1">Cliente</th>
                      <th className="text-center p-1">Segmento</th>
                      <th className="text-right p-1">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomClientes.map((cliente: any, idx: number) => (
                      <tr key={idx} className="border-b border-[#FFCDD2]">
                        <td className="p-1 truncate">{cliente.nome}</td>
                        <td className="text-center p-1 text-[#334155]">{cliente.segmento}</td>
                        <td className="text-right p-1 font-bold text-[#EF4444]">{formatMoney(cliente.margem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#991B1B] font-semibold mt-3">Média Bottom 10: {formatMoney(bottomClientes.reduce((sum: number, c: any) => sum + (c.margem || 0), 0) / (bottomClientes.length || 1))}/cliente</p>
            </div>
          </div>
          <div className="mt-4 bg-[#E3F2FD] border-l-4 border-[#2196F3] p-3 rounded text-xs text-[#0D47A1]">
            💡 <strong>Spread de 6x</strong> entre top e bottom — política de crédito atual aprova clientes que geram R$ 4 mil vs clientes que destroem R$ 1,8 mil. Ajuste de critérios pode liberar caixa expressivo.
          </div>
        </CardContent>
      </Card>

      {/* 6. P&L CONSOLIDADO */}
      <Card>
        <CardHeader>
          <CardTitle>6. P&L Consolidado da Ume</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">Visão consolidada: margem dos clientes menos custos do portfólio de varejos resulta no EBITDA estimado.</p>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {waterfall.map((line: any, idx: number) => (
                <tr key={idx} style={{ borderTop: line.is_subtotal ? "3px double #E2E8F0" : "none" }} className={line.is_final ? "bg-[#E8F5E9]" : ""}>
                  <td className="w-8 text-center font-bold" style={{ color: line.tipo === "receita" ? "#00C853" : "#EF4444" }}>
                    {line.tipo === "receita" ? "+" : "−"}
                  </td>
                  <td className="p-2 font-medium text-[#1a1a1a]">{line.descricao}</td>
                  <td className="text-right p-2 font-bold" style={{ color: line.tipo === "receita" ? "#00C853" : "#EF4444" }}>
                    {formatMoney(line.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 space-y-2 text-xs text-[#475569] italic">
            <p>* Premissa: 20% recuperação via cobrança (benchmark fintech BR)</p>
            <p>** 93% da receita total vem de juros — Ume é fundamentalmente uma fintech de crédito, não uma processadora de pagamentos.</p>
          </div>
        </CardContent>
      </Card>

      {/* 7. BÔNUS: VAREJOS (COLLAPSIBLE) */}
      <Card>
        <div
          className="p-6 cursor-pointer flex justify-between items-center hover:bg-[#F1F5F9] transition"
          onClick={() => setVarejoExpanded(!varejoExpanded)}
        >
          <CardTitle>7. Bônus: Rentabilidade por Varejo {varejoExpanded ? "▲" : "▼"}</CardTitle>
        </div>
        {varejoExpanded && (
          <CardContent className="pt-0">
            <p className="text-sm text-[#64748b] mb-4">Análise complementar — quais varejos parceiros geram mais volume e quais carregam custo desproporcional. Visão estimada baseada na Base de Varejo.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: "#F1F5F9" }}>
                    <th className="text-left p-2 font-semibold">Varejo</th>
                    <th className="text-center p-2 font-semibold">Originação</th>
                    <th className="text-center p-2 font-semibold">Trans. Recorrentes/Mês</th>
                    <th className="text-center p-2 font-semibold">Conversões/Mês</th>
                    <th className="text-center p-2 font-semibold">Custo Op.</th>
                    <th className="text-right p-2 font-semibold">Margem Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {varejos.map((varejo: any, idx: number) => (
                    <tr key={idx} className="border-b border-[#E2E8F0]">
                      <td className="p-2 font-medium">{varejo.nome}</td>
                      <td className="text-center p-2">{formatMoney(varejo.originacao || 0)}</td>
                      <td className="text-center p-2">{varejo.transacoes_recorrentes}</td>
                      <td className="text-center p-2">{varejo.conversoes}</td>
                      <td className="text-center p-2">{formatMoney(varejo.custo_op || 0)}</td>
                      <td className="text-right p-2 font-bold" style={{ color: (varejo.margem_estimada || 0) >= 0 ? "#00C853" : "#EF4444" }}>
                        {formatMoney(varejo.margem_estimada || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-[#F1F5F9] p-3 rounded text-xs text-[#334155]">
              ⚠️ <strong>Limitação:</strong> a base não permite atribuição direta cliente→varejo. Análise estima margem por varejo proporcionalmente ao volume originado. Recomendação Q5: implementar rastreamento cliente→varejo para análise mais precisa.
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
