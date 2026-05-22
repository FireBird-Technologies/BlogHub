export type PublicationId = string;

export interface User {
  id: string;
  email: string;
  name: string;
  tag: string;
  avatar_url: string | null;
  website?: string | null;
  onboarded: boolean;
}

export interface SocialLinkOut {
  label: string;
  url: string;
}

/** Publication as returned by list/detail API (JSON). */
export interface Publication {
  id: PublicationId;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  tags: string[];
  additional_links: string[];
  social_links: SocialLinkOut[];
  upvote_count: number;
  comment_count: number;
  rank?: number | null;
  is_upvoted: boolean;
  created_at: string;
  author: User;
}

export interface PaginatedPublications {
  items: Publication[];
  next_cursor: string | null;
  total: number;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: User;
}

/** Scrape endpoint preview payload. */
export interface ScrapeResult {
  url?: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
}

/** Submit / edit draft building blocks. */
export interface PublicationDraft {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  additional_links?: string[];
  social_links?: SocialLinkOut[];
}

export interface SocialLinkInput {
  label: string;
  url: string;
}
