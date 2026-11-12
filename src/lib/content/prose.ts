export type InlineSegment = { type: 'text'; value: string } | { type: 'code'; value: string }

export type ProseBlock =
  | { type: 'paragraph'; segments: InlineSegment[] }
  | { type: 'code'; language?: string; code: string }

const FENCED_BLOCK_PATTERN = /^```([a-zA-Z0-9_-]*)[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm
const INLINE_CODE_PATTERN = /`([^`\r\n]+)`/g

/**
 * Splits a prose section into paragraphs (with inline backtick code spans) and
 * fenced ``` code blocks so templates can render semantic `<p>`, `<code>`, and `<pre>`
 * elements without injecting raw HTML.
 */
export function parseProseBlocks(text: string): ProseBlock[] {
  const blocks: ProseBlock[] = []
  let lastIndex = 0

  for (const match of text.matchAll(FENCED_BLOCK_PATTERN)) {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      pushParagraphs(blocks, text.slice(lastIndex, matchIndex))
    }

    const language = match[1]?.trim() || undefined
    const code = (match[2] ?? '').replace(/\r?\n$/, '')
    blocks.push(language ? { type: 'code', language, code } : { type: 'code', code })

    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < text.length) {
    pushParagraphs(blocks, text.slice(lastIndex))
  }

  return blocks
}

export function parseInlineCode(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_CODE_PATTERN)) {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, matchIndex) })
    }
    segments.push({ type: 'code', value: match[1] ?? '' })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

function pushParagraphs(blocks: ProseBlock[], chunk: string): void {
  for (const raw of chunk.split(/\n{2,}/)) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    blocks.push({ type: 'paragraph', segments: parseInlineCode(trimmed) })
  }
}

