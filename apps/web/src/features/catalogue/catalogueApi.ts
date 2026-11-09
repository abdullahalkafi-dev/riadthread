import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope, PageMeta, ProductCard, ProductDetail, ProductFilters, Taxonomy } from '@/types/api';
import { toApiQuery, type ProductListArgs } from './query';

export interface ProductListResult {
  items: ProductCard[];
  meta: PageMeta;
}

/** Public catalogue reads, used for client-side filtering and the quick view panel. */
export const catalogueApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<ProductListResult, ProductListArgs>({
      query: (args) => `/products?${toApiQuery(args)}`,
      transformResponse: (res: ApiEnvelope<ProductCard[]>) => ({ items: res.data, meta: res.meta as PageMeta }),
    }),
    getProductFilters: build.query<ProductFilters, void>({
      query: () => '/products/filters',
      transformResponse: (res: ApiEnvelope<ProductFilters>) => res.data,
    }),
    getProduct: build.query<ProductDetail, string>({
      query: (slug) => `/products/${encodeURIComponent(slug)}`,
      transformResponse: (res: ApiEnvelope<ProductDetail>) => res.data,
    }),
    getPublicCategories: build.query<Taxonomy[], void>({
      query: () => '/categories',
      transformResponse: (res: ApiEnvelope<Taxonomy[]>) => res.data,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductFiltersQuery,
  useGetProductQuery,
  useGetPublicCategoriesQuery,
} = catalogueApi;
