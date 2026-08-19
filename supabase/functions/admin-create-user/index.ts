import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_ROLES = ["student", "instructor", "admin", "super_admin"] as const;

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
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.display_name || "").trim();
    const role = String(body.role || "student");
    const phone = body.phone ? String(body.phone).trim() : null;
    const designation = body.designation ? String(body.designation).trim() : null;
    const department = body.department ? String(body.department).trim() : null;
    const employeeId = body.employee_id ? String(body.employee_id).trim() : null;
    const rollNumber = body.roll_number ? String(body.roll_number).trim() : null;
    const isVerified = body.is_verified !== false;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return json({ error: "Valid email is required" }, 400);
    if (password.length < 8 || password.length > 72) return json({ error: "Password must be 8-72 characters" }, 400);
    if (!displayName || displayName.length > 100) return json({ error: "Full name is required (max 100 chars)" }, 400);
    if (!ALLOWED_ROLES.includes(role as any)) return json({ error: "Invalid role" }, 400);
    if ((role === "admin" || role === "super_admin") && !isSuperAdmin) {
      return json({ error: "Only a Super Admin can create admin accounts" }, 403);
    }
    if (phone && phone.length > 20) return json({ error: "Invalid phone number" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, role },
    });
    if (createErr || !created?.user) return json({ error: createErr?.message || "Failed to create user" }, 400);

    const newUserId = created.user.id;

    const profileUpdate: Record<string, unknown> = { is_verified: isVerified };
    if (phone) profileUpdate.phone = phone;
    if (designation) profileUpdate.designation = designation;
    if (department) profileUpdate.department = department;
    if (employeeId) profileUpdate.employee_id = employeeId;
    if (rollNumber) profileUpdate.roll_number = rollNumber;
    await admin.from("profiles").update(profileUpdate).eq("user_id", newUserId);

    await admin.from("activity_logs").insert({
      user_id: callerId,
      action: "user.created_by_admin",
      entity_type: "user",
      entity_id: newUserId,
      metadata: { email, role },
    });

    return json({ ok: true, user_id: newUserId });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
});
