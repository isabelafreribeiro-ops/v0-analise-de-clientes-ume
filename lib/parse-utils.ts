// Parse Brazilian number format
// Handles: "R$ 1.234,56", "1.234,56", "1234.56"
export function parseBRNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;

  const str = String(value).trim();
  if (!str) return 0;

  // Remove R$, spaces, and currency symbols
  let cleaned = str.replace(/R\$\s?/g, "").trim();

  // Check if it uses comma as decimal separator (Brazilian format)
  // If there's a comma followed by 1-2 digits at the end, it's likely the decimal separator
  const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);

  if (hasCommaDecimal) {
    // Brazilian format: remove dots (thousand separators) and replace comma with dot
    cleaned = cleaned.replace(/\./g, "").replace(/,/, ".");
  } else {
    // Already in dot decimal format, just remove any non-numeric except dot
    cleaned = cleaned.replace(/[^\d.]/g, "");
  }

  return parseFloat(cleaned) || 0;
}

// Format number as Brazilian locale (e.g., 1.234,56)
export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Format currency as Brazilian (R$ 1.234,56)
export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Format percentage (e.g., 45,5%)
export function formatPercentage(value: number): string {
  if (value === null || isNaN(value)) return "0%";
  
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
}

// Trim column names and handle BOM/extra spaces
export function normalizeColumnName(name: string): string {
  return name.trim().replace(/^\uFEFF/, ""); // Remove BOM
}

// Parse "Mês de Entrada" or date fields to standardized format and sort key
// Handles formats like: "jan.-23", "Jan/2025", "01/2023", "Janeiro/2024", Excel serial dates, ISO strings
export function parseMonth(mesStr: string | number): { display: string; sortKey: number } {
  const monthMap: Record<string, number> = {
    jan: 1, janeiro: 1,
    fev: 2, fevereiro: 2,
    mar: 3, março: 3, marco: 3,
    abr: 4, abril: 4,
    mai: 5, maio: 5,
    jun: 6, junho: 6,
    jul: 7, julho: 7,
    ago: 8, agosto: 8,
    set: 9, setembro: 9,
    out: 10, outubro: 10,
    nov: 11, novembro: 11,
    dez: 12, dezembro: 12,
  };

  const monthDisplayNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  if (!mesStr && mesStr !== 0) return { display: "", sortKey: 0 };

  let month: number | undefined;
  let year: number | undefined;

  // Handle numeric values (Excel serial dates)
  // Excel dates are stored as number of days since 1/1/1900
  // But with offset: subtract 25569 to convert to Unix epoch, then multiply by 86400000 for milliseconds
  if (typeof mesStr === "number" && mesStr > 0) {
    // Check if it looks like an Excel date (between roughly 1 and 60000)
    if (mesStr > 100 && mesStr < 100000) {
      try {
        const excelDate = new Date((mesStr - 25569) * 86400 * 1000);
        if (!isNaN(excelDate.getTime())) {
          month = excelDate.getMonth() + 1; // getMonth is 0-indexed
          year = excelDate.getFullYear();
        }
      } catch {
        // Fall through to string parsing if Excel date conversion fails
      }
    }
  }

  // Try string parsing if numeric conversion didn't work
  if (!month || !year) {
    const mesStrNormalized = String(mesStr).trim().replace(/\./g, "").toLowerCase();

    if (!mesStrNormalized) return { display: "", sortKey: 0 };

    // Pattern 1: "jan/23", "jan/2023", "jan-23", "jan 23"
    const match1 = mesStrNormalized.match(/^([a-z]+)[-/\s](\d{2,4})$/);
    if (match1) {
      const monthStr = match1[1];
      month = monthMap[monthStr];
      year = parseInt(match1[2], 10);
      if (year && year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
    }

    // Pattern 2: "01/2023", "1/23" (numeric month/year)
    if (!month) {
      const match2 = mesStrNormalized.match(/^(\d{1,2})[-/](\d{2,4})$/);
      if (match2) {
        month = parseInt(match2[1], 10);
        year = parseInt(match2[2], 10);
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }
      }
    }

    // Pattern 3: ISO date format "2023-01-15"
    if (!month) {
      const match3 = mesStrNormalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match3) {
        year = parseInt(match3[1], 10);
        month = parseInt(match3[2], 10);
      }
    }

    // Pattern 4: Just a month name like "janeiro" or "jan"
    if (!month && !year) {
      const first3 = mesStrNormalized.substring(0, 3);
      month = monthMap[first3];
      if (!month) {
        month = monthMap[mesStrNormalized];
      }
    }
  }

  if (!month || month < 1 || month > 12) {
    return { display: String(mesStr), sortKey: 0 };
  }

  // Default to current year if no year found
  if (!year) {
    year = new Date().getFullYear();
  }

  // Format as "Jan/23"
  const displayMonth = monthDisplayNames[month - 1];
  const display = `${displayMonth}/${String(year).slice(-2)}`;

  // Sort key: YYYYMM for chronological ordering
  const sortKey = year * 100 + month;

  return { display, sortKey };
}

// Get sorted unique months from array of month strings/numbers, filtering out invalid values
export function getSortedMonths(monthValues: (string | number)[]): Array<{ original: string; display: string; sortKey: number }> {
  const monthMap = new Map<string, { display: string; sortKey: number }>();

  monthValues.forEach((mes) => {
    const { display, sortKey } = parseMonth(mes);
    // Filter out invalid values (empty display or sortKey 0)
    if (display && sortKey > 0) {
      // Use display format as key to avoid duplicates
      if (!monthMap.has(display)) {
        monthMap.set(display, { display, sortKey });
      }
    }
  });

  // Sort by sortKey and return with original string reference
  return Array.from(monthMap.entries())
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([display, { sortKey }]) => ({
      original: display,
      display,
      sortKey,
    }));
}
