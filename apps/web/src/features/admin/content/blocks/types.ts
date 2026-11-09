import type { ComponentType } from 'react';
import type { BlockData, BlockKey } from '@/types/api';

/** What every block editor receives: its typed value, a way to change it, and field errors. */
export interface BlockEditorProps<V> {
  value: V;
  onChange: (value: V) => void;
  /** Messages from validation, keyed by path inside the block (e.g. "slides.0.title"). */
  errors: Record<string, string>;
}

export interface BlockDef<K extends BlockKey> {
  key: K;
  title: string;
  description: string;
  Editor: ComponentType<BlockEditorProps<BlockData<K>>>;
}

/** Any one of the block definitions. */
export type AnyBlockDef = { [K in BlockKey]: BlockDef<K> }[BlockKey];

/** Keeps each definition's editor and value type in step with its key. */
export const defineBlock = <K extends BlockKey>(def: BlockDef<K>): BlockDef<K> => def;
