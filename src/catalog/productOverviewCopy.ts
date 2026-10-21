import type { CatalogProduct } from '../catalogData';

export interface ProductOverviewFeature {
  title: string;
  body: string;
}

export interface ProductOverviewCopy {
  summaryLead: string;
  summaryMore?: string;
  features: ProductOverviewFeature[];
}

const R780_OVERVIEW: ProductOverviewCopy = {
  summaryLead:
    'The Trimble R780 GNSS receiver is a highly accurate GNSS system built to handle the toughest survey environments.',
  summaryMore:
    ' It delivers scalable performance for layout, stakeout, and control workflows across construction and geospatial sites.',
  features: [
    {
      title: 'Configurable & Scalable Architecture',
      body: 'Fully configurable and scalable to meet changing project demands, allowing you to easily upgrade capabilities as operational requirements evolve over time.',
    },
    {
      title: 'Advanced Positioning Engine',
      body: 'Powered by a constellation-agnostic positioning engine that delivers high precision, reliability, and maximum productivity in challenging GNSS environments.',
    },
    {
      title: 'IMU-Based Tilt Compensation',
      body: 'Survey faster and safer with magnetically immune IMU tilt compensation, enabling quick and accurate point measurement or stakeout without needing to level the pole.',
    },
    {
      title: 'Continuous RTK Coverage',
      body: 'Eliminate field downtime with seamless correction coverage during signal outages, keeping your crew productive when sky view or radio links degrade.',
    },
  ],
};

const DEFAULT_OVERVIEW = (product: CatalogProduct): ProductOverviewCopy => ({
  summaryLead: product.description,
  features: [],
});

export function getProductOverviewCopy(
  product: CatalogProduct
): ProductOverviewCopy {
  if (product.id === 'prod-1' || product.partNumber === '82758-00') {
    return R780_OVERVIEW;
  }
  return DEFAULT_OVERVIEW(product);
}
