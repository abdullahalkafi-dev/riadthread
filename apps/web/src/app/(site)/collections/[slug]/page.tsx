import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CataloguePage } from '@/features/catalogue/CataloguePage';
import { activeFilterCount, parseProductArgs } from '@/features/catalogue/query';
import { getCollections } from '@/lib/site-data';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getCollections()).find((c) => c.slug === slug);
  if (!collection) return { title: 'Collection not found' };
  const args = parseProductArgs(await searchParams, slug);
  const filtered = activeFilterCount(args) > 0 || args.q !== '' || args.page > 1 || args.sort !== 'order';
  const description = collection.description || `The ${collection.name} range from Riad Threads: Moroccan wholesale for UK retailers. Trade prices on request.`;
  return {
    title: collection.name,
    description,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: { title: collection.name, description, ...(collection.image?.url ? { images: [collection.image.url] } : {}) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CollectionPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  if (!slug) notFound();
  return <CataloguePage args={parseProductArgs(await searchParams, slug)} />;
}
