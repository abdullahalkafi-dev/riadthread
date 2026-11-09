import { enquiryQuery, type EnquiryListArgs } from '@/store/admin/enquiriesApi';

const fetchCsv = (args: EnquiryListArgs) =>
  fetch(`/api/v1/admin/enquiries/export.csv${enquiryQuery(args)}`, { credentials: 'include' });

/**
 * Downloads the current filter as a CSV file. It is a plain fetch (the response
 * is a file, not JSON), so it retries once after refreshing the session itself.
 */
export async function downloadEnquiriesCsv(filters: Pick<EnquiryListArgs, 'status' | 'score' | 'q' | 'sort'>): Promise<void> {
  let res = await fetchCsv(filters);
  if (res.status === 401) {
    const refreshed = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'x-riad-csrf': '1' } });
    if (refreshed.ok) res = await fetchCsv(filters);
  }
  if (!res.ok) throw new Error(res.status === 401 ? 'Your session has expired. Please sign in again' : 'The export could not be created');

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
