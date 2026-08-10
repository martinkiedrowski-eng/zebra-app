/**
 * Bewusst kein echter XML/RSS-Parser (kein neues npm-Paket für ein
 * Wegwerf-Tool) — regelbasierte Tag-Extraktion reicht, um ehrlich zu
 * zeigen, was ankommt. Alles defensiv: jede Funktion gibt `null`/`[]`
 * zurück statt zu werfen, wenn ein Muster nicht passt.
 */

export function splitBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(re) ?? [];
}

export function extractTagText(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(re);
  return match ? (match[1] ?? null) : null;
}

/** Findet ein selbstschließendes Tag mit Attribut, z.B. <media:thumbnail url="..."/>. */
export function extractAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']*)["'][^>]*/?>`, "i");
  const match = block.match(re);
  return match ? (match[1] ?? null) : null;
}

/** Für <link href="..."/> (Atom) statt <link>text</link> (RSS). */
export function extractLinkHref(block: string): string | null {
  const selfClosing = extractAttr(block, "link", "href");
  if (selfClosing) return selfClosing;
  const text = extractTagText(block, "link");
  return text ? text.trim() : null;
}

export function isLikelyXml(text: string): boolean {
  const head = text.slice(0, 500).trim();
  return head.startsWith("<?xml") || head.startsWith("<rss") || head.startsWith("<feed") || /<rss[\s>]/i.test(head) || /<feed[\s>]/i.test(head);
}
