// Supabase Edge Function: delete-user
// Deletes a user's real login (auth.users) AND their profile row.
// Callable in two cases:
//  1. An admin deleting someone else's account
//  2. Any authenticated user deleting their OWN account (self-service,
//     required by Google Play policy for apps with account creation)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId manquant" }), { status: 400, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Client scoped to the CALLER's token — used only to verify who's asking
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Session invalide" }), { status: 401, headers: corsHeaders });
    }

    // Admin client with the service-role key — this is what actually has permission to delete
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const isSelfDelete = userId === caller.id;

    if (!isSelfDelete) {
      // Deleting someone ELSE's account — caller must be an admin
      const { data: callerProfile, error: profileErr } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", caller.id)
        .single();
      if (profileErr || callerProfile?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), { status: 403, headers: corsHeaders });
      }
    }
    // else: isSelfDelete === true — anyone may delete their own account, no extra check needed

    // Delete the profile row first (courses/messages/etc cascade via FK), then the real login
    await adminClient.from("profiles").delete().eq("id", userId);
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
