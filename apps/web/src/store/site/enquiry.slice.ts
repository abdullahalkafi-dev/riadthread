import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** One line in the visitor's enquiry list: a product, a colour and quantities per size. */
export interface EnquiryLine {
  /** Unique per product + colour, so adding the same one again merges quantities. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  code: string;
  colour: string | null;
  thumb: string | null;
  moq: number;
  sizes: Array<{ label: string; qty: number }>;
}

interface EnquiryListState {
  lines: EnquiryLine[];
  /** True once the saved list has been read from the browser. */
  hydrated: boolean;
}

const initialState: EnquiryListState = { lines: [], hydrated: false };

export const lineKey = (productId: string, colour: string | null) => `${productId}:${colour ?? ''}`;
export const lineQty = (line: EnquiryLine) => line.sizes.reduce((n, s) => n + s.qty, 0);

const slice = createSlice({
  name: 'enquiryList',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<EnquiryLine[]>) {
      state.lines = action.payload;
      state.hydrated = true;
    },
    /** Adds a line, or adds quantities to the existing line for the same product and colour. */
    addLine(state, action: PayloadAction<EnquiryLine>) {
      const existing = state.lines.find((l) => l.key === action.payload.key);
      if (!existing) {
        state.lines.push(action.payload);
        return;
      }
      for (const s of action.payload.sizes) {
        const hit = existing.sizes.find((x) => x.label === s.label);
        if (hit) hit.qty += s.qty;
        else existing.sizes.push({ ...s });
      }
    },
    setSizeQty(state, action: PayloadAction<{ key: string; label: string; qty: number }>) {
      const line = state.lines.find((l) => l.key === action.payload.key);
      if (!line) return;
      const size = line.sizes.find((s) => s.label === action.payload.label);
      if (size) size.qty = Math.max(0, Math.floor(action.payload.qty));
    },
    removeLine(state, action: PayloadAction<string>) {
      state.lines = state.lines.filter((l) => l.key !== action.payload);
    },
    clearList(state) {
      state.lines = [];
    },
  },
});

export const { hydrate, addLine, setSizeQty, removeLine, clearList } = slice.actions;
export const enquiryListReducer = slice.reducer;
