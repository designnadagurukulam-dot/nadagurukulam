import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const callerSet = new Set((callerRoles || []).map((r: any) => r.role));
    const isSuperAdmin = callerSet.has("super_admin");
    if (!isSuperAdmin && !callerSet.has("admin")) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.target_user_id || "");
    if (!targetUserId) return json({ error: "target_user_id is required" }, 400);
    if (targetUserId === callerId) return json({ error: "You cannot delete your own account" }, 403);

    const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", targetUserId);
    const targetSet = new Set((targetRoles || []).map((r: any) => r.role));
    const targetIsAdminLike = targetSet.has("admin") || targetSet.has("super_admin");

    if (targetSet.has("super_admin")) {
      if (!isSuperAdmin) return json({ error: "Only a Super Admin can delete a Super Admin" }, 403);
      const { count: superAdminCount } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "super_admin");
      if ((superAdminCount || 0) <= 1) return json({ error: "Cannot remove the final Super Admin account" }, 403);
    }

    if (targetIsAdminLike && !isSuperAdmin) {
      return json({ error: "Only a Super Admin can delete admin accounts" }, 403);
    }

    // Clean up user-owned data that does not cascade automatically
    const cleanupTables: { table: string; column: string }[] = [
      { table: "activity_logs", column: "user_id" },
      { table: "user_qualifications", column: "user_id" },
      { table: "profile_change_requests", column: "user_id" },
      { table: "lesson_progress", column: "user_id" },
      { table: "orders", column: "user_id" },
      { table: "student_projects", column: "student_id" },
      { table: "batch_enrollments", column: "student_id" },
      { table: "class_log_confirmations", column: "student_id" },
      { table: "schedules", column: "user_id" },
      { table: "enrollments", column: "user_id" },
      { table: "certificates", column: "user_id" },
    ];

    for (const { table, column } of cleanupTables) {
      const { error: delErr } = await admin.from(table).delete().eq(column, targetUserId);
      if (delErr) {
        // Log but continue; FK constraints will surface on auth delete if critical rows remain
        console.error(`Failed to delete from ${table}:`, delErr.message);
      }
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (deleteErr) return json({ error: deleteErr.message }, 500);

    await admin.from("activity_logs").insert({
      user_id: callerId,
      action: "user.deleted_by_admin",
      entity_type: "user",
      entity_id: targetUserId,
    });

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
});
