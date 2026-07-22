/** Business areas currently supported by the collection system. */
export type CollectionCategory = 'bakery' | 'sewing';

/** Existing CSS placeholder treatments, kept with content for a stable UI. */
export type CollectionImageTone = 'wheat' | 'rose' | 'cream' | 'sage' | 'cocoa';

/** A gallery entry that can render a local image or the current styled placeholder. */
export interface CollectionGalleryImage {
  alt: string;
  caption: string;
  src: string | null;
  tone: CollectionImageTone;
}

/** Reusable content record for bakery, sewing, and future collections. */
export interface Collection {
  id: string;
  category: CollectionCategory;
  /** Sheet-friendly business area alias. */
  businessArea?: CollectionCategory;
  slug: string;
  title: string;
  /** Sheet-friendly collection name. */
  name?: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  /** Folder that contains collection imagery in future asset-backed imports. */
  imageFolder?: string;
  /** All collection image paths. */
  images?: string[];
  heroImage: string | null;
  galleryImages: CollectionGalleryImage[];
  popularIdeas: string[];
  customizationNote: string;
  featured: boolean;
  active: boolean;
  /** Sheet-friendly visibility or lifecycle label. */
  status?: 'Active' | 'Inactive';
  displayOrder: number;
  imageTone: CollectionImageTone;
  /** Optional label reserved for launches such as “Coming soon” or “Seasonal”. */
  badge?: string;
}
