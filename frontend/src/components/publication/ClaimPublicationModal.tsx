import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
import { emptySocialRow, LINKS_MAX_SOCIAL } from "../submit/PublicationLinksStep";
import {
  SOCIAL_OPTIONS,
  DEFAULT_SOCIAL_LABEL,
  isKnownSocialLabel,
} from "../../constants/socials";
import { useClaimPublication } from "../../hooks/useClaimPublication";
import { formatApiErrorDetail } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type { Publication, SocialLinkInput } from "../../types/models";

const inputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors disabled:bg-gray-50 disabled:text-gray-500";

function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface ClaimPublicationModalProps {
  publication: Publication;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimPublicationModal({ publication, isOpen, onClose }: ClaimPublicationModalProps) {
  const { user } = useAuth();
  const { mutate: submitClaim, isPending } = useClaimPublication(publication.id);

  const [name, setName] = useState(user?.name ?? "");
  const [socials, setSocials] = useState<SocialLinkInput[]>(() => [
    { label: "Substack", url: "" },
    { label: "Medium", url: "" },
    { label: "Twitter / X", url: "" },
    { label: "LinkedIn", url: "" },
  ]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const addSocialRow = () => {
    if (socials.length >= LINKS_MAX_SOCIAL) return;
    setSocials((prev) => [...prev, emptySocialRow()]);
  };

  const removeSocialRow = (i: number) => {
    setSocials((prev) => (prev.length <= 1 ? [emptySocialRow()] : prev.filter((_, idx) => idx !== i)));
  };

  const handleSubmit = () => {
    setError("");
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || !/[A-Za-z]/.test(trimmedName)) {
      setError("Please enter your real name.");
      return;
    }

    // Validate any social rows that have a URL, and collect the valid ones.
    const cleanedSocials: SocialLinkInput[] = [];
    for (const row of socials) {
      const url = row.url.trim();
      if (!url) continue;
      if (!looksLikeUrl(url)) {
        setError("Social links must be valid URLs starting with http:// or https://");
        return;
      }
      cleanedSocials.push({ label: row.label.trim() || DEFAULT_SOCIAL_LABEL, url });
    }

    const trimmedOriginal = originalUrl.trim();
    if (trimmedOriginal && !looksLikeUrl(trimmedOriginal)) {
      setError("The original publication link must be a valid URL.");
      return;
    }

    if (cleanedSocials.length === 0 && !trimmedOriginal) {
      setError("Add at least one social profile or the original publication link.");
      return;
    }

    submitClaim(
      {
        name: trimmedName,
        social_links: cleanedSocials,
        original_url: trimmedOriginal || undefined,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(formatApiErrorDetail(err, "Failed to submit claim. Try again.")),
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim this publication" maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
          <ShieldCheck size={18} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-800 leading-relaxed">
            Tell us where this publication is originally yours. We'll review your claim and verify it.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-900">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            maxLength={100}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-900">Your email</label>
          <input type="email" value={user?.email ?? ""} disabled readOnly className={inputCls} />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Social profiles</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Substack, LinkedIn, Twitter/X… that prove this is your work.
              </p>
            </div>
            {socials.length < LINKS_MAX_SOCIAL && (
              <button
                type="button"
                onClick={addSocialRow}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {socials.map((row, i) => {
              const hasLegacyLabel = !!(row.label && !isKnownSocialLabel(row.label));
              const dropdownOptions = [
                ...(hasLegacyLabel ? [{ value: row.label, label: `${row.label} (current)` }] : []),
                ...SOCIAL_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ];
              return (
                <div key={i} className="flex gap-2 items-start">
                  <CustomDropdown
                    value={row.label || DEFAULT_SOCIAL_LABEL}
                    options={dropdownOptions}
                    onChange={(v) =>
                      setSocials((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], label: v };
                        return next;
                      })
                    }
                    className="w-28 shrink-0"
                  />
                  <input
                    type="url"
                    value={row.url}
                    onChange={(e) =>
                      setSocials((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], url: e.target.value };
                        return next;
                      })
                    }
                    placeholder="https://…"
                    className={`${inputCls} flex-1 min-w-0`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialRow(i)}
                    className="mt-2 p-1.5 text-gray-300 hover:text-red-500 rounded-lg shrink-0"
                    aria-label="Remove row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-900">Original publication link</label>
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://yourblog.substack.com/p/the-article"
            className={inputCls}
          />
          <p className="text-[11px] text-gray-400">Where you originally published this (optional if you added a social profile).</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-900">Message <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything you'd like us to know while reviewing your claim…"
            rows={3}
            maxLength={2000}
            className={`${inputCls} resize-y min-h-[72px]`}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Spinner size={16} /> : "Submit claim"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
