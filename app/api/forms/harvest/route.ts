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
  // ── AIA Singapore — confirmed URLs ──
  { id: 'aia-accident-hospitalisation', insurer: 'AIA', type: 'Accident & Hospitalisation', name: 'AIA Accident & Hospitalisation Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/accident-and-hospitalisation-claim-form.pdf', filename: 'aia-accident-hospitalisation.pdf' },
  { id: 'aia-personal-lines', insurer: 'AIA', type: 'Personal Lines', name: 'AIA Personal Lines Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/personal-line-claim-form.pdf', filename: 'aia-personal-lines.pdf' },
  { id: 'aia-death', insurer: 'AIA', type: 'Death', name: 'AIA Death Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/death-claim-form.pdf', filename: 'aia-death.pdf' },
  { id: 'aia-followup', insurer: 'AIA', type: 'Follow-Up', name: 'AIA Follow-Up Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/follow-up-claim-form.pdf', filename: 'aia-followup.pdf' },

  // ── Great Eastern — confirmed URLs ──
  { id: 'ge-personal-accident', insurer: 'Great Eastern', type: 'Personal Accident', name: 'GE Personal Accident Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/personal-insurance/get-help/make-a-claim/personal-accident/personal-accident-claim-form.pdf', filename: 'ge-personal-accident.pdf' },
  { id: 'ge-travel', insurer: 'Great Eastern', type: 'Travel', name: 'GE Travel Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/personal-insurance/get-help/make-a-claim/travel-claim/travel-claim-form.pdf', filename: 'ge-travel.pdf' },
  { id: 'ge-group-hs', insurer: 'Great Eastern', type: 'Group Hospital & Surgical', name: 'GE Group Hospital & Surgical Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-hospital-and-surgical-claim-form.pdf', filename: 'ge-group-hs.pdf' },
  { id: 'ge-group-pa', insurer: 'Great Eastern', type: 'Group Personal Accident', name: 'GE Group Personal Accident Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-personal-accident-claim-form.pdf', filename: 'ge-group-pa.pdf' },
  { id: 'ge-group-outpatient', insurer: 'Great Eastern', type: 'Group Outpatient', name: 'GE Group Outpatient Clinical Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-outpatient-clinical-claim-form.pdf', filename: 'ge-group-outpatient.pdf' },

  // ── Prudential — confirmed URLs ──
  { id: 'pru-general', insurer: 'Prudential', type: 'General Claim', name: 'Prudential Claim Form', url: 'https://www.prudential.com.sg/~/media/prudential/PDF/claimforms/pfc_cform.pdf', filename: 'pru-general.pdf' },
  { id: 'pru-prushield', insurer: 'Prudential', type: 'PRUShield Medical', name: 'PRUShield Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/prushield_claim_form_manual_submission.pdf', filename: 'pru-prushield.pdf' },
  { id: 'pru-prushield-prepost', insurer: 'Prudential', type: 'PRUShield Pre/Post Hospital', name: 'PRUShield Pre & Post-Hospitalisation Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/prushield_pre_post_claim_form.pdf', filename: 'pru-prushield-prepost.pdf' },
  { id: 'pru-ci', insurer: 'Prudential', type: 'Critical Illness', name: 'Prudential Crisis Cover CI Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/cc_others_new.pdf', filename: 'pru-ci.pdf' },
  { id: 'pru-death', insurer: 'Prudential', type: 'Death', name: 'Prudential Death Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/d_statment.pdf', filename: 'pru-death.pdf' },
  { id: 'pru-pruextra', insurer: 'Prudential', type: 'PRUExtra', name: 'PRUExtra Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/pruextra_claim_form.pdf', filename: 'pru-pruextra.pdf' },

  // ── NTUC Income ──
  { id: 'income-life', insurer: 'NTUC Income', type: 'Life', name: 'Income Life Claim Form', url: 'https://www.income.com.sg/sites/default/files/2023-04/life-claim-form.pdf', filename: 'income-life.pdf' },
  { id: 'income-pa', insurer: 'NTUC Income', type: 'Personal Accident', name: 'Income PA Claim Form', url: 'https://www.income.com.sg/sites/default/files/2023-04/pa-claim-form.pdf', filename: 'income-pa.pdf' },
  { id: 'income-travel', insurer: 'NTUC Income', type: 'Travel', name: 'Income Travel Claim Form', url: 'https://www.income.com.sg/sites/default/files/2023-04/travel-claim-form.pdf', filename: 'income-travel.pdf' },
  { id: 'income-motor', insurer: 'NTUC Income', type: 'Motor', name: 'Income Motor Claim Form', url: 'https://www.income.com.sg/sites/default/files/2023-04/motor-accident-report-form.pdf', filename: 'income-motor.pdf' },

  // ── Manulife ──
  { id: 'manulife-medical', insurer: 'Manulife', type: 'Medical', name: 'Manulife Medical Claim Form', url: 'https://www.manulife.com.sg/content/dam/manulife-singapore/documents/forms/claims/medical-expenses-claim-form.pdf', filename: 'manulife-medical.pdf' },
  { id: 'manulife-life', insurer: 'Manulife', type: 'Life/CI', name: 'Manulife Life & CI Claim Form', url: 'https://www.manulife.com.sg/content/dam/manulife-singapore/documents/forms/claims/life-ci-claim-form.pdf', filename: 'manulife-life.pdf' },

  // ── Singlife ──
  { id: 'singlife-general', insurer: 'Singlife', type: 'General', name: 'Singlife Claim Form', url: 'https://singlife.com/content/dam/singlife/sg/documents/claims/singlife-claim-form.pdf', filename: 'singlife-general.pdf' },

  // ── FWD ──
  { id: 'fwd-general', insurer: 'FWD', type: 'General', name: 'FWD General Claim Form', url: 'https://www.fwd.com.sg/content/dam/fwd-sg/documents/claims/fwd-claim-form.pdf', filename: 'fwd-general.pdf' },
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
