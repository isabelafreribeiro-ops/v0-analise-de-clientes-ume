"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Store, TrendingUp, DollarSign, Repeat, Search, ChevronDown, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/lib/data-context";
import { FunnelChart } from "./funnel-chart";
import { InsightCallout } from "./insight-callout";
import type { FunnelStep } from "@/lib/types";

interface VarejoFunnelProps {
  selectedSegmentos: string[];
  searchQuery: string;
  onSegmentosChange: (value: string[]) => void;
  onSearchChange: (value: string) => void;
}

export function VarejoFunnel({ 
  selectedSegmentos, 
  searchQuery,
  onSegmentosChange,
  onSearchChange 
}: VarejoFunnelProps) {
  const { varejoData } = useData();
  const [isSegmentoOpen, setIsSegmentoOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSegmentoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Toggle segmento selection
  const toggleSegmento = (segmento: string) => {
    if (selectedSegmentos.includes(segmento)) {
      onSegmentosChange(selectedSegmentos.filter(s => s !== segmento));
    } else {
      onSegmentosChange([...selectedSegmentos, segmento]);
    }
  };

  // Select all segmentos
  const selectAll = () => {
    onSegmentosChange([]);
  };

  // Filter data by segmentos and search
  const filteredVarejo = useMemo(() => {
    let filtered = varejoData;
    
    // Filter by segmentos (empty array means all)
    if (selectedSegmentos.length > 0) {
      filtered = filtered.filter((v) => selectedSegmentos.includes(v.Segmento));
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((v) => 
        v.Varejo?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [varejoData, selectedSegmentos, searchQuery]);

  // Calculate funnel data for varejos
  const funnelData = useMemo((): FunnelStep[] => {
    if (filteredVarejo.length === 0) return [];

    const totalVarejos = filteredVarejo.length;
    const totalLojas = filteredVarejo.reduce((sum, v) => sum + (Number(v.Lojas) || 0), 0);
    const varejosComRecorrentes = filteredVarejo.filter(
      (v) => Number(v["Transações Recorrentes por mês"]) > 0
    ).length;
    const lojasComRecorrentes = filteredVarejo
      .filter((v) => Number(v["Transações Recorrentes por mês"]) > 0)
      .reduce((sum, v) => sum + (Number(v.Lojas) || 0), 0);
    const varejosComConversoes = filteredVarejo.filter(
      (v) => Number(v["Transações de Conversões por mês"]) > 0
    ).length;
    const lojasComConversoes = filteredVarejo
      .filter((v) => Number(v["Transações de Conversões por mês"]) > 0)
      .reduce((sum, v) => sum + (Number(v.Lojas) || 0), 0);

    const steps: FunnelStep[] = [
      {
        name: "Total de Varejos na Rede",
        value: totalVarejos,
        percentage: 100,
        dropoffRate: 0,
        lojas: totalLojas,
      },
      {
        name: "Varejos com Transações Recorrentes",
        value: varejosComRecorrentes,
        percentage: totalVarejos > 0 ? (varejosComRecorrentes / totalVarejos) * 100 : 0,
        dropoffRate: totalVarejos > 0 ? ((totalVarejos - varejosComRecorrentes) / totalVarejos) * 100 : 0,
        lojas: lojasComRecorrentes,
      },
      {
        name: "Varejos com Conversões",
        value: varejosComConversoes,
        percentage: totalVarejos > 0 ? (varejosComConversoes / totalVarejos) * 100 : 0,
        dropoffRate: varejosComRecorrentes > 0 
          ? ((varejosComRecorrentes - varejosComConversoes) / varejosComRecorrentes) * 100 
          : 0,
        lojas: lojasComConversoes,
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

  const clearFilters = () => {
    onSegmentosChange([]);
    onSearchChange("");
  };

  const hasActiveFilters = selectedSegmentos.length > 0 || searchQuery.trim() !== "";

  const getSegmentoLabel = () => {
    if (selectedSegmentos.length === 0) return "Todos";
    if (selectedSegmentos.length === 1) return selectedSegmentos[0];
    return `${selectedSegmentos.length} selecionados`;
  };

  return (
    <div className="space-y-6">
      {/* Title and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Aquisição de Varejos</h2>
          <p className="text-sm text-[#7a9e8a]">
            Análise do funil de engajamento dos varejos parceiros na rede Ume
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#7a9e8a]" />
            <Input
              type="text"
              placeholder="Buscar varejo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-7 w-[140px] border-[#004d26] bg-[#003d1f] pl-7 pr-2 text-xs text-white placeholder:text-[#7a9e8a]"
            />
          </div>

          {/* Segmento Multi-Select */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsSegmentoOpen(!isSegmentoOpen)}
              className="flex h-7 w-[140px] items-center justify-between rounded-md border border-[#004d26] bg-[#003d1f] px-2 text-xs text-white"
            >
              <span className="truncate">{getSegmentoLabel()}</span>
              <ChevronDown className="h-3 w-3 text-[#7a9e8a]" />
            </button>
            
            {isSegmentoOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-[180px] rounded-md border border-[#004d26] bg-[#002a14] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-white hover:bg-[#003d1f]"
                >
                  <div className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${selectedSegmentos.length === 0 ? "border-[#00C853] bg-[#00C853]" : "border-[#004d26]"}`}>
                    {selectedSegmentos.length === 0 && <Check className="h-2.5 w-2.5 text-[#001a0f]" />}
                  </div>
                  Todos
                </button>
                <div className="my-1 border-t border-[#004d26]" />
                {segmentos.map((segmento) => (
                  <button
                    key={segmento}
                    type="button"
                    onClick={() => toggleSegmento(segmento)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs text-white hover:bg-[#003d1f]"
                  >
                    <div className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${selectedSegmentos.includes(segmento) ? "border-[#00C853] bg-[#00C853]" : "border-[#004d26]"}`}>
                      {selectedSegmentos.includes(segmento) && <Check className="h-2.5 w-2.5 text-[#001a0f]" />}
                    </div>
                    {segmento}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
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
            <FunnelChart data={funnelData} showLojas />
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
