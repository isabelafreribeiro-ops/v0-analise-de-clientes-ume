// Função para processar CSV de forma robusta e responsiva
// Usa Papa.parse simples sem chunk callbacks que podem interferir no fluxo

import Papa from "papaparse";
import type { ClienteRow, VarejoRow } from "./types";

export async function parseCSVAsync(
  fileContent: string,
  type: "clientes" | "varejo",
  onProgress?: (processed: number, total: number) => void
): Promise<{ data: ClienteRow[] | VarejoRow[]; count: number }> {
  return new Promise((resolve, reject) => {
    try {
      // Estimar total de linhas para progresso
      const lines = fileContent.split("\n");
      const totalLines = lines.length;

      // Parse simples e direto
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const data = results.data as ClienteRow[] | VarejoRow[];

          console.log(`[v0] CSV parsing complete: ${data.length} rows`);

          // Report final progress
          if (onProgress) {
            onProgress(data.length, totalLines);
          }

          // Yield thread para manter UI responsiva
          setTimeout(() => {
            resolve({
              data,
              count: data.length,
            });
          }, 0);
        },
        error: (error: any) => {
          console.error("[v0] CSV parse error:", error);
          reject(new Error(`CSV parse error: ${error.message}`));
        },
      });
    } catch (error) {
      console.error("[v0] CSV processing error:", error);
      reject(error);
    }
  });
}

