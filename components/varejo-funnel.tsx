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
import { parseBRNumber, getSortedMonths } from "@/lib/parse-utils";
import type { FunnelStep, VarejoRow } from "@/lib/types";

interface VarejoFunnelProps {
  selectedVarejo: string;
  onVarejoChange: (value: string) => void;
  selectedSegmento: string;
  onSegmentoChange: (value: string) => void;
}

export function VarejoFunnel({ 
  selectedVarejo, 
  onVarejoChange,
  selectedSegmento,
  onSegmentoChange
}: VarejoFunnelProps) {
  const { varejoData } = useData();

  // Get unique values with robust column matching
  const { varejos, segmentos } = useMemo(() => {
    // Guard: return empty if no retail data
    if (!varejoData || varejoData.length === 0) {
      return {
        varejos: [],
        segmentos: [],
      };
    }

    const varejoSet = new Set<string>();
    const segmentoSet = new Set<string>();

    varejoData.forEach((v: any) => {
      // Robust column name matching
      const varejo = v.Varejo || v["Varejo"] || v.Loja || v["Nome da Loja"];
      const segmento = v.Segmento || v["Segmento"];

      if (varejo) varejoSet.add(String(varejo).trim());
      if (segmento) segmentoSet.add(String(segmento).trim());
    });

    return {
      varejos: Array.from(varejoSet).sort(),
      segmentos: Array.from(segmentoSet).sort(),
    };
  }, [varejoData]);

  // Filter data by selected filters (no month filter)
  const filteredVarejo = useMemo(() => {
    return varejoData.filter((v: any) => {
      const varejo = String(v.Varejo || "").trim();
      const segmento = String(v.Segmento || "").trim();

      const varejoMatch = selectedVarejo === "todos" || varejo === selectedVarejo;
      const segmentoMatch = selectedSegmento === "todos" || segmento === selectedSegmento;

      return varejoMatch && segmentoMatch;
    });
  }, [varejoData, selectedVarejo, selectedSegmento]);

  // Calculate funnel data
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredVarejo.length === 0) return [];

    const totalVarejos = filteredVarejo.length;
    const varejosAtivos = filteredVarejo.filter((v: any) => {
      const recorrentes = Number(v["Transações Recorrentes por mês"]) || 0;
      const conversoes = Number(v["Transações de Conversões por mês"]) || 0;
      return recorrentes > 0 || conversoes > 0;
    }).length;
    const varejosComConversoes = filteredVarejo.filter(
      (v: any) => Number(v["Transações de Conversões por mês"]) > 0
    ).length;

    const steps: FunnelStep[] = [
      {
        name: "Total na Rede",
        value: totalVarejos,
        percentage: 100,
        dropoffRate: 0,
      },
      {
        name: "Varejos Ativos",
        value: varejosAtivos,
        percentage: totalVarejos > 0 ? (varejosAtivos / totalVarejos) * 100 : 0,
        dropoffRate: totalVarejos > 0 ? ((totalVarejos - varejosAtivos) / totalVarejos) * 100 : 0,
      },
      {
        name: "Varejos com Conversões",
        value: varejosComConversoes,
        percentage: totalVarejos > 0 ? (varejosComConversoes / totalVarejos) * 100 : 0,
        dropoffRate: varejosAtivos > 0 ? ((varejosAtivos - varejosComConversoes) / varejosAtivos) * 100 : 0,
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
        varejosComConversoes: 0,
        originacaoTotal: 0,
      };
    }

    const totalVarejos = filteredVarejo.length;
    const varejosAtivos = filteredVarejo.filter((v: any) => {
      const recorrentes = Number(v["Transações Recorrentes por mês"]) || 0;
      const conversoes = Number(v["Transações de Conversões por mês"]) || 0;
      return recorrentes > 0 || conversoes > 0;
    }).length;
    const varejosComConversoes = filteredVarejo.filter(
      (v: any) => Number(v["Transações de Conversões por mês"]) > 0
    ).length;
    const originacaoTotal = filteredVarejo.reduce((sum: number, v: any) => {
      return sum + parseBRNumber(v["Originação Total"]);
    }, 0);

    return { totalVarejos, varejosAtivos, varejosComConversoes, originacaoTotal };
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

      {/* Empty State: No retail data */}
      {!varejoData || varejoData.length === 0 ? (
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-6 text-center">
          <p className="text-sm text-[#64748b]">
            Nenhum dado de varejo disponível. Por favor, envie o arquivo &quot;Base de Varejo&quot; para visualizar a análise.
          </p>
        </div>
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E2E8F0] pb-3">
        <span className="text-xs font-medium text-[#64748b]">Varejo:</span>
        <Select value={selectedVarejo} onValueChange={onVarejoChange}>
          <SelectTrigger className="h-8 w-48 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
            <span className="truncate">
              {selectedVarejo === "todos" ? "Todos os Varejos" : selectedVarejo}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs text-[#1a1a1a]">
              Todos os Varejos
            </SelectItem>
            {varejos.map((varejo) => (
              <SelectItem key={varejo} value={varejo} className="text-xs text-[#1a1a1a]">
                {varejo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs font-medium text-[#64748b]">Segmento:</span>
        <Select value={selectedSegmento} onValueChange={onSegmentoChange}>
          <SelectTrigger className="h-8 w-48 border-[#E2E8F0] bg-white text-xs text-[#1a1a1a]">
            <span className="truncate">
              {selectedSegmento === "todos" ? "Todos os Segmentos" : selectedSegmento}
            </span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs text-[#1a1a1a]">
              Todos os Segmentos
            </SelectItem>
            {segmentos.map((segmento) => (
              <SelectItem key={segmento} value={segmento} className="text-xs text-[#1a1a1a]">
                {segmento}
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
            <p className="mt-1 text-xs text-[#64748b]">100% do total</p>
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
            <p className="mt-1 text-xs text-[#64748b]">
              {summaryMetrics.totalVarejos > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((summaryMetrics.varejosAtivos / summaryMetrics.totalVarejos) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">
              Varejos com Conversões
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C853]">
              {summaryMetrics.varejosComConversoes.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {summaryMetrics.totalVarejos > 0 ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format((summaryMetrics.varejosComConversoes / summaryMetrics.totalVarejos) * 100) : 0}% do total
            </p>
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
            <p className="mt-1 text-xs text-[#64748b]">volume total originado</p>
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
              <div className="space-y-2 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748b]">
                <div><span className="font-medium text-[#1a1a1a]">Total na Rede:</span> varejos parceiros presentes na base.</div>
                <div><span className="font-medium text-[#1a1a1a]">Varejos Ativos:</span> varejos com transações recorrentes ou conversões.</div>
                <div><span className="font-medium text-[#1a1a1a]">Varejos com Conversões:</span> varejos com transações de conversão no período.</div>
                <div><span className="font-medium text-[#1a1a1a]">Originação Total:</span> volume total de crédito originado pelos varejos.</div>
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
        </>
      )}
    </div>
  );
}
