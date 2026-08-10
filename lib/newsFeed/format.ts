export function formatNewsTime(publishedAt: string): string {
  if (!publishedAt) return "";

  const parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) {
    // Nicht parsebar (z.B. reiner "DD.MM.YYYY"-Text ohne Uhrzeit) — roh anzeigen statt zu raten.
    return publishedAt;
  }

  const diffMs = Date.now() - parsed;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `vor ${diffD} Tg`;

  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(parsed)
  );
}
