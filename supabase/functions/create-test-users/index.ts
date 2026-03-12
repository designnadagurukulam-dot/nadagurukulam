import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, string> = {};

  // Create instructor
  const { data: inst, error: instErr } = await supabaseAdmin.auth.admin.createUser({
    email: "instructor@nadagurukulam.com",
    password: "Instructor@123",
    email_confirm: true,
    user_metadata: { display_name: "Test Instructor" },
  });
  if (instErr) {
    results.instructor = `Error: ${instErr.message}`;
  } else {
    // Update role to instructor
    await supabaseAdmin.from("user_roles").update({ role: "instructor" }).eq("user_id", inst.user.id);
    results.instructor = `Created: ${inst.user.id}`;
  }

  // Create admin
  const { data: adm, error: admErr } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@nadagurukulam.com",
    password: "Admin@123",
    email_confirm: true,
    user_metadata: { display_name: "Admin" },
  });
  if (admErr) {
    results.admin = `Error: ${admErr.message}`;
  } else {
    // Update role to admin
    await supabaseAdmin.from("user_roles").update({ role: "admin" }).eq("user_id", adm.user.id);
    results.admin = `Created: ${adm.user.id}`;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
