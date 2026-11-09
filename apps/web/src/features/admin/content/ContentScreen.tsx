'use client';

import { useState } from 'react';
import { CONTENT_BLOCK_KEYS } from '@riad/shared';
import { Card, PageHeader, QueryError, Segmented } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useListBlocksQuery } from '@/store/admin/contentApi';
import { BlockCard } from './BlockCard';
import { BLOCKS } from './blocks/registry';
import { HomeSections } from './HomeSections';
import { PagesEditor } from './PagesEditor';

function HomepageBlocks() {
  const { data, isLoading, isError, error, refetch } = useListBlocksQuery();
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <div className="space-y-3.5">
        {isError ? (
          <Card>
            <QueryError error={error} onRetry={refetch} />
          </Card>
        ) : isLoading || !data ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[72px] rounded-card" />)
        ) : (
          CONTENT_BLOCK_KEYS.map((key) => {
            const row = data.find((b) => b.key === key);
            return row ? <BlockCard key={key} def={BLOCKS[key]} row={row} /> : null;
          })
        )}
      </div>
      <HomeSections />
    </div>
  );
}

/** Everything the owner can edit on the public site without a developer. */
export function ContentScreen() {
  const [part, setPart] = useState<'home' | 'pages'>('home');
  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit the words and images the website shows. Each save goes live within about a minute."
        actions={
          <Segmented
            label="What to edit"
            value={part}
            onChange={setPart}
            options={[
              { value: 'home', label: 'Homepage', icon: 'home' },
              { value: 'pages', label: 'Text pages', icon: 'file' },
            ]}
          />
        }
      />
      {part === 'home' ? <HomepageBlocks /> : <PagesEditor />}
    </>
  );
}
