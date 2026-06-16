import type { Publication } from "../types/models";

/** Local calendar YYYY-MM-DD for grouping (browser timezone). */
export function localDateKey(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return localDateKey(new Date().toISOString());
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d.toISOString());
}

/** Section heading for a calendar bucket (dashboard list). */
export function sectionTitleForKey(key: string, todayK: string, yesterdayK: string): string {
  if (key === todayK) return "Today's top Publications";
  if (key === yesterdayK) return "Yesterday's top publications";
  const [y, m, day] = key.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${formatted}'s top publications`;
}

export function publicationScore(pub: Publication): number {
  return (pub.upvote_count ?? 0) + (pub.comment_count ?? 0);
}

export interface DayGroup {
  key: string;
  items: Publication[];
}

/** Group items by local date key; sort each bucket by score desc, then newest first, id desc. */
export function groupPublicationsByLocalDay(publications: Publication[]): DayGroup[] {
  const map = new Map<string, Publication[]>();
  for (const pub of publications) {
    const key = localDateKey(pub.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(pub);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const ds = publicationScore(b) - publicationScore(a);
      if (ds !== 0) return ds;
      // Tie on score: latest publication first.
      const dt = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dt !== 0) return dt;
      return String(b.id).localeCompare(String(a.id));
    });
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((key) => ({ key, items: map.get(key)! }));
}
