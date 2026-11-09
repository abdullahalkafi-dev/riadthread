import { cn } from '@/lib/cn';
import type { Media, MediaVariant } from '@/types/api';

type Format = MediaVariant['format'];

const srcSet = (variants: MediaVariant[], format: Format) =>
  variants
    .filter((v) => v.format === format)
    .sort((a, b) => a.width - b.width)
    .map((v) => `${v.url} ${v.width}w`)
    .join(', ');

interface Props {
  media: Pick<Media, 'variants' | 'url' | 'width' | 'height' | 'blurDataUrl'> | null | undefined;
  alt: string;
  /** What the browser should assume about the rendered width, e.g. "(min-width:1024px) 25vw, 50vw". */
  sizes?: string;
  className?: string;
  /** Above-the-fold images load eagerly and with high priority. */
  priority?: boolean;
  /** Fills a positioned parent (the parent needs a size and `relative`). */
  fill?: boolean;
}

/**
 * Renders a processed image as <picture> with AVIF, WebP and JPEG renditions, so
 * each browser downloads the smallest file it supports at the size it needs.
 * A tiny blurred preview shows while the real image loads.
 */
export function ResponsiveImage({ media, alt, sizes = '100vw', className, priority = false, fill = false }: Props) {
  if (!media || (!media.url && media.variants.length === 0)) return null;
  const avif = srcSet(media.variants, 'avif');
  const webp = srcSet(media.variants, 'webp');
  const jpg = srcSet(media.variants, 'jpg');

  return (
    <picture>
      {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- renditions are already optimised by the API */}
      <img
        src={media.url ?? undefined}
        srcSet={jpg || undefined}
        sizes={jpg ? sizes : undefined}
        alt={alt}
        width={fill ? undefined : (media.width ?? undefined)}
        height={fill ? undefined : (media.height ?? undefined)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        style={media.blurDataUrl ? { backgroundImage: `url(${media.blurDataUrl})`, backgroundSize: 'cover' } : undefined}
        className={cn(fill && 'absolute inset-0 h-full w-full', className)}
      />
    </picture>
  );
}
