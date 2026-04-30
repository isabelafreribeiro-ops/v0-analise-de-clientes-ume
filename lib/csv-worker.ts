// Web Worker para processar CSV em background
// Evita bloqueio da UI durante parsing de arquivos grandes

import Papa from "papaparse";
import type { ClienteRow, VarejoRow } from "./types";

interface ParseMessage {
  type: "clientes" | "varejo";
  fileContent: string;
}

interface ParseResult {
  type: "clientes" | "varejo";
  data: ClienteRow[] | VarejoRow[];
  count: number;
  timestamp: number;
}

self.onmessage = (event: MessageEvent<ParseMessage>) => {
  const { type, fileContent } = event.data;
  const startTime = performance.now();

  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: (results) => {
      const endTime = performance.now();
      const data = (type === "clientes" ? results.data : results.data) as ClienteRow[] | VarejoRow[];

      const result: ParseResult = {
        type,
        data,
        count: data.length,
        timestamp: endTime - startTime,
      };

      self.postMessage(result);
    },
    error: (error: any) => {
      self.postMessage({ error: error.message });
    },
  });
};

export type { ParseMessage, ParseResult };
