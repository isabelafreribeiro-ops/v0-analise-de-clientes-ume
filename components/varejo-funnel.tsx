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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { InsightCallout } from "./insight-callout";
import type { FunnelStep } from "@/lib/types";

interface VarejoFunnelProps {
  selectedSegmento: string;
  onSegmentoChange: (value: string) => void;
}

export function VarejoFunnel({ selectedSegmento, onSegmentoChange }: VarejoFunnelProps) {
  const { varejoData } = useData();

  // Get unique segmentos
  const segmentos = useMemo(() => {
    const segmentSet = new Set<string>();
    varejoData.forEach((v) => {
      if (v.Segmento) {
        segmentSet.add(v.Segmento);
      }
    });
    return Array.from(segmentSet).sort();
  }, [varejoData]);

  // Filter data by segmento
  const filteredVarejo = useMemo(() => {
    if (selectedSegmento === "all") return varejoData;
    return varejoData.filter((v) => v.Segmento === selectedSegmento);
  }, [varejoData, selectedSegmento]);

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
    const originacaoTotal = filteredVarejo.reduce(
      (sum, v) => sum + (Number(v["Originação Total"]) || 0),
      0
    );

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
      (sum, v) => sum + (Number(v["Originação Total"]) || 0),
      0
    );

    return { totalVarejos, varejosAtivos, taxaConversao, originacaoTotal };
  }, [filteredVarejo]);

  const hasData = varejoData.length > 0;

  const clearFilter = () => onSegmentoChange("all");

  return (
    <div className="space-y-6">
      {/* Title and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Aquisição de Varejos</h2>
          <p className="text-sm text-[#7a9e8a]">
            Análise do funil de engajamento dos varejos parceiros na rede Ume
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7a9e8a]">Segmento:</span>
          <Select value={selectedSegmento} onValueChange={onSegmentoChange}>
            <SelectTrigger className="h-7 w-[140px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
              <span className="truncate">
                {selectedSegmento === "all" ? "Todos" : selectedSegmento}
              </span>
            </SelectTrigger>
            <SelectContent className="border-[#004d26] bg-[#002a14]">
              <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                Todos
              </SelectItem>
              {segmentos.map((segmento) => (
                <SelectItem key={segmento} value={segmento} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                  {segmento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSegmento !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-7 px-2 text-[#7a9e8a] hover:bg-[#003d1f] hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Total Varejos
            </CardTitle>
            <Store className="h-4 w-4 text-[#7a9e8a]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summaryMetrics.totalVarejos.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
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

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
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

        <Card className="border-[#004d26] bg-[#002a14]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#7a9e8a]">
              Originação Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#00C853]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {summaryMetrics.originacaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card className="border-[#004d26] bg-[#002a14]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Store className="h-5 w-5 text-[#00C853]" />
            Funil de Aquisição de Varejos
          </CardTitle>
          <CardDescription className="text-[#7a9e8a]">
            Visualização do engajamento dos varejos na rede
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <FunnelChart data={funnelData} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Store className="mb-4 h-12 w-12 text-[#7a9e8a]/50" />
              <p className="text-lg font-medium text-[#7a9e8a]">
                Nenhum dado carregado
              </p>
              <p className="text-sm text-[#7a9e8a]/70">
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
