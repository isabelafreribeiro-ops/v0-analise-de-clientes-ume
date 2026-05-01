"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, Users, DollarSign, Target } from "lucide-react";

// STEP 1: Skeleton only - NO calculations
// All data shows "--" placeholders to confirm tab opens without freezing

export function SegmentacaoTab() {
  const { clientesData } = useData();

  // Filter states (kept for UI, but no filtering logic yet)
  const [filterScore, setFilterScore] = useState("todos");
  const [filterAge, setFilterAge] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");

  const clearFilters = () => {
    setFilterScore("todos");
    setFilterAge("todas");
    setFilterStatus("todos");
  };

  const hasFilters = filterScore !== "todos" || filterAge !== "todas" || filterStatus !== "todos";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Segmentacao de Clientes</h2>
        <p className="text-sm text-[#64748b] mt-1">
          Quem sao os clientes Ume — perfil, valor e risco por segmento.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-[#64748b]">Filtrar por:</span>

        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterScore === "todos" ? "Todos os Scores" : filterScore}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">Todos os Scores</SelectItem>
            <SelectItem value="0-300" className="text-xs">0-300</SelectItem>
            <SelectItem value="301-450" className="text-xs">301-450</SelectItem>
            <SelectItem value="451-550" className="text-xs">451-550</SelectItem>
            <SelectItem value="551+" className="text-xs">551+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAge} onValueChange={setFilterAge}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterAge === "todas" ? "Todas as Idades" : filterAge}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todas" className="text-xs">Todas as Idades</SelectItem>
            <SelectItem value="18-25" className="text-xs">18-25</SelectItem>
            <SelectItem value="26-35" className="text-xs">26-35</SelectItem>
            <SelectItem value="36-50" className="text-xs">36-50</SelectItem>
            <SelectItem value="50+" className="text-xs">50+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-40 border-[#E2E8F0] bg-white text-xs">
            <span className="truncate">{filterStatus === "todos" ? "Todos os Status" : filterStatus}</span>
          </SelectTrigger>
          <SelectContent className="border-[#E2E8F0] bg-white">
            <SelectItem value="todos" className="text-xs">Todos os Status</SelectItem>
            <SelectItem value="Aprovados" className="text-xs">Aprovados</SelectItem>
            <SelectItem value="Ativados" className="text-xs">Ativados</SelectItem>
            <SelectItem value="Recorrentes" className="text-xs">Recorrentes</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-[#64748b]">
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* KPI CARDS - Placeholders */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Clientes Analisados</CardTitle>
            <Users className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">--</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Score Medio</CardTitle>
            <Target className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">--</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">Ticket Medio</CardTitle>
            <DollarSign className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">R$ --</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">LTV Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#64748b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1a1a1a]">R$ --</div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#64748b]">% High Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#22c55e]">--%</div>
          </CardContent>
        </Card>
      </div>

      {/* SCORE DISTRIBUTION - Placeholder */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Distribuicao por Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-[#64748b]">
            Grafico sera carregado apos ativacao dos calculos
          </div>
        </CardContent>
      </Card>

      {/* AGE DISTRIBUTION - Placeholder */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Distribuicao por Idade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-[#64748b]">
            Grafico sera carregado apos ativacao dos calculos
          </div>
        </CardContent>
      </Card>

      {/* VALUE-RISK MATRIX - Placeholder */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#1a1a1a]">Matriz Valor x Risco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-[#64748b]">
            Matriz sera carregada apos ativacao dos calculos
          </div>
        </CardContent>
      </Card>

      {/* PERSONAS - Placeholder */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Personas Comportamentais</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {["Recorrente Premium", "Comprador Eventual", "Ativador Perdido", "Negado de Valor"].map((name) => (
            <Card key={name} className="border-[#E2E8F0] bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#1a1a1a]">{name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-[#22c55e]">--%</div>
                <p className="text-xs text-[#64748b]">Ticket: R$ --</p>
                <p className="text-xs text-[#64748b]">LTV: R$ --</p>
                <p className="mt-2 text-xs font-medium text-[#64748b]">Acao: --</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* EXECUTIVE INSIGHT - Placeholder */}
      <Card className="border-l-4 border-[#F59E0B] bg-gradient-to-r from-[#FFFBEB] to-white">
        <CardHeader>
          <CardTitle className="text-[#D97706] flex items-center gap-2">Insight Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748b]">
            Analise sera gerada apos ativacao dos calculos.
          </p>
        </CardContent>
      </Card>

      {/* DEBUG INFO */}
      <div className="text-xs text-[#94a3b8] p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
        Base carregada: {clientesData.length.toLocaleString("pt-BR")} clientes | Calculos: DESATIVADOS (skeleton mode)
      </div>
    </div>
  );
}
