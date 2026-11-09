import type { ApiEnvelope, Overview } from '@/types/api';
import { baseApi } from '../baseApi';

export const overviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** One aggregated payload for the Overview screen; also feeds the sidebar's "new" count. */
    getOverview: build.query<Overview, void>({
      query: () => '/admin/analytics/overview',
      transformResponse: (res: ApiEnvelope<Overview>) => res.data,
      providesTags: ['Overview'],
    }),
  }),
});

export const { useGetOverviewQuery } = overviewApi;
