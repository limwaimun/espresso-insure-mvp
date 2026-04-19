import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are an expert at parsing financial adviser client databases. You will receive a file (CSV, Excel, or PDF) containing client and policy data in any format or layout.

Your job is to extract structured client and policy records from whatever mess you receive.

Common messy inputs you must handle:
- Columns named anything: "Insured", "Life Assured", "Client", "Policyholder", "Name of Insured"
- Dates in any format: 15/3/2026, 15-Mar-26, March 15 2026, 15.03.26
- Currencies: $3,200.00, SGD3200, 3,200, 3200.00 — extract just the number
- Policy types written variously: "Whole Life", "WL", "Life", "Term Life", "TL", "CI", "Critical Illness"
- Multiple policies per client (multiple rows with same name)
- Blank rows, header rows, footer rows — ignore them
- Merged cells (shown as empty cells in CSV — use the last seen value)
- Extra columns you don't recognise — ignore them
- NRIC, IC numbers — ignore (don't store)

Output ONLY valid JSON in this exact structure:
{
  "clients": [
    {
      "name": "Full Name",
      "email": "email or null",
      "phone": "phone number with country code if present, or null",
      "company": "company/employer name or null",
      "type": "individual" | "sme" | "corporate",
      "tier": "platinum" | "gold" | "silver" | "bronze",
      "policies": [
        {
          "insurer": "insurer name or null",
          "type": "policy type (standardise to: Life, Critical Illness, Health, Fire, Motor, Marine, Travel, Public Liability, Professional Indemnity, Directors & Officers, Keyman, Group Life, Group Health, Annuity, Investment-Linked, Other)",
          "premium": 1234.56 or null (annual, number only),
          "renewal_date": "YYYY-MM-DD or null",
          "sum_assured": 500000 or null (number only),
          "policy_number": "policy number or null"
        }
      ]
    }
  ],
  "warnings": ["any data quality issues to flag to the user"],
  "summary": "one sentence describing what you found"
}

Rules:
- Group multiple rows for the same client into ONE client record with multiple policies
- If you cannot determine a field, use null — never guess
- Tier: default to "silver" unless you can infer from premium size (>$20k/yr = platinum, >$10k = gold, <$2k = bronze)
- Type: default to "individual" unless company name suggests SME/corporate
- Phone: format as +65XXXXXXXX for Singapore numbers without country code
- Dates: always output as YYYY-MM-DD
- If the file appears empty or has no recognisable client data, return {"clients": [], "warnings": ["No client data found"], "summary": "File contained no recognisable client records"}
- Do NOT include any text outside the JSON object`

export async function POST(req: Request) {
  try {
    const { fileName, fileContent, isBase64, mediaType } = await req.json()

    if (!fileContent) {
      return NextResponse.json({ error: 'No file content provided' }, { status: 400 })
    }

    // Build the message content
    let content: any[]

    if (isBase64 && (mediaType === 'application/pdf' || mediaType.includes('image'))) {
      // PDF or image — use Claude's document/vision capability
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: fileContent,
          },
        },
        {
          type: 'text',
          text: `This file is named "${fileName}". Extract all client and policy records from it and return the structured JSON as instructed.`,
        },
      ]
    } else if (isBase64) {
      // Excel or other binary — decode and send as text
      // Claude can't parse binary Excel directly, so we'll tell it what we know
      content = [
        {
          type: 'text',
          text: `The user uploaded an Excel file named "${fileName}". Unfortunately I cannot parse the binary Excel format directly. Please return: {"clients": [], "warnings": ["Excel files need to be saved as CSV first. Please open the file in Excel or Google Sheets, go to File → Save As → CSV, and upload the CSV version."], "summary": "Excel binary format detected"}`,
        },
      ]
    } else {
      // Text/CSV — send directly
      const truncated = fileContent.length > 100000
        ? fileContent.slice(0, 100000) + '\n[File truncated at 100,000 characters]'
        : fileContent

      content = [
        {
          type: 'text',
          text: `This file is named "${fileName}". Here are the contents:\n\n${truncated}\n\nExtract all client and policy records and return the structured JSON.`,
        },
      ]
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const responseText = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    // Strip any markdown fences if present
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error('[import/parse]', err)
    return NextResponse.json({ error: err.message || 'Parse failed' }, { status: 500 })
  }
}
