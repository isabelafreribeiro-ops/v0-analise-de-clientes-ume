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

// Trim column names and handle BOM/extra spaces
export function normalizeColumnName(name: string): string {
  return name.trim().replace(/^\uFEFF/, ""); // Remove BOM
}

// Parse "Mês de Entrada" to standardized format and sort key
// Handles formats like: "jan.-23", "Jan/2025", "01/2023", "Janeiro/2024", etc.
export function parseMonth(mesStr: string): { display: string; sortKey: number } {
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

  if (!mesStr) return { display: "", sortKey: 0 };

  // Normalize: remove dots, trim, lowercase for matching
  const normalized = mesStr.trim().replace(/\./g, "").toLowerCase();

  // Try to extract month and year using various patterns
  let month: number | undefined;
  let year: number | undefined;

  // Pattern 1: "jan/23", "jan/2023", "jan-23", "jan 23"
  const match1 = normalized.match(/^([a-z]+)[-/\s](\d{2,4})$/);
  if (match1) {
    const monthStr = match1[1];
    month = monthMap[monthStr];
    year = parseInt(match1[2], 10);
    // Convert 2-digit year to 4-digit
    if (year && year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
  }

  // Pattern 2: "01/2023", "1/23" (numeric month)
  if (!month) {
    const match2 = normalized.match(/^(\d{1,2})[-/](\d{2,4})$/);
    if (match2) {
      month = parseInt(match2[1], 10);
      year = parseInt(match2[2], 10);
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
    }
  }

  // Pattern 3: Just a month name like "janeiro" or "jan"
  if (!month && !year) {
    month = monthMap[normalized.substring(0, 3)];
    if (!month) {
      month = monthMap[normalized];
    }
  }

  if (!month || month < 1 || month > 12) {
    return { display: mesStr, sortKey: 0 };
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

// Get sorted unique months from array of month strings
export function getSortedMonths(monthStrings: string[]): Array<{ original: string; display: string; sortKey: number }> {
  const monthMap = new Map<string, { display: string; sortKey: number }>();

  monthStrings.forEach((mes) => {
    const { display, sortKey } = parseMonth(mes);
    // Use original string as key to preserve any duplicates in different formats
    if (!monthMap.has(display)) {
      monthMap.set(display, { display, sortKey });
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
