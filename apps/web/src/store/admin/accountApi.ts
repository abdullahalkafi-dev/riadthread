import type { AdminUser, ApiEnvelope } from '@/types/api';
import { baseApi } from '../baseApi';

export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateAccount: build.mutation<AdminUser, { name?: string; email?: string }>({
      query: (body) => ({ url: '/admin/account', method: 'PATCH', body }),
      transformResponse: (res: ApiEnvelope<{ user: AdminUser }>) => res.data.user,
      invalidatesTags: ['Me'],
    }),
    /** Changing the password signs out every other device; this session stays valid. */
    changePassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/admin/account/password', method: 'POST', body }),
    }),
  }),
});

export const { useUpdateAccountMutation, useChangePasswordMutation } = accountApi;
