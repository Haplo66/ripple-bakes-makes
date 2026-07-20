import type { Collection, CollectionCategory } from '../types/collection';

type CollectionSeed = Omit<Collection, 'galleryImages' | 'popularIdeas' | 'customizationNote'> & {
  galleryCaptions: string[];
  popularIdeas: string[];
  customizationNote: string;
};

const makeCollection = ({ galleryCaptions, imageTone, ...collection }: CollectionSeed): Collection => ({
  ...collection,
  imageTone,
  galleryImages: galleryCaptions.map((caption, index) => ({
    alt: `${collection.title}: ${caption}`,
    caption,
    src: null,
    tone: index % 2 ? imageTone : 'cream',
  })),
});

/** Canonical content for every current and future collection page. */
export const collections: readonly Collection[] = [
  makeCollection({ id:'bakery-breads', category:'bakery', slug:'breads', title:'Breads', subtitle:'Slow-risen and table-ready.', shortDescription:'Slow-risen loaves, focaccia, and seasonal bakes made for the table.', description:'From a crusty loaf for dinner to a tender focaccia for sharing, each bake is made in small batches with time, care, and uncomplicated ingredients.', heroImage:null, featured:true, active:true, displayOrder:1, imageTone:'wheat', galleryCaptions:['Fresh morning loaves','Focaccia for the table','Seasonal bakes'], popularIdeas:['Weekly bread box','Dinner-party focaccia','Seasonal loaf'], customizationNote:'Ask about flavours, quantities, and a bake that suits your table.' }),
  makeCollection({ id:'bakery-cookies', category:'bakery', slug:'cookies', title:'Cookies', subtitle:'Buttery favourites to share.', shortDescription:'Buttery classics and playful seasonal boxes for gifting or sharing.', description:'Comforting classics, seasonal details, and gift-ready boxes make these cookies an easy way to share something sweet.', heroImage:null, featured:true, active:true, displayOrder:2, imageTone:'rose', galleryCaptions:['Classic cookie box','Seasonal sweet treats','A thoughtful gift'], popularIdeas:['Celebration cookie box','Teacher thank-you gift','Holiday assortment'], customizationNote:'Choose your favourites, add a note, or build a box for your occasion.' }),
  makeCollection({ id:'bakery-cakes', category:'bakery', slug:'cakes', title:'Cakes', subtitle:'Made for celebrations.', shortDescription:'Thoughtful celebration cakes with beautiful, unfussy finishes.', description:'Celebration cakes should feel special without feeling overdone. Each is made to bring a delicious, personal touch to your gathering.', heroImage:null, featured:true, active:true, displayOrder:3, imageTone:'cream', galleryCaptions:['A soft, simple finish','Cake for a gathering','Personal celebration details'], popularIdeas:['Birthday cake','Small gathering cake','Seasonal celebration'], customizationNote:'Share your date, serving size, and a little about the celebration.' }),
  makeCollection({ id:'bakery-custom-orders', category:'bakery', slug:'custom-orders', title:'Custom orders', subtitle:'Made for your occasion.', shortDescription:'A little something made exactly for your occasion.', description:'A custom order starts with the occasion and ends with a thoughtful detail that makes it feel like yours.', heroImage:null, featured:true, active:true, displayOrder:4, imageTone:'sage', galleryCaptions:['A custom bakery moment','Thoughtful finishing touches','Made for sharing'], popularIdeas:['Dessert table addition','Host gift','Seasonal gathering'], customizationNote:'Tell us the occasion and we will explore a delicious fit.' }),
  makeCollection({ id:'sewing-custom-sewing', category:'sewing', slug:'custom-sewing', title:'Custom sewing', subtitle:'Made to fit your life.', shortDescription:'Made-to-order pieces that fit your life and your style.', description:'Thoughtfully sewn pieces begin with a useful idea, a lovely fabric, and attention to the small details that make something feel personal.', heroImage:null, featured:true, active:true, displayOrder:1, imageTone:'sage', galleryCaptions:['A considered fabric detail','Made for every day','Finished by hand'], popularIdeas:['Custom keepsake','Home textile','Practical everyday piece'], customizationNote:'Bring a fabric, an idea, or simply a need — we will find the right direction.' }),
  makeCollection({ id:'sewing-repairs-refreshes', category:'sewing', slug:'repairs-refreshes', title:'Repairs & refreshes', subtitle:'For pieces worth keeping.', shortDescription:'Careful mending for the pieces worth keeping.', description:'A favourite item can often have more life in it. Careful repair and refresh work helps useful, meaningful pieces stay in your everyday rotation.', heroImage:null, featured:true, active:true, displayOrder:2, imageTone:'wheat', galleryCaptions:['A careful repair','Fresh detail, familiar piece','Ready for another season'], popularIdeas:['Visible mending','Hem and fit refresh','Keepsake repair'], customizationNote:'Share a photo and a short note about the repair you have in mind.' }),
  makeCollection({ id:'sewing-gifts', category:'sewing', slug:'gifts', title:'Gifts', subtitle:'Personal and made to remember.', shortDescription:'Personalized fabric creations made to be remembered.', description:'The best gifts feel considered. These handmade pieces are created to mark a person, a milestone, or a simple moment of care.', heroImage:null, featured:true, active:true, displayOrder:3, imageTone:'rose', galleryCaptions:['A gift with a story','Personal finishing touch','Ready to be remembered'], popularIdeas:['Baby keepsake','Personalized gift','Host or teacher gift'], customizationNote:'Tell us who it is for and what you would love the piece to say.' }),
  makeCollection({ id:'sewing-seasonal-crafts', category:'sewing', slug:'seasonal-crafts', title:'Seasonal crafts', subtitle:'Handmade warmth for the season.', shortDescription:'Small batches of handmade warmth for every season.', description:'Small seasonal details make a home and a gathering feel especially welcoming. These pieces are made in limited, thoughtful batches.', heroImage:null, featured:true, active:true, displayOrder:4, imageTone:'cocoa', galleryCaptions:['A seasonal detail','Handmade for the home','A little warmth'], popularIdeas:['Holiday décor','Seasonal table detail','Limited-run gift'], customizationNote:'Ask what is currently in season or about a small custom batch.' }),
];

const orderedActive = (items: readonly Collection[]) => items.filter((collection) => collection.active).slice().sort((a, b) => a.displayOrder - b.displayOrder);
export const getAllCollections = (): Collection[] => orderedActive(collections);
export const getBakeryCollections = (): Collection[] => getCollectionsByCategory('bakery');
export const getSewingCollections = (): Collection[] => getCollectionsByCategory('sewing');
export const getCollectionBySlug = (slug: string): Collection | undefined => collections.find((collection) => collection.slug === slug && collection.active);
export const getCollectionsByCategory = (category: CollectionCategory): Collection[] => orderedActive(collections.filter((collection) => collection.category === category));
