import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { cn } from '@/lib/cn';
import type { Media } from '@/types/api';

/**
 * A category or collection picture that fills its parent. When no image has been
 * uploaded yet it shows the star pattern instead, so layouts never collapse.
 */
export function CategoryThumb({ image, alt, sizes, className }: { image: Media | null; alt: string; sizes: string; className?: string }) {
  if (!image) {
    return <span aria-hidden="true" className="star-bg-ink absolute inset-0 bg-sand-200 opacity-90" />;
  }
  return <ResponsiveImage media={image} alt={alt} sizes={sizes} fill className={cn('object-cover', className)} />;
}
