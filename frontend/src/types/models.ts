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
  is_verified: boolean;
  verified_at: string | null;
  my_claim_status: "none" | "pending" | "rejected";
  created_at: string;
  author: User;
}

export interface PaginatedPublications {
  items: Publication[];
  next_cursor: string | null;
  total: number;
}

/** Weekly category roundup as returned by the /roundups list endpoint. */
export interface RoundupSummary {
  slug: string;
  title: string;
  category: string;
  week_start: string;
  count: number;
  underrated_count: number;
  created_at: string;
}

/** Single roundup with its publications hydrated.
 *  `publications` is the top picks; `underrated` is the parallel lowest-scored list. */
export interface RoundupDetail extends RoundupSummary {
  publications: Publication[];
  underrated: Publication[];
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

/** Paid featured slot: a booked date range. Dates are inclusive `YYYY-MM-DD` strings. */
export interface BookedRange {
  start_date: string;
  end_date: string;
  status: "pending" | "paid";
}

export interface FeaturedAvailability {
  booked: BookedRange[];
  /** duration_days -> price in cents, keyed as a string over the wire (e.g. `{ "7": 3000 }`). */
  prices: Record<string, number>;
  min_start_date: string;
  max_start_date: string;
}

export interface ActiveFeature {
  publication: Publication;
  start_date: string;
  end_date: string;
  /** Outbound clicks BlogHub has sent to this publication during its featured run. */
  click_count: number;
}

/** The announcement email drafted for a featured publication. Needs the author's
 *  approval and the admin's before it is scheduled. */
export interface FeaturedEmail {
  id: string;
  /** The booking this announcement belongs to — a publication may have several. */
  slot_id: string;
  publication_id: string;
  publication_title?: string | null;
  /** The run this announcement is for, used to label it when there is more than one. */
  start_date?: string | null;
  end_date?: string | null;
  subject: string;
  body: string;
  author_approved: boolean;
  admin_approved: boolean;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  scheduled_at?: string | null;
  sent_at?: string | null;
}

/** One of the author's own featured bookings, so they can track where it stands. */
export interface MyBooking {
  id: string;
  publication_id: string;
  publication_title?: string | null;
  start_date: string;
  end_date: string;
  approval_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  click_count: number;
}

export interface FeatureCheckout {
  checkout_url: string;
  slot_id: string;
  amount_cents: number;
  start_date: string;
  end_date: string;
}
