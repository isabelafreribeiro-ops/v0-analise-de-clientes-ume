"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ClienteRow, VarejoRow, DataContextType } from "./types";
import type { AggregationResult } from "./aggregation-worker";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientesData, setClientesData] = useState<ClienteRow[]>([]);
  const [varejoData, setVarejoData] = useState<VarejoRow[]>([]);
  const [aggregationResult, setAggregationResult] = useState<AggregationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetClientesData = (data: ClienteRow[]) => {
    setClientesData(data);
  };

  const handleSetVarejoData = (data: VarejoRow[]) => {
    setVarejoData(data);
  };

  const handleSetAggregationResult = (result: AggregationResult) => {
    setAggregationResult(result);
  };

  return (
    <DataContext.Provider
      value={{
        clientesData,
        varejoData,
        aggregationResult,
        setClientesData: handleSetClientesData,
        setVarejoData: handleSetVarejoData,
        setAggregationResult: handleSetAggregationResult,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
