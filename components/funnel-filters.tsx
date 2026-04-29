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

  const periods = useMemo(() => {
    const periodsSet = new Set<string>();
    clientesData.forEach((cliente) => {
      const date = cliente["Data de Entrada na Ume"];
      if (date) {
        const parts = String(date).split("/");
        if (parts.length >= 3) {
          const monthYear = `${parts[1]}/${parts[2]}`;
          periodsSet.add(monthYear);
        } else if (String(date).includes("-")) {
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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-[#7a9e8a]" />
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="h-7 w-[130px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="border-[#004d26] bg-[#002a14]">
            <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">Todos os períodos</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period} value={period} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Store className="h-3.5 w-3.5 text-[#7a9e8a]" />
        <Select value={selectedVarejo} onValueChange={onVarejoChange}>
          <SelectTrigger className="h-7 w-[140px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
            <SelectValue placeholder="Varejo" />
          </SelectTrigger>
          <SelectContent className="border-[#004d26] bg-[#002a14]">
            <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">Todos os varejos</SelectItem>
            {varejos.map((varejo) => (
              <SelectItem key={varejo} value={varejo} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                {varejo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          className="h-7 px-2 text-xs text-[#7a9e8a] hover:bg-[#003d1f] hover:text-white"
        >
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
