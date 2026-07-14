import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { CATEGORIES, isCategory, normalizeCategoryForStorage, type Category } from "../../constants/categories";
import {
  PublicationLinksFields,
  collectLinksPayload,
  initLinkExtraSlots,
  initLinkSocialRows,
  emptySocialRow,
} from "../submit/PublicationLinksStep";
import { useScrape } from "../../hooks/useScrape";
import api, { formatApiErrorDetail } from "../../lib/api";
import { publicationShortId } from "../../lib/publicationUrl";
import type { Publication, SocialLinkInput } from "../../types/models";

const inputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors";

function tagsToString(tags: string[] | undefined): string {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags);
}

interface PublicationUpdatePayload {
  url: string;
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  tags: string[];
  additional_links: string[];
  social_links: SocialLinkInput[];
}

interface EditPublicationModalProps {
  publication: Publication | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPublicationModal({ publication, isOpen, onClose }: EditPublicationModalProps) {
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [extraSlots, setExtraSlots] = useState(() => initLinkExtraSlots([]));
  const [socials, setSocials] = useState<SocialLinkInput[]>(() => [emptySocialRow()]);
  const scrape = useScrape();

  useEffect(() => {
    if (!publication || !isOpen) return;
    setSaveError("");
    setFieldError("");
    setUrl(publication.url ?? "");
    setTitle(publication.title ?? "");
    setDescription(publication.description ?? "");
    setImageUrl(publication.image_url ?? "");
    const isPredefined = isCategory(publication.category);
    setCategory(isPredefined ? publication.category : "__custom__");
    setCustomCategory(isPredefined ? "" : publication.category);
    setTagsStr(tagsToString(publication.tags));
    setExtraSlots(initLinkExtraSlots(publication.additional_links ?? []));
    setSocials(initLinkSocialRows(publication.social_links ?? []));
  }, [publication, isOpen]);

  // For an unlisted (link-only) publication, re-fetch its image/title/description
  // live as the URL is edited — there's no separate "Use a link" review step here,
  // so this is the only chance to refresh them. Debounced so it doesn't fire on
  // every keystroke, and skipped on the very first render (the seeded URL is
  // already correct, no need to re-scrape what we just loaded).
  useEffect(() => {
    if (!isOpen || !publication?.is_unlisted) return;
    if (!url.trim() || url === publication.url) return;
    const timer = setTimeout(() => {
      const withScheme = url.includes("://") ? url : `https://${url}`;
      scrape.mutate(withScheme, {
        onSuccess: (data) => {
          if (data.title) setTitle(data.title);
          if (data.description) setDescription(data.description);
          if (data.image_url) setImageUrl(data.image_url);
        },
      });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isOpen, publication?.is_unlisted, publication?.url]);

  const publicationId = publication?.id;

  const { mutate: savePublication, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PublicationUpdatePayload }) =>
      api.patch<Publication>(`/api/publications/${id}`, payload).then((r) => r.data),
    onSuccess: (_data, variables) => {
      const { id } = variables;
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-publications"] });
      queryClient.invalidateQueries({ queryKey: ["publications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // The detail page keys its query by the truncated short id (not the full
      // UUID), so match on that too — otherwise it shows stale data until refresh.
      const shortId = publicationShortId(id);
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "publication" &&
          (String(q.queryKey[1]) === String(id) || String(q.queryKey[1]) === shortId),
      });
      onClose();
    },
    onError: (err: unknown) => {
      setSaveError(formatApiErrorDetail(err, "Could not save changes. Try again."));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setFieldError("");
    if (!publicationId) return;
    if (!title.trim()) {
      setFieldError("Title is required");
      return;
    }
    if (!url.trim()) {
      setFieldError("URL is required");
      return;
    }
    if (category === "__custom__" && !customCategory.trim()) {
      setFieldError("Please enter a category name");
      return;
    }
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const { additional_links, social_links } = collectLinksPayload(extraSlots, socials);
    savePublication({
      id: publicationId,
      payload: {
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        category: normalizeCategoryForStorage(category === "__custom__" ? customCategory : category),
        tags,
        additional_links,
        social_links,
      },
    });
  };

  if (!publication) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit publication">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[min(70vh,640px)] overflow-y-auto pr-3 sm:pr-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={2048}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={512}
            placeholder="Give it a clear title"
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Brief description…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">
            Image URL
            {publication.is_unlisted && scrape.isPending && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-gray-400 font-normal normal-case">
                <Spinner size={10} /> fetching…
              </span>
            )}
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={`${inputCls} flex-1 min-w-0`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">Other / Custom…</option>
            </select>
            {category === "__custom__" && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Gaming, Machine Learning…"
                maxLength={64}
                className={`${inputCls} mt-2`}
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tags</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="ai, ux, web (comma-separated)"
              className={inputCls}
            />
          </div>
        </div>

        {!publication.is_unlisted && (
          <PublicationLinksFields
            extraSlots={extraSlots}
            setExtraSlots={setExtraSlots}
            socials={socials}
            setSocials={setSocials}
            inputCls={inputCls}
          />
        )}

        {(fieldError || saveError) && (
          <p className="text-red-600 text-sm">{fieldError || saveError}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner size={16} /> : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
