"use client";

import { useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { Header } from "@/components/header";
import { CSVUploader } from "@/components/csv-uploader";
import { FunnelDashboard } from "@/components/funnel-dashboard";
import { FunnelFilters } from "@/components/funnel-filters";

export default function Home() {
  const [periodFrom, setPeriodFrom] = useState("all");
  const [periodTo, setPeriodTo] = useState("all");
  const [selectedVarejo, setSelectedVarejo] = useState("all");

  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Toolbar de filtros */}
        <div className="border-b border-[#004d26] bg-[#002a14]">
          <div className="container mx-auto flex items-center gap-4 px-4 py-2">
            <span className="text-xs font-medium text-[#7a9e8a]">Filtros:</span>
            <FunnelFilters
              periodFrom={periodFrom}
              periodTo={periodTo}
              selectedVarejo={selectedVarejo}
              onPeriodFromChange={setPeriodFrom}
              onPeriodToChange={setPeriodTo}
              onVarejoChange={setSelectedVarejo}
            />
          </div>
        </div>
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Funil de Aquisição
            </h2>
            <p className="text-muted-foreground">
              Analise o funil de aquisição de clientes com base nos dados carregados
            </p>
          </div>

          <section className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Upload de Dados
            </h3>
            <CSVUploader />
          </section>

          <section>
            <FunnelDashboard 
              periodFrom={periodFrom}
              periodTo={periodTo}
              selectedVarejo={selectedVarejo}
            />
          </section>
        </main>
      </div>
    </DataProvider>
  );
}
