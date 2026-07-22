import type { Collection, CollectionCategory } from '../types/collection';
import collectionRecords from './collections.json';

type GeneratedData<T> = {
  data: T[];
};

type CollectionRecord = Omit<
  Collection,
  | 'category'
  | 'title'
  | 'galleryImages'
  | 'popularIdeas'
  | 'customizationNote'
  | 'active'
> & {
  businessArea: CollectionCategory | 'Bakery' | 'Sewing';
  name: string;
  title?: string;
  status: 'Active' | 'Inactive';
  galleryCaptions?: string[];
  popularIdeas?: string[];
  customizationNote?: string;
};

const businessAreaMap: Record<CollectionRecord['businessArea'], CollectionCategory> = {
  Bakery: 'bakery',
  Sewing: 'sewing',
  bakery: 'bakery',
  sewing: 'sewing',
};

const toCollection = (record: CollectionRecord): Collection => {
  const category = businessAreaMap[record.businessArea];
  const title = record.title || record.name;
  const galleryCaptions = record.galleryCaptions || [];

  return {
    ...record,
    category,
    businessArea: category,
    title,
    active: record.status === 'Active',
    galleryImages: galleryCaptions.map((caption, index) => ({
      alt: `${title}: ${caption}`,
      caption,
      src: null,
      tone: index % 2 ? record.imageTone : 'cream',
    })),
    popularIdeas: record.popularIdeas || [],
    customizationNote: record.customizationNote || '',
  };
};

/** Collection data loaded from JSON to support future spreadsheet-backed imports. */
const rawCollectionRecords = Array.isArray(collectionRecords)
  ? collectionRecords
  : (collectionRecords as GeneratedData<CollectionRecord>).data;

export const collections: readonly Collection[] = (rawCollectionRecords as CollectionRecord[])
  .map(toCollection);

const orderedActive = (items: readonly Collection[]): Collection[] =>
  items
    .filter((collection) => collection.active)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

export const getAllCollections = (): Collection[] => orderedActive(collections);

export const getCollectionsByBusinessArea = (
  area: CollectionCategory,
): Collection[] =>
  orderedActive(
    collections.filter((collection) => collection.category === area),
  );

export const getCollectionById = (id: string): Collection | undefined =>
  collections.find((collection) => collection.id === id);

export const getFeaturedCollections = (): Collection[] =>
  orderedActive(collections.filter((collection) => collection.featured));

export const getBakeryCollections = (): Collection[] =>
  getCollectionsByBusinessArea('bakery');

export const getSewingCollections = (): Collection[] =>
  getCollectionsByBusinessArea('sewing');

export const getCollectionsByCategory = (
  category: CollectionCategory,
): Collection[] => getCollectionsByBusinessArea(category);
