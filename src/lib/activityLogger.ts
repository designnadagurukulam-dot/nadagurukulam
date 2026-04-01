import { supabase } from "@/integrations/supabase/client";

export const logActivity = (
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
) => {
  // Fire-and-forget: don't block the UI
  supabase.auth.getUser().then(({ data }) => {
    const userId = data?.user?.id;
    if (!userId) return;
    supabase
      .from("activity_logs" as any)
      .insert({
        user_id: userId,
        action,
        entity_type: entityType || null,
        entity_id: entityId || null,
        metadata: metadata || null,
      })
      .then(() => {});
  });
};
