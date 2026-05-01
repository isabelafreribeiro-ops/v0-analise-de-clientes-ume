"use client";

import { useState } from "react";
import { DataProvider } from "@/lib/data-context";
import { Header } from "@/components/header";
import { NavTabs } from "@/components/nav-tabs";
import { CSVUploader } from "@/components/csv-uploader";
import { VarejoFunnel } from "@/components/varejo-funnel";
import { ClientesFunnel } from "@/components/clientes-funnel";
import { SegmentacaoTab } from "@/components/segmentacao-tab";
import { JornadaTab } from "@/components/jornada-tab";
import { RentabilidadeTab } from "@/components/rentabilidade-tab";
import { GlobalMetricsDisplay } from "@/components/global-metrics-display";

export default function Home() {
  const [activeTab, setActiveTab] = useState("aquisicao");
  const [selectedVarejo, setSelectedVarejo] = useState("todos");
  const [selectedSegmento, setSelectedSegmento] = useState("todos");
  const [selectedMes, setSelectedMes] = useState("todos");
  const [periodFrom, setPeriodFrom] = useState("all");
  const [periodTo, setPeriodTo] = useState("all");
  const [varejoFilter, setVarejoFilter] = useState("todos");

  return (
    <DataProvider>
      <div className="min-h-screen bg-[#F7FAF8]">
        <Header />
        <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="container mx-auto px-4 py-8">
          {/* Aquisição Tab */}
          {activeTab === "aquisicao" && (
            <>
              {/* Upload Section */}
              <section className="mb-12">
                <h2 className="mb-2 text-xl font-bold text-[#1a1a1a]">
                  Upload de Dados
                </h2>
                <p className="mb-4 text-sm text-[#64748b]">
                  Carregue as bases de dados CSV para análise dos funis
                </p>
                <CSVUploader />
              </section>

              {/* Global Metrics */}
              <section className="mb-12">
                <h2 className="mb-2 text-xl font-bold text-[#1a1a1a]">
                  Métricas Globais (Base Completa)
                </h2>
                <p className="mb-4 text-sm text-[#64748b]">
                  Indicadores calculados sobre os dados completos - nunca amostrados
                </p>
                <GlobalMetricsDisplay />
              </section>

              {/* Funnel 1: Aquisição de Varejos */}
              <section className="mb-12">
                <VarejoFunnel 
                  selectedVarejo={selectedVarejo}
                  onVarejoChange={setSelectedVarejo}
                  selectedSegmento={selectedSegmento}
                  onSegmentoChange={setSelectedSegmento}
                  selectedMes={selectedMes}
                  onMesChange={setSelectedMes}
                />
              </section>

              {/* Divider */}
              <div className="mb-12 border-t border-[#E2E8F0]" />

              {/* Funnel 2: Aquisição de Clientes */}
              <section>
                <ClientesFunnel 
                  periodFrom={periodFrom}
                  periodTo={periodTo}
                  onPeriodFromChange={setPeriodFrom}
                  onPeriodToChange={setPeriodTo}
                  varejoFilter={varejoFilter}
                  onVarejoFilterChange={setVarejoFilter}
                />
              </section>
            </>
          )}

          {/* Segmentação Tab */}
          {activeTab === "segmentacao" && (
            <section>
              <SegmentacaoTab />
            </section>
          )}

          {/* Jornada Tab */}
          {activeTab === "jornada" && (
            <section>
              <JornadaTab />
            </section>
          )}

          {/* Rentabilidade Tab */}
          {activeTab === "rentabilidade" && (
            <section>
              <RentabilidadeTab />
            </section>
          )}

          {/* Crédito Tab */}
          {activeTab === "credito" && (
            <div className="flex h-96 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-[#64748b]">
                Análise de Crédito em desenvolvimento
              </p>
              <p className="text-sm text-[#94a3b8]">
                Esta seção será adicionada em breve
              </p>
            </div>
          )}
        </main>
      </div>
    </DataProvider>
  );
}
