import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const CLAIM_FORMS = [
  // ── AIA Singapore — verified URLs, slow CDN needs 45s ──
  { id: 'aia-accident-hospitalisation', insurer: 'AIA', type: 'Accident & Hospitalisation', name: 'AIA Accident & Hospitalisation Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/accident-and-hospitalisation-claim-form.pdf', filename: 'aia-accident-hospitalisation.pdf', timeout: 45000 },
  { id: 'aia-personal-lines', insurer: 'AIA', type: 'Personal Lines', name: 'AIA Personal Lines Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/personal-line-claim-form.pdf', filename: 'aia-personal-lines.pdf', timeout: 45000 },
  { id: 'aia-death', insurer: 'AIA', type: 'Death', name: 'AIA Death Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/death-claim-form.pdf', filename: 'aia-death.pdf', timeout: 45000 },
  { id: 'aia-followup', insurer: 'AIA', type: 'Follow-Up', name: 'AIA Follow-Up Claim Form', url: 'https://www.aia.com.sg/content/dam/sg/en/docs/help-support/making-a-claim/follow-up-claim-form.pdf', filename: 'aia-followup.pdf', timeout: 45000 },

  // ── Great Eastern — confirmed ✅ ──
  { id: 'ge-personal-accident', insurer: 'Great Eastern', type: 'Personal Accident', name: 'GE Personal Accident Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/personal-insurance/get-help/make-a-claim/personal-accident/personal-accident-claim-form.pdf', filename: 'ge-personal-accident.pdf', timeout: 15000 },
  { id: 'ge-travel', insurer: 'Great Eastern', type: 'Travel', name: 'GE Travel Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/personal-insurance/get-help/make-a-claim/travel-claim/travel-claim-form.pdf', filename: 'ge-travel.pdf', timeout: 15000 },
  { id: 'ge-group-hs', insurer: 'Great Eastern', type: 'Group Hospital & Surgical', name: 'GE Group Hospital & Surgical Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-hospital-and-surgical-claim-form.pdf', filename: 'ge-group-hs.pdf', timeout: 15000 },
  { id: 'ge-group-pa', insurer: 'Great Eastern', type: 'Group Personal Accident', name: 'GE Group Personal Accident Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-personal-accident-claim-form.pdf', filename: 'ge-group-pa.pdf', timeout: 15000 },
  { id: 'ge-group-outpatient', insurer: 'Great Eastern', type: 'Group Outpatient', name: 'GE Group Outpatient Clinical Claim Form', url: 'https://www.greateasternlife.com/content/dam/corp-site/great-eastern/sg/homepage/corporate-solutions/employee-benefits/group-insurance/customer-service/group-outpatient-clinical-claim-form.pdf', filename: 'ge-group-outpatient.pdf', timeout: 15000 },

  // ── Prudential — confirmed ✅ ──
  { id: 'pru-general', insurer: 'Prudential', type: 'General Claim', name: 'Prudential Claim Form', url: 'https://www.prudential.com.sg/~/media/prudential/PDF/claimforms/pfc_cform.pdf', filename: 'pru-general.pdf', timeout: 15000 },
  { id: 'pru-prushield', insurer: 'Prudential', type: 'PRUShield Medical', name: 'PRUShield Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/prushield_claim_form_manual_submission.pdf', filename: 'pru-prushield.pdf', timeout: 15000 },
  { id: 'pru-prushield-prepost', insurer: 'Prudential', type: 'PRUShield Pre/Post Hospital', name: 'PRUShield Pre & Post-Hospitalisation Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/prushield_pre_post_claim_form.pdf', filename: 'pru-prushield-prepost.pdf', timeout: 15000 },
  { id: 'pru-ci', insurer: 'Prudential', type: 'Critical Illness', name: 'Prudential Crisis Cover CI Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/cc_others_new.pdf', filename: 'pru-ci.pdf', timeout: 15000 },
  { id: 'pru-death', insurer: 'Prudential', type: 'Death', name: 'Prudential Death Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/d_statment.pdf', filename: 'pru-death.pdf', timeout: 15000 },
  { id: 'pru-pruextra', insurer: 'Prudential', type: 'PRUExtra', name: 'PRUExtra Claim Form', url: 'https://www.prudential.com.sg/-/media/project/prudential/pdf/how-to-submit-claim/pruextra_claim_form.pdf', filename: 'pru-pruextra.pdf', timeout: 15000 },

  // ── NTUC Income — verified kcassets URLs ──
  { id: 'income-travel', insurer: 'NTUC Income', type: 'Travel', name: 'Income Travel Claim Form', url: 'https://www.income.com.sg/kcassets/dc2181a5-826f-4f8c-ba05-16d5c2eeb63a/Travel%20Insurance%20Claim%20MOF_202405_DnPDUS.pdf', filename: 'income-travel.pdf', timeout: 20000 },
  { id: 'income-prepost', insurer: 'NTUC Income', type: 'Pre/Post Hospitalisation', name: 'Income Pre/Post Hospital & Outpatient Claim', url: 'https://www.income.com.sg/kcassets/89c6f76d-a2ce-4246-986f-55b93ed82fce/PrePost%20Hospital%20and%20Outpatient%20Hospital%20Claim.pdf', filename: 'income-prepost.pdf', timeout: 20000 },

  // ── Manulife — verified /resources/ URLs ──
  { id: 'manulife-medical', insurer: 'Manulife', type: 'Accident & Health', name: 'Manulife Accident & Health Claim Form', url: 'https://www.manulife.com.sg/content/dam/insurance/sg/resources/medical-claim-form.pdf', filename: 'manulife-medical.pdf', timeout: 20000 },
  { id: 'manulife-death', insurer: 'Manulife', type: 'Death', name: 'Manulife Death Claim Form', url: 'https://www.manulife.com.sg/content/dam/insurance/sg/resources/death-claim-form.pdf', filename: 'manulife-death.pdf', timeout: 20000 },
]

const BUCKET = 'claim-forms'

export async function GET(request: NextRequest) {
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
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*;q=0.9',
          'Accept-Language': 'en-SG,en;q=0.9',
          'Referer': `https://www.${new URL(form.url).hostname}/`,
        },
        signal: AbortSignal.timeout(form.timeout),
        redirect: 'follow',
      })

      if (!res.ok) {
        results.push({ id: form.id, insurer: form.insurer, type: form.type, name: form.name, status: `http_${res.status}` })
        continue
      }

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Verify it's actually a PDF by checking magic bytes
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

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(form.filename)

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
