import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Linkedin, Facebook } from "lucide-react";
import { IconX } from "./socialIcons";
import { publicationPath } from "./publicationUrl";

type IconComponent = ComponentType<LucideProps>;

export interface ShareTarget {
  name: string;
  href: string;
  Icon: IconComponent;
}

/** Absolute, shareable URL for a publication's public detail page.
 *  Built from the runtime origin (not a hardcoded site url) so links stay
 *  correct in dev/staging — same approach as the detail page canonical. */
export function publicationShareUrl(pub: { id: string; title: string }): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${publicationPath(pub)}`;
}

/** Social composer links, pre-filled with the publication url and title. */
export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(`${title} — upvote it on BlogHub:`);
  return [
    { name: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${text}`, Icon: IconX as IconComponent },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: Linkedin },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Facebook },
  ];
}
