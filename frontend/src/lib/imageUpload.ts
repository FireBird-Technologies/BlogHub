/** Shared client-side image helper: load a file, scale it down so its largest side
 *  fits `maxDimension`, and return a compact JPEG data URL. Matches the app's
 *  convention of storing images as base64 data URIs in JSON (see AvatarPicker and
 *  the publication `image_url` field) — there is no file-upload endpoint. */
export async function fileToResizedDataUrl(file: File, maxDimension: number): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image"));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    // JPEG has no alpha channel — paint a white backdrop for transparent images.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
