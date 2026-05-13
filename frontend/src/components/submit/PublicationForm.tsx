import { useState, type ChangeEvent, type FormEvent } from "react";
import { CATEGORIES, isCategory, type Category } from "../../constants/categories";
import type { PublicationDraft } from "../../types/models";
import Button from "../ui/Button";

function tagsToString(tags: string[] | undefined): string {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags);
}

export interface PublicationFormContinuePayload {
  title: string;
  description?: string;
  image_url?: string;
  category: Category;
  tags: string[];
}

interface PublicationFormProps {
  draft: PublicationDraft;
  onContinue: (partial: PublicationFormContinuePayload) => void;
}

export default function PublicationForm({ draft, onContinue }: PublicationFormProps) {
  const [form, setForm] = useState(() => ({
    title: draft?.title ?? "",
    description: draft?.description ?? "",
    image_url: draft?.image_url ?? "",
    category: draft?.category && isCategory(draft.category) ? draft.category : CATEGORIES[0],
    tags: tagsToString(draft?.tags),
  }));
  const [error, setError] = useState("");

  const set =
    (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onContinue({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      image_url: form.image_url.trim() || undefined,
      category: form.category,
      tags,
    });
  };

  const inputCls =
    "w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors";

  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 font-medium">URL</label>
        <input type="url" value={draft?.url ?? ""} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={set("title")}
          maxLength={512}
          placeholder="Give it a clear title"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1.5 font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={4}
          placeholder="Brief description of the publication…"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category *</label>
          <select value={form.category} onChange={set("category")} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={set("tags")}
            placeholder="ai, ux, web (comma-separated)"
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button type="submit" className="self-end">
        Continue
      </Button>
    </form>
  );
}
