/** Browser-only: uses canvas to make photos smaller before they're uploaded. */

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const SMALL_ENOUGH_BYTES = 400 * 1024;

/** Scales a photo down to MAX_SIDE pixels and re-encodes it as WebP. Returns the original if that isn't smaller. */
async function shrinkImage(file: File): Promise<File> {
  // GIFs would lose their animation.
  if (file.type === "image/gif" || file.size <= SMALL_ENOUGH_BYTES) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob || blob.size >= file.size) return file;
  const ext = blob.type.split("/")[1];
  return new File([blob], file.name.replace(/\.\w+$/, "") + "." + ext, { type: blob.type });
}

/** Replaces the files under `keys` in `formData` with smaller versions, dropping empty file inputs. */
export async function shrinkFormImages(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const files = formData.getAll(key).filter((f): f is File => f instanceof File && f.size > 0);
    formData.delete(key);
    for (const file of await Promise.all(files.map(shrinkImage))) formData.append(key, file);
  }
}
