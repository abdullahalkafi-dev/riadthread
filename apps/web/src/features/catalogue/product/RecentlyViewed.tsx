'use client';

import { useEffect, useState } from 'react';
import type { ProductCard, ProductDetail } from '@/types/api';
import { galleryFor, imageForColour } from '../gallery';
import { ProductCardItem } from '../ProductCardItem';

const KEY = 'rt:recent:v1';
const MAX = 8;

/** A card-sized summary of a product, kept in this browser so it can be shown again later. */
function toCard(p: ProductDetail): ProductCard {
  const images = galleryFor(p, null).filter((m) => m.media.type === 'image');
  const withAlt = (m: (typeof images)[number] | undefined) => (m ? { ...m.media, alt: m.alt || p.name } : null);
  const cover = withAlt(images[0]);
  return {
    id: p.id,
    slug: p.slug,
    code: p.code,
    name: p.name,
    badge: p.badge,
    summary: p.summary,
    moq: p.wholesale.moq,
    packText: p.wholesale.packText,
    newArrival: false,
    featured: false,
    category: p.category,
    collection: p.collection,
    cover,
    hover: withAlt(images[1]),
    colours: p.colours.map((c) => {
      const image = imageForColour(p, c.id);
      return { id: c.id, name: c.name, hex: c.hex, family: c.family, image: image ? { ...image, alt: `${p.name} in ${c.name}` } : cover };
    }),
  };
}

function read(): ProductCard[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ProductCard[]) : [];
  } catch {
    return [];
  }
}

/** "Recently viewed": products this visitor looked at before, kept on their own device only. */
export function RecentlyViewed({ current }: { current: ProductDetail }) {
  const [others, setOthers] = useState<ProductCard[]>([]);

  useEffect(() => {
    const saved = read();
    setOthers(saved.filter((p) => p.slug !== current.slug).slice(0, 4));
    try {
      window.localStorage.setItem(KEY, JSON.stringify([toCard(current), ...saved.filter((p) => p.slug !== current.slug)].slice(0, MAX)));
    } catch {
      /* storage unavailable: the list just is not remembered */
    }
  }, [current]);

  if (others.length === 0) return null;
  return (
    <section className="mt-20" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="font-display text-3xl sm:text-4xl">Recently viewed</h2>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
        {others.map((p) => (
          <ProductCardItem key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
