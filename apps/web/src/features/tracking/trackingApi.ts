import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope, PublicSettings } from '@/types/api';
import type { Attribution } from './attribution';
import type { QueuedEvent } from './events';

export interface EventBatch {
  consent: true;
  policyVersion: string;
  visitorId: string;
  sessionId: string;
  events: QueuedEvent[];
  attribution?: Attribution;
  device?: { type: 'mobile' | 'tablet' | 'desktop'; browser: string; os: string; viewport: string };
}

export const trackingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Business settings, including whether the consent banner and journey are switched on. */
    getTrackingSettings: build.query<PublicSettings, void>({
      query: () => '/site',
      transformResponse: (res: ApiEnvelope<{ settings: PublicSettings }>) => res.data.settings,
    }),
    sendEvents: build.mutation<{ accepted: number }, EventBatch>({
      query: (body) => ({ url: '/tracking/events', method: 'POST', body }),
      transformResponse: (res: ApiEnvelope<{ accepted: number }>) => res.data,
    }),
  }),
});

export const { useGetTrackingSettingsQuery, useSendEventsMutation } = trackingApi;
