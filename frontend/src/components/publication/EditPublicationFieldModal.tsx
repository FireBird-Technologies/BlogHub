import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CustomDropdown from "../ui/CustomDropdown";
import api, { formatApiErrorDetail } from "../../lib/api";
import { CATEGORIES, isCategory, normalizeCategoryForStorage, type Category } from "../../constants/categories";
import { publicationShortId } from "../../lib/publicationUrl";
import {
  SOCIAL_OPTIONS,
  DEFAULT_SOCIAL_LABEL,
  isKnownSocialLabel,
} from "../../constants/socials";
import type { Publication, SocialLinkInput } from "../../types/models";

export type EditableField =
  | "basics"
  | "description"
  | "url"
  | "additional_links"
  | "all";

const FIELD_TITLE: Record<EditableField, string> = {
  basics: "Edit publication",
  description: "Edit description",
  url: "Edit article URL",
  additional_links: "Edit related links",
  all: "Resubmit publication",
};

const MAX_EXTRA = 5;
const MAX_SOCIAL = 8;
const inputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors";

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

function buildBasePayload(pub: Publication, customCategory?: string): PublicationUpdatePayload {
  const isPredefined = isCategory(pub.category);
  return {
    url: pub.url,
    title: pub.title,
    description: pub.description ?? undefined,
    image_url: pub.image_url ?? undefined,
    category: isPredefined ? pub.category : (customCategory || pub.category || CATEGORIES[0]),
    tags: pub.tags ?? [],
    additional_links: pub.additional_links ?? [],
    social_links: (pub.social_links ?? []).map((s) => ({ label: s.label, url: s.url })),
  };
}

interface EditPublicationFieldModalProps {
  publication: Publication | null;
  field: EditableField | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPublicationFieldModal({
  publication,
  field,
  isOpen,
  onClose,
}: EditPublicationFieldModalProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [extraSlots, setExtraSlots] = useState<string[]>([]);
  const [socials, setSocials] = useState<SocialLinkInput[]>([]);

  useEffect(() => {
    if (!isOpen || !publication) return;
    setError("");
    setTitle(publication.title ?? "");
    setDescription(publication.description ?? "");
    setImageUrl(publication.image_url ?? "");
    setUrl(publication.url ?? "");
    const isPredefined = isCategory(publication.category);
    setCategory(isPredefined ? publication.category : "__custom__");
    setCustomCategory(isPredefined ? "" : publication.category);
    setTagsStr((publication.tags ?? []).join(", "));

    const links = [...(publication.additional_links ?? [])].slice(0, MAX_EXTRA);
    while (links.length < MAX_EXTRA) links.push("");
    setExtraSlots(links);

    const socialRows: SocialLinkInput[] = (publication.social_links ?? []).map((s) => ({
      label: s.label || DEFAULT_SOCIAL_LABEL,
      url: s.url || "",
    }));
    if (!socialRows.length) socialRows.push({ label: DEFAULT_SOCIAL_LABEL, url: "" });
    setSocials(socialRows.slice(0, MAX_SOCIAL));
  }, [publication, isOpen, field]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PublicationUpdatePayload }) =>
      api.patch<Publication>(`/api/publications/${id}`, payload).then((r) => r.data),
    onSuccess: async (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: ["user-publications"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-publications"] });
      queryClient.invalidateQueries({ queryKey: ["publications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Refetch the specific publication detail query to ensure data updates
      // immediately. The detail page keys its query by the truncated short id
      // (not the full UUID), so match on that too.
      const shortId = publicationShortId(vars.id);
      await queryClient.refetchQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "publication" &&
          (String(q.queryKey[1]) === String(vars.id) || String(q.queryKey[1]) === shortId),
      });
      onClose();
    },
    onError: (err: unknown) => {
      setError(formatApiErrorDetail(err, "Could not save changes. Try again."));
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!publication || !field) return;

    const base = buildBasePayload(publication, customCategory);
    let payload: PublicationUpdatePayload = base;

    switch (field) {
      case "basics": {
        const t = title.trim();
        if (!t) {
          setError("Title is required");
          return;
        }
        if (category === "__custom__" && !customCategory.trim()) {
          setError("Please enter a category name");
          return;
        }
        payload = {
          ...base,
          title: t,
          image_url: imageUrl.trim() || undefined,
          category: normalizeCategoryForStorage(category === "__custom__" ? customCategory : category),
          tags: tagsStr
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          social_links: socials
            .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
            .filter((s) => s.url && s.label),
        };
        break;
      }
      case "description": {
        const d = description.trim();
        payload = { ...base, description: d || undefined };
        break;
      }
      case "url": {
        const u = url.trim();
        if (!u) {
          setError("URL is required");
          return;
        }
        payload = { ...base, url: u };
        break;
      }
      case "additional_links": {
        payload = {
          ...base,
          additional_links: extraSlots.map((u) => u.trim()).filter(Boolean),
        };
        break;
      }
      case "all": {
        const t = title.trim();
        if (!t) {
          setError("Title is required");
          return;
        }
        if (category === "__custom__" && !customCategory.trim()) {
          setError("Please enter a category name");
          return;
        }
        const u = url.trim();
        if (!u) {
          setError("URL is required");
          return;
        }
        payload = {
          ...base,
          title: t,
          url: u,
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          category: normalizeCategoryForStorage(category === "__custom__" ? customCategory : category),
          tags: tagsStr
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          additional_links: extraSlots.map((link) => link.trim()).filter(Boolean),
          social_links: socials
            .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
            .filter((s) => s.url && s.label),
        };
        break;
      }
    }

    mutate({ id: publication.id, payload });
  };

  if (!publication || !field) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={FIELD_TITLE[field]}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-w-0 max-h-[min(70vh,640px)] overflow-y-auto thin-scrollbar -mr-2 pr-2">
        {(field === "basics" || field === "all") && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={512}
                autoFocus
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
              {imageUrl && (
                <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden aspect-video bg-gray-100">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category *</label>
              <CustomDropdown
                value={category}
                onChange={(v) => setCategory(v)}
                options={[
                  ...CATEGORIES.map((c) => ({ value: c, label: c })),
                  { value: "__custom__", label: "Other / Custom…" },
                ]}
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-gray-500 font-medium">Social profiles</label>
                {socials.length < MAX_SOCIAL && (
                  <button
                    type="button"
                    onClick={() => setSocials((prev) => [...prev, { label: DEFAULT_SOCIAL_LABEL, url: "" }])}
                    className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
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
                        className="w-24 sm:w-28 shrink-0"
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
                        onClick={() =>
                          setSocials((prev) =>
                            prev.length <= 1
                              ? [{ label: DEFAULT_SOCIAL_LABEL, url: "" }]
                              : prev.filter((_, idx) => idx !== i)
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
          </>
        )}

        {field === "description" && (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            autoFocus
            placeholder="Brief description…"
            className={`${inputCls} resize-none`}
          />
        )}

        {field === "all" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Brief description…"
              className={`${inputCls} resize-none`}
            />
          </div>
        )}

        {field === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={2048}
            autoFocus
            className={inputCls}
          />
        )}

        {field === "all" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Article URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={2048}
              className={inputCls}
            />
          </div>
        )}

        {(field === "additional_links" || field === "all") && (
          <div className="flex flex-col gap-2">
            {field === "all" && (
              <label className="block text-xs text-gray-500 font-medium">Related links</label>
            )}
            <p className="text-xs text-gray-500">Up to {MAX_EXTRA} URLs.</p>
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
                className={inputCls}
              />
            ))}
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner size={16} /> : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
