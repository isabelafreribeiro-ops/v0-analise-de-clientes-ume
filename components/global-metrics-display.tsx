"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";

function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function formatPercentage(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

export function GlobalMetricsDisplay() {
  const { globalMetrics } = useData();

  if (!globalMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="border-[#E2E8F0] bg-[#F7FAF8] animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-[#E2E8F0] rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-[#E2E8F0] rounded mb-2" />
                <div className="h-3 w-32 bg-[#E2E8F0] rounded" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Taxa de Aprovação */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Taxa de Aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(globalMetrics.taxaAprovacao)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(globalMetrics.totalAprovados)} de {formatNumber(globalMetrics.totalClientes)} clientes</p>
        </CardContent>
      </Card>

      {/* Taxa de Ativação */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Taxa de Ativação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(globalMetrics.taxaAtivacao)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">dos aprovados realizaram pelo menos 1 compra</p>
        </CardContent>
      </Card>

      {/* Score Médio (Geral) */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio (Base Total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(globalMetrics.scoreMediaGeral)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">todas as {formatNumber(globalMetrics.totalClientes)} linhas</p>
        </CardContent>
      </Card>

      {/* Score Médio (Aprovados) */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">Score Médio (Aprovados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatNumber(globalMetrics.scoreMediaAprovados)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(globalMetrics.totalAprovados)} clientes aprovados</p>
        </CardContent>
      </Card>

      {/* App Adoption (Geral) */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">App Adoption (Base Total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(globalMetrics.appAdoptionGeral)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">clientes com app ativo</p>
        </CardContent>
      </Card>

      {/* App Adoption (Aprovados) */}
      <Card className="border-[#E2E8F0] bg-gradient-to-br from-[#F7FAF8] to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-[#64748b] uppercase">App Adoption (Aprovados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#1a1a1a]">{formatPercentage(globalMetrics.appAdoptionAprovados)}</div>
          <p className="text-xs text-[#94a3b8] mt-1">{formatNumber(globalMetrics.totalAprovados)} aprovados</p>
        </CardContent>
      </Card>
    </div>
  );
}
