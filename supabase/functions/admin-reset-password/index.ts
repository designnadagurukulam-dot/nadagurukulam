import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const callerId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey);

    // Caller must be admin or super_admin
    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const callerRoleSet = new Set((callerRoles || []).map((r: any) => r.role));
    if (!callerRoleSet.has("admin") && !callerRoleSet.has("super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const targetUserId = String(body.target_user_id || "");
    const newPassword = String(body.new_password || "");
    if (!targetUserId || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "target_user_id and new_password (>=6 chars) required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Target must NOT be admin or super_admin
    const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", targetUserId);
    const targetSet = new Set((targetRoles || []).map((r: any) => r.role));
    if (targetSet.has("admin") || targetSet.has("super_admin")) {
      return new Response(JSON.stringify({ error: "Cannot reset password for admin accounts" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword });
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log activity (best effort)
    await admin.from("activity_logs").insert({
      user_id: callerId,
      action: "user.password_reset_by_admin",
      entity_type: "user",
      entity_id: targetUserId,
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
