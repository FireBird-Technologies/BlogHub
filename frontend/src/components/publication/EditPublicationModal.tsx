import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
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
import { normalizeLinkUrl, normalizePublicationUrl } from "../../lib/urlNormalize";
import ImageUploadButton from "../ui/ImageUploadButton";
import AdjustImageModal, { ImageThumbWithAdjust } from "../ui/AdjustImageModal";
import { publicationShortId } from "../../lib/publicationUrl";
import type { Publication, SocialLinkInput } from "../../types/models";

const inputBase =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors";
const inputCls = `${inputBase} py-2.5`;
// Shorter variant for compact fields (URL, image URL).
const inputClsSm = `${inputBase} py-1.5`;

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
  image_position?: string | null;
  image_scale?: number | null;
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
  // CSS object-position + zoom for how the image is cropped in card thumbnails.
  const [imagePosition, setImagePosition] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState<number | null>(null);
  const [adjustingImage, setAdjustingImage] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [extraSlots, setExtraSlots] = useState(() => initLinkExtraSlots([]));
  const [socials, setSocials] = useState<SocialLinkInput[]>(() => [emptySocialRow()]);
  // The last URL whose metadata has already been fetched. Seeded to the
  // publication's own URL (its fields were fetched when it was created), so the
  // primary button starts as "Save changes". Whenever the URL is edited to
  // something other than this, the button becomes "Fetch" until they re-fetch.
  const [fetchedUrl, setFetchedUrl] = useState("");
  const scrape = useScrape();

  useEffect(() => {
    if (!publication || !isOpen) return;
    setSaveError("");
    setFieldError("");
    setUrl(publication.url ?? "");
    setFetchedUrl(publication.url ?? "");
    setTitle(publication.title ?? "");
    setDescription(publication.description ?? "");
    setImageUrl(publication.image_url ?? "");
    setImagePosition(publication.image_position ?? null);
    setImageScale(publication.image_scale ?? null);
    const isPredefined = isCategory(publication.category);
    setCategory(isPredefined ? publication.category : "__custom__");
    setCustomCategory(isPredefined ? "" : publication.category);
    setTagsStr(tagsToString(publication.tags));
    setExtraSlots(initLinkExtraSlots(publication.additional_links ?? []));
    setSocials(initLinkSocialRows(publication.social_links ?? []));
  }, [publication, isOpen]);

  // The URL has been edited to something we haven't fetched metadata for yet, so
  // the primary action should be "Fetch" (re-scrape title/description/image)
  // rather than "Save changes".
  const needsFetch = Boolean(url.trim()) && url.trim() !== fetchedUrl.trim();

  // Fetch title/description/image for the edited URL. Unlisted publications are
  // link-only (a specific page) so keep the full path; normal publications are
  // identified by their base site.
  const handleFetch = () => {
    if (!url.trim() || !publication) return;
    setSaveError("");
    setFieldError("");
    const withScheme = url.includes("://") ? url : `https://${url}`;
    // Unlisted publications are link-only (a specific page): keep the full path on
    // both frontend and backend. Normal publications collapse to their base site.
    const canonicalUrl = publication.is_unlisted
      ? normalizeLinkUrl(withScheme)
      : normalizePublicationUrl(withScheme);
    if (!canonicalUrl) {
      setFieldError("Please enter a valid URL.");
      return;
    }
    // Shorten (normal) / normalize (unlisted) the field instantly, before the
    // scrape resolves — matching the normal creation form's behavior. Also marks
    // this URL as fetched so the button flips back to "Save changes".
    setUrl(canonicalUrl);
    setFetchedUrl(canonicalUrl);
    const mode = publication.is_unlisted ? "link" : "publication";
    scrape.mutate(
      { url: withScheme, mode },
      {
        onSuccess: (data) => {
          if (data.title) setTitle(data.title);
          if (data.description) setDescription(data.description);
          if (data.image_url) {
            setImageUrl(data.image_url);
            setImagePosition(null); // new image → reset crop to center
            setImageScale(null);
          }
        },
        onError: () => {
          setFieldError("Could not fetch details for that URL. Check it and try again.");
        },
      },
    );
  };

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
    // When the URL has been edited but not yet fetched, the primary button acts as
    // "Fetch" — scrape the new URL instead of saving. Routing both through the
    // form's submit (rather than swapping button elements mid-click) avoids a
    // re-render race that could otherwise submit-and-close the modal on fetch.
    if (needsFetch) {
      handleFetch();
      return;
    }
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
        image_position: imageUrl.trim() ? imagePosition : null,
        image_scale: imageUrl.trim() ? imageScale : null,
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
            className={inputClsSm}
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
            {scrape.isPending && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-gray-400 font-normal normal-case">
                <Spinner size={10} /> fetching…
              </span>
            )}
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePosition(null); // different image → reset crop
                  setImageScale(null);
                }}
                placeholder="Paste an image URL…"
                className={`${inputClsSm} w-full`}
              />
              <ImageUploadButton
                onUpload={(url) => {
                  setImageUrl(url);
                  setImagePosition(null);
                  setImageScale(null);
                }}
                className="self-start py-1.5"
              />
              {imageUrl && (
                <p className="text-[11px] text-gray-400">Click the image to adjust its thumbnail crop.</p>
              )}
            </div>
            {imageUrl ? (
              <div className="flex flex-col items-center gap-1">
                <ImageThumbWithAdjust
                  src={imageUrl}
                  position={imagePosition}
                  scale={imageScale}
                  className="w-20 h-20"
                  onClick={() => setAdjustingImage(true)}
                />
                <p className="w-20 text-center text-[10px] leading-tight text-gray-400">Card crop</p>
              </div>
            ) : (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden" />
            )}
          </div>
          {imageUrl && (
            <div className="mt-3">
              <p className="text-[11px] text-gray-400 mb-1">Full image (detail page)</p>
              <div className="w-full rounded-lg border border-gray-200 overflow-hidden aspect-video bg-gray-100">
                <img src={imageUrl} alt="" className="w-full h-full object-contain" />
              </div>
            </div>
          )}
          {imageUrl && (
            <AdjustImageModal
              src={imageUrl}
              isOpen={adjustingImage}
              position={imagePosition}
              scale={imageScale}
              aspect={1}
              onClose={() => setAdjustingImage(false)}
              onSave={(pos, sc) => {
                setImagePosition(pos);
                setImageScale(sc);
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category *</label>
            <CustomDropdown
              value={category}
              options={[
                ...CATEGORIES.map((c) => ({ value: c, label: c })),
                { value: "__custom__", label: "Other / Custom…" },
              ]}
              onChange={setCategory}
              placeholder="Select a category…"
              buttonClassName="text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
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
          <Button type="submit" disabled={isPending || scrape.isPending}>
            {isPending || scrape.isPending ? (
              <Spinner size={16} />
            ) : needsFetch ? (
              "Fetch"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
