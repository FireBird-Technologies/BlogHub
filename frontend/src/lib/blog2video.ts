// Central definition of the blog2video.app outbound URL with UTM tracking.
// GA on blog2video.app reads these params under Acquisition -> Traffic acquisition.
// Break down by utm_content ("navbar" | "detail_page" | "popup") to see which
// BlogHub surface sent each visitor.
const BASE_URL = "https://blog2video.app";

export function blog2videoUrl(content: string): string {
  const params = new URLSearchParams({
    utm_source: "bloghub",
    utm_medium: "referral",
    utm_campaign: "blog2video",
    utm_content: content,
  });
  return `${BASE_URL}?${params.toString()}`;
}
