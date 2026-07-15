import { useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import Spinner from "./Spinner";
import { fileToResizedDataUrl } from "../../lib/imageUpload";

/** Banner images render at ~5.9:1 but we keep the natural aspect ratio; cap the
 *  largest side so the base64 payload stays reasonable (kept under the backend's
 *  MAX_IMAGE_LENGTH guard). */
const MAX_DIMENSION = 1128;

interface ImageUploadButtonProps {
  /** Receives a resized JPEG data URI to store in `image_url`. */
  onUpload: (dataUrl: string) => void;
  className?: string;
  label?: string;
}

/** An "Upload" affordance that sits next to an Image URL text input: pick a file,
 *  resize it client-side, and hand back a base64 data URI — the app's convention for
 *  storing images (see AvatarPicker). Lets users upload instead of pasting a URL. */
export default function ImageUploadButton({
  onUpload,
  className = "",
  label = "Upload",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      onUpload(await fileToResizedDataUrl(file, MAX_DIMENSION));
    } catch {
      setError("Could not process that image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white
                    px-3 text-xs font-medium text-gray-600 transition-colors
                    hover:border-red-300 hover:text-red-600 disabled:opacity-50
                    ${className.includes("py-") ? "" : "py-2"} ${className}`}
      >
        {busy ? <Spinner size={14} /> : <Upload size={14} />}
        {label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}
