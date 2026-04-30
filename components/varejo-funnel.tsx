"use client";

import { useMemo } from "react";
import { Store, TrendingUp, DollarSign, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { InsightCallout } from "./insight-callout";
import type { FunnelStep } from "@/lib/types";

interface VarejoFunnelProps {
  selectedVarejo: string;
  onVarejoChange: (value: string) => void;
}

// Helper to parse Brazilian currency format
function parseBrazilianCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Remove "R$", spaces, and replace comma with dot
  const cleaned = String(value)
    .replace(/R\$\s?/g, '')
    .trim()
    .replace(/\./g, '') // Remove thousand separators (dots)
    .replace(/,/g, '.'); // Replace comma with dot
  
  return parseFloat(cleaned) || 0;
}

export function VarejoFunnel({ selectedVarejo, onVarejoChange }: VarejoFunnelProps) {
  const { varejoData } = useData();

  // Get unique varejo names sorted alphabetically
  const varejos = useMemo(() => {
    const varejoSet = new Set<string>();
    varejoData.forEach((v) => {
      if (v["Nome da Loja"]) {
        varejoSet.add(v["Nome da Loja"]);
      }
    });
    return Array.from(varejoSet).sort();
  }, [varejoData]);

  // Filter data by selected varejo
  const filteredVarejo = useMemo(() => {
    if (selectedVarejo === "todos") return varejoData;
    return varejoData.filter((v) => v["Nome da Loja"] === selectedVarejo);
  }, [varejoData, selectedVarejo]);

  // Calculate funnel data for varejos
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredVarejo.length === 0) return [];

    const totalVarejos = filteredVarejo.length;
    const varejosComRecorrentes = filteredVarejo.filter(
      (v) => Number(v["Transações Recorrentes por mês"]) > 0
    ).length;
    const varejosComConversoes = filteredVarejo.filter(
      (v) => Number(v["Transações de Conversões por mês"]) > 0
    ).length;

    const steps: FunnelStep[] = [
      {
        name: "Total de Varejos na Rede",
        value: totalVarejos,
        percentage: 100,
        dropoffRate: 0,
      },
      {
        name: "Varejos com Transações Recorrentes",
        value: varejosComRecorrentes,
        percentage: totalVarejos > 0 ? (varejosComRecorrentes / totalVarejos) * 100 : 0,
        dropoffRate: totalVarejos > 0 ? ((totalVarejos - varejosComRecorrentes) / totalVarejos) * 100 : 0,
      },
      {
        name: "Varejos com Conversões",
        value: varejosComConversoes,
        percentage: totalVarejos > 0 ? (varejosComConversoes / totalVarejos) * 100 : 0,
        dropoffRate: varejosComRecorrentes > 0 
          ? ((varejosComRecorrentes - varejosComConversoes) / varejosComRecorrentes) * 100 
          : 0,
      },
    ];

    return steps;
  }, [filteredVarejo]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (filteredVarejo.length === 0) {
      return {
        totalVarejos: 0,
        varejosAtivos: 0,
        taxaConversao: 0,
        originacaoTotal: 0,
      };
    }

    const totalVarejos = filteredVarejo.length;
    const varejosAtivos = filteredVarejo.filter(
      (v) => Number(v["Transações Recorrentes por mês"]) > 0 || Number(v["Transações de Conversões por mês"]) > 0
    ).length;
    const varejosComConversoes = filteredVarejo.filter(
      (v) => Number(v["Transações de Conversões por mês"]) > 0
    ).length;
    const taxaConversao = totalVarejos > 0 ? (varejosComConversoes / totalVarejos) * 100 : 0;
    const originacaoTotal = filteredVarejo.reduce(
      (sum, v) => sum + parseBrazilianCurrency(v["Originação Total"]),
      0
    );

    return { totalVarejos, varejosAtivos, taxaConversao, originacaoTotal };
  }, [filteredVarejo]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Aquisição de Varejos</h2>
        <p className="text-sm text-[#64748b]">
          Análise do funil de engajamento dos varejos parceiros na rede Ume
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3">
        <span className="text-xs font-medium text-[#64748b]">Varejo:</span>
        <Select value={selectedVarejo} onValueChange={onVarejoChange}>
          <SelectTrigger className="h-8 w-64 border-[#E2E8F0] bg-white text-sm text-[#1a1a1a]">
            <span className="truncate">
              {selectedVarejo === "todos" ? "Todos os Varejos" : selectedVarejo}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-sm text-[#1a1a1a]">
              Todos os Varejos
            </SelectItem>
            {varejos.map((varejo) => (
              <SelectItem key={varejo} value={varejo} className="text-sm text-[#1a1a1a]">
                {varejo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Total Varejos
            </CardTitle>
            <Store className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              {summaryMetrics.totalVarejos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Varejos Ativos
            </CardTitle>
            <Repeat className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {summaryMetrics.varejosAtivos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {summaryMetrics.taxaConversao.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Originação Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">
              R$ {summaryMetrics.originacaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
            <Store className="h-5 w-5 text-[#00C853]" />
            Funil de Aquisição de Varejos
          </CardTitle>
          <CardDescription className="text-[#64748b]">
            Visualização do engajamento dos varejos na rede
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {varejoData.length > 0 ? (
            <>
              <FunnelChart data={funnelData} />
              
              {/* Metric Descriptions */}
              <div className="grid gap-3 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748b]">
                <div><span className="font-medium text-[#1a1a1a]">Total na Rede:</span> varejos parceiros ativos na plataforma Ume</div>
                <div><span className="font-medium text-[#1a1a1a]">Com Transações Recorrentes:</span> varejos com vendas mensais via crédito Ume</div>
                <div><span className="font-medium text-[#1a1a1a]">Com Conversões:</span> varejos que converteram novos clientes no mês</div>
                <div><span className="font-medium text-[#1a1a1a]">Originação Total:</span> volume total de crédito originado pelos varejos</div>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Store className="mb-4 h-12 w-12 text-[#cbd5e1]" />
              <p className="text-lg font-medium text-[#64748b]">
                Nenhum dado carregado
              </p>
              <p className="text-sm text-[#94a3b8]">
                Faça upload da Base de Varejo para visualizar o funil
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight */}
      <InsightCallout data={funnelData} title="varejos" />
    </div>
  );
}
