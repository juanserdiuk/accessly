import { NextRequest, NextResponse } from 'next/server'
import { extractText, getMeta, extractLinks, getDocumentProxy } from 'unpdf'

interface Check {
  id: string
  name: string
  passed: boolean
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  wcag: string
  description: string
}

async function checkPdf(buffer: Buffer): Promise<Check[]> {
  // unpdf wraps pdfjs-dist and works cleanly in Node/serverless. Use the
  // document proxy once so we can read everything (text, meta, outline,
  // links) without re-parsing.
  const data = new Uint8Array(buffer)

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>
  try {
    pdf = await getDocumentProxy(data, { useSystemFonts: true })
  } catch (err: any) {
    console.error('[scan-document] unpdf load failed:', err?.name, err?.message)
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Remove the password protection and re-upload to check accessibility.')
    }
    throw new Error("We couldn't read this document. Make sure it's a valid, non-corrupted PDF.")
  }

  const numpages = pdf.numPages

  // Metadata (Title, Language) — Document Info dictionary
  let info: Record<string, string> = {}
  try {
    const meta = await getMeta(pdf)
    info = (meta.info ?? {}) as Record<string, string>
  } catch {}

  // Bookmarks / outline
  let hasOutline = false
  try {
    const outline = await pdf.getOutline()
    hasOutline = Array.isArray(outline) && outline.length > 0
  } catch {}

  // Extract text per page so we can detect structural variation (heading heuristic)
  let text = ''
  try {
    const { text: pages } = await extractText(pdf, { mergePages: false })
    text = pages.map(p => p.trim()).filter(Boolean).join('\n')
  } catch {}

  // Link annotations across the document
  const pageLinks: Array<{ contents: string; url: string }> = []
  try {
    const { links } = await extractLinks(pdf)
    for (const url of links) pageLinks.push({ contents: '', url })
  } catch {}

  // Heading heuristic: structural docs have short lines mixed with long ones
  const nonEmptyLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const shortLines = nonEmptyLines.filter(l => l.length <= 60)
  const hasLikelyHeadings = nonEmptyLines.length < 5 || shortLines.length >= 2

  // Descriptive link-text check: links with no contents and no descriptive label
  const poorTexts = new Set(['here', 'click here', 'read more', 'more', 'link', 'this', 'learn more'])
  const poorLinks = pageLinks.filter(l => {
    const t = l.contents.trim().toLowerCase()
    return t === '' || poorTexts.has(t) || /^https?:\/\//i.test(l.contents.trim())
  })

  return [
    {
      id: 'document-title',
      name: 'Document title',
      passed: !!(info.Title?.trim()),
      impact: 'serious',
      wcag: 'WCAG 2.4.2',
      description: info.Title?.trim()
        ? `Title is set to "${info.Title.trim()}".`
        : 'No title found in document properties. Set a descriptive title in File → Properties so screen readers can identify the document.',
    },
    {
      id: 'text-extractable',
      name: 'Text extractable',
      passed: text.length > 0,
      impact: 'critical',
      wcag: 'WCAG 1.1.1',
      description: text.length > 0
        ? 'Text content can be extracted and read by assistive technology.'
        : 'No readable text found. This appears to be a scanned image — apply OCR to make the content accessible.',
    },
    {
      id: 'heading-structure',
      name: 'Heading structure',
      passed: text.length === 0 || hasLikelyHeadings,
      impact: 'serious',
      wcag: 'WCAG 1.3.1',
      description: text.length === 0
        ? 'No text content found to evaluate heading structure.'
        : hasLikelyHeadings
        ? 'Document text shows structural variation consistent with headings and sections.'
        : 'Document text appears to be one large block with no structural breaks. Apply heading styles before exporting to PDF.',
    },
    {
      id: 'language',
      name: 'Language identified',
      passed: !!(info.Language?.trim()),
      impact: 'moderate',
      wcag: 'WCAG 3.1.1',
      description: info.Language?.trim()
        ? `Document language is set to "${info.Language.trim()}".`
        : 'No language is specified in document properties. Screen readers need the language to apply correct pronunciation rules.',
    },
    {
      id: 'navigation-structure',
      name: 'Navigation structure',
      passed: numpages <= 3 || hasOutline,
      impact: 'moderate',
      wcag: 'WCAG 2.4.5',
      description: hasOutline
        ? 'Document includes bookmarks for accessible navigation.'
        : numpages <= 3
        ? 'Document is concise; a full navigation structure is appropriate for its length.'
        : `This ${numpages}-page document should include bookmarks and a table of contents for accessible navigation.`,
    },
    {
      id: 'link-text',
      name: 'Descriptive link text',
      passed: pageLinks.length === 0 || poorLinks.length === 0,
      impact: 'minor',
      wcag: 'WCAG 2.4.4',
      description: pageLinks.length === 0
        ? 'No hyperlinks found in the document.'
        : poorLinks.length === 0
        ? `All ${pageLinks.length} link(s) have descriptive text.`
        : `${poorLinks.length} of ${pageLinks.length} link(s) use generic text like "click here" or bare URLs. Use descriptive link text that explains the destination.`,
    },
  ]
}

async function checkDocx(buffer: Buffer): Promise<Check[]> {
  const mammoth = await import('mammoth')

  let result: { value: string; messages: Array<{ type: string; message: string }> }
  try {
    result = await mammoth.convertToHtml({ buffer })
  } catch {
    throw new Error('Could not parse the Word document. Make sure it is a valid .docx file.')
  }

  const html = result.value
  const raw = buffer.toString('latin1').slice(0, 120_000)

  const titleMatch = raw.match(/dc:title>([^<]{1,200})</)
  const title = titleMatch?.[1]?.trim() ?? ''

  const hasHeadings = /<h[1-6][\s>]/i.test(html)

  const imgCount = (html.match(/<img/gi) ?? []).length
  const missingAlt =
    (html.match(/<img(?![^>]*\balt=")[^>]*>/gi) ?? []).length +
    (html.match(/alt=""\s/gi) ?? []).length
  const imgWarnings = result.messages.filter(m => /image/i.test(m.message)).length
  const imgIssues = Math.max(missingAlt, imgWarnings)

  const langMatch = raw.match(/w:lang w:val="([^"]{2,20})"/)
  const lang = langMatch?.[1] ?? ''

  const hasTables = /<table/i.test(html)
  const hasTableHeaders = /<th[\s>]/i.test(html)

  const emptyLinks = (html.match(/<a[^>]*>\s*<\/a>/gi) ?? []).length

  return [
    {
      id: 'document-title',
      name: 'Document title',
      passed: title.length > 0,
      impact: 'serious',
      wcag: 'WCAG 2.4.2',
      description: title
        ? `Title is set to "${title}".`
        : 'No document title in File → Properties. Add a title so screen reader users can identify the document.',
    },
    {
      id: 'heading-structure',
      name: 'Heading structure',
      passed: hasHeadings,
      impact: 'serious',
      wcag: 'WCAG 1.3.1',
      description: hasHeadings
        ? 'Document uses heading styles to organize content for easy navigation.'
        : 'No heading styles found. Apply Heading 1 / Heading 2 styles to create a navigable document structure.',
    },
    {
      id: 'image-alt',
      name: 'Image alt text',
      passed: imgCount === 0 || imgIssues === 0,
      impact: 'critical',
      wcag: 'WCAG 1.1.1',
      description:
        imgCount === 0
          ? 'No images found in the document.'
          : imgIssues === 0
          ? `All ${imgCount} image(s) have alternative text descriptions.`
          : `${imgIssues} of ${imgCount} image(s) are missing alternative text. Right-click each image → Edit Alt Text in Word.`,
    },
    {
      id: 'language',
      name: 'Document language',
      passed: lang.length > 0,
      impact: 'moderate',
      wcag: 'WCAG 3.1.1',
      description: lang
        ? `Document language is set to "${lang}".`
        : 'No proofing language set. Go to Review → Language → Set Proofing Language in Word.',
    },
    {
      id: 'table-headers',
      name: 'Table headers',
      passed: !hasTables || hasTableHeaders,
      impact: 'moderate',
      wcag: 'WCAG 1.3.1',
      description: !hasTables
        ? 'No tables found.'
        : hasTableHeaders
        ? 'Tables have header rows properly identified.'
        : 'Tables found without header rows. Select the header row → Table Design → check "Header Row" in Word.',
    },
    {
      id: 'link-text',
      name: 'Descriptive link text',
      passed: emptyLinks === 0,
      impact: 'minor',
      wcag: 'WCAG 2.4.4',
      description:
        emptyLinks > 0
          ? `${emptyLinks} link(s) have no visible text. Each link should describe its destination.`
          : 'All links have descriptive text.',
    },
  ]
}

export async function POST(req: NextRequest) {
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = fd.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!['pdf', 'docx'].includes(ext))
    return NextResponse.json({ error: 'Only PDF (.pdf) and Word (.docx) files are supported' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'File size must be under 10 MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let checks: Check[]
  try {
    checks = ext === 'pdf' ? await checkPdf(buffer) : await checkDocx(buffer)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unexpected error' }, { status: 422 })
  }

  const violations = checks.filter(c => !c.passed)
  const passes = checks.filter(c => c.passed).length
  const errors = violations.filter(c => c.impact === 'critical' || c.impact === 'serious').length
  const warnings = violations.filter(c => c.impact === 'moderate' || c.impact === 'minor').length
  const pts: Record<string, number> = { critical: 25, serious: 15, moderate: 8, minor: 4 }
  const score = Math.max(0, 100 - violations.reduce((s, c) => s + (pts[c.impact] ?? 0), 0))

  return NextResponse.json({ violations, passes, errors, warnings, score, fileName: file.name, fileType: ext })
}
