import { model, Schema, type Types } from 'mongoose';
import {
  BADGES,
  BELOW_MOQ,
  COLOUR_FAMILIES,
  PRICE_MODES,
  PRODUCT_STATUSES,
  STOCK_STATUSES,
} from '@riad/shared';

/** Colours are embedded: they are always read together with the product. */
const colourSchema = new Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
  family: { type: String, enum: COLOUR_FAMILIES, required: true },
  sku: { type: String, default: '' },
  stock: { type: String, enum: STOCK_STATUSES, default: 'In stock' },
  swatchMediaId: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
});

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true },
    badge: { type: String, enum: BADGES, default: '' },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'draft' },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },

    summary: { type: String, default: '' },
    descriptionHtml: { type: String, default: '' },
    specs: {
      fabric: { type: String, default: '' },
      fabricType: { type: String, default: '' },
      origin: { type: String, default: 'Morocco' },
      care: { type: String, default: '' },
      fit: { type: String, default: '' },
    },
    wholesale: {
      moq: { type: Number, default: 12 },
      packText: { type: String, default: '' },
      packSize: { type: Number, default: 6 },
      priceMode: { type: String, enum: PRICE_MODES, default: 'hidden' },
      belowMoq: { type: String, enum: BELOW_MOQ, default: 'allow' },
      tiers: { type: [{ _id: false, range: String, label: String }], default: [] },
    },

    colours: { type: [colourSchema], default: [] },
    sizes: { type: [{ _id: false, label: { type: String, required: true }, available: { type: Boolean, default: true } }], default: [] },
    sizeGuide: { type: [{ _id: false, size: String, chest: String, length: String, uk: String }], default: [] },

    /** Ordered. The first entry is the cover, the second is the card hover image. */
    media: {
      type: [
        {
          _id: false,
          mediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
          colourId: { type: Schema.Types.ObjectId, default: null },
          alt: { type: String, default: '' },
        },
      ],
      default: [],
    },

    overrides: {
      dispatch: { type: String, default: '' },
      samples: { type: String, default: '' },
      shipText: { type: String, default: '' },
    },
    relatedIds: { type: [Schema.Types.ObjectId], default: [] },
    seo: { title: { type: String, default: '' }, description: { type: String, default: '' } },

    publishedAt: { type: Date, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

productSchema.index({ status: 1, categoryId: 1, order: 1 });
productSchema.index({ status: 1, collectionId: 1, order: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, 'colours.family': 1 });
productSchema.index({ status: 1, 'specs.fabricType': 1 });
productSchema.index({ 'media.mediaId': 1 });
productSchema.index({ 'colours.swatchMediaId': 1 });

/** Plain shape of a stored product (what .lean() returns). */
export interface ProductDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  code: string;
  categoryId: Types.ObjectId;
  collectionId: Types.ObjectId;
  badge: string;
  status: 'draft' | 'published' | 'archived';
  order: number;
  featured: boolean;
  newArrival: boolean;
  summary: string;
  descriptionHtml: string;
  specs: { fabric: string; fabricType: string; origin: string; care: string; fit: string };
  wholesale: {
    moq: number;
    packText: string;
    packSize: number;
    priceMode: 'hidden' | 'from' | 'tiers';
    belowMoq: 'allow' | 'block';
    tiers: { range: string; label: string }[];
  };
  colours: {
    _id: Types.ObjectId;
    name: string;
    hex: string;
    family: string;
    sku: string;
    stock: string;
    swatchMediaId: Types.ObjectId | null;
  }[];
  sizes: { label: string; available: boolean }[];
  sizeGuide: { size: string; chest: string; length: string; uk: string }[];
  media: { mediaId: Types.ObjectId; colourId: Types.ObjectId | null; alt: string }[];
  overrides: { dispatch: string; samples: string; shipText: string };
  relatedIds: Types.ObjectId[];
  seo: { title: string; description: string };
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export const Product = model('Product', productSchema);
