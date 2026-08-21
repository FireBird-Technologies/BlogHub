import type { ComponentType, SVGProps } from "react";
import { Github, Linkedin, Facebook, Instagram, Youtube, Mail, Globe } from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = ComponentType<LucideProps>;

type CustomIconProps = SVGProps<SVGSVGElement> & { size?: number };

export function IconX({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconTikTok({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

function IconDiscord({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function IconSubstack({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  );
}

function IconMedium({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function IconGhost({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.256 2.313c2.47.005 5.116 2.008 5.898 2.962l.244.3c1.64 1.994 3.569 4.34 3.569 6.966 0 3.719-2.98 5.808-6.158 7.508-1.433.766-2.98 1.508-4.748 1.508-4.543 0-8.366-3.569-8.366-8.112 0-.706.17-1.425.342-2.15.122-.515.244-1.033.307-1.549.548-4.539 2.967-6.795 8.422-7.408a4.29 4.29 0 01.49-.026Z" />
    </svg>
  );
}

function IconBeehiiv({ size = 20, className = "", ...rest }: CustomIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden
      {...rest}
    >
      <path d="M12 1.5l9 5.25v10.5L12 22.5l-9-5.25V6.75L12 1.5zm0 4.04L6.5 8.7v6.6L12 18.46l5.5-3.16V8.7L12 5.54z" />
    </svg>
  );
}

export interface ResolvedSocialIcon {
  Icon: IconComponent;
  label: string;
}

export function resolveSocialIcon(url: string, userLabel: string): ResolvedSocialIcon {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    host = "";
  }
  const hint = `${host} ${(userLabel || "").toLowerCase()}`;

  if (
    hint.includes("twitter") ||
    host === "x.com" ||
    host.endsWith(".x.com") ||
    (userLabel || "").trim().toLowerCase() === "x"
  )
    return { Icon: IconX as IconComponent, label: userLabel || "X" };
  if (hint.includes("linkedin")) return { Icon: Linkedin, label: userLabel || "LinkedIn" };
  if (hint.includes("github")) return { Icon: Github, label: userLabel || "GitHub" };
  if (hint.includes("facebook") || hint.includes("fb.com")) return { Icon: Facebook, label: userLabel || "Facebook" };
  if (hint.includes("instagram")) return { Icon: Instagram, label: userLabel || "Instagram" };
  if (hint.includes("youtube") || host === "youtu.be") return { Icon: Youtube, label: userLabel || "YouTube" };
  if (hint.includes("tiktok")) return { Icon: IconTikTok as IconComponent, label: userLabel || "TikTok" };
  if (hint.includes("discord")) return { Icon: IconDiscord as IconComponent, label: userLabel || "Discord" };
  if (hint.includes("substack")) return { Icon: IconSubstack as IconComponent, label: userLabel || "Substack" };
  if (hint.includes("medium")) return { Icon: IconMedium as IconComponent, label: userLabel || "Medium" };
  if (hint.includes("ghost")) return { Icon: IconGhost as IconComponent, label: userLabel || "Ghost" };
  if (hint.includes("beehiiv") || hint.includes("beehive"))
    return { Icon: IconBeehiiv as IconComponent, label: userLabel || "Beehiiv" };
  if (url.startsWith("mailto:")) return { Icon: Mail, label: userLabel || "Email" };

  return { Icon: Globe, label: userLabel || "Website" };
}

/** Icon for a known social-option label, used to render logos in the picker. */
const LABEL_ICONS: Record<string, IconComponent> = {
  "Twitter / X": IconX as IconComponent,
  LinkedIn: Linkedin,
  GitHub: Github,
  Medium: IconMedium as IconComponent,
  Substack: IconSubstack as IconComponent,
  Ghost: IconGhost as IconComponent,
  Beehiiv: IconBeehiiv as IconComponent,
  Facebook: Facebook,
  Instagram: Instagram,
  YouTube: Youtube,
  TikTok: IconTikTok as IconComponent,
  Discord: IconDiscord as IconComponent,
  Email: Mail,
  Website: Globe,
};

export function socialIconForLabel(label: string): IconComponent {
  return LABEL_ICONS[label] ?? Globe;
}
