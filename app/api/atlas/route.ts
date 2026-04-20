import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const BUCKET = 'claim-forms'

// ── Field mapping — known DB fields → common claim form fields ─────────────
function buildKnownFields(client: any, policy: any, ifa: any) {
  return {
    // Claimant / Insured
    'full_name': client.name,
    'name': client.name,
    'claimant_name': client.name,
    'insured_name': client.name,
    'policy_holder': client.name,
    'date_of_birth': client.birthday,
    'dob': client.birthday,
    'contact_number': client.whatsapp,
    'mobile': client.whatsapp,
    'phone': client.whatsapp,
    'email': client.email,
    'email_address': client.email,
    'mailing_address': client.address,
    'address': client.address,
    'company': client.company,
    'employer': client.company,

    // Policy
    'policy_number': policy?.id,
    'policy_no': policy?.id,
    'insurer': policy?.insurer,
    'insurance_company': policy?.insurer,
    'plan_name': policy?.type,
    'policy_type': policy?.type,
    'premium': policy?.premium,

    // IFA / Agent
    'agent_name': ifa?.name,
    'financial_advisor': ifa?.name,
    'advisor_name': ifa?.name,
    'agent_code': null,
    'agency': ifa?.company,
  }
}

// ── Missing fields that Atlas needs Maya to collect ───────────────────────
const CLAIM_SPECIFIC_FIELDS = {
  'Life/TPD': [
    { field: 'date_of_death_or_disability', label: 'Date of death or disability', required: true },
    { field: 'cause_of_death_or_disability', label: 'Cause of death or disability', required: true },
    { field: 'hospital_name', label: 'Hospital name (if applicable)', required: false },
    { field: 'attending_doctor', label: 'Attending doctor name', required: false },
    { field: 'bank_account_name', label: 'Bank account name for payout', required: true },
    { field: 'bank_account_number', label: 'Bank account number', required: true },
    { field: 'bank_name', label: 'Bank name', required: true },
  ],
  'Medical/Health': [
    { field: 'date_of_admission', label: 'Date of hospital admission', required: true },
    { field: 'date_of_discharge', label: 'Date of discharge', required: true },
    { field: 'hospital_name', label: 'Hospital/clinic name', required: true },
    { field: 'diagnosis', label: 'Diagnosis / reason for admission', required: true },
    { field: 'attending_doctor', label: 'Attending doctor name', required: true },
    { field: 'total_bill_amount', label: 'Total bill amount (SGD)', required: true },
    { field: 'medisave_used', label: 'Amount paid via MediSave', required: false },
  ],
  'Critical Illness': [
    { field: 'diagnosis_date', label: 'Date of CI diagnosis', required: true },
    { field: 'ci_type', label: 'Type of critical illness diagnosed', required: true },
    { field: 'hospital_name', label: 'Hospital name', required: true },
    { field: 'attending_doctor', label: 'Attending doctor name', required: true },
    { field: 'doctor_contact', label: 'Doctor contact number', required: false },
    { field: 'bank_account_name', label: 'Bank account name for payout', required: true },
    { field: 'bank_account_number', label: 'Bank account number', required: true },
  ],
  'Motor': [
    { field: 'accident_date', label: 'Date of accident', required: true },
    { field: 'accident_time', label: 'Time of accident', required: true },
    { field: 'accident_location', label: 'Location of accident', required: true },
    { field: 'vehicle_number', label: 'Vehicle registration number', required: true },
    { field: 'third_party_vehicle', label: 'Third party vehicle number (if any)', required: false },
    { field: 'police_report_number', label: 'Police report number', required: false },
    { field: 'workshop_name', label: 'Workshop name', required: false },
    { field: 'repair_estimate', label: 'Estimated repair cost (SGD)', required: false },
  ],
  'Travel': [
    { field: 'departure_date', label: 'Departure date', required: true },
    { field: 'return_date', label: 'Return/expected return date', required: true },
    { field: 'destination', label: 'Travel destination', required: true },
    { field: 'incident_date', label: 'Date of incident', required: true },
    { field: 'incident_description', label: 'Description of incident', required: true },
    { field: 'total_claim_amount', label: 'Total amount claimed (SGD)', required: true },
  ],
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const userId = auth.userId

    // ── Parse body ────────────────────────────────────────────────────────
    const { formId, clientId, ifaId: _unused, collectedFields } = await request.json()

    if (_unused && _unused !== userId) {
      console.warn(`[atlas] ignored mismatched ifaId: body=${_unused} verified=${userId}`)
    }

    if (!formId || !clientId) {
      return NextResponse.json({ error: 'Missing formId or clientId' }, { status: 400 })
    }

    // ── Ownership check: verify client belongs to verified userId ─────────
    // Done separately before the parallel fetch so we can fail fast.
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('ifa_id', userId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // ── Fetch remaining data in parallel ──────────────────────────────────
    const [
      { data: ifa },
      { data: form },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('claim_forms').select('*').eq('id', formId).single(),
    ])

    if (!form) return NextResponse.json({ error: 'Claim form not found' }, { status: 404 })

    // Find the most relevant active policy for this claim type (scoped to verified userId)
    const { data: policies } = await supabase
      .from('policies')
      .select('*')
      .eq('client_id', clientId)
      .eq('ifa_id', userId)

    const relevantPolicy = policies?.find(p =>
      p.insurer?.toLowerCase().includes(form.insurer.toLowerCase()) ||
      p.type?.toLowerCase().includes(form.form_type.toLowerCase().split('/')[0].toLowerCase())
    ) || policies?.[0]

    // ── Fetch claim attachments if claim exists (scoped to verified userId via client check) ──
    let claimAttachments: { file_name: string; file_type: string; storage_path: string; description: string | null }[] = []
    if (clientId) {
      const { data: openClaim } = await supabase
        .from('alerts')
        .select('id')
        .eq('client_id', clientId)
        .eq('ifa_id', userId)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (openClaim) {
        const { data: attachments } = await supabase
          .from('claim_attachments')
          .select('file_name, file_type, storage_path, description')
          .eq('claim_id', openClaim.id)
        claimAttachments = attachments || []
      }
    }

    // ── Build known fields ─────────────────────────────────────────────────
    const knownFields = buildKnownFields(client, relevantPolicy, ifa)

    // Merge in any fields already collected (from Maya conversation)
    const allKnown = { ...knownFields, ...(collectedFields || {}) }

    // ── Determine missing fields for this claim type ───────────────────────
    const claimSpecific = CLAIM_SPECIFIC_FIELDS[form.form_type as keyof typeof CLAIM_SPECIFIC_FIELDS] || []
    const missingFields = claimSpecific.filter(f => !allKnown[f.field] || allKnown[f.field] === null)
    const requiredMissing = missingFields.filter(f => f.required)

    // ── Generate Maya's collection script for missing fields ───────────────
    let mayaScript = null
    if (requiredMissing.length > 0) {
      const scriptRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are Maya, a warm WhatsApp assistant helping process a ${form.form_type} claim for ${client.name} with ${form.insurer}.

Generate a natural, empathetic WhatsApp message to collect the following missing information. Ask for ALL items in ONE message, keeping it concise and warm. Do not use bullet points — weave it naturally.

Missing fields needed:
${requiredMissing.map(f => `- ${f.label}`).join('\n')}

Context: This is for a ${form.insurer} ${form.form_type} claim form. Keep it under 100 words.`,
        }],
      })
      mayaScript = scriptRes.content.find(b => b.type === 'text')?.text
    }

    // ── Check if form PDF is available in storage ──────────────────────────
    const formAvailable = !!form.storage_url

    // ── If form not in library, generate FA request script ─────────────────
    let faFormRequestScript: string | null = null
    if (!formAvailable) {
      const scriptRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are Maya, a WhatsApp assistant for an IFA in Singapore.

A client needs to submit a ${form.form_type} claim with ${form.insurer}, but we don't have their claim form in our library yet.

Write a short, natural WhatsApp message to the FA asking them to upload the blank ${form.insurer} ${form.form_type} claim form to the Espresso Library so we can pre-fill it for the client. 

Keep it under 60 words. Friendly and direct. Mention they can find it on the ${form.insurer} website or get it from their insurer contact.`,
        }],
      })
      faFormRequestScript = scriptRes.content.find(b => b.type === 'text')?.text ?? null
    }

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        insurer: form.insurer,
        type: form.form_type,
        name: form.form_name,
        available: formAvailable,
        storageUrl: form.storage_url,
      },
      client: {
        name: client.name,
        id: clientId,
      },
      policy: relevantPolicy ? {
        insurer: relevantPolicy.insurer,
        type: relevantPolicy.type,
        premium: relevantPolicy.premium,
      } : null,
      prefill: formAvailable ? {
        knownFields: Object.entries(allKnown)
          .filter(([, v]) => v !== null && v !== undefined)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        missingFields: missingFields.map(f => ({
          field: f.field,
          label: f.label,
          required: f.required,
          collected: !!allKnown[f.field],
        })),
        requiredMissingCount: requiredMissing.length,
        completionPercent: Math.round(
          ((claimSpecific.length - requiredMissing.length) / Math.max(claimSpecific.length, 1)) * 100
        ),
      } : null,
      mayaCollectionScript: formAvailable ? mayaScript : null,
      faFormRequestScript,
      claimAttachments: claimAttachments.map(a => ({ name: a.file_name, type: a.file_type, description: a.description })),
      attachmentCount: claimAttachments.length,
      readyToGenerate: formAvailable && requiredMissing.length === 0,
    })
  } catch (err) {
    console.error('[atlas] error:', err)
    return NextResponse.json({ error: 'Atlas failed' }, { status: 500 })
  }
}
