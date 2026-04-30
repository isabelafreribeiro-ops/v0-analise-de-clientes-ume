// Shared text normalization and parsing utilities
// Used across the app for consistent column name and value matching

/**
 * Normalize text for consistent comparison
 * Removes accents, converts to lowercase, trims whitespace
 */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Parse boolean value from various formats
 * Handles "sim", "não", "true", "false", "1", "0", "yes", "no", etc.
 */
export function parseBoolean(value: any): boolean {
  if (value === null || value === undefined || value === "") return false;
  
  const normalized = normalizeText(String(value));
  
  // Positive indicators
  if (["sim", "true", "1", "yes", "s", "y", "verdadeiro", "v"].includes(normalized)) {
    return true;
  }
  
  // Negative indicators
  if (["nao", "false", "0", "no", "n", "falso", "f"].includes(normalized)) {
    return false;
  }
  
  return false;
}

/**
 * Find a column value by trying multiple possible column names
 * Uses normalized text matching for robustness
 */
export function findColumnValue(
  row: Record<string, any>,
  possibleNames: string[]
): any {
  // Try exact matches first (original case)
  for (const name of possibleNames) {
    if (name in row && row[name] !== null && row[name] !== undefined && row[name] !== "") {
      return row[name];
    }
  }
  
  // Then try normalized matches
  const normalizedPossible = possibleNames.map(normalizeText);
  const rowKeys = Object.keys(row);
  
  for (const key of rowKeys) {
    const normalizedKey = normalizeText(key);
    if (normalizedPossible.includes(normalizedKey) && row[key] !== null && row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  
  return null;
}

/**
 * Normalize situação field to standard values
 * Returns: "aprovada", "negada", or "unknown"
 */
export function normalizeSituacao(value: any): "aprovada" | "negada" | "unknown" {
  if (!value) return "unknown";
  
  const normalized = normalizeText(String(value));
  
  if (["negada", "nao", "rejeitada", "rejected", "declined", "no"].includes(normalized)) {
    return "negada";
  }
  
  if (["aprovada", "approved", "ativa", "active", "yes", "sim"].includes(normalized)) {
    return "aprovada";
  }
  
  return "unknown";
}
