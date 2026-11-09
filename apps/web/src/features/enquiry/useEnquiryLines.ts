'use client';

import { useMounted } from '@/lib/useMounted';
import type { EnquiryLine } from '@/store/site/enquiry.slice';
import { useSiteSelector } from '@/store/site/hooks';

const NONE: EnquiryLine[] = [];

/**
 * The visitor's enquiry list as saved on this device. The server knows nothing
 * about it, so until the page has hydrated it reads as empty; this keeps the
 * server HTML and the first browser render identical.
 */
export function useEnquiryLines(): { lines: EnquiryLine[]; ready: boolean } {
  const mounted = useMounted();
  const lines = useSiteSelector((s) => s.enquiryList.lines);
  const restored = useSiteSelector((s) => s.enquiryList.hydrated);
  return { lines: mounted ? lines : NONE, ready: mounted && restored };
}
