import { UPLOAD_LIMITS, type MediaType } from '@riad/shared';

/** What the file input and the drop zone accept, grouped by what the media library can store. */
export const ACCEPT_ATTR = [
  ...UPLOAD_LIMITS.image.mimes,
  ...UPLOAD_LIMITS.video.mimes,
  ...UPLOAD_LIMITS.model.mimes,
  ...UPLOAD_LIMITS.document.mimes,
  '.glb',
].join(',');

export const ACCEPT_IMAGES = UPLOAD_LIMITS.image.mimes.join(',');
export const ACCEPT_DOCUMENTS = UPLOAD_LIMITS.document.mimes.join(',');

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

/** Browsers report no type for .glb files, so the extension decides. */
function kindOf(file: File): MediaType | null {
  if ((UPLOAD_LIMITS.image.mimes as readonly string[]).includes(file.type)) return 'image';
  if ((UPLOAD_LIMITS.video.mimes as readonly string[]).includes(file.type)) return 'video';
  if ((UPLOAD_LIMITS.document.mimes as readonly string[]).includes(file.type)) return 'document';
  if (file.type === 'model/gltf-binary' || file.name.toLowerCase().endsWith('.glb')) return 'model';
  return null;
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

/**
 * Checks a file before it is uploaded, so obvious problems are caught instantly.
 * The API repeats every check from the real file bytes; this only saves a round trip.
 * Returns a readable message, or null when the file looks fine.
 */
export async function validateUpload(file: File, allowed: readonly MediaType[] = ['image', 'video', 'model', 'document']): Promise<string | null> {
  const kind = kindOf(file);
  if (!kind) return `${file.name}: that file type is not supported. Use JPG, PNG, WebP, AVIF, MP4, WebM, GLB or PDF`;
  if (!allowed.includes(kind)) {
    const names = allowed.map((a) => (a === 'model' ? '3D model' : a)).join(' or ');
    return `${file.name}: please choose a ${names} file here`;
  }
  const limit = UPLOAD_LIMITS[kind];
  if (file.size > limit.maxBytes) return `${file.name}: that file is too large. The limit is ${mb(limit.maxBytes)} MB`;

  if (kind === 'image') {
    try {
      const { width, height } = await readImageSize(file);
      const shortSide = Math.min(width, height);
      if (shortSide < UPLOAD_LIMITS.image.minShortSide) {
        return `${file.name}: the image is too small (${width}×${height}). The shortest side must be at least ${UPLOAD_LIMITS.image.minShortSide}px`;
      }
    } catch {
      return `${file.name}: that image could not be read. It may be damaged`;
    }
  }
  return null;
}
