export type StockStatus = 'in-stock' | 'limited' | 'out-of-stock';

export interface BomItem {
  pn: string;
  name: string;
  qty: number;
  /** Short category / description line under the sub-component title. */
  description?: string;
  /** Per-unit dealer net for kit unbundling (e.g. "$350.00"). */
  unitPrice?: string;
  /** Optional thumbnail; falls back to catalog PN match or parent kit image. */
  image?: string;
  /** Optional stock override for kit-only parts not sold standalone. */
  stock?: StockStatus;
  /** When true, dealers may open the standalone SKU or add a spare line to cart. */
  isOrderable?: boolean;
  /** Target orderable PN when different from kit line PN. */
  standalonePn?: string;
  /** e.g. "Factory component" or "Included in box". */
  note?: string;
  /** Nested sub-assembly components. */
  children?: BomItem[];
}

/** Lightweight pointer to a successor SKU when a product is discontinued. */
export interface ReplacementProductRef {
  id: string;
  partNumber: string;
  name: string;
  /** Dealer net display price (e.g. "$29,900.00"). */
  price: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  /** Orderable part number (SKU) surfaced prominently on the card. */
  partNumber: string;
  price: string;
  listPrice?: string;
  image: string;
  stock: StockStatus;
  /** OEM finish / color option shown as a text label (B2B, not a swatch). */
  finish?: string;
  /** Contains orderable sub-components (Bill of Materials). */
  isKit?: boolean;
  /** Kit dealer-net savings vs. buying every component separately. */
  bundleSavings?: number;
  /**
   * Legacy flag — prefer `isDiscontinued` + `replacementProduct`.
   * Still set when a discontinued SKU has a mapped replacement.
   */
  replacementAvailable?: boolean;
  /** Product is discontinued; remains searchable but not orderable. */
  isDiscontinued?: boolean;
  /** Display date the SKU was discontinued (e.g. "March 15, 2025"). */
  discontinuationDate?: string;
  /** Direct replacement SKU when one exists. */
  replacementProduct?: ReplacementProductRef;
  /** Battery / chemical shipping warning. */
  hazmat?: boolean;
  /** Sub-parts included in a kit, listed in the BOM quick view. */
  bom?: BomItem[];
  /** Filterable attributes keyed by FilterGroup id. */
  facets: Record<string, string[]>;
}

/**
 * A single filter choice. `value` is matched against product facets (kept
 * stable), while `label` is the display text so we can show shorter / sentence-
 * case wording without breaking filtering.
 */
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  heading: string;
  type: 'radio' | 'checkbox';
  options: FilterOption[];
}

/** Sentinel option (radio) meaning "no industry filter". */
export const ALL_OPTION = 'All';

/** Options whose display label matches their value verbatim. */
const opt = (value: string, label: string = value): FilterOption => ({ value, label });

export const filterGroups: FilterGroup[] = [
  {
    id: 'industry',
    heading: 'Industry',
    type: 'radio',
    options: [
      opt(ALL_OPTION),
      opt('Geospatial'),
      opt('Civil Construction', 'Civil'),
      opt('Building Construction', 'Building'),
    ],
  },
  {
    id: 'product-type',
    heading: 'Product type',
    type: 'checkbox',
    options: [
      opt('GNSS Receivers & Smart Antennas', 'GNSS receivers & smart antennas'),
      opt('Total Stations & Scanners', 'Total stations & scanners'),
      opt('Controllers & Data Collectors', 'Controllers & data collectors'),
      opt('On-Machine Radios & Gateways', 'On-machine radios & gateways'),
      opt('Accessories (Power, Brackets, Cases)', 'Accessories (power, brackets, cases)'),
      opt('Cables & Harnesses', 'Cables & harnesses'),
    ],
  },
  {
    id: 'brand',
    heading: 'Brand',
    type: 'checkbox',
    options: [opt('Trimble'), opt('Spectra Geospatial'), opt('SECO'), opt('Rajant')],
  },
  {
    id: 'machine-compatibility',
    heading: 'Machine compatibility',
    type: 'checkbox',
    options: [opt('Caterpillar'), opt('John Deere'), opt('Komatsu'), opt('Volvo')],
  },
  {
    id: 'systems',
    heading: 'Systems',
    type: 'checkbox',
    options: [
      opt('Site Positioning Systems (SPS)'),
      opt('Machine Control Systems (Earthworks/GCS)', 'Machine control systems (Earthworks/GCS)'),
      opt('Survey & Optical Systems', 'Survey & optical systems'),
      opt('Mobile Mapping & Reality Capture', 'Mobile mapping & reality capture'),
      opt('Marine Systems', 'Marine systems'),
    ],
  },
];

/** Parse a display price like "$18,950.00" into a number for sorting. */
export function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9.]/g, '')) || 0;
}

/** Format a dollar amount as a catalog display price (e.g. 1180 → "$1,180.00"). */
export function formatCatalogPrice(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

/**
 * MSRP list price for card display. Uses the catalog `listPrice` when set;
 * otherwise derives ~10% above dealer net so every card shows both prices.
 */
export function resolveListPrice(product: CatalogProduct): string {
  if (product.listPrice) return product.listPrice;
  const dealer = parsePrice(product.price);
  return formatCatalogPrice(Math.round(dealer * 1.1 * 100) / 100);
}

export const catalogProducts: CatalogProduct[] = [
  {
    id: 'prod-1',
    name: 'Trimble R780 GNSS Receiver',
    description:
      'Scalable modular GNSS receiver with integrated inertial measurement for fast, tilt-compensated site positioning.',
    partNumber: '82758-00',
    price: '$18,950.00',
    listPrice: '$21,000.00',
    image: '/products/gnss-receiver.png',
    stock: 'in-stock',
    finish: 'Trimble Yellow',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['GNSS Receivers & Smart Antennas'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Site Positioning Systems (SPS)', 'Survey & Optical Systems'],
    },
  },
  {
    id: 'prod-2',
    name: 'Trimble TSC7 Field Controller',
    description:
      'Rugged large-screen data collector running Trimble Access for survey and layout in the field.',
    partNumber: '121760-00',
    price: '$7,420.00',
    image: '/products/field-controller.png',
    stock: 'limited',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Site Positioning Systems (SPS)', 'Survey & Optical Systems'],
    },
  },
  {
    id: 'prod-3',
    name: 'Trimble S7 Robotic Total Station',
    description:
      'All-in-one optical total station with scanning, imaging, and robotic tracking for precise measurement.',
    partNumber: '113600-20',
    price: '$24,300.00',
    listPrice: '$27,900.00',
    image: '/products/total-station.png',
    stock: 'out-of-stock',
    isDiscontinued: true,
    discontinuationDate: 'March 15, 2025',
    replacementAvailable: true,
    replacementProduct: {
      id: 'prod-33',
      partNumber: '113650-30',
      name: 'Trimble S9 HP Robotic Total Station',
      price: '$29,900.00',
    },
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Total Stations & Scanners'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Survey & Optical Systems', 'Mobile Mapping & Reality Capture'],
    },
  },
  {
    id: 'prod-4',
    name: 'Trimble External Power Kit',
    description:
      'Weatherproof field power kit with dual charger, spare batteries, and cabling in a hard transport case.',
    partNumber: '92600-00',
    price: '$1,180.00',
    listPrice: '$1,200.00',
    image: '/products/power-kit.png',
    stock: 'in-stock',
    isKit: true,
    bundleSavings: 145,
    hazmat: true,
    bom: [
      {
        pn: '89840-00',
        name: 'Li-ion Battery Pack',
        description: 'Hot-swappable field battery',
        qty: 2,
        unitPrice: '$350.00',
        image: '/products/power-module-a.png',
      },
      {
        pn: '53018010',
        name: 'Dual Battery Charger',
        description: '2-bay charger',
        qty: 1,
        unitPrice: '$280.00',
        image: '/products/power-module-b.png',
        children: [
          {
            pn: '53018010-AC',
            name: 'AC Power Cord',
            description: '100–240 V mains lead',
            qty: 1,
          },
          {
            pn: '53018010-DC',
            name: 'Vehicle DC Adapter',
            description: '12 V cigarette-lighter input',
            qty: 1,
          },
        ],
      },
      {
        pn: '58957-10',
        name: 'Power Cable',
        description: 'Weather-sealed DC lead',
        qty: 1,
        unitPrice: '$120.00',
        image: '/products/cable-harness.png',
        isOrderable: true,
        standalonePn: '58957-10',
        note: 'Orderable spare accessory',
      },
      {
        pn: '92601-00',
        name: 'Hard Transport Case',
        description: 'Rugged foam-fitted case',
        qty: 1,
        unitPrice: '$80.00',
        image: '/products/power-kit.png',
        stock: 'out-of-stock',
      },
    ],
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Accessories (Power, Brackets, Cases)'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-5',
    name: 'Trimble TDL 450 Radio Module',
    description:
      'Long-range UHF data radio for reliable RTK correction broadcast across the jobsite.',
    partNumber: '01001-00',
    price: '$2,640.00',
    listPrice: '$2,850.00',
    image: '/products/radio-module.png',
    stock: 'in-stock',
    bom: [{ pn: '01001-00', name: 'Trimble TDL 450 Radio Module', qty: 1 }],
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['On-Machine Radios & Gateways'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)', 'Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-6',
    name: 'Trimble GNSS Cable Harness',
    description:
      'Field-serviceable power and data cable harness for machine-mounted GNSS and radio components.',
    partNumber: '58957-10',
    price: '$310.00',
    listPrice: '$345.00',
    image: '/products/cable-harness.png',
    stock: 'limited',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Cables & Harnesses'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-7',
    name: 'Trimble CB460 Grade Control Display',
    description:
      'In-cab color display for 3D machine grade control with intuitive cut/fill guidance.',
    partNumber: 'CB460-00',
    price: '$9,750.00',
    image: '/products/cb460-display.png',
    stock: 'in-stock',
    isKit: true,
    bundleSavings: 650,
    bom: [
      { pn: 'CB460-DSP', name: 'CB460 Display Unit', qty: 1 },
      { pn: '58957-10', name: 'Display Power/Data Harness', qty: 1 },
      {
        pn: '57402-00',
        name: 'RAM Mount Bracket',
        description: 'Heavy-duty in-cab display mount',
        qty: 1,
        children: [
          {
            pn: '57402-BALL',
            name: 'RAM Ball Base',
            description: '1.5 in ball with round plate',
            qty: 2,
          },
          {
            pn: '57402-ARM',
            name: 'Double Socket Arm',
            description: 'Medium-length adjustable arm',
            qty: 1,
          },
          {
            pn: '57402-HW',
            name: 'Mounting Hardware Pack',
            description: 'Stainless fasteners for cab install',
            qty: 1,
            children: [
              { pn: '57402-BLT', name: 'M6 Hex Bolt', description: 'Stainless steel, 20 mm', qty: 4 },
              { pn: '57402-WSH', name: 'M6 Lock Washer', description: 'Split-ring washer', qty: 4 },
            ],
          },
        ],
      },
    ],
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-8',
    name: 'Trimble GCS900 Grade Control Display',
    description:
      'Proven grade control display for dozers, excavators, and motor graders on earthworks sites.',
    partNumber: 'GCS900-10',
    price: '$11,200.00',
    image: '/products/gcs900-display.png',
    stock: 'in-stock',
    isKit: true,
    bundleSavings: 820,
    bom: [
      { pn: 'GCS900-DSP', name: 'CB460 Control Box', qty: 1 },
      { pn: 'MS992-00', name: 'MS992 GNSS Antenna', qty: 2 },
      { pn: '58957-10', name: 'In-Cab Harness', qty: 1 },
    ],
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'John Deere', 'Volvo'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-9',
    name: 'CAT GRADE Control Display',
    description:
      'Factory-compatible grade control display for Cat machines with real-time slope guidance.',
    partNumber: 'AG-D009',
    price: '$10,480.00',
    image: '/products/cat-grade-display.png',
    stock: 'limited',
    finish: 'CAT Yellow',
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-10',
    name: 'CAT CT210 Grade Control Display',
    description:
      'In-cab touchscreen display for 2D/3D grade control with dual cut/fill guidance for Cat dozers.',
    partNumber: 'CT210-00',
    price: '$8,940.00',
    image: '/products/display-cat-ct210.png',
    stock: 'in-stock',
    finish: 'CAT Yellow',
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-11',
    name: 'CAT CT610 Dual-View Display Kit',
    description:
      'Large-format dual-view grade control display kit with mounting hardware for motor graders.',
    partNumber: 'CT610-KIT',
    price: '$13,200.00',
    listPrice: '$14,600.00',
    image: '/products/display-cat-ct610.png',
    stock: 'limited',
    isKit: true,
    bundleSavings: 940,
    finish: 'CAT Yellow',
    bom: [
      { pn: 'CT610-DSP', name: 'CT610 Display Unit', qty: 1 },
      { pn: '57402-00', name: 'RAM Mount Bracket', qty: 1 },
      { pn: '58957-10', name: 'Display Power/Data Harness', qty: 1 },
    ],
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-12',
    name: 'Trimble CB450 Control Box',
    description:
      'Compact grade control box with intuitive keypad for excavators and compact track loaders.',
    partNumber: 'CB450-00',
    price: '$6,320.00',
    image: '/products/display-trimble-cb450.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-13',
    name: 'Trimble L2050 In-Cab Display',
    description:
      'Widescreen in-cab display with high-visibility interface for 3D machine guidance.',
    partNumber: 'L2050-10',
    price: '$9,880.00',
    image: '/products/display-trimble-l2050.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['John Deere'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-14',
    name: 'Spectra ST20 Compact Display',
    description:
      'Entry-level compact machine display for 2D grade indication and depth guidance.',
    partNumber: 'ST20-00',
    price: '$3,410.00',
    image: '/products/display-blue-compact.png',
    stock: 'limited',
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Spectra Geospatial'],
      'machine-compatibility': ['Volvo'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-15',
    name: 'Spectra ST40 Wide Display',
    description:
      'Wide-format machine display with dual-antenna support for slope and elevation control.',
    partNumber: 'ST40-00',
    price: '$5,760.00',
    image: '/products/display-blue-wide.png',
    stock: 'in-stock',
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Spectra Geospatial'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-16',
    name: 'Trimble GCSFlex Keypad Display',
    description:
      'Ruggedized keypad display for GCS grade control retrofits on legacy earthmoving fleets.',
    partNumber: 'GCSF-20',
    price: '$7,050.00',
    image: '/products/display-blue-keypad.png',
    stock: 'out-of-stock',
    isDiscontinued: true,
    discontinuationDate: 'January 8, 2025',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-17',
    name: 'Trimble PM400 Power Module',
    description:
      'Sealed in-cab power conditioning module supplying regulated power to displays and receivers.',
    partNumber: 'PM400-00',
    price: '$980.00',
    image: '/products/power-module-a.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Accessories (Power, Brackets, Cases)'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-18',
    name: 'Trimble PM200 Power Supply',
    description:
      'Compact regulated power supply for machine-mounted radios and antenna electronics.',
    partNumber: 'PM200-00',
    price: '$640.00',
    image: '/products/power-module-b.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Accessories (Power, Brackets, Cases)'],
      brand: ['Trimble'],
      'machine-compatibility': ['Volvo'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-19',
    name: 'Trimble Earthworks GO! Display',
    description:
      'Next-generation grade control display running Earthworks with 3D guidance and remote support.',
    partNumber: 'EW-DSP-12',
    price: '$12,600.00',
    image: '/products/display-earthworks.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-20',
    name: 'Trimble MC Compact Display',
    description:
      'Small-footprint machine control display for skid steers and compact equipment cabs.',
    partNumber: 'MC-CMP-08',
    price: '$4,220.00',
    image: '/products/display-compact-dark.png',
    stock: 'limited',
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['John Deere'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-21',
    name: 'Trimble In-Cab Guidance Display',
    description:
      'Bright in-cab guidance display with sunlight-readable screen for precise blade control.',
    partNumber: 'ICG-15',
    price: '$8,150.00',
    image: '/products/display-incab.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-22',
    name: 'Trimble TC50 Compact Controller',
    description:
      'Lightweight field controller running Trimble Access for fast survey and stakeout tasks.',
    partNumber: 'TC50-00',
    price: '$5,940.00',
    image: '/products/controller-compact.png',
    stock: 'in-stock',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Survey & Optical Systems', 'Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-23',
    name: 'Trimble TSC5 Rugged Controller Kit',
    description:
      'Rugged data controller kit with charger, strap, and stylus for demanding field survey work.',
    partNumber: 'TSC5-KIT',
    price: '$6,480.00',
    image: '/products/controller-rugged.png',
    stock: 'limited',
    isKit: true,
    bundleSavings: 410,
    bom: [
      { pn: 'TSC5-BODY', name: 'TSC5 Controller', qty: 1 },
      { pn: '89840-00', name: 'Li-ion Battery Pack', qty: 1 },
      { pn: '53018010', name: 'USB-C Charger', qty: 1 },
      { pn: 'TSC5-STY', name: 'Capacitive Stylus', qty: 1 },
    ],
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Survey & Optical Systems', 'Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-24',
    name: 'Trimble Nomad Field Tablet',
    description:
      'Compact Windows field tablet for mobile mapping, asset capture, and GIS data collection.',
    partNumber: 'NMD-900',
    price: '$4,760.00',
    image: '/products/tablet-nomad.png',
    stock: 'in-stock',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Mobile Mapping & Reality Capture', 'Survey & Optical Systems'],
    },
  },
  {
    id: 'prod-25',
    name: 'Trimble Siteworks Display',
    description:
      'Site positioning display running Siteworks for grade checking, layout, and measure-up.',
    partNumber: 'SW-DSP-07',
    price: '$9,320.00',
    image: '/products/display-siteworks.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar'],
      systems: ['Site Positioning Systems (SPS)', 'Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-26',
    name: 'Trimble TC10 Mini Controller',
    description:
      'Pocketable handheld controller for quick GNSS checks and point verification in the field.',
    partNumber: 'TC10-00',
    price: '$2,880.00',
    image: '/products/controller-mini.png',
    stock: 'limited',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Controllers & Data Collectors'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Survey & Optical Systems'],
    },
  },
  {
    id: 'prod-27',
    name: 'Trimble R12i GNSS Receiver',
    description:
      'Flagship GNSS receiver with IMU tilt compensation and ProPoint engine for tough environments.',
    partNumber: '109571-00',
    price: '$21,400.00',
    image: '/products/gnss-receiver.png',
    stock: 'in-stock',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['GNSS Receivers & Smart Antennas'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Site Positioning Systems (SPS)', 'Survey & Optical Systems'],
    },
  },
  {
    id: 'prod-28',
    name: 'Spectra SP85 GNSS Receiver',
    description:
      'Versatile GNSS receiver with UHF and cellular options for RTK survey and construction.',
    partNumber: 'SP85-00',
    price: '$13,750.00',
    image: '/products/gnss-receiver.png',
    stock: 'limited',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['GNSS Receivers & Smart Antennas'],
      brand: ['Spectra Geospatial'],
      'machine-compatibility': [],
      systems: ['Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-29',
    name: 'Trimble TDL 2.4 Radio Bridge',
    description:
      'Spread-spectrum 2.4 GHz radio bridge for machine-to-base data links on active jobsites.',
    partNumber: '01002-00',
    price: '$1,940.00',
    image: '/products/radio-module.png',
    stock: 'in-stock',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['On-Machine Radios & Gateways'],
      brand: ['Trimble'],
      'machine-compatibility': ['Caterpillar', 'Komatsu'],
      systems: ['Machine Control Systems (Earthworks/GCS)', 'Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-30',
    name: 'Rajant BreadCrumb Mesh Gateway',
    description:
      'Industrial kinetic mesh gateway providing resilient jobsite connectivity for machine fleets.',
    partNumber: 'ME4-2400',
    price: '$4,320.00',
    image: '/products/radio-module.png',
    stock: 'limited',
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['On-Machine Radios & Gateways'],
      brand: ['Rajant'],
      'machine-compatibility': ['Caterpillar', 'Volvo'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-31',
    name: 'SECO Antenna Cable Kit',
    description:
      'Field-grade antenna cable kit with weather-sealed connectors for GNSS base and rover setups.',
    partNumber: 'SECO-CBL-05',
    price: '$260.00',
    image: '/products/cable-harness.png',
    stock: 'in-stock',
    isKit: true,
    bundleSavings: 35,
    bom: [
      { pn: 'SECO-TNC', name: 'TNC Antenna Cable, 5 m', qty: 1 },
      { pn: 'SECO-ADP', name: 'TNC-to-N Adapter', qty: 2 },
    ],
    facets: {
      industry: ['Civil Construction'],
      'product-type': ['Cables & Harnesses'],
      brand: ['SECO'],
      'machine-compatibility': [],
      systems: ['Site Positioning Systems (SPS)'],
    },
  },
  {
    id: 'prod-32',
    name: 'Trimble Machine Harness Kit',
    description:
      'Complete in-cab wiring harness kit for machine control retrofit, including power and CAN leads.',
    partNumber: 'MH-KIT-30',
    price: '$520.00',
    image: '/products/cable-harness.png',
    stock: 'in-stock',
    isKit: true,
    bundleSavings: 60,
    bom: [
      { pn: '58957-10', name: 'Power/Data Harness', qty: 1 },
      { pn: 'MH-CAN-02', name: 'CAN Bus Lead', qty: 2 },
      {
        pn: 'MH-FUSE',
        name: 'Inline Fuse Assembly',
        qty: 1,
        children: [
          { pn: 'MH-FUSE-10A', name: '10 A Blade Fuse', description: 'ATO automotive fuse', qty: 2 },
          { pn: 'MH-FUSE-HLD', name: 'Weatherproof Fuse Holder', description: 'Sealed inline holder', qty: 1 },
        ],
      },
    ],
    facets: {
      industry: ['Building Construction'],
      'product-type': ['Cables & Harnesses'],
      brand: ['Trimble'],
      'machine-compatibility': ['Volvo', 'John Deere'],
      systems: ['Machine Control Systems (Earthworks/GCS)'],
    },
  },
  {
    id: 'prod-33',
    name: 'Trimble S9 HP Robotic Total Station',
    description:
      'High-precision robotic total station with scanning and DR Plus tracking for demanding survey.',
    partNumber: '113650-30',
    price: '$29,900.00',
    image: '/products/total-station.png',
    stock: 'limited',
    facets: {
      industry: ['Geospatial'],
      'product-type': ['Total Stations & Scanners'],
      brand: ['Trimble'],
      'machine-compatibility': [],
      systems: ['Survey & Optical Systems', 'Mobile Mapping & Reality Capture'],
    },
  },
];

export const sortOptions = [
  { label: 'Sort by: Featured', value: 'featured' },
  { label: 'Sort by: Price, low to high', value: 'price-asc' },
  { label: 'Sort by: Price, high to low', value: 'price-desc' },
  { label: 'Sort by: Name, A–Z', value: 'name-asc' },
];
