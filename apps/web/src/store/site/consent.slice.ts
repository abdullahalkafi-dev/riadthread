import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * The visitor's tracking choice. Nothing is recorded, and no visitor id exists,
 * until they accept. The choice itself is kept in localStorage (not a cookie),
 * so it also survives Safari's cookie limits.
 */
export type ConsentStatus = 'unknown' | 'accepted' | 'declined';

interface ConsentState {
  status: ConsentStatus;
  /** Anonymous ids, created only after the visitor accepts. */
  visitorId: string | null;
  sessionId: string | null;
  policyVersion: string;
  hydrated: boolean;
}

export const POLICY_VERSION = '2026-11';

const initialState: ConsentState = {
  status: 'unknown',
  visitorId: null,
  sessionId: null,
  policyVersion: POLICY_VERSION,
  hydrated: false,
};

const slice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    hydrateConsent(state, action: PayloadAction<Partial<ConsentState>>) {
      Object.assign(state, action.payload, { hydrated: true });
    },
    accept(state, action: PayloadAction<{ visitorId: string; sessionId: string }>) {
      state.status = 'accepted';
      state.visitorId = action.payload.visitorId;
      state.sessionId = action.payload.sessionId;
      state.policyVersion = POLICY_VERSION;
    },
    decline(state) {
      state.status = 'declined';
      state.visitorId = null;
      state.sessionId = null;
    },
  },
});

export const { hydrateConsent, accept, decline } = slice.actions;
export const consentReducer = slice.reducer;
