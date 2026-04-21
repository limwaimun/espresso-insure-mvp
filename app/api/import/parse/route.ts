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
- Policy types: "WL" = Whole Life, "TL" = Term Life, "CI" = Critical Illness, "PA" = Personal Accident, "GH" = Group Health, "GL" = Group Life
- NAV: "$1.234", "1.234", "SGD 1.23" — extract number only
- Units: "1,234.567 units", "1234.567" — extract number only
- Multiple policies per client: group into ONE client with multiple policies
- Blank rows, totals rows, header rows — ignore them
- Merged cells — use last seen value

## FIELD MAPPING — read from correct CSV columns:
- policy_number: from "Policy No" / "Policy Number" / "PN" / "Cert No" column. String. Null if blank.
- product_name: from "Product" / "Product Name" / "Plan" column. This is the branded product name (e.g. "AIA Pro Achiever 2.0", "PRUCritical Care"). Distinct from type.
- type: from "Coverage Type" / "Type" / "Category" column. The insurance category (e.g. "Life", "Investment-Linked", "Critical Illness", "Health", "Motor", "Fire", "D&O", "Cyber", "Public Liability", "Group Health", "Professional Indemnity", "Endowment", "PA"). Normalize variants: "PI" → "Professional Indemnity", "CI" → "Critical Illness", "D&O" → "Directors & Officers", "GL" → "Group Life", "GH" → "Group Health".
- start_date: from "Start Date" / "Inception Date" / "Commencement Date" column. Parse all common formats (DD/MM/YYYY, DD-Mon-YYYY, YYYY-MM-DD, "15 Jul 2025"). Output ISO YYYY-MM-DD. Null if blank.
- premium_frequency: COPY THE RAW VALUE verbatim from the "Freq" / "Frequency" / "Payment Mode" / "Premium Mode" column. Do NOT normalize or change the value. Examples to pass through as-is: "Monthly", "M", "Mthly", "Annual", "ANN", "Yearly", "Quarterly", "Q", "Semi-Annual", "Half-Yearly", "Single", "Lump Sum". Null if column blank or missing.
- status: COPY THE RAW VALUE verbatim from the "Status" / "Policy Status" column. Do NOT normalize or change the value. Examples to pass through as-is: "Active", "ACTIVE", "In Force", "In-Force", "Inforce", "Lapsed", "Lapsed - paying from grace period", "Pending", "Cancelled", "Surrendered", "In Progress". Null if column blank or missing.
- notes: from "Remarks" / "Notes" / "Comments" / "Additional Info" column. Preserve as-is, trim whitespace.

CRITICAL: type reads from "Coverage Type" column, product_name reads from "Product" column. Do not duplicate Product into type field.

CRITICAL: For status and premium_frequency, your job is to READ the column and COPY the value exactly as written. Do not translate, map, or normalize — that is handled downstream. If the CSV says "Lapsed - paying from grace period", output that exact string. If the CSV says "Mthly", output "Mthly".

## OUTPUT FORMAT — return ONLY valid JSON, no other text:

{
  "clients": [
    {
      "name": "Full Name",
      "email": "email or null",
      "phone": "+65XXXXXXXX or null",
      "company": "employer/company or null",
      "dob": "date of birth as YYYY-MM-DD or null — look for DOB, Birthday, Date of Birth columns or notes",
      "type": "individual" | "sme" | "corporate",
      "tier": "platinum" | "gold" | "silver" | "bronze",
      "notes": "any general notes about this client from notes/remarks columns — or null",
      "nok_name": "next of kin full name — look for Wife:, Husband:, NOK:, Next of Kin:, Son:, Daughter:, Mother:, Father: patterns in any column — or null",
      "nok_relationship": "relationship to client e.g. Wife, Husband, Son, Daughter, Mother, Father, Sibling, Partner — or null",
      "nok_phone": "next of kin phone number if mentioned — or null",
      "policies": [
        {
          "policy_number": "policy number or null",
          "product_name": "full product name as written e.g. AIA Life Treasure II, PRUGroup Health Select — or null",
          "insurer": "insurer name or null",
          "type": "standardised type — one of: Life, Critical Illness, Health, Personal Accident, Fire, Motor, Marine, Travel, Public Liability, Professional Indemnity, Directors & Officers, Keyman, Group Life, Group Health, Endowment, Investment-Linked, Annuity, Other",
          "premium": 1234.56,
          "premium_frequency": "VERBATIM value from CSV — copy exactly what you see. e.g. 'Monthly', 'M', 'Annual', 'ANN', 'Yearly', 'Quarterly', 'Semi-Annual'. Null if column blank.",
          "sum_assured": 500000 or null,
          "start_date": "YYYY-MM-DD or null",
          "renewal_date": "YYYY-MM-DD or null",
          "notes": "any notes, comments or remarks about this policy — or null",
          "status": "VERBATIM value from CSV — copy exactly what you see. e.g. 'Active', 'In Force', 'Lapsed', 'Lapsed - paying from grace period', 'Cancelled', 'Pending', 'Surrendered'. Null if column blank."
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
          "last_nav_date": "YYYY-MM-DD or null — the date the NAV was quoted",
          "current_value": 15000.00 or null,
          "currency": "SGD" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "HKD" | "CNY" or null — use ISO code,
          "inception_date": "YYYY-MM-DD or null — when the holding was first purchased",
          "risk_rating": "conservative" | "moderate" | "aggressive" | null  — ALWAYS one of these exact values, never "medium", "high", "low", or any other variant. Map "medium" → "moderate", "high risk" → "aggressive", "low risk" → "conservative",
          "avg_cost_price": 1.12 or null — per-unit cost basis from broker statement. Column names to look for: "Avg Cost", "Average Cost", "Cost Price", "Book Cost / Units", "Purchase Price". If statement shows "Book Value" divided by units, compute it. Extract number only — strip currency symbols.,
          "distribution_yield": 5.2 or null — distribution/dividend yield as PERCENTAGE (e.g. 5.2 for 5.2%, never 0.052). Column names: "Yield", "Distribution Yield", "Indicative Yield", "YTM", "Dividend Yield", "Income Yield". If the statement shows a decimal like 0.052, convert to 5.2.,
          "asset_class": "Equity" | "Fixed Income" | "Multi-Asset" | "Cash" | "REIT" | "Alternatives" | "Structured" | "Crypto" | "Other" or null — classify the holding. Map common terms: bonds/bond fund → Fixed Income; stock/shares → Equity; balanced/allocation → Multi-Asset; fixed deposit/money market → Cash; property fund → REIT; hedge fund/PE → Alternatives.,
          "geography": "Global" | "Singapore" | "Asia ex-Japan" | "Emerging Markets" | "US" | "Europe" | "Japan" | "Greater China" | "ASEAN" | "Other" or null — market exposure, NOT fund domicile. "US equities" → US; "Asia Pacific ex Japan" → Asia ex-Japan; "Global Developed" → Global.,
          "sector": "Diversified" | "Corp credit" | "Technology" | "Financials" | "Healthcare" | "Consumer" | "Energy" | "Industrials" | "Real estate" | "Utilities" | "Materials" | "Communications" | "Other" or null — industry focus. Use "Diversified" for broad-market funds with no sector tilt. Use "Corp credit" for corporate bond funds. For cash/multi-asset, leave null.
        }
      ]
    }
  ],
  "warnings": ["any data quality issues to flag"],
  "summary": "one sentence describing what you found"
}

## HOLDINGS-SPECIFIC PARSING GUIDANCE:

When you encounter a broker statement (Endowus, iFAST, FSMOne, Phillip, Tiger, IBKR), extract maximum detail:
- Endowus CSVs usually have: Fund Name, Fund House, Units, NAV, Market Value, Avg Cost, Asset Class, Currency
- iFAST statements show: Fund Name, Holdings (units), Current NAV, Current Value (SGD), Book Cost
- Bank statements for cash/FDs: product is the FD, product_type="other", asset_class="Cash", current_value=balance, no units/NAV. Yield goes in distribution_yield.
- SSB (Singapore Savings Bonds): asset_class="Fixed Income", geography="Singapore", sector="Diversified"
- STI ETF / SPDR STI: asset_class="Equity", geography="Singapore"
- Global tech fund like "Lion-OCBC Global Tech Fund": asset_class="Equity", geography="Global", sector="Technology"
- If the statement mixes categories in one label like "US equities", split: asset_class="Equity", geography="US"

For risk ratings in broker statements:
- "PRIIPs 1-3" or "Risk Level 1-3" → conservative
- "PRIIPs 4" or "Risk Level 4" → moderate  
- "PRIIPs 5-7" or "Risk Level 5-7" → aggressive

## RULES:
- Group multiple rows for the same client into ONE client with multiple policies/holdings
- ILP: add as both a policy (for renewal tracking) AND a holding (for investment review)
- Tier: default "silver". Infer from total premium: >$20k/yr = platinum, >$10k = gold, <$2k = bronze
- Type: default "individual". Company name → sme or corporate
- Phone: format Singapore numbers as +65XXXXXXXX
- If you cannot determine a field, use null — never guess
- Always capture the Notes/Remarks column content into the relevant notes field
- DOB may appear in Notes column e.g. "DOB: 15 Aug 1988" — extract as dob field in YYYY-MM-DD format
- product_name is the full marketing name of the product, distinct from type
- Next of kin often appears in Notes as "Wife: Tan Siew Lian", "NOK: David Lim (husband)", "Husband: John +6591234567" — always extract name, relationship and phone separately
- Beneficiary mentions like "Beneficiary: spouse" should be captured as NOK relationship even if no name given
- Empty file or no data: return {"clients":[],"warnings":["No client data found"],"summary":"File contained no recognisable records"}
- Holdings with no units/NAV: still include if you can identify a fund name and provider
- Return ONLY the JSON object. No markdown, no explanation, no preamble.`

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic post-normalizers
//
// The LLM's job is to COPY status and premium_frequency values verbatim from
// the CSV. These functions map the raw strings to the constrained enums the
// DB expects. Keeping normalization here (not in the prompt) means:
//   - Reliable: no LLM variability on enum mapping
//   - Testable: plain string-in/enum-out
//   - Extensible: new status variants = one-line code change
// ─────────────────────────────────────────────────────────────────────────────

type PolicyStatus = 'active' | 'lapsed' | 'pending' | 'cancelled'
type PremiumFrequency = 'annual' | 'half-yearly' | 'quarterly' | 'monthly' | 'single'

function normalizeStatus(raw: unknown): PolicyStatus {
  if (typeof raw !== 'string') return 'active'
  const s = raw.toLowerCase().trim()
  if (!s) return 'active'

  // Order matters — most specific / strongest signals first.
  // "Lapsed - paying from grace period" should hit 'lapsed' not any other bucket.
  if (s.includes('lapsed') || s.includes('grace') || s.includes('expired')) return 'lapsed'
  if (s.includes('cancel') || s.includes('surrender') || s.includes('terminated')) return 'cancelled'
  if (s.includes('pending') || s.includes('in progress') || s.includes('processing') || s.includes('underwriting')) return 'pending'
  if (s.includes('active') || s.includes('force') || s.includes('inforce') || s.includes('current') || s === 'a') return 'active'

  // Unknown non-empty string — default to active. Safer than hiding a real policy.
  return 'active'
}

function normalizeFrequency(raw: unknown): PremiumFrequency | null {
  if (typeof raw !== 'string') return null
  const s = raw.toLowerCase().trim()
  if (!s) return null

  if (s.includes('month') || s === 'm' || s === 'mth' || s === 'mthly') return 'monthly'
  if (s.includes('quarter') || s === 'q' || s === 'qtr') return 'quarterly'
  if (s.includes('half') || s.includes('semi') || s === 'h' || s === 'sa') return 'half-yearly'
  if (s.includes('single') || s.includes('one-time') || s.includes('one time') || s.includes('lump')) return 'single'
  if (s.includes('annual') || s.includes('year') || s === 'a' || s === 'ann' || s === 'y' || s === 'p.a.' || s === 'pa') return 'annual'

  // Unknown non-empty string — default to annual (most common in SG market).
  return 'annual'
}

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

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse response. Please try again.' }, { status: 500 })
    }

    // ─── Deterministic post-normalization ──────────────────────────────────
    // Overwrite LLM-emitted raw strings with enum values the DB can accept.
    if (parsed?.clients && Array.isArray(parsed.clients)) {
      for (const client of parsed.clients) {
        if (client?.policies && Array.isArray(client.policies)) {
          for (const policy of client.policies) {
            policy.status = normalizeStatus(policy.status)
            policy.premium_frequency = normalizeFrequency(policy.premium_frequency)
          }
        }
      }
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('[import/parse]', err)
    return NextResponse.json({ error: err.message || 'Parse failed' }, { status: 500 })
  }
}
