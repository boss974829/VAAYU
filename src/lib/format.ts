const stamp = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const hourOnly = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  hour12: true,
});

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "time unknown";
  return `${stamp.format(date)} IST`;
}

export function formatHour(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return hourOnly.format(date);
}

export function formatSaved(iso: string | null): string {
  if (!iso) return "Not saved yet";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "Saved";
  if (diff < 60_000) return "Saved just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.round(diff / 60_000));
    return `Saved ${minutes} min ago`;
  }
  return `Saved ${formatStamp(iso)}`;
}

export function istHour(iso: string): number {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  return hour ? Number(hour) : date.getUTCHours();
}
