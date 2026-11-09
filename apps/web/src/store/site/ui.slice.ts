import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Side panels of the public site. Only one is open at a time. */
export type Drawer = 'menu' | 'search' | 'enquiry' | 'quickView' | 'quickEnquiry' | null;

/** The product a visitor is asking about in the "Ask about this style" panel. */
export interface QuickEnquiryProduct {
  id: string;
  slug: string;
  name: string;
  code: string;
  colour: string | null;
}

interface UiState {
  drawer: Drawer;
  /** Slug of the product shown in the quick view panel. */
  quickViewSlug: string | null;
  quickEnquiryProduct: QuickEnquiryProduct | null;
  toast: { id: number; message: string } | null;
}

const initialState: UiState = { drawer: null, quickViewSlug: null, quickEnquiryProduct: null, toast: null };

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
    openQuickEnquiry(state, action: PayloadAction<QuickEnquiryProduct>) {
      state.drawer = 'quickEnquiry';
      state.quickEnquiryProduct = action.payload;
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

export const { openDrawer, openQuickView, openQuickEnquiry, closeDrawer, showToast, clearToast } = slice.actions;
export const uiReducer = slice.reducer;
