import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { clients, policies } = await request.json();

    if (!clients || !policies) {
      return NextResponse.json(
        { error: "Missing clients or policies data" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Deduplicate clients by name (case-insensitive)
    const uniqueClients = new Map();
    clients.forEach((client: any) => {
      const key = client.name.toLowerCase().trim();
      if (!uniqueClients.has(key)) {
        uniqueClients.set(key, client);
      }
    });

    const deduplicatedClients = Array.from(uniqueClients.values());

    // Insert clients
    const { data: insertedClients, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert(deduplicatedClients)
      .select("id, name");

    if (clientError) {
      console.error("Error inserting clients:", clientError);
      return NextResponse.json(
        { error: `Failed to insert clients: ${clientError.message}` },
        { status: 500 }
      );
    }

    // Build name-to-id map from inserted clients
    const clientIdMap = new Map();
    insertedClients.forEach((client) => {
      const key = client.name.toLowerCase().trim();
      clientIdMap.set(key, client.id);
    });

    // Prepare policies with client_id
    const policiesWithClientIds = policies.map((policy: any) => {
      const clientKey = policy.clientName.toLowerCase().trim();
      const clientId = clientIdMap.get(clientKey);
      
      if (!clientId) {
        throw new Error(`Client not found for policy: ${policy.clientName}`);
      }

      return {
        insurer: policy.insurer,
        type: policy.type,
        premium: policy.premium,
        renewal_date: policy.renewal_date,
        client_id: clientId,
      };
    });

    // Insert policies
    const { data: insertedPolicies, error: policyError } = await supabaseAdmin
      .from("policies")
      .insert(policiesWithClientIds)
      .select("id");

    if (policyError) {
      console.error("Error inserting policies:", policyError);
      return NextResponse.json(
        { error: `Failed to insert policies: ${policyError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientsImported: insertedClients.length,
      policiesImported: insertedPolicies.length,
      message: `Successfully imported ${insertedClients.length} clients and ${insertedPolicies.length} policies`,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}