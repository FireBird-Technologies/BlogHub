import { useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { Camera, Upload } from "lucide-react";
import Avatar from "./Avatar";
import { fileToResizedDataUrl } from "../../lib/imageUpload";

interface AvatarPickerProps {
  src?: string | null;
  name?: string;
  size?: number;
  onChange: (dataUrl: string) => void;
  className?: string;
}

const MAX_DIMENSION = 256;

export default function AvatarPicker({
  src,
  name,
  size = 96,
  onChange,
  className = "",
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    try {
      onChange(await fileToResizedDataUrl(file, MAX_DIMENSION));
    } catch {
      setError("Could not process that image.");
    }
  };

  const style: CSSProperties = { width: size, height: size };
  const badgeSize = size >= 72 ? 28 : 22;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={style}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`group relative h-full w-full rounded-full overflow-hidden cursor-pointer ${className}`}
          aria-label="Change profile photo"
        >
          <Avatar src={src} name={name} size={size} />
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/45 text-white
                       opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera size={size >= 72 ? 22 : 16} />
          </span>
        </button>
        {/* Always-visible upload affordance at the photo's corner. */}
        <span
          style={{ width: badgeSize, height: badgeSize, bottom: size * 0.03, right: size * 0.03 }}
          className="absolute flex items-center justify-center rounded-full bg-red-600 text-white
                     border-2 border-white shadow-sm pointer-events-none"
        >
          <Upload size={size >= 72 ? 14 : 12} />
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
