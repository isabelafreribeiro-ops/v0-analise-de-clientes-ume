"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  processarBase,
  aggregateBySegment,
  calcularKpis,
  buildWhaleCurve,
  getTopBottomClientes,
  calcularInsights,
  SEGMENT_META,
} from "@/lib/rentabilidade";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatMoney(value: number): string {
  if (!value || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number, decimals = 1): string {
  if (!value || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

function formatNumber(value: number): string {
  if (!value || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function RentabilidadeTab() {
  const { clientesData, varejoData } = useData();

  const { kpis, segmentos, whaleCurve: whaleCurveData, insights, topBottomClientes } = useMemo(() => {
    if (!clientesData || clientesData.length === 0) {
      return { kpis: null, segmentos: [], whaleCurveData: [], insights: [], topBottomClientes: null };
    }

    const processed = processarBase(clientesData);
    const segs = aggregateBySegment(processed);
    const kpisCalc = calcularKpis(processed, varejoData || []);
    const whaleCurveCalc = buildWhaleCurve(processed);
    const insightsCalc = calcularInsights(processed, kpisCalc);
    const topBottom = getTopBottomClientes(processed);

    return {
      kpis: kpisCalc,
      segmentos: segs,
      whaleCurveData: whaleCurveCalc,
      insights: insightsCalc,
      topBottomClientes: topBottom,
    };
  }, [clientesData, varejoData]);

  if (!kpis) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-12">
        <p className="text-lg font-semibold text-[#1a1a1a] mb-2">📊 Dados não carregados</p>
        <p className="text-sm text-[#64748b]">Envie a base de clientes na aba Aquisição para visualizar a análise de rentabilidade.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 0. PERGUNTA-ÂNCORA */}
      <Card style={{ backgroundColor: "#E8F5E9", borderLeft: `4px solid #00C853` }}>
        <CardContent className="pt-6">
          <p className="text-lg font-bold text-[#1B5E20] mb-2">❓ Pergunta-Âncora</p>
          <p className="text-base font-semibold text-[#1a1a1a] mb-3">
            Qual a rentabilidade real por cliente Ume? Onde está concentrado o valor e onde está sendo destruído?
          </p>
          <p className="text-sm text-[#334155]">
            P&L unitário por cliente (MDR + Juros − CAC − Mensageria − Inadimplência). Juros com Tabela Price individualizada. Custos operacionais em análise separada.
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
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.margemContribuicaoTotal)}</p>
              <p className="text-xs text-[#334155]">margem clientes</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#E8F5E9" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#1B5E20] uppercase mb-2">EBITDA Estimado</p>
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.ebitdaEstimado)}</p>
              <p className="text-xs text-[#334155]">após custos varejo</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#E8F5E9" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#1B5E20] uppercase mb-2">Margem/Cliente</p>
              <p className="text-3xl font-extrabold text-[#00C853] mb-1">{formatMoney(kpis.margemMediaCliente)}</p>
              <p className="text-xs text-[#334155]">média da base</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#FEF2F2" }}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-semibold text-[#991B1B] uppercase mb-2">Destruidores</p>
              <p className="text-3xl font-extrabold text-[#EF4444] mb-1">{formatPercent(kpis.pctDestruidores)}%</p>
              <p className="text-xs text-[#334155]">destroem valor</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. P&L UNITÁRIO POR SEGMENTO */}
      <Card>
        <CardHeader>
          <CardTitle>2. P&L Unitário por Segmento</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">
            Decomposição da margem de contribuição por segmento. Receita de juros calculada com Tabela Price.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#F1F5F9" }}>
                  <th className="text-left p-2 font-semibold text-[#1a1a1a]">Segmento</th>
                  <th className="text-center p-2 font-semibold text-[#1a1a1a]">Headcount</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">MDR</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Juros</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">CAC</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Mensageria</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Margem Total</th>
                  <th className="text-right p-2 font-semibold text-[#1a1a1a]">Margem/Cliente</th>
                </tr>
              </thead>
              <tbody>
                {segmentos.map((seg) => {
                  const meta = seg.id !== "total" ? SEGMENT_META[seg.id] : null;
                  const bgColor = meta ? meta.bg : "#F8FAFC";
                  return (
                    <tr key={seg.id} style={{ backgroundColor: bgColor }}>
                      <td className="p-2 font-medium text-[#1a1a1a]">
                        {meta ? `${meta.icon} ${seg.label}` : seg.label}
                      </td>
                      <td className="p-2 text-center text-[#1a1a1a]">{formatNumber(seg.headcount)}</td>
                      <td className="p-2 text-right text-[#1a1a1a]">{formatMoney(seg.receitaMdr)}</td>
                      <td className="p-2 text-right text-[#1a1a1a]">{formatMoney(seg.receitaJuros)}</td>
                      <td className="p-2 text-right text-[#EF4444]">{formatMoney(seg.cac)}</td>
                      <td className="p-2 text-right text-[#EF4444]">{formatMoney(seg.custoMsg)}</td>
                      <td className="p-2 text-right font-semibold text-[#00C853]">{formatMoney(seg.margemTotal)}</td>
                      <td className="p-2 text-right font-semibold text-[#00C853]">{formatMoney(seg.margemPorCliente)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. WHALE CURVE */}
      <Card>
        <CardHeader>
          <CardTitle>3. Whale Curve - Concentração de Margem</CardTitle>
          <p className="text-sm text-[#64748b] mt-2">Pareto: qual % de clientes gera qual % da margem acumulada.</p>
        </CardHeader>
        <CardContent>
          {whaleCurveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={whaleCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="pctClientes" label={{ value: "% de Clientes", position: "insideBottomRight", offset: -5 }} />
                <YAxis label={{ value: "R$ Margem Acumulada", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Line type="monotone" dataKey="margemCumulativa" stroke="#00C853" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#64748b]">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* 4. TOP 10 / BOTTOM 10 CLIENTES */}
      {topBottomClientes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>4a. Top 10 Clientes</CardTitle>
              <p className="text-sm text-[#64748b] mt-2">Maior margem individual</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBottomClientes.top.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[#F0F9F4] border border-[#E2E8F0]">
                    <div className="text-sm">
                      <p className="font-semibold text-[#1a1a1a]">{c.nome}</p>
                      <p className="text-xs text-[#64748b]">{c.icon} {c.segmentoLabel}</p>
                    </div>
                    <p className="font-bold text-[#00C853]">{formatMoney(c.margem)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4b. Bottom 10 Clientes</CardTitle>
              <p className="text-sm text-[#64748b] mt-2">Menor margem individual</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBottomClientes.bottom.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[#FEF2F2] border border-[#E2E8F0]">
                    <div className="text-sm">
                      <p className="font-semibold text-[#1a1a1a]">{c.nome}</p>
                      <p className="text-xs text-[#64748b]">{c.icon} {c.segmentoLabel}</p>
                    </div>
                    <p className="font-bold text-[#EF4444]">{formatMoney(c.margem)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. 5 INSIGHTS-CHAVE */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">5. Insights-Chave</h2>
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <Card
              key={i}
              style={{
                backgroundColor: insight.bgColor,
                borderLeft: `4px solid ${insight.accentColor}`,
              }}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <span className="text-3xl">{insight.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">{insight.numero} {insight.isHeadline ? "🔴 HEADLINE" : ""}</p>
                    <p className="text-base font-semibold text-[#1a1a1a] mb-2">{insight.titulo}</p>
                    <p className="text-sm text-[#1a1a1a] mb-2">
                      <span className="font-bold">{insight.valorPrincipal}</span> {insight.valorSecundario && `• ${insight.valorSecundario}`}
                    </p>
                    <p className="text-xs text-[#334155]">{insight.implicacao}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
