export function formatKickoffDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatKickoffTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCountdown(iso: string, now: Date = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  if (diffMs <= 0) return "Jetzt";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} Tg · ${hours} Std`;
  if (hours > 0) return `${hours} Std · ${minutes} Min`;
  return `${minutes} Min`;
}
