import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { Media } from '@/types/api';
import { Icon, type IconName } from '../Icon';

const KIND_ICON: Record<Media['type'], IconName> = { image: 'img', video: 'play', model: 'box', document: 'file' };
const KIND_LABEL: Record<Media['type'], string> = { image: 'Image', video: 'Video', model: '3D model', document: 'PDF' };

interface MediaThumbProps {
  media: Pick<Media, 'type' | 'status' | 'variants' | 'url' | 'width' | 'height' | 'blurDataUrl' | 'posterUrl'>;
  /** The container is relative and fills its parent; give the parent a size or aspect ratio. */
  className?: string;
  alt?: string;
  sizes?: string;
}

/** A preview of any media file: the image itself, a video poster, or an icon for 3D models and PDFs. */
export function MediaThumb({ media, className, alt = '', sizes = '200px' }: MediaThumbProps) {
  const showImage = media.type === 'image' && media.status === 'ready';

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-sand-200', className)}>
      {showImage && <ResponsiveImage media={media} alt={alt} sizes={sizes} fill className="object-cover" />}
      {media.type === 'video' && media.posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- poster frame made by the API
        <img src={media.posterUrl} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {!showImage && !(media.type === 'video' && media.posterUrl) && (
        <div className="absolute inset-0 grid place-items-center text-center text-ink-soft">
          <div>
            <Icon name={KIND_ICON[media.type]} className="mx-auto h-9 w-9" />
            <span className="mt-1 block text-xs">{KIND_LABEL[media.type]}</span>
          </div>
        </div>
      )}
      {media.type === 'video' && (
        <span className="absolute inset-0 grid place-items-center bg-night-900/30 text-white" aria-hidden>
          <Icon name="play" className="h-8 w-8 fill-white" />
        </span>
      )}
      {media.status !== 'ready' && (
        <span
          className={cn(
            'absolute inset-x-0 bottom-0 px-2 py-1 text-center text-[11px] font-semibold',
            media.status === 'failed' ? 'bg-admin-danger text-white' : 'bg-night-900/75 text-white',
          )}
        >
          {media.status === 'failed' ? 'Failed' : 'Processing…'}
        </span>
      )}
    </div>
  );
}

export const mediaKindLabel = (type: Media['type']) => KIND_LABEL[type];
