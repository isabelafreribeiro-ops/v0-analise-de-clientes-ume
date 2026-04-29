"use client";

import { DataProvider } from "@/lib/data-context";
import { Header } from "@/components/header";
import { CSVUploader } from "@/components/csv-uploader";
import { FunnelDashboard } from "@/components/funnel-dashboard";

export default function Home() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
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
            <FunnelDashboard />
          </section>
        </main>
      </div>
    </DataProvider>
  );
}
