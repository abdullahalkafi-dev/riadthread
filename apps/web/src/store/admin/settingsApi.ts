import type { z } from 'zod';
import type { settingsInput } from '@riad/shared';
import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope } from '@/types/api';

/** The full settings document, as the dashboard edits it. */
export type AdminSettings = z.output<typeof settingsInput> & { updatedAt?: string };

const unwrap = <T>(res: ApiEnvelope<T>) => res.data;

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<AdminSettings, void>({
      query: () => '/admin/settings',
      transformResponse: unwrap<AdminSettings>,
      providesTags: ['Settings'],
    }),

    saveSettings: build.mutation<AdminSettings, z.input<typeof settingsInput>>({
      query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
      transformResponse: unwrap<AdminSettings>,
      invalidatesTags: ['Settings', 'Site'],
    }),
  }),
});

export const { useGetSettingsQuery, useSaveSettingsMutation } = settingsApi;
