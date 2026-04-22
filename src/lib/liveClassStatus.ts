export type LiveClassComputedStatus = "scheduled" | "live" | "completed" | "cancelled" | "expired";

export const getLiveClassWindow = (cls: { scheduled_at: string; duration_minutes?: number | null }) => {
  const start = new Date(cls.scheduled_at);
  const end = new Date(start.getTime() + (cls.duration_minutes || 60) * 60000);
  const joinStart = new Date(start.getTime() - 10 * 60000);
  return { start, joinStart, end };
};

export const getLiveClassStatus = (cls: { scheduled_at: string; duration_minutes?: number | null; status?: string | null }): LiveClassComputedStatus => {
  if (cls.status === "cancelled") return "cancelled";
  const now = new Date();
  const { joinStart, end } = getLiveClassWindow(cls);
  if (now >= joinStart && now <= end) return "live";
  if (now > end) return cls.status === "scheduled" ? "expired" : "completed";
  return "scheduled";
};

export const isLiveClassPast = (cls: { scheduled_at: string; duration_minutes?: number | null; status?: string | null }) => {
  const status = getLiveClassStatus(cls);
  return status === "completed" || status === "cancelled" || status === "expired";
};

export const getLiveClassBadgeClass = (status: LiveClassComputedStatus) => {
  switch (status) {
    case "live": return "bg-primary text-primary-foreground animate-pulse";
    case "completed": return "bg-muted text-muted-foreground";
    case "cancelled": return "bg-destructive/10 text-destructive";
    case "expired": return "bg-secondary/20 text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getLiveClassLabel = (status: LiveClassComputedStatus) => {
  switch (status) {
    case "live": return "● Live Now";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "expired": return "Expired";
    default: return "Scheduled";
  }
};
