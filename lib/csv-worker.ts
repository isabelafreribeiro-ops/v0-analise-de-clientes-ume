// Função para processar CSV de forma não-bloqueante
// Yield do thread principal para manter UI responsiva

import Papa from "papaparse";
import type { ClienteRow, VarejoRow } from "./types";

export async function parseCSVAsync(
  fileContent: string,
  type: "clientes" | "varejo"
): Promise<{ data: ClienteRow[] | VarejoRow[]; count: number }> {
  return new Promise((resolve, reject) => {
    try {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          // Yield do thread após parsing para UI ficar responsiva
          setTimeout(() => {
            const data = (
              type === "clientes" ? results.data : results.data
            ) as ClienteRow[] | VarejoRow[];

            resolve({
              data,
              count: data.length,
            });
          }, 0);
        },
        error: (error: any) => {
          reject(new Error(`CSV parse error: ${error.message}`));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

