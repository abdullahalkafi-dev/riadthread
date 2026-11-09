import type { LoginInput } from '@riad/shared';
import type { AdminUser, ApiEnvelope } from '@/types/api';
import { baseApi } from '../baseApi';

type UserEnvelope = ApiEnvelope<{ user: AdminUser }>;

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** The signed-in admin. A 401 here (after the single refresh attempt) means "send to login". */
    me: build.query<AdminUser, void>({
      query: () => '/auth/me',
      transformResponse: (res: UserEnvelope) => res.data.user,
      providesTags: ['Me'],
    }),
    login: build.mutation<AdminUser, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (res: UserEnvelope) => res.data.user,
      invalidatesTags: ['Me'],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      // Drop every cached admin response so the next person never sees stale data.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
  }),
});

export const { useMeQuery, useLoginMutation, useLogoutMutation } = authApi;
