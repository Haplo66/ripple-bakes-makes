import type { Product } from '../types/product';

/** Seed data for products across Bakery and Sewing collections. */
export const products: readonly Product[] = [
  {
    id: 'bakery-cakes-birthday-cake',
    collectionId: 'bakery-cakes',
    category: 'cake',
    businessArea: 'bakery',
    slug: 'birthday-cake',
    title: 'Birthday Cake',
    subtitle: 'Classic layers made to celebrate.',
    shortDescription:
      'Customizable layer cake with your choice of flavor, frosting, and message.',
    description:
      'Our signature birthday cake features light, tender layers paired with rich buttercream. Crafted in small batches and finished with custom details for your special day.',
    image: null,
    imageTone: 'cream',
    status: 'available',
    active: true,
    featured: true,
    displayOrder: 1,
    formId: 'birthday-cake-form',
    priceLabel: 'From $45',
  },
  {
    id: 'bakery-cakes-celebration-cake',
    collectionId: 'bakery-cakes',
    category: 'cake',
    businessArea: 'bakery',
    slug: 'celebration-cake',
    title: 'Celebration Cake',
    subtitle: 'An elegant centerpiece for any gathering.',
    shortDescription:
      'Multi-tiered or custom finished cakes designed for anniversaries, showers, and milestones.',
    description:
      'A beautifully styled cake tailored to your gathering. Choose from our curated flavor pairings and decorative finishes.',
    image: null,
    imageTone: 'rose',
    status: 'available',
    active: true,
    featured: false,
    displayOrder: 2,
    formId: 'celebration-cake-form',
    priceLabel: 'From $65',
  },
  {
    id: 'sewing-custom-sewing-adult-t-shirt',
    collectionId: 'sewing-custom-sewing',
    category: 'shirt',
    businessArea: 'sewing',
    slug: 'adult-t-shirt',
    title: 'Adult T-Shirt',
    subtitle: 'Tailored fit in premium soft fabric.',
    shortDescription:
      'Made-to-order t-shirt styled to your measurements and preferred fabric selection.',
    description:
      'A comfortable, durable everyday tee crafted from high-quality jersey knit. Customized for sleeve length, neck style, and fit.',
    image: null,
    imageTone: 'sage',
    status: 'available',
    active: true,
    featured: true,
    displayOrder: 1,
    formId: 'adult-t-shirt-form',
    priceLabel: 'From $38',
  },
  {
    id: 'sewing-custom-sewing-custom-hoodie',
    collectionId: 'sewing-custom-sewing',
    category: 'shirt',
    businessArea: 'sewing',
    slug: 'custom-hoodie',
    title: 'Custom Hoodie',
    subtitle: 'Cozy, custom-fit fleece pullover.',
    shortDescription:
      'Handmade fleece hoodie built to fit your style with choice of pocket, hood style, and color.',
    description:
      'Warm, breathable fleece sewn to fit comfortably. Features customizable accents including drawstring colors and pocket options.',
    image: null,
    imageTone: 'cocoa',
    status: 'available',
    active: true,
    featured: false,
    displayOrder: 2,
    formId: 'custom-hoodie-form',
    priceLabel: 'From $75',
  },
];

const orderedActive = (items: readonly Product[]): Product[] =>
  items
    .filter((product) => product.active)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Returns all active products sorted by display order. */
export const getAllProducts = (): Product[] => orderedActive(products);

/** Returns active products belonging to a specific collection ID. */
export const getProductsByCollection = (
  collectionId: string,
): Product[] =>
  orderedActive(
    products.filter((product) => product.collectionId === collectionId),
  );

/** Returns an active product matching the slug. */
export const getProductBySlug = (
  slug: string,
): Product | undefined =>
  products.find(
    (product) => product.slug === slug && product.active,
  );

/** Returns an active product matching both collection ID and slug. */
export const getProductByCollectionAndSlug = (
  collectionId: string,
  slug: string,
): Product | undefined =>
  products.find(
    (product) =>
      product.collectionId === collectionId &&
      product.slug === slug &&
      product.active,
  );