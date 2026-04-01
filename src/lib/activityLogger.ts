import { supabase } from "@/integrations/supabase/client";

export const logActivity = async (
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return;
    await (supabase.from("activity_logs" as any) as any).insert({
      user_id: userId,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata: metadata || null,
    });
  } catch {
    // Silently fail — never block UI for logging
  }
};
