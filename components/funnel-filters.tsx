"use client";

import { useMemo } from "react";
import { Calendar, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/lib/data-context";

interface FunnelFiltersProps {
  selectedPeriod: string;
  selectedVarejo: string;
  onPeriodChange: (value: string) => void;
  onVarejoChange: (value: string) => void;
}

export function FunnelFilters({
  selectedPeriod,
  selectedVarejo,
  onPeriodChange,
  onVarejoChange,
}: FunnelFiltersProps) {
  const { clientesData, varejoData } = useData();

  // Extrair períodos únicos (mês/ano) da base de clientes
  const periods = useMemo(() => {
    const periodsSet = new Set<string>();
    clientesData.forEach((cliente) => {
      const date = cliente["Data de Entrada na Ume"];
      if (date) {
        // Assumindo formato DD/MM/YYYY ou similar
        const parts = String(date).split("/");
        if (parts.length >= 3) {
          const monthYear = `${parts[1]}/${parts[2]}`;
          periodsSet.add(monthYear);
        } else if (String(date).includes("-")) {
          // Formato YYYY-MM-DD
          const dateParts = String(date).split("-");
          if (dateParts.length >= 2) {
            const monthYear = `${dateParts[1]}/${dateParts[0]}`;
            periodsSet.add(monthYear);
          }
        }
      }
    });
    return Array.from(periodsSet).sort((a, b) => {
      const [monthA, yearA] = a.split("/").map(Number);
      const [monthB, yearB] = b.split("/").map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });
  }, [clientesData]);

  // Extrair varejos únicos
  const varejos = useMemo(() => {
    const varejosSet = new Set<string>();
    varejoData.forEach((varejo) => {
      if (varejo.Varejo) {
        varejosSet.add(varejo.Varejo);
      }
    });
    return Array.from(varejosSet).sort();
  }, [varejoData]);

  const hasActiveFilters = selectedPeriod !== "all" || selectedVarejo !== "all";

  const clearFilters = () => {
    onPeriodChange("all");
    onVarejoChange("all");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedVarejo} onValueChange={onVarejoChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Varejo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os varejos</SelectItem>
            {varejos.map((varejo) => (
              <SelectItem key={varejo} value={varejo}>
                {varejo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="mr-1 h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
