import type { CreateEnquiryInput, LineSheetRequestInput } from '@riad/shared';
import { baseApi } from '@/store/baseApi';
import type { ApiEnvelope } from '@/types/api';

export interface SubmissionResult {
  ref: string;
}

/** Public submissions. Both are safe to retry: the API answers a repeated submission key with the same reference. */
export const enquiryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    submitEnquiry: build.mutation<SubmissionResult, CreateEnquiryInput>({
      query: (body) => ({ url: '/enquiries', method: 'POST', body }),
      transformResponse: (res: ApiEnvelope<SubmissionResult>) => res.data,
    }),
    requestLineSheet: build.mutation<SubmissionResult, LineSheetRequestInput>({
      query: (body) => ({ url: '/line-sheet', method: 'POST', body }),
      transformResponse: (res: ApiEnvelope<SubmissionResult>) => res.data,
    }),
  }),
});

export const { useSubmitEnquiryMutation, useRequestLineSheetMutation } = enquiryApi;
