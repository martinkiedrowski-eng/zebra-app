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

/**
 * Häufige benannte HTML-Entities, die in RSS-Feeds für deutschen Text und
 * typografische Sonderzeichen vorkommen — über die ursprünglichen 5
 * hinaus (amp/lt/gt/quot/#39), die zuvor die einzigen abgedeckten waren.
 * Das war die identifizierte Ursache für falsch dargestellte
 * Sonderzeichen (Umlaute, „ ", –, …) bei liga3-online.de-Headlines: alles
 * außerhalb dieser fünf Fälle blieb als roher Entity-Text
 * ("D&#252;sseldorf") im Titel stehen, statt zum echten Zeichen (ü)
 * dekodiert zu werden.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  nbsp: "\u00A0",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  bdquo: "„",
  ldquo: "\u201C",
  rdquo: "\u201D",
  lsquo: "\u2018",
  rsquo: "\u2019",
};

export function decodeEntities(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/&([a-zA-Z]+);/g, (full, name: string) => NAMED_ENTITIES[name] ?? full)
    .replace(/&#(\d+);/g, (_full, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _full;
    })
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_full, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _full;
    });
}

export function stripCdataAndTags(value: string | null): string | null {
  if (value === null) return null;
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
