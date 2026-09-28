import type { NameKind } from "../content/tools";

// Builds publication name ideas from the writer's own keywords, entirely in the browser.
// A seed makes each "Generate more" press produce a different, repeatable batch.

export type NameStyle = "classic" | "playful" | "minimal";

const PLACES = ["Table", "Desk", "Corner", "Lab", "Studio", "Journal", "Room", "Notebook", "Field", "Workshop"];
const ADJECTIVES = ["Curious", "Daily", "Honest", "Modern", "Quiet", "Wandering", "Frugal", "Bold", "Little", "Slow"];
const VERBS = ["Chasing", "Finding", "Making", "Building", "Learning", "Tasting", "Mapping", "Rethinking"];
const BLOG_SUFFIXES = ["Diaries", "Chronicles", "Hub", "Life", "Guide", "Club", "Society", "Collective"];
const NEWSLETTER_FORMATS = ["Brief", "Dispatch", "Letter", "Notes", "Digest", "Report", "Memo", "Signal", "Roundup", "Wire"];
const CADENCES = ["Weekly", "Sunday", "Friday", "Monday", "Morning"];
const MINIMAL_ENDINGS = ["ly", "ist", "wise", "hq", "io", "ful"];

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateNames(input: string, kind: NameKind, style: NameStyle, seed: number, count = 24): string[] {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 3);
  if (words.length === 0) return [];
  const rand = rng(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const main = cap(words[0]);
  const other = words[1] ? cap(words[1]) : main;
  const phrase = words.map(cap).join(" ");
  const compact = words.map(cap).join("");

  const patterns: (() => string)[] =
    style === "minimal"
      ? [
          () => `${main}${pick(MINIMAL_ENDINGS)}`,
          () => compact,
          () => `${main}${kind === "newsletter" ? pick(["mail", "post", "letter"]) : pick(["log", "base", "bit"])}`,
          () => `${other}${pick(MINIMAL_ENDINGS)}`,
          () => `${main} ${kind === "newsletter" ? pick(NEWSLETTER_FORMATS) : pick(["Co", "HQ", "Lab"])}`,
        ]
      : style === "playful"
        ? [
            () => `${pick(VERBS)} ${main}`,
            () => `The ${pick(ADJECTIVES)} ${main}`,
            () => `${main} & ${pick(["Chill", "Crumbs", "Coffee", "Chaos", "Co."])}`,
            () => `Oh My ${main}`,
            () => `${main} ${pick(BLOG_SUFFIXES)}`,
            () => `${pick(ADJECTIVES)} ${other} ${kind === "newsletter" ? pick(NEWSLETTER_FORMATS) : pick(PLACES)}`,
          ]
        : kind === "newsletter"
          ? [
              () => `The ${phrase} ${pick(NEWSLETTER_FORMATS)}`,
              () => `${pick(CADENCES)} ${main}`,
              () => `The ${pick(CADENCES)} ${main} ${pick(NEWSLETTER_FORMATS)}`,
              () => `${main} ${pick(NEWSLETTER_FORMATS)}`,
              () => `${pick(ADJECTIVES)} ${main}`,
              () => `Inside ${phrase}`,
            ]
          : [
              () => `The ${phrase} ${pick(PLACES)}`,
              () => `${pick(ADJECTIVES)} ${main}`,
              () => `${main} ${pick(PLACES)}`,
              () => `${pick(VERBS)} ${main}`,
              () => `The ${main} ${pick(BLOG_SUFFIXES)}`,
              () => `${phrase} ${pick(["Daily", "Guide", "Journal"])}`,
            ];

  const out = new Set<string>();
  for (let i = 0; out.size < count && i < count * 20; i++) out.add(pick(patterns)());
  return [...out];
}
