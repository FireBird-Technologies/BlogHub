import type { ComponentType, SVGProps } from "react";
import { Github, Linkedin, Facebook, Instagram, Youtube, Mail, Globe } from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = ComponentType<LucideProps>;

type CustomIconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconX({ size = 20, className = "", ...rest }: CustomIconProps) {
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
  if (url.startsWith("mailto:")) return { Icon: Mail, label: userLabel || "Email" };

  return { Icon: Globe, label: userLabel || "Website" };
}
