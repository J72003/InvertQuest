-- ============================================================
-- Fieldnotes — Initial Schema Migration
-- Run this once in your Supabase SQL editor or via the CLI.
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: mirrors auth.users, created by trigger on signup
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        TEXT        CHECK (role IN ('student', 'teacher')),
  avatar_url  TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- classrooms
CREATE TABLE IF NOT EXISTS public.classrooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  join_code   TEXT        NOT NULL UNIQUE,
  teacher_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- classroom_members
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID        NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (classroom_id, user_id)
);

-- taxa: reference table seeded below, read-only for users
CREATE TABLE IF NOT EXISTS public.taxa (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name        TEXT    NOT NULL,
  family             TEXT    NOT NULL,
  order_name         TEXT    NOT NULL,
  tolerance          NUMERIC(3,1) NOT NULL,
  model_class_index  INTEGER NOT NULL UNIQUE,
  ecological_notes   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- sites: sampling locations, teacher-created
CREATE TABLE IF NOT EXISTS public.sites (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID        NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  latitude     NUMERIC(10,7) NOT NULL,
  longitude    NUMERIC(10,7) NOT NULL,
  created_by   UUID        NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- specimens: core data table
CREATE TABLE IF NOT EXISTS public.specimens (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id  UUID          REFERENCES public.classrooms(id) ON DELETE SET NULL,
  taxon_id      UUID          REFERENCES public.taxa(id) ON DELETE SET NULL,
  site_id       UUID          REFERENCES public.sites(id) ON DELETE SET NULL,
  image_url     TEXT          NOT NULL,
  image_path    TEXT          NOT NULL,
  size_estimate TEXT          CHECK (size_estimate IN ('<1cm', '1-3cm', '3-10cm', '>10cm')),
  habitat       TEXT,
  behaviors     TEXT[],
  confidence    TEXT          CHECK (confidence IN ('certain', 'likely', 'unsure')),
  notes         TEXT,
  latitude      NUMERIC(10,7),
  longitude     NUMERIC(10,7),
  is_pinned     BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Stores raw output from both AI models; never used to overwrite taxon_id
  ai_predictions JSONB,
  captured_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- comments: teacher feedback on specimens
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  specimen_id UUID        NOT NULL REFERENCES public.specimens(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- feedback_views: tracks when specimen owner last read their comments
CREATE TABLE IF NOT EXISTS public.feedback_views (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  specimen_id    UUID        NOT NULL REFERENCES public.specimens(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, specimen_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_specimens_user_id       ON public.specimens(user_id);
CREATE INDEX IF NOT EXISTS idx_specimens_classroom_id  ON public.specimens(classroom_id);
CREATE INDEX IF NOT EXISTS idx_specimens_site_id       ON public.specimens(site_id);
CREATE INDEX IF NOT EXISTS idx_specimens_captured_at   ON public.specimens(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_specimen_id    ON public.comments(specimen_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_user  ON public.classroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_classroom_id      ON public.sites(classroom_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','classrooms','sites','specimens','comments']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ============================================================
-- PROFILE AUTO-CREATE TRIGGER
-- Creates a profiles row when a new user signs up in auth.users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECURITY DEFINER FUNCTION: join_classroom_by_code
-- Students use this to join a classroom; prevents direct inserts
-- ============================================================

CREATE OR REPLACE FUNCTION public.join_classroom_by_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_classroom_id UUID;
  v_user_id      UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO v_classroom_id
  FROM public.classrooms
  WHERE join_code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid classroom code: %', p_code;
  END IF;

  INSERT INTO public.classroom_members (classroom_id, user_id)
  VALUES (v_classroom_id, v_user_id)
  ON CONFLICT (classroom_id, user_id) DO NOTHING;

  RETURN v_classroom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: nearby_site
-- Returns the closest site within 100 m, or NULL
-- Uses Haversine formula — no PostGIS required
-- ============================================================

CREATE OR REPLACE FUNCTION public.nearby_site(
  p_lat          DOUBLE PRECISION,
  p_lng          DOUBLE PRECISION,
  p_classroom_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_site_id   UUID;
  v_site_lat  DOUBLE PRECISION;
  v_site_lng  DOUBLE PRECISION;
  v_dist_m    DOUBLE PRECISION;
  v_dlat      DOUBLE PRECISION;
  v_dlng      DOUBLE PRECISION;
  v_a         DOUBLE PRECISION;
BEGIN
  -- Find the geographically closest site in this classroom
  SELECT
    id,
    latitude::DOUBLE PRECISION,
    longitude::DOUBLE PRECISION
  INTO v_site_id, v_site_lat, v_site_lng
  FROM public.sites
  WHERE classroom_id = p_classroom_id
  ORDER BY
    -- Euclidean approximation for sorting only (cheap)
    POWER(latitude::DOUBLE PRECISION - p_lat, 2) +
    POWER(longitude::DOUBLE PRECISION - p_lng, 2)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Haversine distance in metres
  v_dlat := RADIANS(v_site_lat - p_lat);
  v_dlng := RADIANS(v_site_lng - p_lng);
  v_a    := POWER(SIN(v_dlat / 2), 2)
            + COS(RADIANS(p_lat)) * COS(RADIANS(v_site_lat))
            * POWER(SIN(v_dlng / 2), 2);
  v_dist_m := 6371000.0 * 2.0 * ATAN2(SQRT(v_a), SQRT(1.0 - v_a));

  IF v_dist_m <= 100.0 THEN
    RETURN v_site_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- VIEW: site_health_metrics
-- Live FBI and EPT richness per site
-- FBI = Σ(individual_tolerance) / N  (equivalent to mean tolerance per specimen)
-- ============================================================

CREATE OR REPLACE VIEW public.site_health_metrics AS
SELECT
  s.id                                                          AS site_id,
  s.name                                                        AS site_name,
  s.classroom_id,
  COUNT(sp.id)                                                  AS specimen_count,
  COUNT(DISTINCT sp.taxon_id)                                   AS taxa_richness,
  COUNT(DISTINCT CASE
    WHEN t.order_name IN ('Ephemeroptera', 'Plecoptera', 'Trichoptera')
    THEN sp.taxon_id
  END)                                                          AS ept_richness,
  CASE
    WHEN COUNT(sp.id) > 0
    THEN ROUND(SUM(t.tolerance) / COUNT(sp.id), 2)
    ELSE NULL
  END                                                           AS fbi_score,
  CASE
    WHEN COUNT(sp.id) = 0 THEN NULL
    WHEN SUM(t.tolerance) / COUNT(sp.id) <= 3.75  THEN 'A'
    WHEN SUM(t.tolerance) / COUNT(sp.id) <= 5.00  THEN 'B'
    WHEN SUM(t.tolerance) / COUNT(sp.id) <= 6.50  THEN 'C'
    ELSE 'D'
  END                                                           AS fbi_grade
FROM public.sites s
LEFT JOIN public.specimens sp
  ON sp.site_id = s.id
  AND sp.taxon_id IS NOT NULL  -- Only identified specimens count toward FBI
LEFT JOIN public.taxa t
  ON t.id = sp.taxon_id
GROUP BY s.id, s.name, s.classroom_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxa             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_views   ENABLE ROW LEVEL SECURITY;

-- ---- Helper: is the calling user a member of a classroom? ----
CREATE OR REPLACE FUNCTION public.is_classroom_member(p_classroom_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE classroom_id = p_classroom_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- Helper: is the calling user the teacher of a classroom? ----
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(p_classroom_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = p_classroom_id
    AND teacher_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- Helper: is the calling user a teacher in the same classroom as a specimen? ----
CREATE OR REPLACE FUNCTION public.is_teacher_for_specimen(p_specimen_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.specimens sp
    JOIN public.classrooms c ON c.id = sp.classroom_id
    WHERE sp.id = p_specimen_id
    AND c.teacher_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_self_or_classmate" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classroom_members cm1
      JOIN public.classroom_members cm2 ON cm1.classroom_id = cm2.classroom_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = public.profiles.id
    )
    OR EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.teacher_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.classroom_members cm
        WHERE cm.classroom_id = c.id AND cm.user_id = public.profiles.id
      )
    )
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ---- CLASSROOMS ----
CREATE POLICY "classrooms_select_member_or_teacher" ON public.classrooms
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.is_classroom_member(id)
  );

CREATE POLICY "classrooms_insert_teacher" ON public.classrooms
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "classrooms_update_teacher" ON public.classrooms
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "classrooms_delete_teacher" ON public.classrooms
  FOR DELETE USING (teacher_id = auth.uid());

-- ---- CLASSROOM_MEMBERS ----
-- No direct INSERT — use join_classroom_by_code() SECURITY DEFINER function
CREATE POLICY "members_select_in_classroom" ON public.classroom_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_classroom_teacher(classroom_id)
    OR public.is_classroom_member(classroom_id)
  );

CREATE POLICY "members_delete_self_or_teacher" ON public.classroom_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR public.is_classroom_teacher(classroom_id)
  );

-- ---- TAXA (read-only for all authenticated users) ----
CREATE POLICY "taxa_select_authenticated" ON public.taxa
  FOR SELECT USING (auth.role() = 'authenticated');

-- ---- SITES ----
CREATE POLICY "sites_select_classroom_member" ON public.sites
  FOR SELECT USING (public.is_classroom_member(classroom_id) OR public.is_classroom_teacher(classroom_id));

CREATE POLICY "sites_insert_teacher" ON public.sites
  FOR INSERT WITH CHECK (public.is_classroom_teacher(classroom_id));

CREATE POLICY "sites_update_teacher" ON public.sites
  FOR UPDATE USING (public.is_classroom_teacher(classroom_id));

CREATE POLICY "sites_delete_teacher" ON public.sites
  FOR DELETE USING (public.is_classroom_teacher(classroom_id));

-- ---- SPECIMENS ----
CREATE POLICY "specimens_select_owner_or_classmate" ON public.specimens
  FOR SELECT USING (
    user_id = auth.uid()
    OR (classroom_id IS NOT NULL AND (
      public.is_classroom_member(classroom_id)
      OR public.is_classroom_teacher(classroom_id)
    ))
  );

CREATE POLICY "specimens_insert_authenticated" ON public.specimens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "specimens_update_owner" ON public.specimens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "specimens_delete_owner" ON public.specimens
  FOR DELETE USING (user_id = auth.uid());

-- ---- COMMENTS ----
CREATE POLICY "comments_select_classmate" ON public.comments
  FOR SELECT USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.specimens sp
      WHERE sp.id = specimen_id
      AND (
        sp.user_id = auth.uid()
        OR (sp.classroom_id IS NOT NULL AND (
          public.is_classroom_member(sp.classroom_id)
          OR public.is_classroom_teacher(sp.classroom_id)
        ))
      )
    )
  );

-- Only teachers in the specimen's classroom can add comments
CREATE POLICY "comments_insert_teacher" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND public.is_teacher_for_specimen(specimen_id)
  );

CREATE POLICY "comments_update_author" ON public.comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "comments_delete_author_or_teacher" ON public.comments
  FOR DELETE USING (
    author_id = auth.uid()
    OR public.is_teacher_for_specimen(specimen_id)
  );

-- ---- FEEDBACK_VIEWS ----
CREATE POLICY "feedback_views_own" ON public.feedback_views
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Specimens bucket (user photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'specimens',
  'specimens',
  false,   -- Not public; signed URLs used for access
  10485760, -- 10 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Reference bucket (curated reference images — future task, read-only placeholder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference',
  'reference',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: specimens bucket
CREATE POLICY "specimens_storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'specimens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "specimens_storage_select_own_or_classmate" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'specimens'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR EXISTS (
        SELECT 1 FROM public.specimens sp
        WHERE sp.image_path = name
        AND (
          sp.user_id = auth.uid()
          OR (sp.classroom_id IS NOT NULL AND (
            public.is_classroom_member(sp.classroom_id)
            OR public.is_classroom_teacher(sp.classroom_id)
          ))
        )
      )
    )
  );

CREATE POLICY "specimens_storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'specimens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ============================================================
-- SEED DATA: taxa
-- ============================================================

INSERT INTO public.taxa (common_name, family, order_name, tolerance, model_class_index, ecological_notes)
VALUES
  ('Small Minnow Mayfly',          'Baetidae',       'Ephemeroptera', 6.0,  0,  'Fast-swimming nymphs found in riffles. Two tails. Sensitive to siltation and low oxygen.'),
  ('Water Scavenger Beetle',       'Hydrophilidae',  'Coleoptera',    5.0,  1,  'Scavenges decaying organic matter. Adults surface to breathe air directly.'),
  ('Small Square-gilled Mayfly',   'Caenidae',       'Ephemeroptera', 7.0,  2,  'Tolerates slow-moving, silty water. Square plate gills on abdomen are distinctive.'),
  ('Little Sister Caddisfly',      'Hydropsychidae', 'Trichoptera',   6.0,  3,  'Net-spinning filter feeder in moderate currents. Builds fixed silk retreat nets.'),
  ('Finger-net Caddisfly',         'Philopotamidae', 'Trichoptera',   4.0,  4,  'Builds finger-shaped silk nets in fast, cold, clean water. Intolerant of pollution.'),
  ('Aquatic Moth',                 'Crambidae',      'Lepidoptera',   5.0,  5,  'Larvae scrape algae and biofilm from submerged rocks. Silken feeding tubes visible.'),
  ('Riffle Beetle',                'Elmidae',        'Coleoptera',    4.0,  6,  'Both adults and larvae extract dissolved oxygen via plastron respiration. Intolerant of low DO.'),
  ('Scud',                         'Hyalellidae',    'Amphipoda',     8.0,  7,  'Shrimp-like, swims on its side. Tolerates enriched, nutrient-heavy water. Often abundant.'),
  ('Common Netspinner Caddisfly',  'Hydropsychidae', 'Trichoptera',   5.0,  8,  'Builds fixed silk capture nets in fast-flowing water to intercept drifting food particles.'),
  ('Purse-case Caddisfly',         'Hydroptilidae',  'Trichoptera',   6.0,  9,  'Micro-caddisflies (1–3mm) that build tiny portable purse-shaped cases from plant material.'),
  ('Little Stout Crawler Mayfly',  'Leptohyphidae',  'Ephemeroptera', 4.0,  10, 'Robust crawlers found in leaf packs and gravel. Three tails. Good water quality indicator.'),
  ('Petrophila Moth',              'Crambidae',      'Lepidoptera',   5.0,  11, 'Aquatic caterpillars graze epilithic algae in fast-flowing streams. Adults visible at lights.'),
  ('Water Penny Beetle',           'Psephenidae',    'Coleoptera',    4.0,  12, 'Flat, oval larvae cling tightly to rock surfaces. Intolerant of organic pollution.')
ON CONFLICT (model_class_index) DO NOTHING;
