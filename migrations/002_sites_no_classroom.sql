-- Migration 002: Make sites work without classrooms
-- Run this in the Supabase SQL editor.

-- 1. Make classroom_id nullable and drop the CASCADE so deleting
--    a classroom doesn't nuke the site.
ALTER TABLE public.sites ALTER COLUMN classroom_id DROP NOT NULL;
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_classroom_id_fkey;
ALTER TABLE public.sites
  ADD CONSTRAINT sites_classroom_id_fkey
  FOREIGN KEY (classroom_id)
  REFERENCES public.classrooms(id)
  ON DELETE SET NULL;

-- 2. Replace classroom-gated RLS with owner-only policies.
DROP POLICY IF EXISTS "sites_select_classroom_member" ON public.sites;
DROP POLICY IF EXISTS "sites_insert_teacher"           ON public.sites;
DROP POLICY IF EXISTS "sites_update_teacher"           ON public.sites;
DROP POLICY IF EXISTS "sites_delete_teacher"           ON public.sites;

CREATE POLICY "sites_select_own" ON public.sites
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "sites_insert_own" ON public.sites
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "sites_update_own" ON public.sites
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "sites_delete_own" ON public.sites
  FOR DELETE USING (created_by = auth.uid());

-- 3. Replace nearby_site: now finds the closest site owned by the
--    calling user instead of filtering by classroom.
DROP FUNCTION IF EXISTS public.nearby_site(double precision, double precision, uuid);

CREATE OR REPLACE FUNCTION public.nearby_site(
  p_lat     DOUBLE PRECISION,
  p_lng     DOUBLE PRECISION,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_site_id  UUID;
  v_site_lat DOUBLE PRECISION;
  v_site_lng DOUBLE PRECISION;
  v_dist_m   DOUBLE PRECISION;
  v_dlat     DOUBLE PRECISION;
  v_dlng     DOUBLE PRECISION;
  v_a        DOUBLE PRECISION;
BEGIN
  SELECT id, latitude::DOUBLE PRECISION, longitude::DOUBLE PRECISION
  INTO v_site_id, v_site_lat, v_site_lng
  FROM public.sites
  WHERE created_by = p_user_id
  ORDER BY
    POWER(latitude::DOUBLE PRECISION - p_lat, 2) +
    POWER(longitude::DOUBLE PRECISION - p_lng, 2)
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  v_dlat   := RADIANS(v_site_lat - p_lat);
  v_dlng   := RADIANS(v_site_lng - p_lng);
  v_a      := POWER(SIN(v_dlat / 2), 2)
             + COS(RADIANS(p_lat)) * COS(RADIANS(v_site_lat))
             * POWER(SIN(v_dlng / 2), 2);
  v_dist_m := 6371000.0 * 2.0 * ATAN2(SQRT(v_a), SQRT(1.0 - v_a));

  IF v_dist_m <= 100.0 THEN RETURN v_site_id; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
