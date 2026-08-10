// Central definition of the outbound URLs to the two sibling properties, with
// UTM tracking. GA on the receiving domain reads these params under
// Acquisition -> Traffic acquisition. Break down by utm_content ("navbar" |
// "detail_page" | "popup" | "footer") to see which BlogHub surface sent each
// visitor.
//
// blog2video.app takes a URL and returns a video; pdf2vid.com takes a document
// and returns one. All three sites link to each other — see
// ../../../blog2video/frontend/src/config/siblingSites.ts for the mirror of
// this file.
const BLOG2VIDEO_URL = "https://blog2video.app";
const PDF2VID_URL = "https://pdf2vid.com";

function withUtm(base: string, campaign: string, content: string): string {
  const params = new URLSearchParams({
    utm_source: "bloghub",
    utm_medium: "referral",
    utm_campaign: campaign,
    utm_content: content,
  });
  return `${base}?${params.toString()}`;
}

export function blog2videoUrl(content: string): string {
  return withUtm(BLOG2VIDEO_URL, "blog2video", content);
}

export function pdf2vidUrl(content: string): string {
  return withUtm(PDF2VID_URL, "pdf2vid", content);
}
