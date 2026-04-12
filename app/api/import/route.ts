import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Read body ONCE
    const body = await request.json();
    console.log('IMPORT BODY KEYS:', Object.keys(body));
    console.log('DEBUG POLICIES:', JSON.stringify({ policiesLength: body.policies?.length, firstPolicy: body.policies?.[0], policiesType: typeof body.policies }));
    console.log('userId:', body.userId);
    console.log('clients count:', body.clients?.length);
    console.log('policies count:', body.policies?.length);

    const { clients, policies, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 400 });
    }
    
    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: 'No client data' }, { status: 400 });
    }
    
    if (!policies || policies.length === 0) {
      console.log('SKIPPING POLICIES: empty or missing');
      // Continue with client import only
    }
    
    console.log(`Processing ${clients.length} clients and ${policies?.length || 0} policies for user ${userId}`);

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

    console.log('POLICIES RECEIVED:', policies?.length);
    console.log('FIRST POLICY:', JSON.stringify(policies?.[0]));

    // Build name-to-id map from inserted clients
    const clientIdMap = new Map();
    insertedClients.forEach((client) => {
      const key = client.name.toLowerCase().trim();
      clientIdMap.set(key, client.id);
    });
    
    console.log('CLIENT ID MAP SIZE:', clientIdMap.size);
    console.log('CLIENT ID MAP KEYS:', Array.from(clientIdMap.keys()));

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
    
    console.log('POLICY ROWS TO INSERT:', policiesWithClientIds?.length);
    if (policiesWithClientIds?.length > 0) console.log('FIRST POLICY ROW:', JSON.stringify(policiesWithClientIds[0]));

    // Insert policies (non-fatal)
    let policiesImported = 0;
    let policyInsertError = null;
    try {
      const { data: insertedPolicies, error: policyError } = await supabaseAdmin
        .from("policies")
        .insert(policiesWithClientIds)
        .select("id");

      if (policyError) {
        policyInsertError = String(policyError);
        console.error('POLICY INSERT ERROR:', JSON.stringify(policyError));
        // Continue — clients were already inserted
      } else {
        policiesImported = insertedPolicies.length;
      }
    } catch (policyError) {
      policyInsertError = String(policyError);
      console.error('POLICY INSERT ERROR:', JSON.stringify(policyError));
      // continue — clients were already inserted
    }

    return NextResponse.json({
      success: true,
      clientsImported: insertedClients.length,
      policiesImported,
      debug: {
        policiesReceived: policies?.length || 0,
        policiesType: typeof policies,
        firstPolicy: policies?.[0] || null,
        clientIdMapSize: clientIdMap?.size || 0,
        policyRowsBuilt: policiesWithClientIds?.length || 0,
        firstPolicyRow: policiesWithClientIds?.[0] || null,
        policyError: policyInsertError,
      },
      message: `Successfully imported ${insertedClients.length} clients and ${policiesImported} policies`,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}