import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { TriangleAlert, Plus, Trash2, ShieldCheck } from "lucide-react";
import { isAxiosError } from "axios";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
import UrlPhase from "./UrlPhase";
import UrlPreview from "./UrlPreview";
import PublicationForm from "./PublicationForm";
import PublicationLinksStep, { emptySocialRow, LINKS_MAX_SOCIAL } from "./PublicationLinksStep";
import api, { formatApiErrorDetail } from "../../lib/api";
import { publicationPath } from "../../lib/publicationUrl";
import { SOCIAL_OPTIONS, DEFAULT_SOCIAL_LABEL, isKnownSocialLabel } from "../../constants/socials";
import { useAuth } from "../../context/AuthContext";
import type { Publication, PublicationDraft, ScrapeResult, SocialLinkInput } from "../../types/models";
import type { PublicationFormContinuePayload } from "./PublicationForm";
import type { LinksPayload } from "./PublicationLinksStep";

type Phase = "url" | "details" | "links" | "verified-conflict" | "claim-required";

interface SubmitDraft extends PublicationDraft {
  additional_links?: string[];
  social_links?: SocialLinkInput[];
}

function buildDraftFromScrape(data: ScrapeResult & { url: string }): SubmitDraft {
  return {
    url: data.url,
    title: data.title ?? "",
    description: data.description ?? "",
    image_url: data.image_url ?? "",
    category: undefined,
    tags: [],
    additional_links: [],
    social_links: [],
  };
}

interface CreatePublicationPayload {
  url: string;
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  tags: string[];
  additional_links: string[];
  social_links: SocialLinkInput[];
}

interface ResubmitAndClaimPayload extends CreatePublicationPayload {
  name: string;
  claim_social_links: SocialLinkInput[];
  original_url?: string;
  comment?: string;
}

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

const inputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors disabled:bg-gray-50 disabled:text-gray-500";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("url");
  const [draft, setDraft] = useState<SubmitDraft | null>(null);
  const [linksPayload, setLinksPayload] = useState<LinksPayload | null>(null);
  const [pendingPublicationId, setPendingPublicationId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState("");

  // Claim form state
  const [claimName, setClaimName] = useState("");
  const [claimSocials, setClaimSocials] = useState<SocialLinkInput[]>(() => [
    { label: "Substack", url: "" },
    { label: "Medium", url: "" },
    { label: "X", url: "" },
    { label: "LinkedIn", url: "" },
  ]);
  const [claimOriginalUrl, setClaimOriginalUrl] = useState("");
  const [claimComment, setClaimComment] = useState("");
  const [claimError, setClaimError] = useState("");

  const { mutate: publish, isPending: publishing } = useMutation({
    mutationFn: (payload: CreatePublicationPayload) =>
      api.post<Publication | { requires_claim: boolean; publication_id: string }>("/api/publications", payload).then((r) => r.data),
    onSuccess: (res) => {
      if ("requires_claim" in res && res.requires_claim) {
        setPendingPublicationId(res.publication_id);
        setClaimName(user?.name ?? "");
        setPhase("claim-required");
        return;
      }
      const pub = res as Publication;
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["publication-tags"] });
      handleClose();
      navigate(publicationPath(pub), { state: { showVideoPrompt: true } });
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        setPhase("verified-conflict");
        return;
      }
      setPublishError(formatApiErrorDetail(err, "Failed to publish. Try again."));
    },
  });

  const { mutate: submitResubmitClaim, isPending: submittingClaim } = useMutation({
    mutationFn: (payload: ResubmitAndClaimPayload) =>
      api
        .post(`/api/publications/${pendingPublicationId}/resubmit-and-claim`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["publication-tags"] });
      handleClose();
    },
    onError: (err: unknown) => {
      setClaimError(formatApiErrorDetail(err, "Failed to submit. Try again."));
    },
  });

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setPhase("url");
      setDraft(null);
      setLinksPayload(null);
      setPendingPublicationId(null);
      setPublishError("");
      setClaimName("");
      setClaimSocials([
        { label: "Substack", url: "" },
        { label: "Medium", url: "" },
        { label: "X", url: "" },
        { label: "LinkedIn", url: "" },
      ]);
      setClaimOriginalUrl("");
      setClaimComment("");
      setClaimError("");
    }, 300);
  };

  const handleScraped = (data: ScrapeResult & { url: string }) => {
    setDraft(buildDraftFromScrape(data));
    setPhase("details");
    setPublishError("");
  };

  const handleContinueDetails = (partial: PublicationFormContinuePayload) => {
    setDraft((d) => (d ? { ...d, ...partial } : null));
    setPhase("links");
    setPublishError("");
  };

  const handlePublish = (payload: LinksPayload) => {
    setLinksPayload(payload);
    setPublishError("");
    if (!draft?.url || !draft.title?.trim() || !draft.category) return;
    publish({
      url: draft.url,
      title: draft.title.trim(),
      description: draft.description || undefined,
      image_url: draft.image_url || undefined,
      category: draft.category,
      tags: draft.tags ?? [],
      additional_links: payload.additional_links ?? [],
      social_links: payload.social_links ?? [],
    });
  };

  const handleSubmitClaim = () => {
    setClaimError("");
    const trimmedName = claimName.trim();
    if (trimmedName.length < 2 || !/[A-Za-z]/.test(trimmedName)) {
      setClaimError("Please enter your real name.");
      return;
    }

    const cleanedSocials: SocialLinkInput[] = [];
    for (const row of claimSocials) {
      const url = row.url.trim();
      if (!url) continue;
      if (!looksLikeUrl(url)) {
        setClaimError("Social links must be valid URLs starting with http:// or https://");
        return;
      }
      cleanedSocials.push({ label: row.label.trim() || DEFAULT_SOCIAL_LABEL, url });
    }

    const trimmedOriginal = claimOriginalUrl.trim();
    if (trimmedOriginal && !looksLikeUrl(trimmedOriginal)) {
      setClaimError("The original publication link must be a valid URL.");
      return;
    }

    if (cleanedSocials.length === 0 && !trimmedOriginal) {
      setClaimError("Add at least one social profile or the original publication link.");
      return;
    }

    if (!draft?.url || !draft.title?.trim() || !draft.category || !pendingPublicationId) return;

    submitResubmitClaim({
      url: draft.url,
      title: draft.title.trim(),
      description: draft.description || undefined,
      image_url: draft.image_url || undefined,
      category: draft.category,
      tags: draft.tags ?? [],
      additional_links: linksPayload?.additional_links ?? [],
      social_links: linksPayload?.social_links ?? [],
      name: trimmedName,
      claim_social_links: cleanedSocials,
      original_url: trimmedOriginal || undefined,
      comment: claimComment.trim() || undefined,
    });
  };

  const title =
    phase === "url"
      ? "Share a publication"
      : phase === "details"
        ? "Fill in the details"
        : phase === "verified-conflict"
          ? "Publication already exists"
          : phase === "claim-required"
            ? "Verify your ownership"
            : "Links & socials";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth={phase === "verified-conflict" ? "max-w-sm" : "max-w-2xl"}>
      <div className="flex flex-col gap-5">
        {phase === "url" && <UrlPhase onScraped={handleScraped} />}

        {phase === "details" && draft && (
          <>
            <UrlPreview data={draft} />
            <PublicationForm key={draft.url} draft={draft} onContinue={handleContinueDetails} />
          </>
        )}

        {phase === "links" && draft && (
          <PublicationLinksStep
            initialAdditionalLinks={draft.additional_links ?? []}
            initialSocialLinks={draft.social_links ?? []}
            onBack={() => setPhase("details")}
            onPublish={handlePublish}
            isPending={publishing}
            error={publishError}
          />
        )}

        {phase === "verified-conflict" && (
          <div className="flex flex-col items-center gap-3 py-1 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-50 border border-yellow-100">
              <TriangleAlert size={20} className="text-yellow-500" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">This publication has been verified by its owner.</p>
              <p className="text-xs text-gray-500">
                It cannot be updated or resubmitted.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              Got it
            </button>
          </div>
        )}

        {phase === "claim-required" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-3">
              <ShieldCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                This publication already exists in our directory. To update it and request ownership,
                please verify that this is your work. We'll review your claim and transfer ownership if everything checks out.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-900">Your name</label>
              <input
                type="text"
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
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
                {claimSocials.length < LINKS_MAX_SOCIAL && (
                  <button
                    type="button"
                    onClick={() => setClaimSocials((prev) => [...prev, emptySocialRow()])}
                    className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {claimSocials.map((row, i) => {
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
                          setClaimSocials((prev) => {
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
                          setClaimSocials((prev) => {
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
                        onClick={() =>
                          setClaimSocials((prev) =>
                            prev.length <= 1 ? [emptySocialRow()] : prev.filter((_, idx) => idx !== i)
                          )
                        }
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
                value={claimOriginalUrl}
                onChange={(e) => setClaimOriginalUrl(e.target.value)}
                placeholder="https://yourblog.substack.com/p/the-article"
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400">Where you originally published this (optional if you added a social profile).</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-900">
                Message <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={claimComment}
                onChange={(e) => setClaimComment(e.target.value)}
                placeholder="Anything you'd like us to know while reviewing your claim…"
                rows={3}
                maxLength={2000}
                className={`${inputCls} resize-y min-h-[72px]`}
              />
            </div>

            {claimError && <p className="text-red-600 text-sm">{claimError}</p>}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={submittingClaim}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmitClaim} disabled={submittingClaim}>
                {submittingClaim ? <Spinner size={16} /> : "Submit claim"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
