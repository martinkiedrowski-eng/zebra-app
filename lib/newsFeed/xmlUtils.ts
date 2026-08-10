/**
 * Minimale, regelbasierte XML-Extraktion für RSS/Atom — kein volles
 * XML-Paket, weil die Feed-Struktur klein und stabil ist. Bewusst eine
 * eigene, produktive Kopie statt eines Imports aus
 * app/debug/content-sources/_probe/xmlUtils.ts (siehe fetchUtils.ts).
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

export function extractAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']*)["'][^>]*/?>`, "i");
  const match = block.match(re);
  return match ? (match[1] ?? null) : null;
}

export function extractLinkHref(block: string): string | null {
  const selfClosing = extractAttr(block, "link", "href");
  if (selfClosing) return selfClosing;
  const text = extractTagText(block, "link");
  return text ? text.trim() : null;
}

export function isLikelyXml(text: string): boolean {
  const head = text.slice(0, 500).trim();
  return /<rss[\s>]/i.test(head) || /<feed[\s>]/i.test(head) || head.startsWith("<?xml");
}

export function decodeEntities(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

export function stripCdataAndTags(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
