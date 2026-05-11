/**
 * B-pe-15f — unpdf-based PDF text extraction with boilerplate stripping.
 *
 * Replaces Claude verbatim extraction for Layer C. Produces the same
 * { page_number, content, is_meaningful }[] shape so downstream chunking
 * logic in chunk-and-embed.ts doesn't change.
 *
 * Boilerplate detection: any line appearing on >=50% of pages is stripped
 * (typical insurer headers/footers like "AIA Singapore Private Limited
 * Policy AIA-HSG-7841 • HealthShield Gold Max"). Page number lines
 * (^Page \d+$) are also stripped.
 *
 * Performance: ~500ms for a 16-page Singapore IS plan PDF on Vercel.
 */

import { extractText, getDocumentProxy } from 'unpdf'

export interface ExtractedPage {
  page_number: number
  content: string
  is_meaningful: boolean
}

export interface ExtractResult {
  pages: ExtractedPage[]
  numPages: number
  totalChars: number
  boilerplateLinesRemoved: number
  extractMs: number
}

const MIN_MEANINGFUL_CHARS = 100
const BOILERPLATE_THRESHOLD = 0.5 // line must appear on >=50% of pages
const BOILERPLATE_MIN_LINE_LENGTH = 20 // ignore very short repeats

export async function extractPagesWithUnpdf(
  pdfBytes: Uint8Array,
): Promise<ExtractResult> {
  const t_start = Date.now()

  const pdf = await getDocumentProxy(pdfBytes)
  const result = await extractText(pdf, { mergePages: false })
  const rawPages: string[] = Array.isArray(result.text)
    ? result.text
    : [result.text]
  const numPages = result.totalPages

  // Tokenize each page into trimmed non-empty lines
  const perPageLines: string[][] = rawPages.map((p) =>
    (p || '').split('\n').map((l) => l.trim()).filter(Boolean),
  )

  // Count cross-page line frequency (deduped within a page so repeats
  // on the same page don't inflate the count)
  const lineCount = new Map<string, number>()
  for (const lines of perPageLines) {
    const unique = new Set(lines)
    for (const line of unique) {
      lineCount.set(line, (lineCount.get(line) ?? 0) + 1)
    }
  }

  const minOccurrencesForBoilerplate = Math.max(
    2,
    Math.ceil(numPages * BOILERPLATE_THRESHOLD),
  )
  const boilerplate = new Set<string>()
  for (const [line, count] of lineCount.entries()) {
    if (
      count >= minOccurrencesForBoilerplate &&
      line.length >= BOILERPLATE_MIN_LINE_LENGTH
    ) {
      boilerplate.add(line)
    }
  }

  const pageNumberLineRegex = /^Page\s+\d+$/i

  const pages: ExtractedPage[] = perPageLines.map((lines, idx) => {
    const cleaned = lines
      .filter((line) => !boilerplate.has(line))
      .filter((line) => !pageNumberLineRegex.test(line))
      .join('\n')

    return {
      page_number: idx + 1,
      content: cleaned,
      is_meaningful: cleaned.length >= MIN_MEANINGFUL_CHARS,
    }
  })

  const totalChars = pages.reduce((sum, p) => sum + p.content.length, 0)

  return {
    pages,
    numPages,
    totalChars,
    boilerplateLinesRemoved: boilerplate.size,
    extractMs: Date.now() - t_start,
  }
}
