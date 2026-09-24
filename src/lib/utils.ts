import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// crypto.randomUUID() is only available in secure contexts (HTTPS or localhost),
// so fall back to a manual UUID v4 when accessing the app over plain HTTP/LAN IP.
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Shared unread-badge display rule: 1-9 shows the exact count, 10+ shows "9+".
export function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}
