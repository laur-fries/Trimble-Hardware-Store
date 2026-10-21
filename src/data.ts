/** Homepage industry tiles — facet values match `catalogData` industry filters. */
export interface Industry {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  /** Value for the catalog `industry` facet radio. */
  facetValue: string;
}

export const industries: Industry[] = [
  {
    id: 'geospatial',
    title: 'Geospatial',
    description:
      'GNSS, optical, and field controllers pre-filtered for survey and mapping crews.',
    image: '/images/industry-geospatial.jpg',
    cta: 'Shop Geospatial',
    facetValue: 'Geospatial',
  },
  {
    id: 'civil',
    title: 'Civil',
    description:
      'Machine control, radios, and site positioning hardware for earthworks and infrastructure.',
    image: '/images/industry-civil.jpg',
    cta: 'Shop Civil',
    facetValue: 'Civil Construction',
  },
  {
    id: 'building',
    title: 'Building',
    description:
      'Layout, grade, and controller kits curated for commercial and building construction trades.',
    image: '/images/industry-building.jpg',
    cta: 'Shop Building',
    facetValue: 'Building Construction',
  },
];

/** Catalog product ids for the homepage “Frequently purchased” rail. */
export const FREQUENTLY_PURCHASED_IDS = [
  'prod-1',
  'prod-2',
  'prod-4',
  'prod-7',
] as const;

/** Catalog product ids for the homepage “New hardware” rail. */
export const NEW_HARDWARE_IDS = [
  'prod-3',
  'prod-5',
  'prod-8',
  'prod-7',
] as const;
