import type { z } from 'zod';
import type { productInput, productUpdate } from '@riad/shared';
import { baseApi } from '@/store/baseApi';
import type { AdminProduct, AdminProductRow, ApiEnvelope, PageMeta } from '@/types/api';

/** What the editor sends when it creates a product (schema defaults fill the rest). */
export type ProductCreateBody = z.input<typeof productInput>;
/** PATCH is a true partial: only the fields that changed are sent. */
export type ProductPatchBody = z.input<typeof productUpdate>;
export type ProductStatusAction = 'publish' | 'unpublish' | 'archive';

export interface ProductListArgs {
  page: number;
  limit: number;
  q?: string;
  status?: AdminProduct['status'];
  categoryId?: string;
  collectionId?: string;
}
export interface ProductList {
  items: AdminProductRow[];
  meta: PageMeta;
}

const unwrap = <T>(res: ApiEnvelope<T>) => res.data;

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProducts: build.query<ProductList, ProductListArgs>({
      query: (params) => ({ url: '/admin/products', params }),
      transformResponse: (res: ApiEnvelope<AdminProductRow[]>) => ({ items: res.data, meta: res.meta as PageMeta }),
      providesTags: (result) => [
        { type: 'Product', id: 'LIST' },
        ...(result?.items ?? []).map((p) => ({ type: 'Product' as const, id: p.id })),
      ],
    }),

    getProduct: build.query<AdminProduct, string>({
      query: (id) => `/admin/products/${id}`,
      transformResponse: unwrap<AdminProduct>,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),

    createProduct: build.mutation<AdminProduct, ProductCreateBody>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      transformResponse: unwrap<AdminProduct>,
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Category', 'Collection', 'Overview'],
    }),

    updateProduct: build.mutation<AdminProduct, { id: string; body: ProductPatchBody }>({
      query: ({ id, body }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<AdminProduct>,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }, 'Category', 'Collection'],
    }),

    setProductStatus: build.mutation<AdminProduct, { id: string; action: ProductStatusAction }>({
      query: ({ id, action }) => ({ url: `/admin/products/${id}/${action}`, method: 'POST' }),
      transformResponse: unwrap<AdminProduct>,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }, 'Category', 'Collection'],
    }),

    duplicateProduct: build.mutation<AdminProduct, string>({
      query: (id) => ({ url: `/admin/products/${id}/duplicate`, method: 'POST' }),
      transformResponse: unwrap<AdminProduct>,
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Category', 'Collection'],
    }),

    deleteProduct: build.mutation<null, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
      transformResponse: () => null,
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Category', 'Collection', 'Overview'],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSetProductStatusMutation,
  useDuplicateProductMutation,
  useDeleteProductMutation,
} = productsApi;
