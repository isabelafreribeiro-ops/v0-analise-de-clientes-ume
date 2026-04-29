"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Users, UserCheck, ShoppingBag, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { FunnelFilters } from "./funnel-filters";
import { InsightCallout } from "./insight-callout";
import type { FunnelStep } from "@/lib/types";

export function FunnelDashboard() {
  const { clientesData, varejoData } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedVarejo, setSelectedVarejo] = useState("all");

  // Filtrar dados de clientes por período
  const filteredClientes = useMemo(() => {
    if (selectedPeriod === "all") return clientesData;
    
    return clientesData.filter((cliente) => {
      const date = cliente["Data de Entrada na Ume"];
      if (!date) return false;
      
      const dateStr = String(date);
      const parts = dateStr.split("/");
      if (parts.length >= 3) {
        const monthYear = `${parts[1]}/${parts[2]}`;
        return monthYear === selectedPeriod;
      } else if (dateStr.includes("-")) {
        const dateParts = dateStr.split("-");
        if (dateParts.length >= 2) {
          const monthYear = `${dateParts[1]}/${dateParts[0]}`;
          return monthYear === selectedPeriod;
        }
      }
      return false;
    });
  }, [clientesData, selectedPeriod]);

  // Dados do varejo filtrado
  const filteredVarejo = useMemo(() => {
    if (selectedVarejo === "all") return null;
    return varejoData.find((v) => v.Varejo === selectedVarejo) || null;
  }, [varejoData, selectedVarejo]);

  // Calcular métricas do funil baseado na base de clientes
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredClientes.length === 0) return [];

    // Se tiver filtro de varejo, usar métricas do varejo
    if (filteredVarejo) {
      const totalTransacoes = (filteredVarejo["Transações Recorrentes por mês"] || 0) + 
                              (filteredVarejo["Transações de Conversões por mês"] || 0);
      const conversoes = filteredVarejo["Transações de Conversões por mês"] || 0;
      const recorrentes = filteredVarejo["Transações Recorrentes por mês"] || 0;
      
      const steps: FunnelStep[] = [
        {
          name: "Total Transações",
          value: totalTransacoes,
          percentage: 100,
          dropoffRate: 0,
        },
        {
          name: "Conversões",
          value: conversoes,
          percentage: totalTransacoes > 0 ? (conversoes / totalTransacoes) * 100 : 0,
          dropoffRate: totalTransacoes > 0 ? ((totalTransacoes - conversoes) / totalTransacoes) * 100 : 0,
        },
        {
          name: "Recorrentes",
          value: recorrentes,
          percentage: totalTransacoes > 0 ? (recorrentes / totalTransacoes) * 100 : 0,
          dropoffRate: conversoes > 0 ? ((conversoes - recorrentes) / conversoes) * 100 : 0,
        },
      ];
      
      return steps;
    }

    // Métricas padrão da base de clientes
    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovadosInativos = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) === 0 && c.Situação !== "Negada"
    ).length;
    const primeiraCompra = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) >= 1
    ).length;
    const recorrentes = filteredClientes.filter(
      (c) => Number(c["Qtd de Compras"]) > 1
    ).length;

    const steps: FunnelStep[] = [
      {
        name: "Total Solicitações",
        value: total,
        percentage: 100,
        dropoffRate: 0,
      },
      {
        name: "Negados",
        value: negados,
        percentage: total > 0 ? (negados / total) * 100 : 0,
        dropoffRate: 0,
      },
      {
        name: "Aprovados Inativos",
        value: aprovadosInativos,
        percentage: total > 0 ? (aprovadosInativos / total) * 100 : 0,
        dropoffRate: total > 0 ? ((total - negados - aprovadosInativos - primeiraCompra) / total) * 100 : 0,
      },
      {
        name: "Primeira Compra",
        value: primeiraCompra,
        percentage: total > 0 ? (primeiraCompra / total) * 100 : 0,
        dropoffRate: aprovadosInativos > 0 
          ? ((total - negados - primeiraCompra) / (total - negados)) * 100 
          : 0,
      },
      {
        name: "Recorrentes",
        value: recorrentes,
        percentage: total > 0 ? (recorrentes / total) * 100 : 0,
        dropoffRate: primeiraCompra > 0 
          ? ((primeiraCompra - recorrentes) / primeiraCompra) * 100 
          : 0,
      },
    ];

    // Recalcular drop-off rates de forma mais precisa
    for (let i = 1; i < steps.length; i++) {
      if (i === 1) {
        // Negados não têm drop-off significativo (são filtrados)
        steps[i].dropoffRate = 0;
      } else if (steps[i - 1].value > 0) {
        const prevRelevantValue = i === 2 
          ? steps[0].value - steps[1].value // Total - Negados
          : steps[i - 1].value;
        steps[i].dropoffRate = prevRelevantValue > 0 
          ? ((prevRelevantValue - steps[i].value) / prevRelevantValue) * 100 
          : 0;
      }
    }

    return steps;
  }, [filteredClientes, filteredVarejo]);

  // Métricas resumo
  const summaryMetrics = useMemo(() => {
    if (filteredClientes.length === 0) {
      return {
        total: 0,
        aprovados: 0,
        ativos: 0,
        taxaConversao: 0,
      };
    }

    const total = filteredClientes.length;
    const negados = filteredClientes.filter((c) => c.Situação === "Negada").length;
    const aprovados = total - negados;
    const ativos = filteredClientes.filter((c) => Number(c["Qtd de Compras"]) >= 1).length;
    const taxaConversao = aprovados > 0 ? (ativos / aprovados) * 100 : 0;

    return { total, aprovados, ativos, taxaConversao };
  }, [filteredClientes]);

  const hasData = clientesData.length > 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-[#004d26] bg-[#002a14]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Filtros</CardTitle>
          <CardDescription className="text-[#7a9e8a]">Filtre os dados por período ou varejo</CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelFilters
            selectedPeriod={selectedPeriod}
            selectedVarejo={selectedVarejo}
            onPeriodChange={setSelectedPeriod}
            onVarejoChange={setSelectedVarejo}
          />
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Total Solicitações
            </CardTitle>
            <Users className="h-4 w-4 text-[#7a9e8a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summaryMetrics.total.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Aprovados
            </CardTitle>
            <UserCheck className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {summaryMetrics.aprovados.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Clientes Ativos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#00ff6a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summaryMetrics.ativos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00ff6a]">
              {summaryMetrics.taxaConversao.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil */}
      <Card className="border-[#004d26] bg-[#002a14]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Repeat className="h-5 w-5 text-[#00C853]" />
            Funil de Aquisição
          </CardTitle>
          <CardDescription className="text-[#7a9e8a]">
            {selectedVarejo !== "all"
              ? `Métricas de transações do varejo: ${selectedVarejo}`
              : "Visualização do funil completo de aquisição de clientes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <FunnelChart data={funnelData} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Users className="mb-4 h-12 w-12 text-[#7a9e8a]/50" />
              <p className="text-lg font-medium text-[#7a9e8a]">
                Nenhum dado carregado
              </p>
              <p className="text-sm text-[#7a9e8a]/70">
                Faça upload das bases CSV para visualizar o funil
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight */}
      <InsightCallout data={funnelData} />
    </div>
  );
}
