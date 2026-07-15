import { useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import ImagePositionPicker from "./ImagePositionPicker";
import CropImage from "./CropImage";

interface AdjustImageModalProps {
  src: string;
  isOpen: boolean;
  position: string | null;
  scale: number | null;
  aspect?: number;
  rounded?: boolean;
  onClose: () => void;
  /** Called only when the user confirms — the parent stores it locally until the form saves. */
  onSave: (position: string | null, scale: number | null) => void;
}

/**
 * Focused modal for adjusting an image's thumbnail crop (pan + zoom). The change is
 * held locally here and only handed back on Save, so the surrounding form persists it
 * to the DB when the form itself is submitted.
 */
export default function AdjustImageModal(props: AdjustImageModalProps) {
  if (!props.isOpen) return null;
  // Remount the body each time the modal opens (or the image changes), so its draft
  // state always starts from the latest saved position/scale — no stale-draft bug.
  return <AdjustImageModalBody key={`${props.src}:${props.position}:${props.scale}`} {...props} />;
}

function AdjustImageModalBody({
  src,
  isOpen,
  position,
  scale,
  aspect = 1,
  rounded = false,
  onClose,
  onSave,
}: AdjustImageModalProps) {
  const [draftPos, setDraftPos] = useState<string | null>(position ?? null);
  const [draftScale, setDraftScale] = useState<number | null>(scale ?? null);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust image" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className={rounded ? "mx-auto w-56" : "w-full"}>
          <ImagePositionPicker
            src={src}
            aspect={aspect}
            rounded={rounded}
            value={draftPos}
            scale={draftScale}
            onChange={setDraftPos}
            onScaleChange={(s) => setDraftScale(s)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Normalize "no adjustment" back to null so unchanged images stay default.
              const pos = draftPos && draftPos !== "50% 50%" ? draftPos : null;
              const sc = draftScale && draftScale > 1 ? draftScale : null;
              onSave(pos, sc);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ImageThumbWithAdjustProps {
  src: string;
  position?: string | null;
  scale?: number | null;
  /** Preview box classes (size/shape). Defaults to a square thumb. */
  className?: string;
  rounded?: boolean;
  onClick: () => void;
}

/**
 * Image preview showing the current crop, with a pencil overlay that opens the
 * adjust modal. Drop this in next to the image URL/upload controls in a form.
 */
export function ImageThumbWithAdjust({
  src,
  position,
  scale,
  className = "w-24 h-24",
  rounded = false,
  onClick,
}: ImageThumbWithAdjustProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Adjust image crop"
      className={`group relative flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-200
                  ${rounded ? "rounded-full" : "rounded-lg"} ${className}`}
    >
      <CropImage src={src} position={position} scale={scale} className="w-full h-full" />
      <span
        className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 group-hover:bg-black/40
                   text-white opacity-0 group-hover:opacity-100 transition-all text-xs font-medium"
      >
        <Pencil size={14} /> Adjust
      </span>
      {/* Always-visible pencil badge so the affordance is discoverable without hover. */}
      <span
        className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 rounded-full
                   bg-white/90 border border-gray-200 text-gray-600 shadow-sm group-hover:opacity-0 transition-opacity"
      >
        <Pencil size={12} />
      </span>
    </button>
  );
}
