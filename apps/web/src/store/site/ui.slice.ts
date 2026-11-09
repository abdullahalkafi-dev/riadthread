import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Side panels of the public site. Only one is open at a time. */
export type Drawer = 'menu' | 'search' | 'enquiry' | 'quickView' | 'quickEnquiry' | null;

interface UiState {
  drawer: Drawer;
  /** Slug of the product shown in the quick view panel. */
  quickViewSlug: string | null;
  toast: { id: number; message: string } | null;
}

const initialState: UiState = { drawer: null, quickViewSlug: null, toast: null };

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openDrawer(state, action: PayloadAction<Exclude<Drawer, null>>) {
      state.drawer = action.payload;
    },
    openQuickView(state, action: PayloadAction<string>) {
      state.drawer = 'quickView';
      state.quickViewSlug = action.payload;
    },
    closeDrawer(state) {
      state.drawer = null;
    },
    showToast(state, action: PayloadAction<string>) {
      state.toast = { id: Date.now(), message: action.payload };
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { openDrawer, openQuickView, closeDrawer, showToast, clearToast } = slice.actions;
export const uiReducer = slice.reducer;
