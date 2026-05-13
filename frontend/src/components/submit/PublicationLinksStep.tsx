import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import type { SocialLinkInput } from "../../types/models";

const defaultInputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors";

export const LINKS_MAX_EXTRA = 5;
export const LINKS_MAX_SOCIAL = 8;

export function emptySocialRow(): SocialLinkInput {
  return { label: "", url: "" };
}

export interface PublicationLinksFieldsProps {
  extraSlots: string[];
  setExtraSlots: Dispatch<SetStateAction<string[]>>;
  socials: SocialLinkInput[];
  setSocials: Dispatch<SetStateAction<SocialLinkInput[]>>;
  inputCls?: string;
}

/** Shared fields for submit step 3 and edit-publication modal. */
export function PublicationLinksFields({
  extraSlots,
  setExtraSlots,
  socials,
  setSocials,
  inputCls: inputClassName = defaultInputCls,
}: PublicationLinksFieldsProps) {
  const addSocialRow = () => {
    if (socials.length >= LINKS_MAX_SOCIAL) return;
    setSocials((prev) => [...prev, emptySocialRow()]);
  };

  const removeSocialRow = (i: number) => {
    setSocials((prev) =>
      prev.length <= 1 ? [emptySocialRow()] : prev.filter((_, idx) => idx !== i)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Additional links</p>
        <p className="text-xs text-gray-500 mb-3">Up to {LINKS_MAX_EXTRA} URLs readers can explore (optional).</p>
        <div className="flex flex-col gap-2">
          {extraSlots.map((val, i) => (
            <input
              key={i}
              type="url"
              value={val}
              onChange={(e) =>
                setExtraSlots((prev) => {
                  const next = [...prev];
                  next[i] = e.target.value;
                  return next;
                })
              }
              placeholder={`Related link ${i + 1}`}
              className={inputClassName}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Social profiles</p>
            <p className="text-xs text-gray-500 mt-0.5">Optional — label and URL ({LINKS_MAX_SOCIAL} max).</p>
          </div>
          {socials.length < LINKS_MAX_SOCIAL && (
            <button
              type="button"
              onClick={addSocialRow}
              className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {socials.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={row.label}
                onChange={(e) =>
                  setSocials((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], label: e.target.value };
                    return next;
                  })
                }
                placeholder="e.g. Twitter / X"
                className={`${inputClassName} flex-1 min-w-0`}
                maxLength={64}
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
                className={`${inputClassName} flex-[2] min-w-0`}
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
          ))}
        </div>
      </div>
    </div>
  );
}

export interface LinksPayload {
  additional_links: string[];
  social_links: SocialLinkInput[];
}

export function collectLinksPayload(extraSlots: string[], socials: SocialLinkInput[]): LinksPayload {
  const additional_links = extraSlots.map((u) => u.trim()).filter(Boolean);
  const social_links = socials
    .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
    .filter((s) => s.url && s.label);
  return { additional_links, social_links };
}

export function initLinkExtraSlots(initialAdditionalLinks: string[] | undefined): string[] {
  const urls = [...(initialAdditionalLinks || [])].slice(0, LINKS_MAX_EXTRA);
  while (urls.length < LINKS_MAX_EXTRA) urls.push("");
  return urls;
}

export function initLinkSocialRows(initialSocialLinks: SocialLinkInput[] | undefined): SocialLinkInput[] {
  const base = (initialSocialLinks?.length ? initialSocialLinks : [emptySocialRow()]).map((s) => ({
    label: s.label || "",
    url: s.url || "",
  }));
  while (base.length < 1) base.push(emptySocialRow());
  return base.slice(0, LINKS_MAX_SOCIAL);
}

interface PublicationLinksStepProps {
  initialAdditionalLinks?: string[];
  initialSocialLinks?: SocialLinkInput[];
  onBack: () => void;
  onPublish: (payload: LinksPayload) => void;
  isPending?: boolean;
  error?: string;
}

export default function PublicationLinksStep({
  initialAdditionalLinks = [],
  initialSocialLinks = [],
  onBack,
  onPublish,
  isPending,
  error,
}: PublicationLinksStepProps) {
  const [extraSlots, setExtraSlots] = useState(() => initLinkExtraSlots(initialAdditionalLinks));

  const [socials, setSocials] = useState(() => initLinkSocialRows(initialSocialLinks));

  useEffect(() => {
    setExtraSlots(initLinkExtraSlots(initialAdditionalLinks));
  }, [initialAdditionalLinks]);

  useEffect(() => {
    setSocials(initLinkSocialRows(initialSocialLinks));
  }, [initialSocialLinks]);

  const handlePublish = () => {
    onPublish(collectLinksPayload(extraSlots, socials));
  };

  return (
    <div className="flex flex-col gap-6">
      <PublicationLinksFields
        extraSlots={extraSlots}
        setExtraSlots={setExtraSlots}
        socials={socials}
        setSocials={setSocials}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handlePublish} disabled={isPending}>
          {isPending ? <Spinner size={16} /> : "Publish"}
        </Button>
      </div>
    </div>
  );
}
