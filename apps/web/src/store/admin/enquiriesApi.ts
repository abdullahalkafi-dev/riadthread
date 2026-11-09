import type { EnquiryStatus } from '@riad/shared';
import type { ApiEnvelope, EnquiryDetail, EnquiryRow, PageMeta } from '@/types/api';
import { baseApi } from '../baseApi';

export interface EnquiryListArgs {
  status?: EnquiryStatus;
  score?: 'hot' | 'warm' | 'cold';
  q?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface EnquiryList {
  items: EnquiryRow[];
  meta: PageMeta;
  /** Number of enquiries per status across the whole database (spam excluded from "All"). */
  statusCounts: Record<string, number>;
}

/** Query string for the list and the CSV export; empty values are left out. */
export function enquiryQuery(args: EnquiryListArgs): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

const LIST_TAG = { type: 'Enquiry', id: 'LIST' } as const;

export const enquiriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listEnquiries: build.query<EnquiryList, EnquiryListArgs>({
      query: (args) => `/admin/enquiries${enquiryQuery(args)}`,
      transformResponse: (res: ApiEnvelope<EnquiryRow[]>): EnquiryList => {
        const { statusCounts, ...meta } = (res.meta ?? {}) as PageMeta & { statusCounts?: Record<string, number> };
        return { items: res.data, meta, statusCounts: statusCounts ?? {} };
      },
      providesTags: (result) => [
        LIST_TAG,
        ...(result?.items ?? []).map((e) => ({ type: 'Enquiry' as const, id: e.id })),
      ],
    }),

    /** Opening an enquiry also marks it as read on the server. */
    getEnquiry: build.query<EnquiryDetail, string>({
      query: (id) => `/admin/enquiries/${id}`,
      transformResponse: (res: ApiEnvelope<EnquiryDetail>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Enquiry', id }],
    }),

    updateStatus: build.mutation<EnquiryDetail, { id: string; status: EnquiryStatus }>({
      query: ({ id, status }) => ({ url: `/admin/enquiries/${id}/status`, method: 'PATCH', body: { status } }),
      transformResponse: (res: ApiEnvelope<EnquiryDetail>) => res.data,
      // Show the new status straight away in every cached list and in the open panel.
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled, getState }) {
        const patches = enquiriesApi.util
          .selectInvalidatedBy(getState(), [LIST_TAG])
          .filter((entry) => entry.endpointName === 'listEnquiries')
          .map((entry) =>
            dispatch(
              enquiriesApi.util.updateQueryData('listEnquiries', entry.originalArgs as EnquiryListArgs, (draft) => {
                const row = draft.items.find((e) => e.id === id);
                if (row) {
                  row.status = status;
                  row.unread = false;
                }
              }),
            ),
          );
        patches.push(
          dispatch(
            enquiriesApi.util.updateQueryData('getEnquiry', id, (draft) => {
              draft.status = status;
            }),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Enquiry', id }, LIST_TAG, 'Overview'],
    }),

    addNote: build.mutation<EnquiryDetail, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: `/admin/enquiries/${id}/notes`, method: 'POST', body: { text } }),
      transformResponse: (res: ApiEnvelope<EnquiryDetail>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Enquiry', id }],
    }),

    /** Pass null to clear the follow-up date. */
    setFollowUp: build.mutation<EnquiryDetail, { id: string; followUpAt: string | null }>({
      query: ({ id, followUpAt }) => ({ url: `/admin/enquiries/${id}/follow-up`, method: 'PATCH', body: { followUpAt } }),
      transformResponse: (res: ApiEnvelope<EnquiryDetail>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Enquiry', id }, LIST_TAG, 'Overview'],
    }),

    retryEmails: build.mutation<{ retried: number }, string>({
      query: (id) => ({ url: `/admin/enquiries/${id}/emails/retry`, method: 'POST' }),
      transformResponse: (res: ApiEnvelope<{ retried: number }>) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: 'Enquiry', id }],
    }),
  }),
});

export const {
  useListEnquiriesQuery,
  useGetEnquiryQuery,
  useUpdateStatusMutation,
  useAddNoteMutation,
  useSetFollowUpMutation,
  useRetryEmailsMutation,
} = enquiriesApi;
