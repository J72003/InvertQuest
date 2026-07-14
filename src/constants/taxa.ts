export type TaxonOrder =
  | 'Ephemeroptera'
  | 'Trichoptera'
  | 'Coleoptera'
  | 'Lepidoptera'
  | 'Amphipoda';

export interface TaxonDefinition {
  modelClassIndex: number;
  commonName: string;
  family: string;
  order: TaxonOrder;
  tolerance: number;
  ecologicalNotes: string;
}

export const TAXA: TaxonDefinition[] = [
  {
    modelClassIndex: 0,
    commonName: 'Small Minnow Mayfly',
    family: 'Baetidae',
    order: 'Ephemeroptera',
    tolerance: 6.0,
    ecologicalNotes:
      'Fast-swimming nymphs found in riffles. Two tails. Sensitive to siltation and low oxygen.',
  },
  {
    modelClassIndex: 1,
    commonName: 'Water Scavenger Beetle',
    family: 'Hydrophilidae',
    order: 'Coleoptera',
    tolerance: 5.0,
    ecologicalNotes:
      'Scavenges decaying organic matter. Adults surface to breathe air directly.',
  },
  {
    modelClassIndex: 2,
    commonName: 'Small Square-gilled Mayfly',
    family: 'Caenidae',
    order: 'Ephemeroptera',
    tolerance: 7.0,
    ecologicalNotes:
      'Tolerates slow-moving, silty water. Square plate gills on abdomen are distinctive.',
  },
  {
    modelClassIndex: 3,
    commonName: 'Little Sister Caddisfly',
    family: 'Hydropsychidae',
    order: 'Trichoptera',
    tolerance: 6.0,
    ecologicalNotes:
      'Net-spinning filter feeder in moderate currents. Builds fixed silk retreat nets.',
  },
  {
    modelClassIndex: 4,
    commonName: 'Finger-net Caddisfly',
    family: 'Philopotamidae',
    order: 'Trichoptera',
    tolerance: 4.0,
    ecologicalNotes:
      'Builds finger-shaped silk nets in fast, cold, clean water. Intolerant of pollution.',
  },
  {
    modelClassIndex: 5,
    commonName: 'Aquatic Moth',
    family: 'Crambidae',
    order: 'Lepidoptera',
    tolerance: 5.0,
    ecologicalNotes:
      'Larvae scrape algae and biofilm from submerged rocks. Silken feeding tubes visible.',
  },
  {
    modelClassIndex: 6,
    commonName: 'Riffle Beetle',
    family: 'Elmidae',
    order: 'Coleoptera',
    tolerance: 4.0,
    ecologicalNotes:
      'Both adults and larvae extract dissolved oxygen via plastron respiration. Intolerant of low DO.',
  },
  {
    modelClassIndex: 7,
    commonName: 'Scud',
    family: 'Hyalellidae',
    order: 'Amphipoda',
    tolerance: 8.0,
    ecologicalNotes:
      'Shrimp-like, swims on its side. Tolerates enriched, nutrient-heavy water. Often abundant.',
  },
  {
    modelClassIndex: 8,
    commonName: 'Common Netspinner Caddisfly',
    family: 'Hydropsychidae',
    order: 'Trichoptera',
    tolerance: 5.0,
    ecologicalNotes:
      'Builds fixed silk capture nets in fast-flowing water to intercept drifting food particles.',
  },
  {
    modelClassIndex: 9,
    commonName: 'Purse-case Caddisfly',
    family: 'Hydroptilidae',
    order: 'Trichoptera',
    tolerance: 6.0,
    ecologicalNotes:
      'Micro-caddisflies (1–3mm) that build tiny portable purse-shaped cases from plant material.',
  },
  {
    modelClassIndex: 10,
    commonName: 'Little Stout Crawler Mayfly',
    family: 'Leptohyphidae',
    order: 'Ephemeroptera',
    tolerance: 4.0,
    ecologicalNotes:
      'Robust crawlers found in leaf packs and gravel. Three tails. Good water quality indicator.',
  },
  {
    modelClassIndex: 11,
    commonName: 'Petrophila Moth',
    family: 'Crambidae',
    order: 'Lepidoptera',
    tolerance: 5.0,
    ecologicalNotes:
      'Aquatic caterpillars graze epilithic algae in fast-flowing streams. Adults visible at lights.',
  },
  {
    modelClassIndex: 12,
    commonName: 'Water Penny Beetle',
    family: 'Psephenidae',
    order: 'Coleoptera',
    tolerance: 4.0,
    ecologicalNotes:
      'Flat, oval larvae cling tightly to rock surfaces. Intolerant of organic pollution; high-quality indicator.',
  },
];

export const TAXA_BY_ORDER: Record<TaxonOrder, TaxonDefinition[]> = {
  Ephemeroptera: TAXA.filter((t) => t.order === 'Ephemeroptera'),
  Trichoptera: TAXA.filter((t) => t.order === 'Trichoptera'),
  Coleoptera: TAXA.filter((t) => t.order === 'Coleoptera'),
  Lepidoptera: TAXA.filter((t) => t.order === 'Lepidoptera'),
  Amphipoda: TAXA.filter((t) => t.order === 'Amphipoda'),
};

export const ORDER_COMMON_NAMES: Record<TaxonOrder, string> = {
  Ephemeroptera: 'Mayflies',
  Trichoptera: 'Caddisflies',
  Coleoptera: 'Beetles',
  Lepidoptera: 'Aquatic Moths',
  Amphipoda: 'Scuds',
};

export function getTolerance(tol: number): 'sensitive' | 'moderate' | 'tolerant' {
  if (tol <= 3) return 'sensitive';
  if (tol <= 6) return 'moderate';
  return 'tolerant';
}

export function getFBIGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score <= 3.75) return 'A';
  if (score <= 5.0) return 'B';
  if (score <= 6.5) return 'C';
  return 'D';
}

export const FBI_GRADE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
};
