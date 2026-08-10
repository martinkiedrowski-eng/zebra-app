import { ProbeResult, ProbeItem, emptyResult } from "./types";
import { fetchText, decodeEntities } from "./util";
import { splitBlocks, extractTagText, extractAttr, extractLinkHref, isLikelyXml } from "./xmlUtils";

const CHANNEL_ID = "UCY18b48CEK53zTARqNiN0ig"; // @MSVZebraChannel, live ermittelt im Reality Check
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export async function probeYoutube(): Promise<ProbeResult> {
  const result = emptyResult("YouTube / ZebraTV");
  result.notes.push(`Feed-URL: ${FEED_URL}`);

  const res = await fetchText(FEED_URL);
  if ("error" in res) {
    result.status = "Fetch fehlgeschlagen";
    result.errorMessage = res.error;
    return result;
  }

  result.fetchSuccess = true;
  result.httpStatus = res.status;
  result.contentType = res.contentType;

  if (res.status < 200 || res.status >= 300) {
    result.status = `HTTP-Fehler ${res.status}`;
    result.errorMessage = `Server antwortete mit Status ${res.status}`;
    return result;
  }

  if (!isLikelyXml(res.text)) {
    result.status = "Kein valides XML/Atom erkannt";
    result.errorMessage = "Response beginnt nicht wie erwartet mit <?xml/<feed";
    return result;
  }

  const entries = splitBlocks(res.text, "entry");
  result.itemCount = entries.length;
  result.parseSuccess = entries.length > 0;
  result.status = result.parseSuccess ? "OK" : "Valides XML, aber keine <entry>-Elemente gefunden";

  result.items = entries.slice(0, 3).map((entry): ProbeItem => {
    const videoId = extractTagText(entry, "yt:videoId");
    const title = decodeEntities(extractTagText(entry, "title"));
    const published = extractTagText(entry, "published");
    const link = extractLinkHref(entry);
    const thumbnail = extractAttr(entry, "media:thumbnail", "url");
    const description = decodeEntities(extractTagText(entry, "media:description"));

    return {
      title: title ? title.trim() : null,
      date: published ? published.trim() : null,
      url: link,
      teaser: description ? description.trim() : null,
      image: thumbnail,
      extra: { videoId: videoId ? videoId.trim() : null },
    };
  });

  return result;
}
