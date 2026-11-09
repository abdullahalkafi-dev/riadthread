import type { Metadata } from 'next';
import { CataloguePage } from '@/features/catalogue/CataloguePage';
import { activeFilterCount, parseProductArgs } from '@/features/catalogue/query';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const args = parseProductArgs(await searchParams);
  // Every filtered or paged view points back to the main page, and stays out of search results.
  const filtered = activeFilterCount(args) > 0 || args.q !== '' || args.page > 1 || args.sort !== 'order';
  return {
    title: 'Collection',
    description:
      'Browse the full Riad Threads wholesale range: djellabas, gandoras, jabadors and prayer essentials for UK retailers. Trade prices on request.',
    alternates: { canonical: '/collections' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CollectionsPage({ searchParams }: { searchParams: SearchParams }) {
  return <CataloguePage args={parseProductArgs(await searchParams)} />;
}
