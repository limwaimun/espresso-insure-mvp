import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    console.log("Import API called");
    const body = await request.json();
    console.log("Request body received:", JSON.stringify(body, null, 2).substring(0, 1000));
    
    const { clients, policies, userId } = body;

    if (!clients || !policies || !userId) {
      console.error("Missing required data:", { 
        hasClients: !!clients, 
        hasPolicies: !!policies, 
        hasUserId: !!userId 
      });
      return NextResponse.json(
        { error: "Missing required data (clients, policies, or userId)" },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${clients.length} clients and ${policies.length} policies for user ${userId}`);

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

    // Deduplicate clients by name (case-insensitive) and add ifa_id
    const uniqueClients = new Map();
    clients.forEach((client: any) => {
      const key = client.name.toLowerCase().trim();
      if (!uniqueClients.has(key)) {
        uniqueClients.set(key, {
          ...client,
          ifa_id: userId
        });
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
      // Handle both clientName and client_name for compatibility
      const clientName = policy.clientName || policy.client_name;
      if (!clientName) {
        console.error("Policy missing client name:", policy);
        throw new Error(`Policy missing client name: ${JSON.stringify(policy)}`);
      }
      
      const clientKey = clientName.toLowerCase().trim();
      const clientId = clientIdMap.get(clientKey);
      
      if (!clientId) {
        console.error(`Client not found for policy: ${clientName}. Available clients:`, Array.from(clientIdMap.keys()));
        throw new Error(`Client not found for policy: ${clientName}`);
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