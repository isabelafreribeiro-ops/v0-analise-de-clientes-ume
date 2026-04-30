"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data-context";
import type { ClienteRow, VarejoRow } from "@/lib/types";

interface UploadState {
  clientes: { uploaded: boolean; fileName: string | null; count: number; loading: boolean };
  varejo: { uploaded: boolean; fileName: string | null; count: number; loading: boolean };
}

export function CSVUploader() {
  const { setClientesData, setVarejoData } = useData();
  const [uploadState, setUploadState] = useState<UploadState>({
    clientes: { uploaded: false, fileName: null, count: 0, loading: false },
    varejo: { uploaded: false, fileName: null, count: 0, loading: false },
  });
  const [isDragging, setIsDragging] = useState<"clientes" | "varejo" | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Cleanup worker on unmount
  const cleanupWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupWorker();
  }, [cleanupWorker]);

  const handleFileUpload = useCallback(
    (file: File, type: "clientes" | "varejo") => {
      // Set loading state
      setUploadState((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: true },
      }));

      // Read file as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;

        // Initialize worker if not already done
        if (!workerRef.current) {
          workerRef.current = new Worker(new URL("../lib/csv-worker.ts", import.meta.url), {
            type: "module",
          });
        }

        // Handle worker message
        const handleMessage = (event: MessageEvent) => {
          const { type: resultType, data, count, error } = event.data;

          if (error) {
            console.error("[v0] Error parsing CSV:", error);
            setUploadState((prev) => ({
              ...prev,
              [type]: { ...prev[type], loading: false },
            }));
            return;
          }

          // Update state with parsed data
          if (resultType === "clientes") {
            setClientesData(data as ClienteRow[]);
            setUploadState((prev) => ({
              ...prev,
              clientes: { uploaded: true, fileName: file.name, count, loading: false },
            }));
          } else {
            setVarejoData(data as VarejoRow[]);
            setUploadState((prev) => ({
              ...prev,
              varejo: { uploaded: true, fileName: file.name, count, loading: false },
            }));
          }

          // Remove listener after processing
          workerRef.current?.removeEventListener("message", handleMessage);
        };

        workerRef.current?.addEventListener("message", handleMessage);

        // Send file to worker for parsing
        workerRef.current?.postMessage({ type, fileContent });
      };

      reader.readAsText(file);
    },
    [setClientesData, setVarejoData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "clientes" | "varejo") => {
      e.preventDefault();
      setIsDragging(null);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleFileUpload(file, type);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent, type: "clientes" | "varejo") => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: "clientes" | "varejo") => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const clearUpload = (type: "clientes" | "varejo") => {
    if (type === "clientes") {
      setClientesData([]);
      setUploadState((prev) => ({
        ...prev,
        clientes: { uploaded: false, fileName: null, count: 0, loading: false },
      }));
    } else {
      setVarejoData([]);
      setUploadState((prev) => ({
        ...prev,
        varejo: { uploaded: false, fileName: null, count: 0, loading: false },
      }));
    }
  };

  const UploadCard = ({
    type,
    title,
    description,
  }: {
    type: "clientes" | "varejo";
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
          {state.loading ? (
            <div className="flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 p-4">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <p className="text-sm font-medium text-blue-600">Processando arquivo...</p>
            </div>
          ) : state.uploaded ? (
            <div className="flex items-center justify-between rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00C853]" />
                <div>
                  <p className="font-medium text-[#1a1a1a]">{state.fileName}</p>
                  <p className="text-sm text-[#64748b]">
                    {state.count.toLocaleString("pt-BR")} registros carregados
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
    <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
