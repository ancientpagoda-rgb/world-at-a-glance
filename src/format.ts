export function formatNumber(x: number, unit?: string) {
  if (!Number.isFinite(x)) return "—";

  // Percent-ish units
  if (unit === "%") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(x) + "%";
  }

  // Currency-ish
  if (unit?.toLowerCase().includes("us$") || unit?.toLowerCase().includes("usd")) {
    // WB GDP numbers are huge; compact keeps it readable.
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(x);
  }

  // Generic compact
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(x);
}
