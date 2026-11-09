import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope, Media, PageMeta } from '@/types/api';

export interface MediaListArgs {
  page: number;
  limit: number;
  type?: Media['type'];
  status?: Media['status'];
  q?: string;
}
export interface MediaList {
  items: Media[];
  meta: PageMeta;
}

/**
 * Uploading is not an RTK Query endpoint: it needs byte-level progress, which
 * fetch cannot report. See features/admin/media/uploadMedia.ts; it invalidates
 * the 'Media' tag when a file has been accepted.
 */
export const mediaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listMedia: build.query<MediaList, MediaListArgs>({
      query: (params) => ({ url: '/admin/media', params }),
      transformResponse: (res: ApiEnvelope<Media[]>) => ({ items: res.data, meta: res.meta as PageMeta }),
      providesTags: (result) => [
        { type: 'Media', id: 'LIST' },
        ...(result?.items ?? []).map((m) => ({ type: 'Media' as const, id: m.id })),
      ],
    }),

    /** Polled while a file is still processing. */
    getMedia: build.query<Media, string>({
      query: (id) => `/admin/media/${id}`,
      transformResponse: (res: ApiEnvelope<Media>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Media', id }],
    }),

    retryMedia: build.mutation<Media, string>({
      query: (id) => ({ url: `/admin/media/${id}/retry`, method: 'POST' }),
      transformResponse: (res: ApiEnvelope<Media>) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: 'Media', id }, { type: 'Media', id: 'LIST' }],
    }),

    /** Fails with 409 and a readable message while the file is used on the website. */
    deleteMedia: build.mutation<null, string>({
      query: (id) => ({ url: `/admin/media/${id}`, method: 'DELETE' }),
      transformResponse: () => null,
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),
  }),
});

export const {
  useListMediaQuery,
  useGetMediaQuery,
  useLazyGetMediaQuery,
  useRetryMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
