"use client";

import { createContext, useContext, useState, useRef, type ReactNode } from "react";
import type { ClienteRow, VarejoRow, DataContextType } from "./types";

const DataContext = createContext<DataContextType | undefined>(undefined);

export interface CachedAnalytics {
  segments: any;
  metrics: any;
  thresholds: any;
  distribution: any;
  groupComparison: any;
  ageDistribution: any;
  genderDistribution: any;
  retailerDistribution: any;
  aggregated: any;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientesData, setClientesData] = useState<ClienteRow[]>([]);
  const [varejoData, setVarejoData] = useState<VarejoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedAnalytics, setCachedAnalytics] = useState<CachedAnalytics | null>(null);
  const dataRefClientes = useRef<ClienteRow[]>([]);

  const handleSetClientesData = (data: ClienteRow[]) => {
    setClientesData(data);
    dataRefClientes.current = data; // Store in stable ref to avoid re-parsing
  };

  const handleSetVarejoData = (data: VarejoRow[]) => {
    setVarejoData(data);
  };

  const handleSetCachedAnalytics = (analytics: CachedAnalytics) => {
    setCachedAnalytics(analytics);
  };

  return (
    <DataContext.Provider
      value={{
        clientesData,
        varejoData,
        isLoading,
        setIsLoading,
        setClientesData: handleSetClientesData,
        setVarejoData: handleSetVarejoData,
        cachedAnalytics,
        setCachedAnalytics: handleSetCachedAnalytics,
        dataRefClientes,
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
