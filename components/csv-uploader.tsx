"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data-context";
import { parseCSVAsync } from "@/lib/csv-worker";
import { calculateGlobalMetrics } from "@/lib/segmentation";
import type { ClienteRow, VarejoRow } from "@/lib/types";

interface UploadState {
  clientes: { uploaded: boolean; fileName: string | null; count: number; loading: boolean; progress: number; error?: string };
  varejo: { uploaded: boolean; fileName: string | null; count: number; loading: boolean; progress: number; error?: string };
  rentabilidade: { uploaded: boolean; fileName: string | null; loading: boolean; progress: number; error?: string };
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

export function CSVUploader() {
  const { setClientesData, setVarejoData, setGlobalMetrics, setRentabilidadeData } = useData();
  const [uploadState, setUploadState] = useState<UploadState>({
    clientes: { uploaded: false, fileName: null, count: 0, loading: false, progress: 0, error: undefined },
    varejo: { uploaded: false, fileName: null, count: 0, loading: false, progress: 0, error: undefined },
    rentabilidade: { uploaded: false, fileName: null, loading: false, progress: 0, error: undefined },
  });
  const [isDragging, setIsDragging] = useState<"clientes" | "varejo" | "rentabilidade" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect removed - no longer needed since we're not using workers
  useEffect(() => {
    return () => {};
  }, []);

  const handleFileUpload = useCallback(
    async (file: File, type: "clientes" | "varejo" | "rentabilidade") => {
      // Verificar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        const errorMsg = `Arquivo muito grande! Máximo: ${sizeMB}MB (seu arquivo: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
        setUploadState((prev) => ({
          ...prev,
          [type]: { ...prev[type], error: errorMsg },
        }));
        return;
      }

      // Set loading state
      setUploadState((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: true, progress: 0, error: undefined },
      }));

      try {
        if (type === "rentabilidade") {
          // Handle JSON file for rentabilidade
          const fileContent = await file.text();
          const rentabilidadeJSON = JSON.parse(fileContent);
          setRentabilidadeData(rentabilidadeJSON);
          setUploadState((prev) => ({
            ...prev,
            rentabilidade: { uploaded: true, fileName: file.name, loading: false, progress: 100, error: undefined },
          }));
        } else {
          // Read file as text for CSV
          const fileContent = await file.text();

          // Parse CSV asynchronously (non-blocking) with progress tracking
          const { data, count } = await parseCSVAsync(
            fileContent,
            type,
            (processed, total) => {
              const progress = Math.min(100, Math.round((processed / total) * 100));
              setUploadState((prev) => ({
                ...prev,
                [type]: { ...prev[type], progress },
              }));
            }
          );

          // Update state with parsed data
          if (type === "clientes") {
            setClientesData(data as ClienteRow[]);
            
            // Compute global metrics from full dataset for dashboard cards
            const metrics = calculateGlobalMetrics(data as ClienteRow[]);
            setGlobalMetrics(metrics);
            
            setUploadState((prev) => ({
              ...prev,
              clientes: { uploaded: true, fileName: file.name, count, loading: false, progress: 100, error: undefined },
            }));
          } else {
            setVarejoData(data as VarejoRow[]);
            setUploadState((prev) => ({
              ...prev,
              varejo: { uploaded: true, fileName: file.name, count, loading: false, progress: 100, error: undefined },
            }));
          }
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : "Erro ao processar arquivo";
        console.error("[v0] Error uploading CSV:", error);
        setUploadState((prev) => ({
          ...prev,
          [type]: { ...prev[type], loading: false, progress: 0, error: errorMsg },
        }));
      }
    },
    [setClientesData, setVarejoData, setRentabilidadeData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "clientes" | "varejo" | "rentabilidade") => {
      e.preventDefault();
      setIsDragging(null);
      const file = e.dataTransfer.files[0];
      if (file) {
        if (type === "rentabilidade" && file.name.endsWith(".json")) {
          handleFileUpload(file, type);
        } else if (type !== "rentabilidade" && file.name.endsWith(".csv")) {
          handleFileUpload(file, type);
        }
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent, type: "clientes" | "varejo" | "rentabilidade") => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: "clientes" | "varejo" | "rentabilidade") => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const clearUpload = (type: "clientes" | "varejo" | "rentabilidade") => {
    if (type === "clientes") {
      setClientesData([]);
      setUploadState((prev) => ({
        ...prev,
        clientes: { uploaded: false, fileName: null, count: 0, loading: false, progress: 0, error: undefined },
      }));
    } else if (type === "varejo") {
      setVarejoData([]);
      setUploadState((prev) => ({
        ...prev,
        varejo: { uploaded: false, fileName: null, count: 0, loading: false, progress: 0, error: undefined },
      }));
    } else {
      setRentabilidadeData(null);
      setUploadState((prev) => ({
        ...prev,
        rentabilidade: { uploaded: false, fileName: null, loading: false, progress: 0, error: undefined },
      }));
    }
  };

  const UploadCard = ({
    type,
    title,
    description,
  }: {
    type: "clientes" | "varejo" | "rentabilidade";
    title: string;
    description: string;
  }) => {
    const state = uploadState[type];
    const isActive = isDragging === type;

    return (
      <Card
        className={`transition-all duration-200 border-[#E2E8F0] bg-white ${
          isActive ? "border-[#00C853] ring-2 ring-[#00C853]/20" : ""
        } ${state.uploaded ? "border-[#00C853]/50" : ""} ${state.loading ? "border-blue-400/50" : ""}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-[#1a1a1a]">
            <FileSpreadsheet className="h-5 w-5 text-[#00C853]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-600">{state.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearUpload(type)}
                className="mt-2 text-red-600 hover:bg-red-100"
              >
                Limpar
              </Button>
            </div>
          ) : state.loading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-blue-600">Processando arquivo...</p>
                </div>
                <p className="text-xs text-[#64748b]">{state.progress}%</p>
              </div>
              <div className="bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
            </div>
          ) : state.uploaded ? (
            <div className="flex items-center justify-between rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00C853]" />
                <div>
                  <p className="font-medium text-[#1a1a1a]">{state.fileName}</p>
                  <p className="text-sm text-[#64748b]">
                    {type === "rentabilidade" 
                      ? "Carregado com sucesso" 
                      : `${(state as any).count.toLocaleString("pt-BR")} registros carregados`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearUpload(type)}
                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400 text-[#64748b]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop(e, type)}
              onDragOver={(e) => handleDragOver(e, type)}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                isActive ? "border-[#00C853] bg-[#00C853]/5" : "border-[#E2E8F0] hover:border-[#00C853]/50"
              }`}
            >
              <Upload className={`mb-3 h-10 w-10 ${isActive ? "text-[#00C853]" : "text-[#64748b]"}`} />
              <p className="mb-1 text-sm font-medium text-[#1a1a1a]">{description}</p>
              <p className="mb-4 text-xs text-[#64748b]">Arraste e solte ou clique para selecionar</p>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleInputChange(e, type)}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild className="border-[#00C853] text-[#00C853] hover:bg-[#00C853]/10 hover:text-[#009e3f]">
                  <span className="cursor-pointer">Selecionar arquivo</span>
                </Button>
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <UploadCard
        type="clientes"
        title="Base de Clientes"
        description="Upload da base de clientes"
      />
      <UploadCard
        type="varejo"
        title="Base de Varejo"
        description="Upload da base de varejo"
      />
      <UploadCard
        type="rentabilidade"
        title="Dados de Rentabilidade (Q4)"
        description="Upload do JSON rentabilidade_v2_agregado.json"
      />
    </div>
  );
}
