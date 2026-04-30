"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ClienteRow, VarejoRow, DataContextType } from "./types";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clientesData, setClientesData] = useState<ClienteRow[]>([]);
  const [varejoData, setVarejoData] = useState<VarejoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetClientesData = (data: ClienteRow[]) => {
    setIsLoading(true);
    setClientesData(data);
    setIsLoading(false);
  };

  const handleSetVarejoData = (data: VarejoRow[]) => {
    setIsLoading(true);
    setVarejoData(data);
    setIsLoading(false);
  };

  return (
    <DataContext.Provider
      value={{
        clientesData,
        varejoData,
        setClientesData: handleSetClientesData,
        setVarejoData: handleSetVarejoData,
        isLoading,
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
