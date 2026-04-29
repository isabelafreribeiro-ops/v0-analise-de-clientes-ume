"use client";

import { useMemo } from "react";
import { Calendar, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useData } from "@/lib/data-context";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

interface PeriodOption {
  value: string; // MM/YYYY for filtering
  label: string; // "Jan/2025" for display
  sortKey: number; // YYYYMM for sorting
}

interface FunnelFiltersProps {
  periodFrom: string;
  periodTo: string;
  selectedVarejo: string;
  onPeriodFromChange: (value: string) => void;
  onPeriodToChange: (value: string) => void;
  onVarejoChange: (value: string) => void;
}

export function FunnelFilters({
  periodFrom,
  periodTo,
  selectedVarejo,
  onPeriodFromChange,
  onPeriodToChange,
  onVarejoChange,
}: FunnelFiltersProps) {
  const { clientesData, varejoData } = useData();

  const periods = useMemo((): PeriodOption[] => {
    const periodsMap = new Map<string, PeriodOption>();
    
    clientesData.forEach((cliente) => {
      const date = cliente["Data de Entrada na Ume"];
      if (date) {
        const dateStr = String(date);
        let month: number | null = null;
        let year: number | null = null;
        
        // Try DD/MM/YYYY format
        const slashParts = dateStr.split("/");
        if (slashParts.length >= 3) {
          month = parseInt(slashParts[1], 10);
          year = parseInt(slashParts[2], 10);
        } 
        // Try YYYY-MM-DD format
        else if (dateStr.includes("-")) {
          const dashParts = dateStr.split("-");
          if (dashParts.length >= 2) {
            year = parseInt(dashParts[0], 10);
            month = parseInt(dashParts[1], 10);
          }
        }
        
        if (month && year && month >= 1 && month <= 12) {
          const value = `${month.toString().padStart(2, "0")}/${year}`;
          const label = `${MONTH_NAMES[month - 1]}/${year}`;
          const sortKey = year * 100 + month;
          
          if (!periodsMap.has(value)) {
            periodsMap.set(value, { value, label, sortKey });
          }
        }
      }
    });
    
    return Array.from(periodsMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [clientesData]);

  const getLabel = (value: string) => {
    if (value === "all") return "Todos";
    const found = periods.find(p => p.value === value);
    return found ? found.label : value;
  };

  const varejos = useMemo(() => {
    const varejosSet = new Set<string>();
    varejoData.forEach((varejo) => {
      if (varejo.Varejo) {
        varejosSet.add(varejo.Varejo);
      }
    });
    return Array.from(varejosSet).sort();
  }, [varejoData]);

  const hasActiveFilters = periodFrom !== "all" || periodTo !== "all" || selectedVarejo !== "all";

  const clearFilters = () => {
    onPeriodFromChange("all");
    onPeriodToChange("all");
    onVarejoChange("all");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-[#7a9e8a]" />
        <span className="text-xs text-[#7a9e8a]">De:</span>
        <Select value={periodFrom} onValueChange={onPeriodFromChange}>
          <SelectTrigger className="h-6 w-[100px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
            <span className="truncate">{getLabel(periodFrom)}</span>
          </SelectTrigger>
          <SelectContent className="border-[#004d26] bg-[#002a14]">
            <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">Todos</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-[#7a9e8a]">Até:</span>
        <Select value={periodTo} onValueChange={onPeriodToChange}>
          <SelectTrigger className="h-6 w-[100px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
            <span className="truncate">{getLabel(periodTo)}</span>
          </SelectTrigger>
          <SelectContent className="border-[#004d26] bg-[#002a14]">
            <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">Todos</SelectItem>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value} className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Store className="h-3.5 w-3.5 text-[#7a9e8a]" />
        <Select value={selectedVarejo} onValueChange={onVarejoChange}>
          <SelectTrigger className="h-6 w-[120px] border-[#004d26] bg-[#003d1f] px-2 text-xs text-white">
            <span className="truncate">{selectedVarejo === "all" ? "Todos varejos" : selectedVarejo}</span>
          </SelectTrigger>
          <SelectContent className="border-[#004d26] bg-[#002a14]">
            <SelectItem value="all" className="text-xs text-white hover:bg-[#003d1f] focus:bg-[#003d1f] focus:text-white">Todos varejos</SelectItem>
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
          className="h-6 px-2 text-xs text-[#7a9e8a] hover:bg-[#003d1f] hover:text-white"
        >
          <X className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
