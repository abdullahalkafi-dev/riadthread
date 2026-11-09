import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../baseApi';
import { toastReducer } from './toast.slice';

/**
 * The dashboard's store. Server data lives in the shared RTK Query cache
 * (baseApi); the only local state is the toast stack. Endpoints are injected
 * by the *Api.ts files in this folder, so they must be imported somewhere in
 * the dashboard tree (the hooks they export take care of that).
 */
export const makeAdminStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      toasts: toastReducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export type AdminStore = ReturnType<typeof makeAdminStore>;
export type AdminState = ReturnType<AdminStore['getState']>;
export type AdminDispatch = AdminStore['dispatch'];
