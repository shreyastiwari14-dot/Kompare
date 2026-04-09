import { compareTwoStrings } from 'string-similarity';
import { ProductData } from '@/lib/types';

// Common storage/RAM variants to detect in titles
const VARIANT_PATTERNS = [
  /\b(\d+)\s*gb\b/gi,
  /\b(\d+)\s*tb\b/gi,
  /\b(\d+)\s*mp\b/gi,
  /\b(black|white|blue|red|green|gold|silver|graphite|midnight|starlight|titanium|natural|pink|purple|yellow|violet)\b/gi,
];

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVariants(title: string): string[] {
  const found: string[] = [];
  for (const pat of VARIANT_PATTERNS) {
    const matches = title.matchAll(new RegExp(pat.source, 'gi'));
    for (const m of matches) found.push(m[0].toLowerCase().trim());
  }
  return found;
}

function variantOverlap(a: string, b: string): number {
  const va = extractVariants(a);
  const vb = extractVariants(b);
  if (!va.length && !vb.length) return 1; // no variant info — neutral
  if (!va.length || !vb.length) return 0.5; // one side unknown — penalise lightly
  const intersection = va.filter(v => vb.includes(v)).length;
  const union = new Set([...va, ...vb]).size;
  return intersection / union; // Jaccard
}

export interface MatchResult {
  product: ProductData;
  confidence: number;
}

export function findBestMatch(
  source: ProductData,
  candidates: ProductData[]
): ProductData | null {
  const matches = scoreAll(source, candidates).filter(m => m.confidence >= 0.7);
  if (!matches.length) return null;
  return matches[0].product;
}

export function scoreAll(
  source: ProductData,
  candidates: ProductData[]
): MatchResult[] {
  const srcNorm = normalise(source.name);

  const scored: MatchResult[] = candidates.map(candidate => {
    const candNorm = normalise(candidate.name);
    let confidence = 0;

    // ── Model number exact match (highest signal) ──────────────────────────
    if (
      source.modelNumber &&
      candidate.modelNumber &&
      source.modelNumber.toLowerCase() === candidate.modelNumber.toLowerCase()
    ) {
      confidence = Math.max(confidence, 0.95);
    }

    // ── String similarity on normalised names ─────────────────────────────
    const nameSim = compareTwoStrings(srcNorm, candNorm);
    confidence = Math.max(confidence, nameSim * 0.85); // name alone max 0.85

    // ── Variant overlap bonus/penalty ─────────────────────────────────────
    const varScore = variantOverlap(source.name, candidate.name);
    // Boost if variants match, penalise if they conflict (varScore < 0.5)
    if (varScore >= 0.8) {
      confidence = Math.min(1, confidence + 0.1);
    } else if (varScore < 0.3) {
      confidence *= 0.6; // different variant — heavy penalty
    }

    // ── Sanity: if the store is the same, skip (no cross-store value) ──────
    if (source.store === candidate.store) {
      confidence = 0;
    }

    return { product: candidate, confidence };
  });

  return scored.sort((a, b) => b.confidence - a.confidence);
}
