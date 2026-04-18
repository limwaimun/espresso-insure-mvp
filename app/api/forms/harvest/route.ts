import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// ── Known public PDF URLs for SG insurer claim forms ──────────────────────
// These are publicly available forms from insurer websites
// Updated: April 2026 — trigger /api/forms/harvest to refresh
const CLAIM_FORMS = [
  // AIA Singapore — https://www.aia.com.sg/en/claims
  { id: 'aia-life-tpd', insurer: 'AIA', type: 'Life/TPD', name: 'AIA Life & TPD Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/product-brochures/claims/aia-life-tpd-claim-form.pdf', filename: 'aia-life-tpd.pdf' },
  { id: 'aia-medical', insurer: 'AIA', type: 'Medical/Health', name: 'AIA Medical Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/product-brochures/claims/aia-medical-claim-form.pdf', filename: 'aia-medical.pdf' },
  { id: 'aia-ci', insurer: 'AIA', type: 'Critical Illness', name: 'AIA Critical Illness Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/product-brochures/claims/aia-ci-claim-form.pdf', filename: 'aia-ci.pdf' },
  { id: 'aia-accident', insurer: 'AIA', type: 'Personal Accident', name: 'AIA Personal Accident Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/product-brochures/claims/aia-pa-claim-form.pdf', filename: 'aia-pa.pdf' },

  // Great Eastern — https://www.greateasternlife.com/sg/en/claims
  { id: 'ge-life', insurer: 'Great Eastern', type: 'Life/TPD', name: 'GE Life & TPD Claim Form', url: 'https://www.greateasternlife.com/content/dam/great-eastern/singapore/doc/forms/claims/ge-life-tpd-claim-form.pdf', filename: 'ge-life-tpd.pdf' },
  { id: 'ge-medical', insurer: 'Great Eastern', type: 'Medical/Health', name: 'GE Medical Claim Form', url: 'https://www.greateasternlife.com/content/dam/great-eastern/singapore/doc/forms/claims/ge-medical-claim-form.pdf', filename: 'ge-medical.pdf' },
  { id: 'ge-ci', insurer: 'Great Eastern', type: 'Critical Illness', name: 'GE Critical Illness Claim Form', url: 'https://www.greateasternlife.com/content/dam/great-eastern/singapore/doc/forms/claims/ge-ci-claim-form.pdf', filename: 'ge-ci.pdf' },

  // Prudential Singapore — https://www.prudential.com.sg/claims
  { id: 'pru-life', insurer: 'Prudential', type: 'Life/TPD', name: 'PRULife Claim Form', url: 'https://www.prudential.com.sg/content/dam/prudential-singapore/pdf/claims/pru-life-claim-form.pdf', filename: 'pru-life.pdf' },
  { id: 'pru-medical', insurer: 'Prudential', type: 'Medical/Health', name: 'PRUShield/Medical Claim Form', url: 'https://www.prudential.com.sg/content/dam/prudential-singapore/pdf/claims/pru-medical-claim-form.pdf', filename: 'pru-medical.pdf' },
  { id: 'pru-ci', insurer: 'Prudential', type: 'Critical Illness', name: 'PRUCritical Illness Claim Form', url: 'https://www.prudential.com.sg/content/dam/prudential-singapore/pdf/claims/pru-ci-claim-form.pdf', filename: 'pru-ci.pdf' },

  // NTUC Income — https://www.income.com.sg/claims
  { id: 'income-life', insurer: 'NTUC Income', type: 'Life/TPD', name: 'Income Life Claim Form', url: 'https://www.income.com.sg/content/dam/income/documents/forms/claims/life-claim-form.pdf', filename: 'income-life.pdf' },
  { id: 'income-medical', insurer: 'NTUC Income', type: 'Medical/Health', name: 'Income MediShield Claim Form', url: 'https://www.income.com.sg/content/dam/income/documents/forms/claims/medishield-claim-form.pdf', filename: 'income-medical.pdf' },
  { id: 'income-motor', insurer: 'NTUC Income', type: 'Motor', name: 'Income Motor Claim Form', url: 'https://www.income.com.sg/content/dam/income/documents/forms/claims/motor-claim-form.pdf', filename: 'income-motor.pdf' },
  { id: 'income-travel', insurer: 'NTUC Income', type: 'Travel', name: 'Income Travel Claim Form', url: 'https://www.income.com.sg/content/dam/income/documents/forms/claims/travel-claim-form.pdf', filename: 'income-travel.pdf' },

  // Manulife Singapore — https://www.manulife.com.sg/claims
  { id: 'manulife-life', insurer: 'Manulife', type: 'Life/TPD', name: 'Manulife Life Claim Form', url: 'https://www.manulife.com.sg/content/dam/manulife-singapore/documents/forms/claims/life-claim-form.pdf', filename: 'manulife-life.pdf' },
  { id: 'manulife-medical', insurer: 'Manulife', type: 'Medical/Health', name: 'Manulife ManuMedicare Claim Form', url: 'https://www.manulife.com.sg/content/dam/manulife-singapore/documents/forms/claims/medical-claim-form.pdf', filename: 'manulife-medical.pdf' },
  { id: 'manulife-ci', insurer: 'Manulife', type: 'Critical Illness', name: 'Manulife Critical Illness Claim Form', url: 'https://www.manulife.com.sg/content/dam/manulife-singapore/documents/forms/claims/ci-claim-form.pdf', filename: 'manulife-ci.pdf' },

  // Singlife (formerly Aviva) — https://singlife.com/claims
  { id: 'singlife-life', insurer: 'Singlife', type: 'Life/TPD', name: 'Singlife Life Claim Form', url: 'https://singlife.com/content/dam/singlife/documents/claims/life-claim-form.pdf', filename: 'singlife-life.pdf' },
  { id: 'singlife-medical', insurer: 'Singlife', type: 'Medical/Health', name: 'Singlife Shield Medical Claim Form', url: 'https://singlife.com/content/dam/singlife/documents/claims/shield-claim-form.pdf', filename: 'singlife-medical.pdf' },

  // FWD Singapore — https://www.fwd.com.sg/claims
  { id: 'fwd-life', insurer: 'FWD', type: 'Life/TPD', name: 'FWD Life Claim Form', url: 'https://www.fwd.com.sg/content/dam/fwd-sg/documents/claims/life-claim-form.pdf', filename: 'fwd-life.pdf' },
  { id: 'fwd-medical', insurer: 'FWD', type: 'Medical/Health', name: 'FWD Medical Claim Form', url: 'https://www.fwd.com.sg/content/dam/fwd-sg/documents/claims/medical-claim-form.pdf', filename: 'fwd-medical.pdf' },

  // Tokio Marine — https://www.tokiomarine.com/sg/claims
  { id: 'tm-general', insurer: 'Tokio Marine', type: 'General', name: 'Tokio Marine General Claim Form', url: 'https://www.tokiomarine.com/content/dam/sg/documents/claims/general-claim-form.pdf', filename: 'tokiomarine-general.pdf' },

  // AXA / HSBC Life — https://www.hsbc.com.sg/insurance/claims
  { id: 'hsbc-life', insurer: 'HSBC Life', type: 'Life/TPD', name: 'HSBC Life Claim Form', url: 'https://www.hsbc.com.sg/content/dam/hsbc/sg/documents/insurance/claims/life-claim-form.pdf', filename: 'hsbc-life.pdf' },
]

const BUCKET = 'claim-forms'

export async function GET(request: NextRequest) {
  // Allow cron (from Vercel) or manual trigger with secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.headers.get('x-vercel-cron')
  if (!cronSecret && authHeader !== `Bearer ${process.env.SUPABASE_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { id: string; insurer: string; type: string; name: string; status: string; size?: number; error?: string }[] = []

  for (const form of CLAIM_FORMS) {
    try {
      const res = await fetch(form.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Espresso/1.0; +https://espresso.insure)',
          'Accept': 'application/pdf,*/*',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: `http_${res.status}` })
        continue
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: 'not_pdf' })
        continue
      }

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Verify it's actually a PDF
      const header = String.fromCharCode(...bytes.slice(0, 4))
      if (header !== '%PDF') {
        results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: 'invalid_pdf' })
        continue
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(form.filename, bytes, { contentType: 'application/pdf', upsert: true })

      if (uploadError) {
        results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: 'upload_error', error: uploadError.message })
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(form.filename)

      // Upsert into claim_forms table
      await supabase.from('claim_forms').upsert({
        id: form.id,
        insurer: form.insurer,
        form_type: form.type,
        form_name: form.name,
        filename: form.filename,
        storage_url: urlData.publicUrl,
        source_url: form.url,
        file_size: bytes.length,
        last_fetched: new Date().toISOString(),
        status: 'available',
      })

      results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: 'success', size: bytes.length })

    } catch (err: any) {
      results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: 'error', error: err.message })
    }
  }

  const success = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status !== 'success')

  return NextResponse.json({
    message: `Harvested ${success.length}/${CLAIM_FORMS.length} claim forms`,
    success: success.map(r => `${r.insurer} - ${r.type}`),
    failed: failed.map(r => `${r.insurer} - ${r.type}: ${r.status}${r.error ? ` (${r.error})` : ''}`),
    timestamp: new Date().toISOString(),
  })
}
