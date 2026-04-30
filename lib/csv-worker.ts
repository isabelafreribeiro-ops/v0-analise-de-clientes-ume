// Função para processar CSV de forma não-bloqueante com suporte a arquivos grandes
// Processa em chunks para evitar memory overflow

import Papa from "papaparse";
import type { ClienteRow, VarejoRow } from "./types";

export async function parseCSVAsync(
  fileContent: string,
  type: "clientes" | "varejo",
  onProgress?: (processed: number, total: number) => void
): Promise<{ data: ClienteRow[] | VarejoRow[]; count: number }> {
  return new Promise((resolve, reject) => {
    try {
      // Dividir conteúdo em linhas para estimar total
      const lines = fileContent.split("\n");
      const totalLines = lines.length;
      let processedRows = 0;

      // Parse com chunk callback para processar incrementalmente
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        chunk: (results, parser) => {
          processedRows += results.data.length;

          // Relatar progresso se callback fornecido
          if (onProgress) {
            onProgress(processedRows, totalLines);
          }

          // Pausar e resumir com delay para yield do thread
          parser.pause();
          setTimeout(() => {
            parser.resume();
          }, 0);
        },
        complete: (results) => {
          // Yield do thread principal após parsing para UI ficar responsiva
          setTimeout(() => {
            const data = (
              type === "clientes" ? results.data : results.data
            ) as ClienteRow[] | VarejoRow[];

            console.log(
              `[v0] CSV parsing complete: ${data.length} rows processed`
            );

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

