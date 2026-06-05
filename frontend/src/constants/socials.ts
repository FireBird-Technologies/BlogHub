export const SOCIAL_OPTIONS = [
  { value: "X", label: "X" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "GitHub", label: "GitHub" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "YouTube", label: "YouTube" },
  { value: "TikTok", label: "TikTok" },
  { value: "Discord", label: "Discord" },
  { value: "Substack", label: "Substack" },
  { value: "Email", label: "Email" },
  { value: "Website", label: "Website" },
] as const;

export type SocialOptionValue = (typeof SOCIAL_OPTIONS)[number]["value"];

export const SOCIAL_OPTION_VALUES = SOCIAL_OPTIONS.map((o) => o.value) as readonly string[];

export function isKnownSocialLabel(label: string): boolean {
  return SOCIAL_OPTION_VALUES.includes(label);
}

export const DEFAULT_SOCIAL_LABEL: SocialOptionValue = "Substack";
