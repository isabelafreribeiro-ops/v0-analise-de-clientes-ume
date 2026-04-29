"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data-context";
import type { ClienteRow, VarejoRow } from "@/lib/types";

interface UploadState {
  clientes: { uploaded: boolean; fileName: string | null; count: number };
  varejo: { uploaded: boolean; fileName: string | null; count: number };
}

export function CSVUploader() {
  const { setClientesData, setVarejoData } = useData();
  const [uploadState, setUploadState] = useState<UploadState>({
    clientes: { uploaded: false, fileName: null, count: 0 },
    varejo: { uploaded: false, fileName: null, count: 0 },
  });
  const [isDragging, setIsDragging] = useState<"clientes" | "varejo" | null>(null);

  const handleFileUpload = useCallback(
    (file: File, type: "clientes" | "varejo") => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (type === "clientes") {
            const data = results.data as ClienteRow[];
            setClientesData(data);
            setUploadState((prev) => ({
              ...prev,
              clientes: { uploaded: true, fileName: file.name, count: data.length },
            }));
          } else {
            const data = results.data as VarejoRow[];
            setVarejoData(data);
            setUploadState((prev) => ({
              ...prev,
              varejo: { uploaded: true, fileName: file.name, count: data.length },
            }));
          }
        },
        error: (error) => {
          console.error("[v0] Error parsing CSV:", error);
        },
      });
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
        clientes: { uploaded: false, fileName: null, count: 0 },
      }));
    } else {
      setVarejoData([]);
      setUploadState((prev) => ({
        ...prev,
        varejo: { uploaded: false, fileName: null, count: 0 },
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
        className={`transition-all duration-200 border-[#004d26] bg-[#002a14] ${
          isActive ? "border-[#00C853] ring-2 ring-[#00C853]/20" : ""
        } ${state.uploaded ? "border-[#00C853]/50" : ""}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <FileSpreadsheet className="h-5 w-5 text-[#00C853]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.uploaded ? (
            <div className="flex items-center justify-between rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00C853]" />
                <div>
                  <p className="font-medium text-white">{state.fileName}</p>
                  <p className="text-sm text-[#7a9e8a]">
                    {state.count.toLocaleString("pt-BR")} registros carregados
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearUpload(type)}
                className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400 text-[#7a9e8a]"
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
                isActive ? "border-[#00C853] bg-[#00C853]/5" : "border-[#004d26] hover:border-[#00C853]/50"
              }`}
            >
              <Upload className={`mb-3 h-10 w-10 ${isActive ? "text-[#00C853]" : "text-[#7a9e8a]"}`} />
              <p className="mb-1 text-sm font-medium text-white">{description}</p>
              <p className="mb-4 text-xs text-[#7a9e8a]">Arraste e solte ou clique para selecionar</p>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleInputChange(e, type)}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild className="border-[#00C853] text-[#00C853] hover:bg-[#00C853]/10 hover:text-[#00ff6a]">
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
