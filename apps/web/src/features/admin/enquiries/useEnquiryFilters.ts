'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ENQUIRY_STATUSES, LEAD_LEVELS, type EnquiryStatus } from '@riad/shared';

export type ViewMode = 'table' | 'board';

export interface EnquiryFilters {
  status: EnquiryStatus | undefined;
  score: (typeof LEAD_LEVELS)[number] | undefined;
  q: string;
  sort: 'newest' | 'oldest';
  page: number;
  view: ViewMode;
  /** Id of the enquiry whose panel is open. */
  open: string | undefined;
}

type Patch = Partial<Record<'status' | 'score' | 'q' | 'sort' | 'page' | 'view' | 'open', string | number | undefined>>;

const oneOf = <T extends string>(list: readonly T[], value: string | null): T | undefined =>
  list.find((item) => item === value);

/**
 * The enquiries page keeps its whole state in the address bar (filters, page,
 * view and the open panel), so a refresh, the back button and shared links all
 * land exactly where the person was.
 */
export function useEnquiryFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: EnquiryFilters = useMemo(
    () => ({
      status: oneOf(ENQUIRY_STATUSES, params.get('status')),
      score: oneOf(LEAD_LEVELS, params.get('score')),
      q: params.get('q') ?? '',
      sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
      page: Math.max(1, Number(params.get('page')) || 1),
      view: params.get('view') === 'board' ? 'board' : 'table',
      open: params.get('open') ?? undefined,
    }),
    [params],
  );

  const update = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '' || (key === 'page' && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      // Changing what is listed starts again from the first page, unless the page itself was set.
      const changesList = ['status', 'score', 'q', 'sort'].some((k) => k in patch);
      if (changesList && !('page' in patch)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { filters, update };
}
