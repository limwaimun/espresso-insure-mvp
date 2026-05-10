/**
 * pdfjs-dist text extraction for policy PDFs (Node runtime).
 *
 * Uses pdfjs-dist's legacy build, suitable for Node serverless
 * environments. Returns PageContent[] in the same shape as the
 * Claude extraction path, for drop-in substitution in
 * lib/policy-extraction/chunk-and-embed.ts.
 *
 * Reading order: naive single-column. Items are concatenated in
 * the order returned by pdfjs, with hasEOL hints used opportun-
 * istically to insert newlines. Multi-column or table-heavy
 * layouts may extract in non-natural order; this is acceptable
 * for v1 since downstream chunking and vector retrieval are
 * tolerant of moderate ordering noise.
 *
 * Empty / scanned PDFs: pages will have empty or near-empty
 * content. Caller should density-check the result and fall back
 * to Claude vision-based extraction if pdfjs returns insufficient
 * text.
 *
 * NRIC redaction is applied to all returned content.
 */

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export interface PageContent {
  page_number: number
  content: string
  is_meaningful: boolean
}

const MIN_MEANINGFUL_CHARS = 50
const MIN_AVG_CHARS_PER_PAGE = 200

// Singapore NRIC: [STFGM] + 7 digits + checksum letter.
// Mask the middle 7 digits, preserving prefix and checksum so
// FAs can still distinguish records by partial match.
const NRIC_PATTERN = /([STFGM])(\d{7})([A-Z])/g

export function redactNRICs(text: string): string {
  return text.replace(NRIC_PATTERN, (_, prefix, _digits, checksum) => {
    return `${prefix}*******${checksum}`
  })
}

/**
 * Extract per-page text from a PDF buffer using pdfjs-dist.
 *
 * Throws on encrypted / malformed PDFs. Returns pages with empty
 * content for blank pages (caller can detect via density check).
 */
export async function extractPagesWithPdfjs(buffer: Buffer): Promise<PageContent[]> {
  const data = new Uint8Array(buffer)

  const pdfDoc = await getDocument({
    data,
    useWorkerFetch: false,
    useSystemFonts: false,
  }).promise

  const numPages = pdfDoc.numPages
  const pages: PageContent[] = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    let raw = ''
    for (const item of textContent.items) {
      if (!('str' in item)) continue
      raw += item.str
      // Use hasEOL when pdfjs provides it; else default to space
      const hasEOL = 'hasEOL' in item && (item as { hasEOL?: boolean }).hasEOL
      raw += hasEOL ? '\n' : ' '
    }

    // Normalize whitespace: collapse runs of spaces/tabs but
    // preserve newlines. Cap consecutive newlines at 2 for
    // paragraph breaks the chunker can detect.
    const normalized = raw
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const content = redactNRICs(normalized)

    pages.push({
      page_number: pageNum,
      content,
      is_meaningful: content.length >= MIN_MEANINGFUL_CHARS,
    })

    page.cleanup()
  }

  await pdfDoc.destroy()
  return pages
}

/**
 * Returns true if pdfjs produced enough text to trust as the
 * extraction source. Returns false for scanned PDFs, encrypted-
 * but-not-throwing PDFs, or otherwise text-sparse extractions
 * where Claude vision-based extraction would do better.
 */
export function isExtractionDenseEnough(pages: PageContent[]): boolean {
  if (pages.length === 0) return false
  const totalChars = pages.reduce((sum, p) => sum + p.content.length, 0)
  return totalChars / pages.length >= MIN_AVG_CHARS_PER_PAGE
}
