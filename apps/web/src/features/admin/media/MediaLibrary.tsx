'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, Chip, EmptyState, Icon, Input, PageHeader, Pagination, QueryError, Select } from '@/components/admin';
import { MediaThumb, mediaKindLabel } from '@/components/admin/media/MediaThumb';
import { UploadDropzone } from '@/components/admin/media/UploadDropzone';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useListMediaQuery } from '@/store/admin/mediaApi';
import type { Media } from '@/types/api';
import { formatBytes } from '../shared/format';
import { useDebounced } from '../shared/useDebounced';
import { MediaDetail } from './MediaDetail';

const PAGE_SIZE = 24;
const TYPES: Array<{ value: '' | Media['type']; label: string }> = [
  { value: '', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'model', label: '3D models' },
  { value: 'document', label: 'PDFs' },
];

/** Every uploaded file in one place: browse, upload, inspect, retry and delete. */
export function MediaLibrary() {
  const [type, setType] = useState<'' | Media['type']>('');
  const [status, setStatus] = useState<'' | Media['status']>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pollMs, setPollMs] = useState(0);
  const q = useDebounced(search.trim());

  const { data, isLoading, isFetching, isError, error, refetch } = useListMediaQuery(
    { page, limit: PAGE_SIZE, ...(type ? { type } : {}), ...(status ? { status } : {}), ...(q ? { q } : {}) },
    { pollingInterval: pollMs },
  );
  const items = data?.items ?? [];

  // While anything is still being processed, check again every few seconds.
  const processing = items.some((m) => m.status === 'processing');
  useEffect(() => setPollMs(processing ? 3000 : 0), [processing]);

  const selected = items.find((m) => m.id === selectedId) ?? null;
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Media library" description="Every photo, video, 3D model and PDF in one place. Originals are kept private; the website gets optimised copies." />

      <Card className="mb-4">
        <CardBody className="pt-[18px]">
          <UploadDropzone />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5 p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="File type">
            {TYPES.map((t) => (
              <Chip key={t.value} active={type === t.value} onClick={() => reset(setType)(t.value)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="grow" />
          <Select value={status} onChange={(e) => reset(setStatus)(e.target.value as '' | Media['status'])} aria-label="Status" className="w-auto">
            <option value="">Any status</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </Select>
          <div className="relative w-full max-w-[260px]">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <Input value={search} onChange={(e) => reset(setSearch)(e.target.value)} placeholder="Search by file name…" aria-label="Search files" className="pl-10" />
          </div>
        </div>
      </Card>

      {isError ? (
        <Card>
          <QueryError error={error} onRetry={refetch} />
        </Card>
      ) : (
        <Card className={cn(isFetching && !isLoading && 'opacity-80 transition-opacity')}>
          {isLoading ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 p-4">
              {Array.from({ length: 12 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-[4/5] rounded-xl" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <EmptyState title="No files found">Upload something above, or change the filters.</EmptyState>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 p-4">
              {items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className="group block w-full overflow-hidden rounded-xl border border-admin-line bg-white text-left transition hover:-translate-y-0.5 hover:border-sand-400"
                  >
                    <div className="aspect-[4/5]">
                      <MediaThumb media={m} sizes="200px" />
                    </div>
                    <div className="space-y-1 px-2.5 py-2">
                      <p className="truncate text-[13px] font-semibold">{m.originalName ?? 'Untitled'}</p>
                      <div className="flex items-center justify-between gap-1 text-xs text-ink-soft">
                        <span>
                          {mediaKindLabel(m.type)} · {formatBytes(m.bytes)}
                        </span>
                        {m.status !== 'ready' && <Badge tone={m.status}>{m.status === 'failed' ? 'Failed' : 'Processing'}</Badge>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onChange={setPage} />}
        </Card>
      )}

      <MediaDetail media={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
