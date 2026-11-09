import type { ApiEnvelope, Media } from '@/types/api';

export class UploadError extends Error {}

const ENDPOINT = '/api/v1/admin/media';

function send(file: File, onProgress: (fraction: number) => void): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT);
    // Same-site cookies carry the session; the API requires this header on every write.
    xhr.setRequestHeader('x-riad-csrf', '1');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new UploadError('We could not reach the server. Check your connection and try again'));
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* a non-JSON answer is reported by status below */
      }
      resolve({ status: xhr.status, body });
    };
    xhr.send(form);
  });
}

/** An expired access cookie is renewed once, the same way the RTK Query base does it. */
async function refreshSession(): Promise<boolean> {
  const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'x-riad-csrf': '1' } });
  return res.ok;
}

/**
 * Uploads one file with byte-level progress (fetch cannot report upload progress).
 * Resolves with the new media record, which is still "processing" on the server.
 */
export async function uploadMedia(file: File, onProgress: (fraction: number) => void): Promise<Media> {
  let result = await send(file, onProgress);
  if (result.status === 401 && (await refreshSession())) result = await send(file, onProgress);

  const body = result.body as (ApiEnvelope<Media> & { message?: string }) | null;
  if (result.status >= 200 && result.status < 300 && body?.data) return body.data;
  throw new UploadError(body?.message ?? 'The upload failed. Please try again');
}
