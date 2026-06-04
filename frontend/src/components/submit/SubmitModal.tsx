import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Video, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import UrlPhase from "./UrlPhase";
import UrlPreview from "./UrlPreview";
import PublicationForm from "./PublicationForm";
import PublicationLinksStep from "./PublicationLinksStep";
import api, { formatApiErrorDetail } from "../../lib/api";
import { CATEGORIES, isCategory, type Category } from "../../constants/categories";
import type { Publication, PublicationDraft, ScrapeResult, SocialLinkInput } from "../../types/models";
import type { PublicationFormContinuePayload } from "./PublicationForm";
import type { LinksPayload } from "./PublicationLinksStep";

type Phase = "url" | "details" | "links" | "success";

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

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("url");
  const [draft, setDraft] = useState<SubmitDraft | null>(null);
  const [publishError, setPublishError] = useState("");

  const { mutate: publish, isPending: publishing } = useMutation({
    mutationFn: (payload: CreatePublicationPayload) =>
      api.post<Publication>("/api/publications", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setPhase("success");
    },
    onError: (err: unknown) => {
      setPublishError(formatApiErrorDetail(err, "Failed to publish. Try again."));
    },
  });

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setPhase("url");
      setDraft(null);
      setPublishError("");
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

  const handlePublish = ({ additional_links, social_links }: LinksPayload) => {
    setPublishError("");
    if (!draft?.url || !draft.title?.trim() || !draft.category) return;
    publish({
      url: draft.url,
      title: draft.title.trim(),
      description: draft.description || undefined,
      image_url: draft.image_url || undefined,
      category: draft.category,
      tags: draft.tags ?? [],
      additional_links: additional_links ?? [],
      social_links: social_links ?? [],
    });
  };

  const title =
    phase === "url"
      ? "Share a publication"
      : phase === "details"
        ? "Fill in the details"
        : phase === "links"
          ? "Links & socials"
          : "Publication added";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth={phase === "success" ? "max-w-md" : "max-w-2xl"}>
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

        {phase === "success" && (
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-green-600" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-semibold text-gray-900">Your publication is live!</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Want to reach a wider audience? Turn it into a video with blog2video.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <a href="https://blog2video.app" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button className="w-full justify-center">
                  <Video size={16} />
                  Convert to video
                  <ExternalLink size={14} className="opacity-80" />
                </Button>
              </a>
              <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto justify-center">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
