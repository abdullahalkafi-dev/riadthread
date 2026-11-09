import type { FieldErrors, ProductDraft, ProductTab } from '../formModel';

type DraftPatch = Partial<ProductDraft>;

/** What every tab of the product editor receives. */
export interface TabProps {
  draft: ProductDraft;
  /**
   * Merge changes into the draft. Pass a function when the change builds on the
   * current draft and may run later (an upload finishing), so nothing is overwritten.
   */
  update: (patch: DraftPatch | ((current: ProductDraft) => DraftPatch)) => void;
  /** Messages from validation or from the API, keyed by field path (e.g. "wholesale.moq"). */
  errors: FieldErrors;
  /** Jump to another tab (used by the colour list to open that colour's photos). */
  goTo?: (tab: ProductTab, colourId?: string) => void;
}
