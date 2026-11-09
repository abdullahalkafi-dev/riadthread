import type { z } from 'zod';
import type { taxonomyInput, taxonomyUpdate } from '@riad/shared';
import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope, Taxonomy } from '@/types/api';

/** Categories and collections share one shape and one set of endpoints. */
export type TaxonomyKind = 'categories' | 'collections';
export type TaxonomyCreateBody = z.input<typeof taxonomyInput>;
export type TaxonomyPatchBody = z.input<typeof taxonomyUpdate>;

const tagFor = (kind: TaxonomyKind) => (kind === 'categories' ? ('Category' as const) : ('Collection' as const));
const unwrap = <T>(res: ApiEnvelope<T>) => res.data;

export const taxonomyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTaxonomy: build.query<Taxonomy[], TaxonomyKind>({
      query: (kind) => `/admin/${kind}`,
      transformResponse: unwrap<Taxonomy[]>,
      providesTags: (_r, _e, kind) => [tagFor(kind)],
    }),

    createTaxonomy: build.mutation<Taxonomy, { kind: TaxonomyKind; body: TaxonomyCreateBody }>({
      query: ({ kind, body }) => ({ url: `/admin/${kind}`, method: 'POST', body }),
      transformResponse: unwrap<Taxonomy>,
      invalidatesTags: (_r, _e, { kind }) => [tagFor(kind)],
    }),

    updateTaxonomy: build.mutation<Taxonomy, { kind: TaxonomyKind; id: string; body: TaxonomyPatchBody }>({
      query: ({ kind, id, body }) => ({ url: `/admin/${kind}/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<Taxonomy>,
      invalidatesTags: (_r, _e, { kind }) => [tagFor(kind)],
    }),

    /** Fails with 409 and a readable message while products still use it. */
    deleteTaxonomy: build.mutation<null, { kind: TaxonomyKind; id: string }>({
      query: ({ kind, id }) => ({ url: `/admin/${kind}/${id}`, method: 'DELETE' }),
      transformResponse: () => null,
      invalidatesTags: (_r, _e, { kind }) => [tagFor(kind)],
    }),
  }),
});

export const {
  useListTaxonomyQuery,
  useCreateTaxonomyMutation,
  useUpdateTaxonomyMutation,
  useDeleteTaxonomyMutation,
} = taxonomyApi;
