import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type ToastTone = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

/** Short messages shown at the bottom of the dashboard after an action. */
const slice = createSlice({
  name: 'toasts',
  initialState: [] as Toast[],
  reducers: {
    pushToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        // Keep the stack short so a burst of saves never covers the page.
        state.push(action.payload);
        if (state.length > 4) state.shift();
      },
      prepare: (message: string, tone: ToastTone = 'success') => ({ payload: { id: nanoid(), message, tone } }),
    },
    dismissToast: (state, action: PayloadAction<string>) => state.filter((t) => t.id !== action.payload),
  },
});

export const { pushToast, dismissToast } = slice.actions;
export const toastReducer = slice.reducer;
