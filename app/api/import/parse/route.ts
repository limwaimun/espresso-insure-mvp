import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are an expert at parsing financial adviser client databases in Singapore. You will receive a file (CSV, Excel, or PDF) containing client, policy, and/or investment data in any format or layout.

Your job is to extract structured records from whatever you receive. You must correctly classify each product as either an INSURANCE POLICY or an INVESTMENT HOLDING.

## PRODUCT CLASSIFICATION

INSURANCE POLICIES (save as policies):
- Life Insurance, Whole Life, Term Life, Endowment
- Critical Illness (CI)
- Health / Hospitalisation / MediShield / Shield plans
- Personal Accident (PA)
- Motor / Car insurance
- Fire / Home / Property insurance
- Marine / Travel insurance
- Public Liability, Professional Indemnity (PI), Directors & Officers (D&O)
- Group Life, Group Health, Group Term
- Keyman insurance
- Investment-Linked Policy (ILP) — save as BOTH a policy AND a holding

INVESTMENT HOLDINGS (save as holdings):
- Unit Trusts / Mutual Funds
- ETF (Exchange Traded Fund)
- Endowment savings plans (non-insurance component)
- Annuity / Retirement plans
- Structured Products / Notes
- Bonds, stocks (if managed by FA)
- CPF investments (CPFIS)
- SRS investments
- ILP sub-funds — save as holding only (the ILP itself is already a policy)

## COMMON MESSY INPUTS — handle all of these:
- Column names: "Policy No.", "Pol No", "Policy Number", "PN", "Cert No"
- Sum assured: "SA", "Sum Assured", "Coverage", "Face Amount", "Cover Amount"
- Premium: "$3,200.00", "SGD3200", "3,200 p.a.", "3200/yr", "267/mth" — convert to annual SGD number
- Dates: 15/3/2026, 15-Mar-26, March 15 2026, 15.03.26 — always output YYYY-MM-DD
- Frequency: "Monthly", "Mthly", "M", "Annual", "Ann", "A", "Quarterly", "Q" — normalise to: monthly/quarterly/half-yearly/annual
- Policy types: "WL" = Whole Life, "TL" = Term Life, "CI" = Critical Illness, "PA" = Personal Accident, "GH" = Group Health, "GL" = Group Life
- NAV: "$1.234", "1.234", "SGD 1.23" — extract number only
- Units: "1,234.567 units", "1234.567" — extract number only
- Multiple policies per client: group into ONE client with multiple policies
- Blank rows, totals rows, header rows — ignore them
- Merged cells — use last seen value

## OUTPUT FORMAT — return ONLY valid JSON, no other text:

{
  "clients": [
    {
      "name": "Full Name",
      "email": "email or null",
      "phone": "+65XXXXXXXX or null",
      "company": "employer/company or null",
      "type": "individual" | "sme" | "corporate",
      "tier": "platinum" | "gold" | "silver" | "bronze",
      "policies": [
        {
          "policy_number": "policy number or null",
          "insurer": "insurer name or null",
          "type": "standardised type — one of: Life, Critical Illness, Health, Personal Accident, Fire, Motor, Marine, Travel, Public Liability, Professional Indemnity, Directors & Officers, Keyman, Group Life, Group Health, Endowment, Investment-Linked, Annuity, Other",
          "premium": 1234.56,
          "premium_frequency": "monthly" | "quarterly" | "half-yearly" | "annual" | null,
          "sum_assured": 500000 or null,
          "start_date": "YYYY-MM-DD or null",
          "renewal_date": "YYYY-MM-DD or null",
          "status": "active"
        }
      ],
      "holdings": [
        {
          "product_type": "unit_trust" | "etf" | "ilp" | "annuity" | "structured_product" | "other",
          "product_name": "fund/product name",
          "provider": "fund house or insurer name",
          "platform": "brokerage or platform name or null",
          "units_held": 1234.567 or null,
          "last_nav": 1.234 or null,
          "current_value": 15000.00 or null,
          "risk_rating": "conservative" | "moderate" | "aggressive" | null  — ALWAYS one of these exact values, never "medium", "high", "low", or any other variant. Map "medium" → "moderate", "high risk" → "aggressive", "low risk" → "conservative"
        }
      ]
    }
  ],
  "warnings": ["any data quality issues to flag"],
  "summary": "one sentence describing what you found"
}

## RULES:
- Group multiple rows for the same client into ONE client with multiple policies/holdings
- ILP: add as both a policy (for renewal tracking) AND a holding (for investment review)
- Tier: default "silver". Infer from total premium: >$20k/yr = platinum, >$10k = gold, <$2k = bronze
- Type: default "individual". Company name → sme or corporate
- Phone: format Singapore numbers as +65XXXXXXXX
- If you cannot determine a field, use null — never guess
- Empty file or no data: return {"clients":[],"warnings":["No client data found"],"summary":"File contained no recognisable records"}
- Holdings with no units/NAV: still include if you can identify a fund name and provider
- Return ONLY the JSON object. No markdown, no explanation, no preamble.`

export async function POST(req: Request) {
  try {
    const { fileName, fileContent, isBase64, mediaType } = await req.json()

    if (!fileContent) {
      return NextResponse.json({ error: 'No file content provided' }, { status: 400 })
    }

    let content: any[]

    if (isBase64 && mediaType === 'application/pdf') {
      content = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileContent } },
        { type: 'text', text: `File: "${fileName}". Extract all client, policy, and investment records. Return structured JSON only.` },
      ]
    } else if (isBase64) {
      // Excel binary — can't parse directly, ask FA to save as CSV
      return NextResponse.json({
        clients: [],
        warnings: ['Excel files need to be saved as CSV first. In Excel or Google Sheets: File → Save As → CSV. Then upload the CSV.'],
        summary: 'Excel binary format — please save as CSV first',
      })
    } else {
      const truncated = fileContent.length > 120000
        ? fileContent.slice(0, 120000) + '\n[Truncated]'
        : fileContent

      content = [
        { type: 'text', text: `File: "${fileName}"\n\n${truncated}\n\nExtract all client, policy, and investment records. Return structured JSON only.` },
      ]
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const raw = message.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse response. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('[import/parse]', err)
    return NextResponse.json({ error: err.message || 'Parse failed' }, { status: 500 })
  }
}
