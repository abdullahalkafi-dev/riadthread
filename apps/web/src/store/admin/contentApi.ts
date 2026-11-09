import type { z } from 'zod';
import type { pageInput } from '@riad/shared';
import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope, BlockKey, PageContent } from '@/types/api';

export interface ContentBlockRow {
  key: BlockKey;
  visible: boolean;
  data: Record<string, unknown>;
  updatedAt: string | null;
}
export interface HomeSection {
  key: string;
  visible: boolean;
}
export type PageBody = z.input<typeof pageInput>;

const unwrap = <T>(res: ApiEnvelope<T>) => res.data;

export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBlocks: build.query<ContentBlockRow[], void>({
      query: () => '/admin/content/blocks',
      transformResponse: unwrap<ContentBlockRow[]>,
      providesTags: [{ type: 'Content', id: 'BLOCKS' }],
    }),

    saveBlock: build.mutation<ContentBlockRow, { key: BlockKey; visible?: boolean; data: Record<string, unknown> }>({
      query: ({ key, ...body }) => ({ url: `/admin/content/blocks/${key}`, method: 'PUT', body }),
      transformResponse: unwrap<ContentBlockRow>,
      invalidatesTags: [{ type: 'Content', id: 'BLOCKS' }, 'Site'],
    }),

    getLayout: build.query<HomeSection[], void>({
      query: () => '/admin/content/layout',
      transformResponse: unwrap<HomeSection[]>,
      providesTags: [{ type: 'Content', id: 'LAYOUT' }],
    }),

    saveLayout: build.mutation<HomeSection[], HomeSection[]>({
      query: (sections) => ({ url: '/admin/content/layout', method: 'PUT', body: { sections } }),
      transformResponse: unwrap<HomeSection[]>,
      invalidatesTags: [{ type: 'Content', id: 'LAYOUT' }, 'Site'],
    }),

    getPage: build.query<PageContent, string>({
      query: (key) => `/admin/content/pages/${key}`,
      transformResponse: unwrap<PageContent>,
      providesTags: (_r, _e, key) => [{ type: 'Content', id: `PAGE:${key}` }],
    }),

    savePage: build.mutation<PageContent, { key: string; body: PageBody }>({
      query: ({ key, body }) => ({ url: `/admin/content/pages/${key}`, method: 'PUT', body }),
      transformResponse: unwrap<PageContent>,
      invalidatesTags: (_r, _e, { key }) => [{ type: 'Content', id: `PAGE:${key}` }, 'Site'],
    }),
  }),
});

export const {
  useListBlocksQuery,
  useSaveBlockMutation,
  useGetLayoutQuery,
  useSaveLayoutMutation,
  useGetPageQuery,
  useSavePageMutation,
} = contentApi;
