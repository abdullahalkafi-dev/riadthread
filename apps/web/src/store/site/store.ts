import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../baseApi';
import { consentReducer } from './consent.slice';
import { enquiryListReducer } from './enquiry.slice';
import { uiReducer } from './ui.slice';

/** A fresh store per request on the server, one per tab in the browser. */
export const makeSiteStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      ui: uiReducer,
      enquiryList: enquiryListReducer,
      consent: consentReducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export type SiteStore = ReturnType<typeof makeSiteStore>;
export type SiteState = ReturnType<SiteStore['getState']>;
export type SiteDispatch = SiteStore['dispatch'];
