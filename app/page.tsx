"use client";

import { useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { Header } from "@/components/header";
import { CSVUploader } from "@/components/csv-uploader";
import { VarejoFunnel } from "@/components/varejo-funnel";
import { ClientesFunnel } from "@/components/clientes-funnel";

export default function Home() {
  const [selectedSegmento, setSelectedSegmento] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("all");
  const [periodTo, setPeriodTo] = useState("all");

  return (
    <DataProvider>
      <div className="min-h-screen bg-[#001a0f]">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Upload Section */}
          <section className="mb-12">
            <h2 className="mb-2 text-xl font-bold text-white">
              Upload de Dados
            </h2>
            <p className="mb-4 text-sm text-[#7a9e8a]">
              Carregue as bases de dados CSV para análise dos funis
            </p>
            <CSVUploader />
          </section>

          {/* Funnel 1: Aquisição de Varejos */}
          <section className="mb-12">
            <VarejoFunnel 
              selectedSegmento={selectedSegmento}
              onSegmentoChange={setSelectedSegmento}
            />
          </section>

          {/* Divider */}
          <div className="mb-12 border-t border-[#004d26]" />

          {/* Funnel 2: Aquisição de Clientes */}
          <section>
            <ClientesFunnel 
              periodFrom={periodFrom}
              periodTo={periodTo}
              onPeriodFromChange={setPeriodFrom}
              onPeriodToChange={setPeriodTo}
            />
          </section>
        </main>
      </div>
    </DataProvider>
  );
}
