import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Site } from '../types/database';

export interface SiteWithMetrics extends Site {
  specimenCount: number;
  taxaRichness: number;
  eptRichness: number;
  fbiScore: number | null;
  fbiGrade: 'A' | 'B' | 'C' | 'D' | null;
  lastSampledAt: string | null;
}

const EPT_ORDERS = new Set(['Ephemeroptera', 'Plecoptera', 'Trichoptera']);

function fbiGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score <= 3.75) return 'A';
  if (score <= 5.00) return 'B';
  if (score <= 6.50) return 'C';
  return 'D';
}

export function useSites(userId: string | null) {
  return useQuery({
    queryKey: ['sites', userId],
    queryFn: async (): Promise<SiteWithMetrics[]> => {
      if (!userId) return [];

      const { data: sites, error: sitesErr } = await supabase
        .from('sites')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      if (sitesErr) throw sitesErr;
      if (!sites?.length) return [];

      const siteIds = sites.map((s) => s.id);

      const { data: specimens, error: specErr } = await supabase
        .from('specimens')
        .select('site_id, taxon_id, captured_at, taxon:taxa(tolerance, order_name)')
        .in('site_id', siteIds)
        .not('taxon_id', 'is', null);
      if (specErr) throw specErr;

      // Group identified specimens by site
      const bySite = new Map<string, typeof specimens>();
      for (const sp of specimens ?? []) {
        if (!sp.site_id) continue;
        if (!bySite.has(sp.site_id)) bySite.set(sp.site_id, []);
        bySite.get(sp.site_id)!.push(sp);
      }

      return sites.map((site) => {
        const siteSpecs = bySite.get(site.id) ?? [];
        const taxonIds = new Set(siteSpecs.map((s) => s.taxon_id));
        const eptTaxa = new Set(
          siteSpecs
            .filter((s) => s.taxon && EPT_ORDERS.has((s.taxon as any).order_name))
            .map((s) => s.taxon_id),
        );

        const totalTolerance = siteSpecs.reduce(
          (sum, s) => sum + ((s.taxon as any)?.tolerance ?? 0),
          0,
        );
        const rawScore = siteSpecs.length > 0 ? totalTolerance / siteSpecs.length : null;
        const fbiScore = rawScore !== null ? Math.round(rawScore * 100) / 100 : null;

        const lastSampledAt =
          siteSpecs.length > 0
            ? siteSpecs.reduce(
                (latest, s) => (s.captured_at > latest ? s.captured_at : latest),
                siteSpecs[0].captured_at,
              )
            : null;

        return {
          ...site,
          specimenCount: siteSpecs.length,
          taxaRichness: taxonIds.size,
          eptRichness: eptTaxa.size,
          fbiScore,
          fbiGrade: fbiScore !== null ? fbiGrade(fbiScore) : null,
          lastSampledAt,
        };
      });
    },
    enabled: !!userId,
  });
}
