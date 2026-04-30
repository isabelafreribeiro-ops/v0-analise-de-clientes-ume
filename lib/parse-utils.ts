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
