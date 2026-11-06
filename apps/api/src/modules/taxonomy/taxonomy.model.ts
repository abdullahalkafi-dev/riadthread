import { model, Schema, type Model, type Types } from 'mongoose';

/** Categories and collections have the same shape, so they share one definition. */
function taxonomySchema() {
  return new Schema(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true },
      description: { type: String, default: '' },
      imageMediaId: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      showOnHome: { type: Boolean, default: false },
    },
    { timestamps: true },
  );
}

export interface TaxonomyDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  imageMediaId: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  showOnHome: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Category = model('Category', taxonomySchema()) as unknown as Model<TaxonomyDoc>;
export const Collection = model('Collection', taxonomySchema()) as unknown as Model<TaxonomyDoc>;

export type TaxonomyKind = 'category' | 'collection';
