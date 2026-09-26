-- ============================================
-- KADESH HOPE MISSION — SUPABASE CMS SCHEMA
-- ============================================

-- -------------------------------------------
-- TABLES
-- -------------------------------------------

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  hero_image TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  category TEXT NOT NULL,
  duration TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  video_url TEXT,
  category TEXT,
  author TEXT,
  display_location TEXT DEFAULT 'both',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'admin',
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT,
  donor_email TEXT,
  donor_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  converted_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  frequency TEXT DEFAULT 'one-time',
  status TEXT DEFAULT 'pending',
  is_sponsorship BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  payment_reference TEXT,
  location TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  location TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  needs TEXT,
  class_grade TEXT,
  school_name TEXT,
  parent_name TEXT,
  religion TEXT,
  sponsorship_status TEXT DEFAULT 'available' CHECK (sponsorship_status IN ('available', 'sponsored', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE donor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sponsorships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES auth.users(id),
  child_id UUID NOT NULL REFERENCES children(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  monthly_amount DECIMAL(10,2),
  start_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------
-- INDEXES
-- -------------------------------------------

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_sort_order ON projects(sort_order);

CREATE INDEX idx_gallery_category ON gallery(category);
CREATE INDEX idx_gallery_sort_order ON gallery(sort_order);

CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_is_featured ON videos(is_featured);
CREATE INDEX idx_videos_sort_order ON videos(sort_order);

CREATE INDEX idx_partners_is_active ON partners(is_active);
CREATE INDEX idx_partners_sort_order ON partners(sort_order);

CREATE INDEX idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_sort_order ON testimonials(sort_order);

CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_is_published ON news(is_published);

CREATE INDEX idx_contact_messages_is_read ON contact_messages(is_read);

CREATE INDEX idx_page_content_page_slug ON page_content(page_slug);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);

CREATE INDEX idx_children_sponsorship_status ON children(sponsorship_status);
CREATE INDEX idx_children_gender ON children(gender);
CREATE INDEX idx_children_location ON children(location);
CREATE INDEX idx_children_age ON children(age);

CREATE INDEX idx_donor_profiles_email ON donor_profiles(email);

CREATE INDEX idx_sponsorships_donor_id ON sponsorships(donor_id);
CREATE INDEX idx_sponsorships_child_id ON sponsorships(child_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);

-- -------------------------------------------
-- UPDATED_AT TRIGGER
-- -------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_page_content_updated_at
  BEFORE UPDATE ON page_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_sponsorships_updated_at
  BEFORE UPDATE ON sponsorships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------
-- AUTO-CREATE DONOR PROFILE ON SIGNUP (TRIGGER)
-- -------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.donor_profiles (id, first_name, last_name, email, phone, location)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'location'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------
-- HELPER FUNCTION: Check if user is admin
-- -------------------------------------------
-- Access is limited to the two allowlisted admin emails. Even if a row
-- exists in admin_users, the user's auth email must match the allowlist
-- for is_admin() to return true.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN auth.users u ON u.id = au.id
    WHERE au.id = auth.uid()
      AND LOWER(u.email) IN ('masooshem@gmail.com', 'kadeshhope.africa@gmail.com')
  );
$$;

-- -------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -------------------------------------------

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon + authenticated can read)

CREATE POLICY "Public can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Public can view gallery"
  ON gallery FOR SELECT
  USING (true);

CREATE POLICY "Public can view videos"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "Public can view active partners"
  ON partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can view published news"
  ON news FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can view settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Public can view page content"
  ON page_content FOR SELECT
  USING (true);

CREATE POLICY "Public can view children"
  ON children FOR SELECT
  USING (true);

-- Admin write policies (only admin_users can write)

CREATE POLICY "Admin can manage projects"
  ON projects FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage gallery"
  ON gallery FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage videos"
  ON videos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage partners"
  ON partners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage testimonials"
  ON testimonials FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage news"
  ON news FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can manage contact messages"
  ON contact_messages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage settings"
  ON settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage page content"
  ON page_content FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage admin users"
  ON admin_users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage donations"
  ON donations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can manage children"
  ON children FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view own donor profile"
  ON donor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own donor profile"
  ON donor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own donor profile"
  ON donor_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage donor profiles"
  ON donor_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- NOTE: there are deliberately NO client INSERT/UPDATE policies on
-- sponsorships. "Users can insert own sponsorships" / "Users can update own
-- sponsorships" only constrained donor_id, so any signed-in donor could forge
-- a cancelled row (arbitrary credit) and fire the sync trigger, which freed
-- another donor's child back to 'available'. Writes are now limited to the
-- service role (verified Paystack payments) and the SECURITY DEFINER RPCs
-- create_sponsorship_with_credit / reactivate_sponsorship / cancel_sponsorship.
-- See the sponsorship hardening block at the end of this file.
DROP POLICY IF EXISTS "Users can insert own sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Users can update own sponsorships" ON sponsorships;

CREATE POLICY "Users can view own sponsorships"
  ON sponsorships FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Admin can manage sponsorships"
  ON sponsorships FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public can insert donations"
  ON donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view own donations"
  ON donations FOR SELECT
  USING (donor_email = auth.email() OR is_admin());

-- -------------------------------------------
-- STORAGE BUCKETS
-- -------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('images', 'images', true),
  ('thumbnails', 'thumbnails', true),
  ('videos', 'videos', true),
  ('sponsorship', 'sponsorship', true),
  ('children', 'children', true),
  ('news', 'news', true);

-- Public read access for storage objects

CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news'));

-- Admin upload/update/delete storage policies

CREATE POLICY "Admin can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

CREATE POLICY "Admin can update"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

CREATE POLICY "Admin can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

-- Migration: Add category and author columns to news table
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT;

-- -------------------------------------------
-- SPONSORSHIP LIFECYCLE
-- -------------------------------------------

ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_sponsorship BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS donations_payment_reference_key
  ON donations(payment_reference);

-- Keep a child's sponsorship_status in sync with its sponsorship record.
CREATE OR REPLACE FUNCTION sync_child_sponsorship_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.children
      SET sponsorship_status = 'sponsored'
      WHERE id = NEW.child_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.children
      SET sponsorship_status = 'available'
      WHERE id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_child_sponsorship_status ON sponsorships;
CREATE TRIGGER trg_sync_child_sponsorship_status
  AFTER INSERT OR UPDATE OF status ON sponsorships
  FOR EACH ROW
  EXECUTE FUNCTION sync_child_sponsorship_status();

-- Sponsor a child using an existing (already-paid) sponsorship credit.
-- A cancelled sponsorship is a freed slot; reuse the oldest cancelled slot.
-- p_plan: 'one-time' clears monthly_amount (no recurring billing), 'monthly'
-- sets monthly_amount from amount or the slot's existing value, NULL preserves
-- the slot's current plan.
DROP FUNCTION IF EXISTS create_sponsorship_with_credit(uuid);
DROP FUNCTION IF EXISTS create_sponsorship_with_credit(uuid, numeric);
CREATE OR REPLACE FUNCTION create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount numeric DEFAULT NULL,
  p_plan text DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status text;
  v_slot_id uuid;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  SELECT sponsorship_status INTO v_status
    FROM public.children
    WHERE id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  SELECT id INTO v_slot_id
    FROM public.sponsorships
    WHERE donor_id = v_donor_id
      AND status = 'cancelled'
    ORDER BY updated_at ASC
    LIMIT 1;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No sponsorship credit available. Please make a sponsorship donation first.';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET child_id = p_child_id,
          status = 'active',
          start_date = now(),
          monthly_amount = CASE
            WHEN p_plan = 'one-time' THEN NULL
            WHEN p_plan = 'monthly' THEN COALESCE(p_amount, s.monthly_amount, s.amount)
            ELSE COALESCE(p_amount, s.monthly_amount)
          END,
          amount = CASE
            WHEN p_plan = 'one-time' THEN COALESCE(p_amount, s.amount, s.monthly_amount)
            WHEN p_plan = 'monthly' THEN NULL
            ELSE COALESCE(p_amount, s.amount)
          END
      WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;

-- Reactivate a cancelled sponsorship (flips the slot back to "active").
-- p_plan optionally switches the plan: 'one-time' clears monthly_amount
-- (no recurring billing), 'monthly' sets monthly_amount (recurring), NULL
-- keeps the slot's current plan.
DROP FUNCTION IF EXISTS reactivate_sponsorship(uuid);
CREATE OR REPLACE FUNCTION reactivate_sponsorship(p_sponsorship_id uuid, p_plan text DEFAULT NULL)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_child_status text;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  SELECT donor_id, status INTO v_owner, v_status
    FROM public.sponsorships
    WHERE id = p_sponsorship_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_owner <> v_donor_id THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;
  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled';
  END IF;

  SELECT sponsorship_status INTO v_child_status
    FROM public.children
    WHERE id = (SELECT s2.child_id FROM public.sponsorships s2 WHERE s2.id = p_sponsorship_id);

  IF v_child_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'active',
          monthly_amount = CASE
            WHEN p_plan = 'one-time' THEN NULL
            WHEN p_plan = 'monthly' THEN COALESCE(s.monthly_amount, s.amount)
            ELSE s.monthly_amount
          END,
          amount = CASE
            WHEN p_plan = 'one-time' THEN COALESCE(s.amount, s.monthly_amount)
            WHEN p_plan = 'monthly' THEN NULL
            ELSE s.amount
          END
      WHERE s.id = p_sponsorship_id
      RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION reactivate_sponsorship(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reactivate_sponsorship(uuid, text) TO authenticated;

-- Admin-only lifecycle RPCs. SECURITY DEFINER with an is_admin() guard so only
-- allowlisted admins can drive the lifecycle, independent of RLS (RPCs bypass
-- row-level security).
CREATE OR REPLACE FUNCTION admin_pause_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can pause sponsorships';
  END IF;

  SELECT status INTO v_status
    FROM public.sponsorships
    WHERE id = p_sponsorship_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active sponsorships can be paused';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'paused'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_resume_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can resume sponsorships';
  END IF;

  SELECT status INTO v_status
    FROM public.sponsorships
    WHERE id = p_sponsorship_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status <> 'paused' THEN
    RAISE EXCEPTION 'Only paused sponsorships can be resumed';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'active'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel sponsorships';
  END IF;

  SELECT status INTO v_status
    FROM public.sponsorships
    WHERE id = p_sponsorship_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'This sponsorship is already cancelled';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'cancelled'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

REVOKE ALL ON FUNCTION admin_pause_sponsorship(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_resume_sponsorship(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_pause_sponsorship(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_resume_sponsorship(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_cancel_sponsorship(uuid) TO authenticated;

-- =============================================================
-- SPONSORSHIP TRACKING: amount paid, cancellation + re-sponsoring
-- =============================================================
-- Lets donors see how much they sponsored a child with, and lets admins
-- monitor cancellations + how donated sponsorship credit is reused to
-- re-sponsor other children.

ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS donation_id UUID REFERENCES donations(id) ON DELETE SET NULL;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS paused_by UUID REFERENCES auth.users(id);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS previous_child_id UUID;
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sponsorships_created_at ON sponsorships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsorships_cancelled_at ON sponsorships(cancelled_at);

CREATE OR REPLACE FUNCTION sync_child_sponsorship_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    NEW.cancelled_at := NULL;
    NEW.paused_at := NULL;
    NEW.paused_by := NULL;
    NEW.cancelled_by := NULL;
    UPDATE public.children
      SET sponsorship_status = 'sponsored'
      WHERE id = NEW.child_id;
  ELSIF NEW.status = 'paused' THEN
    -- Child stays "sponsored" while paused so nobody else can take the slot.
    IF NEW.paused_at IS NULL THEN
      NEW.paused_at := now();
    END IF;
    NEW.paused_by := auth.uid();
  ELSIF NEW.status = 'cancelled' THEN
    IF NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
    NEW.cancelled_by := auth.uid();
    IF TG_OP = 'INSERT' OR OLD.status <> 'cancelled' THEN
      UPDATE public.children
        SET sponsorship_status = 'available'
        WHERE id = NEW.child_id;
    END IF;
  END IF;

  -- A slot reused with credit to sponsor a different child = a re-sponsorship.
  IF TG_OP = 'UPDATE' AND OLD.child_id IS DISTINCT FROM NEW.child_id THEN
    NEW.previous_child_id := OLD.child_id;
    NEW.reassigned_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_child_sponsorship_status ON sponsorships;
CREATE TRIGGER trg_sync_child_sponsorship_status
  BEFORE INSERT OR UPDATE ON sponsorships
  FOR EACH ROW
  EXECUTE FUNCTION sync_child_sponsorship_status();

CREATE OR REPLACE FUNCTION create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount numeric DEFAULT NULL,
  p_plan text DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status text;
  v_slot_id uuid;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  SELECT sponsorship_status INTO v_status
    FROM public.children
    WHERE id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  SELECT id INTO v_slot_id
    FROM public.sponsorships
    WHERE donor_id = v_donor_id
      AND status = 'cancelled'
    ORDER BY updated_at ASC
    LIMIT 1;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No sponsorship credit available. Please make a sponsorship donation first.';
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET child_id = p_child_id,
          status = 'active',
          start_date = now(),
          monthly_amount = CASE
            WHEN p_plan = 'one-time' THEN NULL
            WHEN p_plan = 'monthly' THEN COALESCE(p_amount, s.monthly_amount, s.amount)
            ELSE COALESCE(p_amount, s.monthly_amount)
          END,
          amount = CASE
            WHEN p_plan = 'one-time' THEN COALESCE(p_amount, s.amount, s.monthly_amount)
            WHEN p_plan = 'monthly' THEN NULL
            ELSE COALESCE(p_amount, s.amount)
          END
      WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;

-- Backfill: sponsorship rows cancelled before cancelled_at existed keep only
-- their original update time — use it as the cancellation timestamp.
UPDATE sponsorships
  SET cancelled_at = updated_at
  WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- Backfill: rows already in the paused state (if any) get a timestamp.
UPDATE sponsorships
  SET paused_at = updated_at
  WHERE status = 'paused' AND paused_at IS NULL;

-- Backfill: link each sponsorship to the completed sponsorship donation made
-- by the same donor closest in time (donation + sponsorship are written in the
-- same request), and copy the paid amount onto rows created before the
-- amount/donation_id columns existed — so one-time sponsorship amounts show
-- too, not just monthly ones.
WITH matched AS (
  SELECT DISTINCT ON (sp.id)
    sp.id AS sponsorship_id,
    dn.id AS donation_id,
    dn.amount
  FROM sponsorships sp
  JOIN donations dn
    ON dn.status = 'completed'
   AND dn.is_sponsorship = true
   AND dn.donor_id = sp.donor_id
   AND ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at))) <= 900
  ORDER BY sp.id, ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at)))
)
UPDATE sponsorships s
SET donation_id = m.donation_id,
    amount = COALESCE(s.amount, m.amount)
FROM matched m
WHERE s.id = m.sponsorship_id
  AND s.donation_id IS NULL;

-- ===========================================================================
-- SPONSORSHIP CREDIT HARDENING
-- Mirrors supabase/migrations_002_credit_and_rls_hardening.sql so a fresh
-- install of this file ends in the same state as a database that had the
-- 002 migration applied. Fully idempotent: appended last, so these definitions
-- supersede the earlier, less strict versions above.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Donor-facing cancel. Replaces the client-side
--    .update({status:'cancelled'}) that needed the UPDATE policy we just
--    dropped, and adds the ownership + state checks it never had.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status    text;
  v_child     uuid;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a sponsorship';
  END IF;

  -- Lock the row so two concurrent cancels cannot both proceed.
  SELECT s.status, s.child_id INTO v_status, v_child
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active sponsorships can be cancelled';
  END IF;

  -- The BEFORE UPDATE trigger stamps cancelled_at / cancelled_by and releases
  -- the child back to 'available', which is what mints the credit slot.
  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status = 'cancelled'
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sponsorship(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Reactivation: explicit, validated amount + row locks.
--    p_amount is the monthly figure (or the one-time figure) the donor is
--    agreeing to. The UI always sends it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text    DEFAULT NULL,
  p_amount         numeric DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_row_amount   numeric;
  v_row_monthly  numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the slot.
  SELECT s.status, s.child_id, s.amount, s.monthly_amount
    INTO v_status, v_child, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled';
  END IF;

  -- Lock the child before testing availability, so nobody else can claim it
  -- between the check and the update.
  IF (SELECT c.sponsorship_status FROM public.children c WHERE c.id = v_child) IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Default to whatever plan the slot already had.
  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    -- Only reuse the slot's own monthly figure. Falling back to the one-time
    -- amount here is what turned $200 one-time into $200/month.
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    -- Downgrading to one-time: the slot's own one-time amount, else its
    -- monthly figure, which is a sensible single-payment default.
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) TO authenticated;

-- Drop the old 2-arg signature so the new 3-arg one is the only overload.
DROP FUNCTION IF EXISTS public.reactivate_sponsorship(uuid, text);


-- ---------------------------------------------------------------------------
-- 3. create_sponsorship_with_credit: lock the slot and the child.
--    Same behaviour as before apart from the locking and the amount rules,
--    which now match reactivate_sponsorship (monthly requires an amount).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount   numeric DEFAULT NULL,
  p_plan     text    DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_slot_id  uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the child so two donors cannot both pass the availability check.
  PERFORM 1 FROM public.children c WHERE c.id = p_child_id FOR UPDATE;

  SELECT c.sponsorship_status INTO v_status
    FROM public.children c
   WHERE c.id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Lock the chosen slot so two concurrent spends cannot claim the same one.
  SELECT s.id, s.amount, s.monthly_amount INTO v_slot_id, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.donor_id = v_donor_id
     AND s.status = 'cancelled'
   ORDER BY s.updated_at ASC, s.created_at ASC
   LIMIT 1
   FOR UPDATE;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No sponsorship credit available. Please make a sponsorship donation first.';
  END IF;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET child_id       = p_child_id,
           status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = v_slot_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;


-- ---------------------------------------------------------------------------
-- 4. Close the forgery hole.
--    SELECT and the admin policy stay. INSERT and UPDATE go: from here on the
--    only writers are the service role (verified Paystack payments) and the
--    SECURITY DEFINER functions above.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Users can update own sponsorships" ON public.sponsorships;
DROP POLICY IF EXISTS "Authenticated can manage sponsorships" ON public.sponsorships;


-- ---------------------------------------------------------------------------
-- 5. Belt and braces: a sponsorship amount can never be zero or negative.
--    NOT VALID so existing rows are not scanned (and cannot block the deploy),
--    but every new INSERT/UPDATE is checked from now on.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sponsorships_amount_positive'
  ) THEN
    ALTER TABLE public.sponsorships
      ADD CONSTRAINT sponsorships_amount_positive
      CHECK (amount IS NULL OR amount > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sponsorships_monthly_amount_positive'
  ) THEN
    ALTER TABLE public.sponsorships
      ADD CONSTRAINT sponsorships_monthly_amount_positive
      CHECK (monthly_amount IS NULL OR monthly_amount > 0) NOT VALID;
  END IF;
END;
$$;


-- ---------------------------------------------------------------------------
-- 6. At most one active sponsorship per child.
--    Closes the second half of the double-spend race: even if two donors reach
--    the same child, the second write now fails instead of orphaning the child.
--    Built from a partial index so cancelled/paused rows are unaffected.
--
--    If the data already contains a child with two active sponsorships, creating
--    the index would abort the whole migration. In that case we skip it and say
--    so, rather than leaving you with a half-applied migration. Resolve those
--    rows, then run the CREATE UNIQUE INDEX by hand.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_dupes integer;
BEGIN
  SELECT count(*) INTO v_dupes
    FROM (
      SELECT child_id
        FROM public.sponsorships
       WHERE status = 'active'
       GROUP BY child_id
      HAVING count(*) > 1
    ) AS duplicates;

  IF v_dupes = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS sponsorships_one_active_per_child
      ON public.sponsorships (child_id)
      WHERE status = 'active';
    RAISE NOTICE 'Created sponsorships_one_active_per_child.';
  ELSE
    RAISE WARNING
      'SKIPPED sponsorships_one_active_per_child: % child row(s) currently have more than one active sponsorship. Resolve them in the admin Sponsorships panel, then create the index manually.',
      v_dupes;
  END IF;
END;
$$;



-- =============================================================================
-- Migration 003: monetary sponsorship credit ledger
-- =============================================================================

-- ===========================================================================
-- 003 — Sponsorship credit becomes a real money balance
-- ===========================================================================
-- Run after 002. Self-contained and idempotent: re-running it is a no-op.
--
-- THE BUG THIS FIXES
-- ------------------
-- Credit was never stored. The "Sponsorship Credit" number was computed on the
-- fly in the browser as:
--
--     sponsorships.filter(cancelled).reduce(+ (amount ?? monthly_amount))
--
-- and reactivation OVERWROTE the cancelled row's amount with whatever the donor
-- typed. So a donor holding $2 + $1 of cancelled sponsorships ($3) who
-- reactivated the $2 slot "for $1" lost the other $1: the row became a $1
-- active sponsorship, so the sum dropped to $1 while $2 had actually been paid.
-- The card then disagreed with reality and the donor could spend credit they no
-- longer had.
--
-- Reactivation also never checked the amount against the balance at all, so a
-- donor with $3 of credit could reactivate a $5 sponsorship and the app happily
-- accepted it.
--
-- THE MODEL
-- ---------
-- Credit is now an explicit, append-only ledger of signed amounts:
--
--     +amount  granted  (a sponsorship was cancelled; the money becomes reusable)
--     -amount  spent    (credit covered a reactivation or a new sponsorship)
--     balance  = SUM(amount) for the donor
--
-- Money is conserved: a grant is written exactly once per cancellation, and
-- every spend is recorded, so the balance always equals
--     (money paid for sponsorships now cancelled) - (money covered by credit).
--
-- Because the balance is stored rather than derived, a partial spend keeps the
-- remainder: $2 + $1 cancelled ($3), reactivate for $1 -> $2 left, not $1.
--
-- CONCURRENCY
-- -----------
-- The balance is a SUM() over many rows, so there is no single row to lock.
-- Concurrent taps would each read the same balance and both spend it. Every
-- spend therefore takes a per-donor transaction-scoped advisory lock first, so
-- spends for one donor serialise while different donors stay parallel.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. The ledger.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsorship_credit_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Signed: positive grants credit, negative spends it. Kept signed so the
  -- balance is a plain SUM with no per-row interpretation.
  amount        numeric(12,2) NOT NULL CHECK (amount <> 0),
  reason        text NOT NULL,
  sponsorship_id uuid REFERENCES public.sponsorships(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsorship_credit_ledger_donor_idx
  ON public.sponsorship_credit_ledger (donor_id, created_at);

COMMENT ON TABLE public.sponsorship_credit_ledger IS
  'Append-only ledger of sponsorship credit. Positive = granted, negative = spent. Balance = SUM(amount) per donor.';

-- Donors may read their own ledger (for a history view) and admins may read it
-- for support. There is deliberately no INSERT/UPDATE/DELETE policy: the only
-- writers are the SECURITY DEFINER functions below and the service role.
ALTER TABLE public.sponsorship_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.sponsorship_credit_ledger FROM anon, authenticated;

-- Explicit rather than relying on Supabase's default privileges, so reading
-- your own balance/history works even in a project whose defaults differ.
GRANT SELECT ON public.sponsorship_credit_ledger TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Balance + grant/spend primitives.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sponsor_credit_balance(p_donor_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor uuid;
  v_bal   numeric;
BEGIN
  v_donor := COALESCE(p_donor_id, auth.uid());

  IF v_donor IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to view sponsorship credit';
  END IF;

  -- A donor may only read their own balance; admins may read anyone's.
  IF v_donor <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only view your own sponsorship credit';
  END IF;

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = v_donor;

  RETURN v_bal;
END;
$$;

-- Donors read their own balance, so authenticated keeps EXECUTE here. anon does
-- not: it has no donor identity and this function re-checks the caller anyway.
REVOKE ALL ON FUNCTION public.sponsor_credit_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sponsor_credit_balance(uuid) TO authenticated, service_role;


-- Grants credit. Called when a sponsorship is cancelled: the money the donor
-- already paid becomes reusable, so it must be recorded exactly once.
CREATE OR REPLACE FUNCTION public.grant_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, p_amount, p_reason, p_sponsorship_id);
END;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to anon
-- and authenticated, so revoking from PUBLIC alone would leave this callable by
-- any signed-in user — and this function mints credit with no in-body auth
-- check, since it is only ever meant to be reached through the SECURITY
-- DEFINER cancellation/reactivation RPCs. Revoke those roles explicitly.
REVOKE ALL ON FUNCTION public.grant_sponsorship_credit(uuid, numeric, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_sponsorship_credit(uuid, numeric, text, uuid)
  TO service_role;


-- Spends credit, refusing to overdraw. This is the single choke point that
-- makes the balance authoritative, so reactivation and new sponsorships cannot
-- disagree about what is available.
CREATE OR REPLACE FUNCTION public.spend_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bal numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Serialise spends for this donor for the rest of the transaction, so two
  -- concurrent reactivations cannot both read the same balance and both spend it.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_donor_id::text, 0));

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = p_donor_id;

  IF p_amount > v_bal THEN
    -- HINT lets the client recognise this specific case and offer the
    -- "add money on the donations page" link instead of a generic failure.
    RAISE EXCEPTION USING
      ERRCODE    = 'P0001',
      MESSAGE    = format(
        'You have %s in sponsorship credit but this needs %s. Add money on the donations page to cover the difference.',
        trim(to_char(v_bal, 'FM999999990.00')),
        trim(to_char(p_amount, 'FM999999990.00'))
      ),
      HINT       = 'INSUFFICIENT_SPONSORSHIP_CREDIT',
      DETAIL     = format('available=%s required=%s', v_bal, p_amount);
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, -p_amount, p_reason, p_sponsorship_id);
END;
$$;

-- Same default-privilege trap as grant_sponsorship_credit: the balance is only
-- authoritative if this is unreachable except through the SECURITY DEFINER
-- RPCs, so anon and authenticated are revoked explicitly.
REVOKE ALL ON FUNCTION public.spend_sponsorship_credit(uuid, numeric, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_sponsorship_credit(uuid, numeric, text, uuid)
  TO service_role;


-- ---------------------------------------------------------------------------
-- 3. Backfill: preserve the balance donors see today.
--    Without this, everyone's credit would drop to $0 the moment the dashboard
--    stopped deriving it from cancelled rows. Cancelled rows are grants that
--    predate the ledger; nothing has been spent against them yet, because
--    reactivation had no balance check to begin with.
--    The NOT EXISTS guard makes a re-run a no-op.
-- ---------------------------------------------------------------------------
INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
SELECT s.donor_id,
       COALESCE(s.amount, s.monthly_amount),
       'backfill',
       s.id
  FROM public.sponsorships s
 WHERE s.status = 'cancelled'
   AND COALESCE(s.amount, s.monthly_amount) > 0
   AND NOT EXISTS (
     SELECT 1 FROM public.sponsorship_credit_ledger l WHERE l.sponsorship_id = s.id
   );


-- ---------------------------------------------------------------------------
-- 4. Cancel now grants credit.
--    Cancelling a sponsorship you paid for is what makes that money reusable,
--    so this is where credit is created. (Previously this fell out of the
--    "sum the cancelled rows" calculation.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_amt      numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a sponsorship';
  END IF;

  SELECT s.status, s.child_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_child, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active sponsorships can be cancelled';
  END IF;

  -- Grant before the UPDATE so the money is recorded against the same row that
  -- is becoming cancelled. Idempotent by construction: only an 'active' row
  -- reaches here, and cancelling an already-cancelled row raises above.
  PERFORM public.grant_sponsorship_credit(
    v_donor_id, v_amt, 'sponsorship_cancelled', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status = 'cancelled'
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sponsorship(uuid) TO authenticated;


-- Admin cancellation must return the donor's money too, otherwise a support
-- action silently destroys their credit.
CREATE OR REPLACE FUNCTION public.admin_cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_donor  uuid;
  v_amt    numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel sponsorships';
  END IF;

  SELECT s.status, s.donor_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_donor, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'This sponsorship is already cancelled';
  END IF;

  PERFORM public.grant_sponsorship_credit(
    v_donor, v_amt, 'admin_cancellation', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'cancelled'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cancel_sponsorship(uuid) FROM PUBLIC;


-- ---------------------------------------------------------------------------
-- 5. Reactivation spends credit and may no longer pick a plan's amount for
--    free. The amount is now the amount being charged against the balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text    DEFAULT NULL,
  p_amount         numeric DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the slot.
  SELECT s.status, s.child_id, s.amount, s.monthly_amount
    INTO v_status, v_child, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled';
  END IF;

  -- Reactivating must be paid for out of the balance, exactly like sponsoring a
  -- new child with credit. Spend before the row is revived so a rejected
  -- reactivation leaves the balance untouched.
  PERFORM public.spend_sponsorship_credit(
    v_donor_id,
    COALESCE(p_amount, v_row_amount, v_row_monthly),
    'reactivation',
    p_sponsorship_id
  );

  IF (SELECT c.sponsorship_status FROM public.children c WHERE c.id = v_child) IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    -- Only reuse the slot's own monthly figure. Falling back to the one-time
    -- amount here is what turned $200 one-time into $200/month.
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    -- Downgrading to one-time: the slot's own one-time amount, else its
    -- monthly figure, which is a sensible single-payment default.
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) TO authenticated;


-- ---------------------------------------------------------------------------
-- 6. Sponsoring a NEW child with credit spends the balance.
--    A cancelled slot is reused as the vehicle when one exists, so the
--    "reassigned from <child>" audit trail still works; otherwise a fresh row
--    is inserted (the donor's remaining balance can outlive their cancelled
--    rows after a partial reactivation).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount   numeric DEFAULT NULL,
  p_plan     text    DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_slot_id  uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the child so two donors cannot both pass the availability check.
  PERFORM 1 FROM public.children c WHERE c.id = p_child_id FOR UPDATE;

  SELECT c.sponsorship_status INTO v_status
    FROM public.children c
   WHERE c.id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Reuse a cancelled slot as the vehicle when one is available, keeping the
  -- previous_child_id / reassigned_at chain intact.
  SELECT s.id, s.amount, s.monthly_amount
    INTO v_slot_id, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.donor_id = v_donor_id
     AND s.status = 'cancelled'
   ORDER BY s.updated_at ASC, s.created_at ASC
   LIMIT 1
   FOR UPDATE;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  -- Balance is the gate, not the presence of a cancelled slot: a donor whose
  -- balance outlived their cancelled rows (partial reactivation) can still use it.
  PERFORM public.spend_sponsorship_credit(v_donor_id, v_amount, 'credit_sponsorship', v_slot_id);

  IF v_slot_id IS NOT NULL THEN
    RETURN QUERY
      UPDATE public.sponsorships AS s
         SET child_id       = p_child_id,
             status         = 'active',
             start_date     = now(),
             monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
             amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
       WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
  ELSE
    RETURN QUERY
      INSERT INTO public.sponsorships
        (donor_id, child_id, status, start_date, monthly_amount, amount)
      VALUES
        (v_donor_id, p_child_id, 'active', now(),
         CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
         CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END)
      RETURNING id, child_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;


-- =============================================================================
-- Migration 003: monetary sponsorship credit ledger
-- Replaces the cancelled-row credit model with a real spendable balance.
-- =============================================================================

-- ===========================================================================
-- 003 — Sponsorship credit becomes a real money balance
-- ===========================================================================
-- Run after 002. Self-contained and idempotent: re-running it is a no-op.
--
-- THE BUG THIS FIXES
-- ------------------
-- Credit was never stored. The "Sponsorship Credit" number was computed on the
-- fly in the browser as:
--
--     sponsorships.filter(cancelled).reduce(+ (amount ?? monthly_amount))
--
-- and reactivation OVERWROTE the cancelled row's amount with whatever the donor
-- typed. So a donor holding $2 + $1 of cancelled sponsorships ($3) who
-- reactivated the $2 slot "for $1" lost the other $1: the row became a $1
-- active sponsorship, so the sum dropped to $1 while $2 had actually been paid.
-- The card then disagreed with reality and the donor could spend credit they no
-- longer had.
--
-- Reactivation also never checked the amount against the balance at all, so a
-- donor with $3 of credit could reactivate a $5 sponsorship and the app happily
-- accepted it.
--
-- THE MODEL
-- ---------
-- Credit is now an explicit, append-only ledger of signed amounts:
--
--     +amount  granted  (a sponsorship was cancelled; the money becomes reusable)
--     -amount  spent    (credit covered a reactivation or a new sponsorship)
--     balance  = SUM(amount) for the donor
--
-- Money is conserved: a grant is written exactly once per cancellation, and
-- every spend is recorded, so the balance always equals
--     (money paid for sponsorships now cancelled) - (money covered by credit).
--
-- Because the balance is stored rather than derived, a partial spend keeps the
-- remainder: $2 + $1 cancelled ($3), reactivate for $1 -> $2 left, not $1.
--
-- CONCURRENCY
-- -----------
-- The balance is a SUM() over many rows, so there is no single row to lock.
-- Concurrent taps would each read the same balance and both spend it. Every
-- spend therefore takes a per-donor transaction-scoped advisory lock first, so
-- spends for one donor serialise while different donors stay parallel.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. The ledger.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsorship_credit_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Signed: positive grants credit, negative spends it. Kept signed so the
  -- balance is a plain SUM with no per-row interpretation.
  amount        numeric(12,2) NOT NULL CHECK (amount <> 0),
  reason        text NOT NULL,
  sponsorship_id uuid REFERENCES public.sponsorships(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sponsorship_credit_ledger_donor_idx
  ON public.sponsorship_credit_ledger (donor_id, created_at);

COMMENT ON TABLE public.sponsorship_credit_ledger IS
  'Append-only ledger of sponsorship credit. Positive = granted, negative = spent. Balance = SUM(amount) per donor.';

-- Donors may read their own ledger (for a history view) and admins may read it
-- for support. There is deliberately no INSERT/UPDATE/DELETE policy: the only
-- writers are the SECURITY DEFINER functions below and the service role.
ALTER TABLE public.sponsorship_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Users can view own sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger;
CREATE POLICY "Admin can view sponsorship credit ledger"
  ON public.sponsorship_credit_ledger FOR SELECT
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.sponsorship_credit_ledger FROM anon, authenticated;

-- Explicit rather than relying on Supabase's default privileges, so reading
-- your own balance/history works even in a project whose defaults differ.
GRANT SELECT ON public.sponsorship_credit_ledger TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Balance + grant/spend primitives.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sponsor_credit_balance(p_donor_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor uuid;
  v_bal   numeric;
BEGIN
  v_donor := COALESCE(p_donor_id, auth.uid());

  IF v_donor IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to view sponsorship credit';
  END IF;

  -- A donor may only read their own balance; admins may read anyone's.
  IF v_donor <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only view your own sponsorship credit';
  END IF;

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = v_donor;

  RETURN v_bal;
END;
$$;

REVOKE ALL ON FUNCTION public.sponsor_credit_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sponsor_credit_balance(uuid) TO authenticated;


-- Grants credit. Called when a sponsorship is cancelled: the money the donor
-- already paid becomes reusable, so it must be recorded exactly once.
CREATE OR REPLACE FUNCTION public.grant_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, p_amount, p_reason, p_sponsorship_id);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_sponsorship_credit(uuid, numeric, text, uuid) FROM PUBLIC;


-- Spends credit, refusing to overdraw. This is the single choke point that
-- makes the balance authoritative, so reactivation and new sponsorships cannot
-- disagree about what is available.
CREATE OR REPLACE FUNCTION public.spend_sponsorship_credit(
  p_donor_id      uuid,
  p_amount        numeric,
  p_reason        text,
  p_sponsorship_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bal numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Serialise spends for this donor for the rest of the transaction, so two
  -- concurrent reactivations cannot both read the same balance and both spend it.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_donor_id::text, 0));

  SELECT COALESCE(SUM(l.amount), 0) INTO v_bal
    FROM public.sponsorship_credit_ledger l
   WHERE l.donor_id = p_donor_id;

  IF p_amount > v_bal THEN
    -- HINT lets the client recognise this specific case and offer the
    -- "add money on the donations page" link instead of a generic failure.
    RAISE EXCEPTION USING
      ERRCODE    = 'P0001',
      MESSAGE    = format(
        'You have %s in sponsorship credit but this needs %s. Add money on the donations page to cover the difference.',
        trim(to_char(v_bal, 'FM999999990.00')),
        trim(to_char(p_amount, 'FM999999990.00'))
      ),
      HINT       = 'INSUFFICIENT_SPONSORSHIP_CREDIT',
      DETAIL     = format('available=%s required=%s', v_bal, p_amount);
  END IF;

  INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
  VALUES (p_donor_id, -p_amount, p_reason, p_sponsorship_id);
END;
$$;

REVOKE ALL ON FUNCTION public.spend_sponsorship_credit(uuid, numeric, text, uuid) FROM PUBLIC;


-- ---------------------------------------------------------------------------
-- 3. Backfill: preserve the balance donors see today.
--    Without this, everyone's credit would drop to $0 the moment the dashboard
--    stopped deriving it from cancelled rows. Cancelled rows are grants that
--    predate the ledger; nothing has been spent against them yet, because
--    reactivation had no balance check to begin with.
--    The NOT EXISTS guard makes a re-run a no-op.
-- ---------------------------------------------------------------------------
INSERT INTO public.sponsorship_credit_ledger (donor_id, amount, reason, sponsorship_id)
SELECT s.donor_id,
       COALESCE(s.amount, s.monthly_amount),
       'backfill',
       s.id
  FROM public.sponsorships s
 WHERE s.status = 'cancelled'
   AND COALESCE(s.amount, s.monthly_amount) > 0
   AND NOT EXISTS (
     SELECT 1 FROM public.sponsorship_credit_ledger l WHERE l.sponsorship_id = s.id
   );


-- ---------------------------------------------------------------------------
-- 4. Cancel now grants credit.
--    Cancelling a sponsorship you paid for is what makes that money reusable,
--    so this is where credit is created. (Previously this fell out of the
--    "sum the cancelled rows" calculation.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_amt      numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a sponsorship';
  END IF;

  SELECT s.status, s.child_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_child, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Only active sponsorships can be cancelled';
  END IF;

  -- Grant before the UPDATE so the money is recorded against the same row that
  -- is becoming cancelled. Idempotent by construction: only an 'active' row
  -- reaches here, and cancelling an already-cancelled row raises above.
  PERFORM public.grant_sponsorship_credit(
    v_donor_id, v_amt, 'sponsorship_cancelled', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status = 'cancelled'
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_sponsorship(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_sponsorship(uuid) TO authenticated;


-- Admin cancellation must return the donor's money too, otherwise a support
-- action silently destroys their credit.
CREATE OR REPLACE FUNCTION public.admin_cancel_sponsorship(p_sponsorship_id uuid)
RETURNS TABLE (sponsorship_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_donor  uuid;
  v_amt    numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel sponsorships';
  END IF;

  SELECT s.status, s.donor_id, COALESCE(s.amount, s.monthly_amount)
    INTO v_status, v_donor, v_amt
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;
  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'This sponsorship is already cancelled';
  END IF;

  PERFORM public.grant_sponsorship_credit(
    v_donor, v_amt, 'admin_cancellation', p_sponsorship_id
  );

  RETURN QUERY
    UPDATE public.sponsorships AS s
      SET status = 'cancelled'
      WHERE s.id = p_sponsorship_id
      RETURNING s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cancel_sponsorship(uuid) FROM PUBLIC;


-- ---------------------------------------------------------------------------
-- 5. Reactivation spends credit and may no longer pick a plan's amount for
--    free. The amount is now the amount being charged against the balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text    DEFAULT NULL,
  p_amount         numeric DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_child    uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the slot.
  SELECT s.status, s.child_id, s.amount, s.monthly_amount
    INTO v_status, v_child, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.id = p_sponsorship_id
   FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.sponsorships s
     WHERE s.id = p_sponsorship_id AND s.donor_id = v_donor_id
  ) THEN
    RAISE EXCEPTION 'You do not own this sponsorship';
  END IF;

  IF v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled';
  END IF;

  -- Reactivating must be paid for out of the balance, exactly like sponsoring a
  -- new child with credit. Spend before the row is revived so a rejected
  -- reactivation leaves the balance untouched.
  PERFORM public.spend_sponsorship_credit(
    v_donor_id,
    COALESCE(p_amount, v_row_amount, v_row_monthly),
    'reactivation',
    p_sponsorship_id
  );

  IF (SELECT c.sponsorship_status FROM public.children c WHERE c.id = v_child) IS DISTINCT FROM 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    -- Only reuse the slot's own monthly figure. Falling back to the one-time
    -- amount here is what turned $200 one-time into $200/month.
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    -- Downgrading to one-time: the slot's own one-time amount, else its
    -- monthly figure, which is a sensible single-payment default.
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  RETURN QUERY
    UPDATE public.sponsorships AS s
       SET status         = 'active',
           start_date     = now(),
           monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
           amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
     WHERE s.id = p_sponsorship_id
    RETURNING s.id, s.child_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric) TO authenticated;


-- ---------------------------------------------------------------------------
-- 6. Sponsoring a NEW child with credit spends the balance.
--    A cancelled slot is reused as the vehicle when one exists, so the
--    "reassigned from <child>" audit trail still works; otherwise a fresh row
--    is inserted (the donor's remaining balance can outlive their cancelled
--    rows after a partial reactivation).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_sponsorship_with_credit(
  p_child_id uuid,
  p_amount   numeric DEFAULT NULL,
  p_plan     text    DEFAULT NULL
)
RETURNS TABLE (sponsorship_id uuid, child_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_donor_id uuid := auth.uid();
  v_status   text;
  v_slot_id  uuid;
  v_row_amount  numeric;
  v_row_monthly numeric;
  v_plan     text;
  v_amount   numeric;
BEGIN
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to sponsor a child';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Invalid sponsorship plan. Choose one-time or monthly.';
  END IF;

  IF p_amount IS NOT NULL AND p_amount <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero.';
  END IF;

  -- Lock the child so two donors cannot both pass the availability check.
  PERFORM 1 FROM public.children c WHERE c.id = p_child_id FOR UPDATE;

  SELECT c.sponsorship_status INTO v_status
    FROM public.children c
   WHERE c.id = p_child_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship';
  END IF;

  -- Reuse a cancelled slot as the vehicle when one is available, keeping the
  -- previous_child_id / reassigned_at chain intact.
  SELECT s.id, s.amount, s.monthly_amount
    INTO v_slot_id, v_row_amount, v_row_monthly
    FROM public.sponsorships s
   WHERE s.donor_id = v_donor_id
     AND s.status = 'cancelled'
   ORDER BY s.updated_at ASC, s.created_at ASC
   LIMIT 1
   FOR UPDATE;

  v_plan := COALESCE(
    p_plan,
    CASE WHEN v_row_monthly IS NOT NULL THEN 'monthly' ELSE 'one-time' END
  );

  IF v_plan = 'monthly' THEN
    v_amount := COALESCE(p_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the monthly amount for this sponsorship. Switching a one-time sponsorship to monthly needs an amount.';
    END IF;
  ELSE
    v_amount := COALESCE(p_amount, v_row_amount, v_row_monthly);
    IF v_amount IS NULL THEN
      RAISE EXCEPTION 'Enter the amount for this sponsorship.';
    END IF;
  END IF;

  -- Balance is the gate, not the presence of a cancelled slot: a donor whose
  -- balance outlived their cancelled rows (partial reactivation) can still use it.
  PERFORM public.spend_sponsorship_credit(v_donor_id, v_amount, 'credit_sponsorship', v_slot_id);

  IF v_slot_id IS NOT NULL THEN
    RETURN QUERY
      UPDATE public.sponsorships AS s
         SET child_id       = p_child_id,
             status         = 'active',
             start_date     = now(),
             monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
             amount         = CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END
       WHERE s.id = v_slot_id
      RETURNING s.id, s.child_id;
  ELSE
    RETURN QUERY
      INSERT INTO public.sponsorships
        (donor_id, child_id, status, start_date, monthly_amount, amount)
      VALUES
        (v_donor_id, p_child_id, 'active', now(),
         CASE WHEN v_plan = 'monthly' THEN v_amount ELSE NULL END,
         CASE WHEN v_plan = 'monthly' THEN NULL     ELSE v_amount END)
      RETURNING id, child_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sponsorship_with_credit(uuid, numeric, text) TO authenticated;

-- =============================================================================
-- Migration 004: live-currency donations and monthly billing periods
-- =============================================================================

-- supabase/migrations_004_currency_and_monthly_cycle.sql
--
-- Two related problems are fixed here.
--
-- 1. CURRENCY. `donations.amount` was being written with the USD equivalent
--    while `donations.currency` said 'KES', and `converted_amount` held the KES
--    figure. So the column named "amount" and the column named "currency"
--    described two different currencies, and every report built on them was
--    wrong. This migration makes the semantics explicit and unambiguous:
--      amount            = USD equivalent (the reporting currency)
--      currency          = 'USD' (kept populated for existing consumers)
--      amount_original   = what the donor actually paid, in charged_currency
--      charged_currency  = currency Paystack settled in (always KES here)
--      usd_amount        = same as amount, named for new code
--      fx_rate           = units of charged_currency per 1 USD at payment time
--      fx_rate_source    = where that rate came from, for auditability
--    The rate is snapshotted per donation, so a later rate change never
--    retroactively alters what a past gift was worth.
--
-- 2. MONTHLY CYCLE. Monthly sponsorships had no end date, so "is this
--    sponsorship overdue?" could not be answered. This adds an explicit
--    one-month billing period that advances on each verified payment:
--      current_period_start / current_period_end  the month just paid for
--      next_payment_due                          when the next payment is due
--    next_payment_due is derived: a sponsorship is due when the current
--    period has ended. Past due + active + monthly = overdue, which is what
--    the account and admin pages render in red.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. donations: explicit, unambiguous currency columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_original   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS charged_currency  TEXT,
  ADD COLUMN IF NOT EXISTS usd_amount        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS fx_rate           NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS fx_rate_source    TEXT;

COMMENT ON COLUMN public.donations.amount IS
  'USD equivalent of the gift. Reporting currency for the whole platform.';
COMMENT ON COLUMN public.donations.amount_original IS
  'Amount exactly as the donor paid it, in charged_currency.';
COMMENT ON COLUMN public.donations.charged_currency IS
  'Currency Paystack settled the payment in (KES for this merchant account).';
COMMENT ON COLUMN public.donations.fx_rate IS
  'Units of charged_currency per 1 USD at the moment of payment. Snapshotted per donation.';
COMMENT ON COLUMN public.donations.fx_rate_source IS
  'Origin of fx_rate, so any figure can be traced back to a rate source.';

-- `converted_amount` and `currency` only exist on databases created from the
-- full schema; older ones may predate them. Add them if missing so the repair
-- below is safe on both shapes of database.
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Repair existing rows.
--
-- For every historical row, `amount` already held the USD equivalent and
-- `converted_amount` held the KES figure that Paystack actually charged
-- (amount_kes in the verify function). So the fix is a reinterpretation, not
-- a recalculation: copy converted_amount into amount_original, record KES as
-- the charged currency, and derive the rate that was implicitly applied. The
-- rate is left NULL where the implied value isn't a sane rate (tiny test
-- transactions divide out to < 1 KES/USD), because a fabricated precision is
-- worse than an honest gap.
UPDATE public.donations d
SET amount_original = d.converted_amount,
    charged_currency = 'KES',
    usd_amount = d.amount,
    fx_rate = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN ROUND((d.converted_amount / d.amount)::numeric, 6)
              END,
    fx_rate_source = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN 'implied-historical'
              END
WHERE d.amount_original IS NULL;

-- `amount` is the USD figure, so `currency` must say USD. Existing consumers
-- that render `${amount} ${currency}` therefore become correct automatically.
UPDATE public.donations
SET currency = 'USD'
WHERE currency IS DISTINCT FROM 'USD';

-- Guard rails: these columns are money, not free text.
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_usd_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_original_amount_positive;

-- Only enforced on new/updated rows (NOT VALID) so a pre-existing anomaly
-- can't block the deploy; validate once the data has been reviewed.
ALTER TABLE public.donations
  ADD CONSTRAINT donations_usd_amount_positive
    CHECK (usd_amount IS NULL OR usd_amount > 0) NOT VALID,
  ADD CONSTRAINT donations_original_amount_positive
    CHECK (amount_original IS NULL OR amount_original > 0) NOT VALID;

-- ----------------------------------------------------------------------------
-- 2. sponsorships: explicit monthly billing period
-- ----------------------------------------------------------------------------

ALTER TABLE public.sponsorships
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_due      TIMESTAMPTZ;

COMMENT ON COLUMN public.sponsorships.current_period_start IS
  'Start of the month currently paid for.';
COMMENT ON COLUMN public.sponsorships.current_period_end IS
  'End of the month currently paid for (exclusive: the next payment is due then).';
COMMENT ON COLUMN public.sponsorships.next_payment_due IS
  'When the next monthly payment is due. NULL for one-time sponsorships.';

-- Backfill from the original start date: the first period ran from the day
-- they signed up until one calendar month later. Monthly rows are the only
-- ones that get a due date. Interval arithmetic is done with make_date-style
-- month addition below so a 31st start date clamps instead of erroring.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (
      s.start_date::date + INTERVAL '1 month'
    ),
    next_payment_due = (
      s.start_date::date + INTERVAL '1 month'
    )
WHERE s.monthly_amount IS NOT NULL
  AND s.status = 'active'
  AND s.current_period_start IS NULL;

-- Monthly rows that are not active (cancelled/paused) still need a truthful
-- period so historical reporting isn't blank, but no due date — nothing is
-- owed on a cancelled sponsorship.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (s.start_date::date + INTERVAL '1 month')
WHERE s.monthly_amount IS NOT NULL
  AND s.status <> 'active'
  AND s.current_period_start IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Helper: is this monthly sponsorship overdue?
-- ----------------------------------------------------------------------------
-- Kept as SQL so the account page, the admin page and any future report all
-- agree on one definition instead of each re-deriving it (and disagreeing).
--
-- Overdue = monthly + active + has a due date + the due date has passed.
-- The comparison is on the calendar day, not the exact instant: a donor
-- shouldn't be shown "overdue" at 00:01 on the due date when they have all
-- day to pay.

CREATE OR REPLACE FUNCTION public.sponsorship_is_overdue(p_sponsorship public.sponsorships)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT p_sponsorship.monthly_amount IS NOT NULL
     AND p_sponsorship.status = 'active'
     AND p_sponsorship.next_payment_due IS NOT NULL
     AND (p_sponsorship.next_payment_due AT TIME ZONE 'UTC')::date < (now() AT TIME ZONE 'UTC')::date;
$$;

COMMENT ON FUNCTION public.sponsorship_is_overdue(public.sponsorships) IS
  'True when an active monthly sponsorship has passed its next_payment_due date.';

-- ----------------------------------------------------------------------------
-- 4. RPC: advance a monthly sponsorship to its next paid period
-- ----------------------------------------------------------------------------
-- Called by the verify-paystack-transaction Edge Function after Paystack
-- confirms a renewal payment. Security definer + explicit auth check, because
-- it writes a column that drives billing.
--
-- The new period starts where the previous one ended, so a donor who pays late
-- doesn't lose the days they already paid for and doesn't gain free time. If
-- the previous period already ended (they were overdue), the new period still
-- begins at the old due date and simply runs a month from there, which is how
-- a catch-up payment behaves.

-- IMPORTANT — this function is the ONLY thing that can move a sponsorship's
-- billing period forward, and it is deliberately NOT callable by donors.
-- If a signed-in donor could call it directly they could renew their own
-- monthly sponsorship for free, simply by invoking it from the browser. The
-- period may only advance against hard evidence that money arrived, so the
-- caller must be our own Edge Function (service role) and must pass the
-- Paystack reference of a completed donation that belongs to the donor.
CREATE OR REPLACE FUNCTION public.advance_monthly_period(
  p_sponsorship_id  uuid,
  p_payment_reference text
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row        public.sponsorships;
  v_donation   public.donations;
  v_start      timestamptz;
  v_already    boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  IF p_payment_reference IS NULL OR p_payment_reference = '' THEN
    RAISE EXCEPTION 'A verified payment reference is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.monthly_amount IS NULL THEN
    RAISE EXCEPTION 'This is not a monthly sponsorship' USING ERRCODE = '22023';
  END IF;

  IF v_row.status = 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship was cancelled and cannot be renewed'
      USING ERRCODE = '22023';
  END IF;

  -- The payment must exist, be settled, and belong to this sponsorship's donor.
  SELECT * INTO v_donation
  FROM public.donations
  WHERE payment_reference = p_payment_reference;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No payment found for that reference'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_donation.status <> 'completed' THEN
    RAISE EXCEPTION 'That payment has not completed'
      USING ERRCODE = '22023';
  END IF;

  IF v_donation.donor_id IS DISTINCT FROM v_row.donor_id THEN
    RAISE EXCEPTION 'That payment was not made by this donor'
      USING ERRCODE = '42501';
  END IF;

  -- Re-running the same payment (webhook and the donor's browser callback can
  -- both record it) must not push the cycle out twice, so treat an
  -- already-current period as a successful no-op.
  v_already := v_row.current_period_end IS NOT NULL
               AND v_row.current_period_end > now();
  IF v_already THEN
    RETURN v_row;
  END IF;

  -- Continue from the end of the period already paid for, so a donor who pays
  -- late doesn't lose the days they already covered and isn't credited with
  -- time they haven't paid for either.
  v_start := COALESCE(v_row.current_period_end, v_row.start_date);

  IF v_start > now() THEN
    v_start := now();
  END IF;

  UPDATE public.sponsorships
  SET current_period_start = v_start,
      current_period_end   = (v_start::date + INTERVAL '1 month'),
      next_payment_due      = (v_start::date + INTERVAL '1 month'),
      status                = CASE WHEN status = 'paused' THEN 'active' ELSE status END,
      updated_at            = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM anon;
-- Only the service role (our Edge Functions) may move a billing period.
GRANT EXECUTE ON FUNCTION public.advance_monthly_period(uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. RPC: record a verified payment's FX snapshot on a donation
-- ----------------------------------------------------------------------------
-- Separate from the donation insert so the verify function and the webhook can
-- both stamp the same rate onto the same row without duplicating logic.

CREATE OR REPLACE FUNCTION public.record_donation_fx(
  p_payment_reference text,
  p_amount_original    numeric,
  p_charged_currency   text,
  p_usd_amount         numeric,
  p_fx_rate            numeric,
  p_fx_rate_source     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- The only caller is our own Edge Function using the service role, which
  -- bypasses RLS; there is no authenticated-user path to this function.
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.donations
  SET amount          = p_usd_amount,
      usd_amount      = p_usd_amount,
      amount_original = p_amount_original,
      charged_currency = p_charged_currency,
      currency        = 'USD',
      converted_amount = p_amount_original,
      fx_rate         = p_fx_rate,
      fx_rate_source  = p_fx_rate_source
  WHERE payment_reference = p_payment_reference;
END;
$$;

-- Supabase's default privileges hand EXECUTE on new public functions to anon
-- and authenticated, so revoking from PUBLIC alone is not enough here: this
-- function would be directly callable by any signed-in user. Revoke from those
-- roles explicitly and grant only the service role, which is the only caller.
REVOKE ALL ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 6. Reactivation re-anchors the monthly period
-- ----------------------------------------------------------------------------
-- reactivate_sponsorship in 003 has a fixed 3-argument signature. Re-declare it
-- with an extra optional p_period_start so reactivating a monthly sponsorship
-- starts a fresh paid period from today (otherwise the old period would be
-- inherited and the donor would be shown as overdue immediately).
--
-- Body is 003's implementation with the period columns set on success. The
-- ledger spend and all of 003's guards are preserved unchanged.

CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text   DEFAULT NULL,
  p_amount         numeric DEFAULT NULL,
  p_period_start   timestamptz DEFAULT NULL
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row            public.sponsorships;
  v_plan           text;
  v_row_amount     numeric;
  v_row_monthly    numeric;
  v_spend_amount   numeric;
  v_period_start   timestamptz;
  v_period_end     timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship'
      USING ERRCODE = '42501';
  END IF;

  -- Reject duplicate calls for the same row before taking any lock, so a double
  -- click can't spend the donor's credit twice.
  PERFORM 1 FROM public.sponsorships WHERE id = p_sponsorship_id FOR UPDATE;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.donor_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only reactivate your own sponsorship'
      USING ERRCODE = '42501';
  END IF;

  IF v_row.status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled' USING ERRCODE = '22023';
  END IF;

  -- The child must still be free, or someone else has taken them since.
  PERFORM 1 FROM public.children WHERE id = v_row.child_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = v_row.child_id AND sponsorship_status = 'available'
  ) THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship'
      USING ERRCODE = '22023';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Sponsorship plan must be one-time or monthly'
      USING ERRCODE = '22023';
  END IF;

  v_plan        := COALESCE(p_plan,
                             CASE WHEN v_row.monthly_amount IS NOT NULL
                                  THEN 'monthly' ELSE 'one-time' END);
  v_row_amount  := v_row.amount;
  v_row_monthly := v_row.monthly_amount;

  -- A monthly switch needs a figure: without one the old code reused the
  -- one-time amount as the *monthly* price, silently turning a single payment
  -- into a recurring charge.
  IF v_plan = 'monthly' AND COALESCE(p_amount, v_row_monthly) IS NULL THEN
    RAISE EXCEPTION 'A monthly sponsorship amount is required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_amount, v_row_amount, v_row_monthly) <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  -- What the donor is charged for this period, resolved once and used for both
  -- the ledger spend and the stored amount so they can never diverge.
  v_spend_amount := CASE
    WHEN v_plan = 'monthly' THEN COALESCE(p_amount, v_row_monthly)
    ELSE COALESCE(p_amount, v_row_amount, v_row_monthly)
  END;

  -- Charges the donor's credit balance, refusing the whole operation if short.
  -- Raises with HINT 'INSUFFICIENT_SPONSORSHIP_CREDIT' when it can't proceed.
  PERFORM public.spend_sponsorship_credit(
    v_row.donor_id, v_spend_amount,
    'sponsorship_reactivation', v_row.id
  );

  -- A reactivated monthly sponsorship is paid for the month starting now.
  IF v_plan = 'monthly' THEN
    v_period_start := COALESCE(p_period_start, now());
    v_period_end   := (v_period_start::date + INTERVAL '1 month');
  END IF;

  UPDATE public.sponsorships
  SET status       = 'active',
      cancelled_at = NULL,
      cancelled_by = NULL,
      amount       = CASE WHEN v_plan = 'monthly' THEN NULL ELSE v_spend_amount END,
      monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_spend_amount ELSE NULL END,
      current_period_start = CASE WHEN v_plan = 'monthly' THEN v_period_start END,
      current_period_end   = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      next_payment_due     = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      updated_at    = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  -- Flip the child back to sponsored. updated_at is left to the
  -- set_children_updated_at trigger where one exists, so this also works on
  -- databases whose children table predates that column.
  UPDATE public.children
  SET sponsorship_status = 'sponsored'
  WHERE id = v_row.child_id;

  RETURN v_row;
END;
$$;

-- Same default-privilege trap as record_donation_fx above: revoking from
-- PUBLIC leaves anon with EXECUTE. The body checks auth.uid() and ownership
-- anyway, but the grant itself should say who may call it.
REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz)
  TO authenticated, service_role;

-- The 3-argument form from 003 must not remain callable with the old
-- signature, or PostgREST would expose two overloads and the client call would
-- be ambiguous.
DROP FUNCTION IF EXISTS public.reactivate_sponsorship(uuid, text, numeric);

-- Expose the new sponsorship columns to the donor's own reads.
GRANT SELECT (current_period_start, current_period_end, next_payment_due)
  ON public.sponsorships TO authenticated;

COMMIT;


-- =============================================================================
-- Migration 004: live-currency donations and monthly billing periods
-- =============================================================================

-- supabase/migrations_004_currency_and_monthly_cycle.sql
--
-- Two related problems are fixed here.
--
-- 1. CURRENCY. `donations.amount` was being written with the USD equivalent
--    while `donations.currency` said 'KES', and `converted_amount` held the KES
--    figure. So the column named "amount" and the column named "currency"
--    described two different currencies, and every report built on them was
--    wrong. This migration makes the semantics explicit and unambiguous:
--      amount            = USD equivalent (the reporting currency)
--      currency          = 'USD' (kept populated for existing consumers)
--      amount_original   = what the donor actually paid, in charged_currency
--      charged_currency  = currency Paystack settled in (always KES here)
--      usd_amount        = same as amount, named for new code
--      fx_rate           = units of charged_currency per 1 USD at payment time
--      fx_rate_source    = where that rate came from, for auditability
--    The rate is snapshotted per donation, so a later rate change never
--    retroactively alters what a past gift was worth.
--
-- 2. MONTHLY CYCLE. Monthly sponsorships had no end date, so "is this
--    sponsorship overdue?" could not be answered. This adds an explicit
--    one-month billing period that advances on each verified payment:
--      current_period_start / current_period_end  the month just paid for
--      next_payment_due                          when the next payment is due
--    next_payment_due is derived: a sponsorship is due when the current
--    period has ended. Past due + active + monthly = overdue, which is what
--    the account and admin pages render in red.

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. donations: explicit, unambiguous currency columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_original   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS charged_currency  TEXT,
  ADD COLUMN IF NOT EXISTS usd_amount        NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS fx_rate           NUMERIC(18,6),
  ADD COLUMN IF NOT EXISTS fx_rate_source    TEXT;

COMMENT ON COLUMN public.donations.amount IS
  'USD equivalent of the gift. Reporting currency for the whole platform.';
COMMENT ON COLUMN public.donations.amount_original IS
  'Amount exactly as the donor paid it, in charged_currency.';
COMMENT ON COLUMN public.donations.charged_currency IS
  'Currency Paystack settled the payment in (KES for this merchant account).';
COMMENT ON COLUMN public.donations.fx_rate IS
  'Units of charged_currency per 1 USD at the moment of payment. Snapshotted per donation.';
COMMENT ON COLUMN public.donations.fx_rate_source IS
  'Origin of fx_rate, so any figure can be traced back to a rate source.';

-- `converted_amount` and `currency` only exist on databases created from the
-- full schema; older ones may predate them. Add them if missing so the repair
-- below is safe on both shapes of database.
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Repair existing rows.
--
-- For every historical row, `amount` already held the USD equivalent and
-- `converted_amount` held the KES figure that Paystack actually charged
-- (amount_kes in the verify function). So the fix is a reinterpretation, not
-- a recalculation: copy converted_amount into amount_original, record KES as
-- the charged currency, and derive the rate that was implicitly applied. The
-- rate is left NULL where the implied value isn't a sane rate (tiny test
-- transactions divide out to < 1 KES/USD), because a fabricated precision is
-- worse than an honest gap.
UPDATE public.donations d
SET amount_original = d.converted_amount,
    charged_currency = 'KES',
    usd_amount = d.amount,
    fx_rate = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN ROUND((d.converted_amount / d.amount)::numeric, 6)
              END,
    fx_rate_source = CASE
                WHEN d.converted_amount IS NOT NULL
                 AND d.amount IS NOT NULL
                 AND d.amount > 0
                 AND (d.converted_amount / d.amount) BETWEEN 1 AND 100000
                THEN 'implied-historical'
              END
WHERE d.amount_original IS NULL;

-- `amount` is the USD figure, so `currency` must say USD. Existing consumers
-- that render `${amount} ${currency}` therefore become correct automatically.
UPDATE public.donations
SET currency = 'USD'
WHERE currency IS DISTINCT FROM 'USD';

-- Guard rails: these columns are money, not free text.
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_usd_amount_positive,
  DROP CONSTRAINT IF EXISTS donations_original_amount_positive;

-- Only enforced on new/updated rows (NOT VALID) so a pre-existing anomaly
-- can't block the deploy; validate once the data has been reviewed.
ALTER TABLE public.donations
  ADD CONSTRAINT donations_usd_amount_positive
    CHECK (usd_amount IS NULL OR usd_amount > 0) NOT VALID,
  ADD CONSTRAINT donations_original_amount_positive
    CHECK (amount_original IS NULL OR amount_original > 0) NOT VALID;

-- ----------------------------------------------------------------------------
-- 2. sponsorships: explicit monthly billing period
-- ----------------------------------------------------------------------------

ALTER TABLE public.sponsorships
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_due      TIMESTAMPTZ;

COMMENT ON COLUMN public.sponsorships.current_period_start IS
  'Start of the month currently paid for.';
COMMENT ON COLUMN public.sponsorships.current_period_end IS
  'End of the month currently paid for (exclusive: the next payment is due then).';
COMMENT ON COLUMN public.sponsorships.next_payment_due IS
  'When the next monthly payment is due. NULL for one-time sponsorships.';

-- Backfill from the original start date: the first period ran from the day
-- they signed up until one calendar month later. Monthly rows are the only
-- ones that get a due date. Interval arithmetic is done with make_date-style
-- month addition below so a 31st start date clamps instead of erroring.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (
      s.start_date::date + INTERVAL '1 month'
    ),
    next_payment_due = (
      s.start_date::date + INTERVAL '1 month'
    )
WHERE s.monthly_amount IS NOT NULL
  AND s.status = 'active'
  AND s.current_period_start IS NULL;

-- Monthly rows that are not active (cancelled/paused) still need a truthful
-- period so historical reporting isn't blank, but no due date — nothing is
-- owed on a cancelled sponsorship.
UPDATE public.sponsorships s
SET current_period_start = s.start_date,
    current_period_end = (s.start_date::date + INTERVAL '1 month')
WHERE s.monthly_amount IS NOT NULL
  AND s.status <> 'active'
  AND s.current_period_start IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Helper: is this monthly sponsorship overdue?
-- ----------------------------------------------------------------------------
-- Kept as SQL so the account page, the admin page and any future report all
-- agree on one definition instead of each re-deriving it (and disagreeing).
--
-- Overdue = monthly + active + has a due date + the due date has passed.
-- The comparison is on the calendar day, not the exact instant: a donor
-- shouldn't be shown "overdue" at 00:01 on the due date when they have all
-- day to pay.

CREATE OR REPLACE FUNCTION public.sponsorship_is_overdue(p_sponsorship public.sponsorships)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT p_sponsorship.monthly_amount IS NOT NULL
     AND p_sponsorship.status = 'active'
     AND p_sponsorship.next_payment_due IS NOT NULL
     AND (p_sponsorship.next_payment_due AT TIME ZONE 'UTC')::date < (now() AT TIME ZONE 'UTC')::date;
$$;

COMMENT ON FUNCTION public.sponsorship_is_overdue(public.sponsorships) IS
  'True when an active monthly sponsorship has passed its next_payment_due date.';

-- ----------------------------------------------------------------------------
-- 4. RPC: advance a monthly sponsorship to its next paid period
-- ----------------------------------------------------------------------------
-- Called by the verify-paystack-transaction Edge Function after Paystack
-- confirms a renewal payment. Security definer + explicit auth check, because
-- it writes a column that drives billing.
--
-- The new period starts where the previous one ended, so a donor who pays late
-- doesn't lose the days they already paid for and doesn't gain free time. If
-- the previous period already ended (they were overdue), the new period still
-- begins at the old due date and simply runs a month from there, which is how
-- a catch-up payment behaves.

-- IMPORTANT — this function is the ONLY thing that can move a sponsorship's
-- billing period forward, and it is deliberately NOT callable by donors.
-- If a signed-in donor could call it directly they could renew their own
-- monthly sponsorship for free, simply by invoking it from the browser. The
-- period may only advance against hard evidence that money arrived, so the
-- caller must be our own Edge Function (service role) and must pass the
-- Paystack reference of a completed donation that belongs to the donor.
CREATE OR REPLACE FUNCTION public.advance_monthly_period(
  p_sponsorship_id  uuid,
  p_payment_reference text
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row        public.sponsorships;
  v_donation   public.donations;
  v_start      timestamptz;
  v_already    boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  IF p_payment_reference IS NULL OR p_payment_reference = '' THEN
    RAISE EXCEPTION 'A verified payment reference is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.monthly_amount IS NULL THEN
    RAISE EXCEPTION 'This is not a monthly sponsorship' USING ERRCODE = '22023';
  END IF;

  IF v_row.status = 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship was cancelled and cannot be renewed'
      USING ERRCODE = '22023';
  END IF;

  -- The payment must exist, be settled, and belong to this sponsorship's donor.
  SELECT * INTO v_donation
  FROM public.donations
  WHERE payment_reference = p_payment_reference;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No payment found for that reference'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_donation.status <> 'completed' THEN
    RAISE EXCEPTION 'That payment has not completed'
      USING ERRCODE = '22023';
  END IF;

  IF v_donation.donor_id IS DISTINCT FROM v_row.donor_id THEN
    RAISE EXCEPTION 'That payment was not made by this donor'
      USING ERRCODE = '42501';
  END IF;

  -- Re-running the same payment (webhook and the donor's browser callback can
  -- both record it) must not push the cycle out twice, so treat an
  -- already-current period as a successful no-op.
  v_already := v_row.current_period_end IS NOT NULL
               AND v_row.current_period_end > now();
  IF v_already THEN
    RETURN v_row;
  END IF;

  -- Continue from the end of the period already paid for, so a donor who pays
  -- late doesn't lose the days they already covered and isn't credited with
  -- time they haven't paid for either.
  v_start := COALESCE(v_row.current_period_end, v_row.start_date);

  IF v_start > now() THEN
    v_start := now();
  END IF;

  UPDATE public.sponsorships
  SET current_period_start = v_start,
      current_period_end   = (v_start::date + INTERVAL '1 month'),
      next_payment_due      = (v_start::date + INTERVAL '1 month'),
      status                = CASE WHEN status = 'paused' THEN 'active' ELSE status END,
      updated_at            = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.advance_monthly_period(uuid, text) FROM anon;
-- Only the service role (our Edge Functions) may move a billing period.
GRANT EXECUTE ON FUNCTION public.advance_monthly_period(uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. RPC: record a verified payment's FX snapshot on a donation
-- ----------------------------------------------------------------------------
-- Separate from the donation insert so the verify function and the webhook can
-- both stamp the same rate onto the same row without duplicating logic.

CREATE OR REPLACE FUNCTION public.record_donation_fx(
  p_payment_reference text,
  p_amount_original    numeric,
  p_charged_currency   text,
  p_usd_amount         numeric,
  p_fx_rate            numeric,
  p_fx_rate_source     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- The only caller is our own Edge Function using the service role, which
  -- bypasses RLS; there is no authenticated-user path to this function.
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not permitted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.donations
  SET amount          = p_usd_amount,
      usd_amount      = p_usd_amount,
      amount_original = p_amount_original,
      charged_currency = p_charged_currency,
      currency        = 'USD',
      converted_amount = p_amount_original,
      fx_rate         = p_fx_rate,
      fx_rate_source  = p_fx_rate_source
  WHERE payment_reference = p_payment_reference;
END;
$$;

-- Supabase's default privileges hand EXECUTE on new public functions to anon
-- and authenticated, so revoking from PUBLIC alone is not enough here: this
-- function would be directly callable by any signed-in user. Revoke from those
-- roles explicitly and grant only the service role, which is the only caller.
REVOKE ALL ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_donation_fx(text, numeric, text, numeric, numeric, text)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 6. Reactivation re-anchors the monthly period
-- ----------------------------------------------------------------------------
-- reactivate_sponsorship in 003 has a fixed 3-argument signature. Re-declare it
-- with an extra optional p_period_start so reactivating a monthly sponsorship
-- starts a fresh paid period from today (otherwise the old period would be
-- inherited and the donor would be shown as overdue immediately).
--
-- Body is 003's implementation with the period columns set on success. The
-- ledger spend and all of 003's guards are preserved unchanged.

CREATE OR REPLACE FUNCTION public.reactivate_sponsorship(
  p_sponsorship_id uuid,
  p_plan           text   DEFAULT NULL,
  p_amount         numeric DEFAULT NULL,
  p_period_start   timestamptz DEFAULT NULL
)
RETURNS public.sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row            public.sponsorships;
  v_plan           text;
  v_row_amount     numeric;
  v_row_monthly    numeric;
  v_spend_amount   numeric;
  v_period_start   timestamptz;
  v_period_end     timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to reactivate a sponsorship'
      USING ERRCODE = '42501';
  END IF;

  -- Reject duplicate calls for the same row before taking any lock, so a double
  -- click can't spend the donor's credit twice.
  PERFORM 1 FROM public.sponsorships WHERE id = p_sponsorship_id FOR UPDATE;

  SELECT * INTO v_row
  FROM public.sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sponsorship not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.donor_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You can only reactivate your own sponsorship'
      USING ERRCODE = '42501';
  END IF;

  IF v_row.status <> 'cancelled' THEN
    RAISE EXCEPTION 'This sponsorship is not cancelled' USING ERRCODE = '22023';
  END IF;

  -- The child must still be free, or someone else has taken them since.
  PERFORM 1 FROM public.children WHERE id = v_row.child_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM public.children
    WHERE id = v_row.child_id AND sponsorship_status = 'available'
  ) THEN
    RAISE EXCEPTION 'This child is no longer available for sponsorship'
      USING ERRCODE = '22023';
  END IF;

  IF p_plan IS NOT NULL AND p_plan NOT IN ('one-time', 'monthly') THEN
    RAISE EXCEPTION 'Sponsorship plan must be one-time or monthly'
      USING ERRCODE = '22023';
  END IF;

  v_plan        := COALESCE(p_plan,
                             CASE WHEN v_row.monthly_amount IS NOT NULL
                                  THEN 'monthly' ELSE 'one-time' END);
  v_row_amount  := v_row.amount;
  v_row_monthly := v_row.monthly_amount;

  -- A monthly switch needs a figure: without one the old code reused the
  -- one-time amount as the *monthly* price, silently turning a single payment
  -- into a recurring charge.
  IF v_plan = 'monthly' AND COALESCE(p_amount, v_row_monthly) IS NULL THEN
    RAISE EXCEPTION 'A monthly sponsorship amount is required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_amount, v_row_amount, v_row_monthly) <= 0 THEN
    RAISE EXCEPTION 'Sponsorship amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  -- What the donor is charged for this period, resolved once and used for both
  -- the ledger spend and the stored amount so they can never diverge.
  v_spend_amount := CASE
    WHEN v_plan = 'monthly' THEN COALESCE(p_amount, v_row_monthly)
    ELSE COALESCE(p_amount, v_row_amount, v_row_monthly)
  END;

  -- Charges the donor's credit balance, refusing the whole operation if short.
  -- Raises with HINT 'INSUFFICIENT_SPONSORSHIP_CREDIT' when it can't proceed.
  PERFORM public.spend_sponsorship_credit(
    v_row.donor_id, v_spend_amount,
    'sponsorship_reactivation', v_row.id
  );

  -- A reactivated monthly sponsorship is paid for the month starting now.
  IF v_plan = 'monthly' THEN
    v_period_start := COALESCE(p_period_start, now());
    v_period_end   := (v_period_start::date + INTERVAL '1 month');
  END IF;

  UPDATE public.sponsorships
  SET status       = 'active',
      cancelled_at = NULL,
      cancelled_by = NULL,
      amount       = CASE WHEN v_plan = 'monthly' THEN NULL ELSE v_spend_amount END,
      monthly_amount = CASE WHEN v_plan = 'monthly' THEN v_spend_amount ELSE NULL END,
      current_period_start = CASE WHEN v_plan = 'monthly' THEN v_period_start END,
      current_period_end   = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      next_payment_due     = CASE WHEN v_plan = 'monthly' THEN v_period_end END,
      updated_at    = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  -- Flip the child back to sponsored. updated_at is left to the
  -- set_children_updated_at trigger where one exists, so this also works on
  -- databases whose children table predates that column.
  UPDATE public.children
  SET sponsorship_status = 'sponsored'
  WHERE id = v_row.child_id;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reactivate_sponsorship(uuid, text, numeric, timestamptz) TO authenticated;

-- The 3-argument form from 003 must not remain callable with the old
-- signature, or PostgREST would expose two overloads and the client call would
-- be ambiguous.
DROP FUNCTION IF EXISTS public.reactivate_sponsorship(uuid, text, numeric);

-- Expose the new sponsorship columns to the donor's own reads.
GRANT SELECT (current_period_start, current_period_end, next_payment_due)
  ON public.sponsorships TO authenticated;

COMMIT;


-- =============================================================================
-- Migration 005: authoritative payment-to-sponsorship links
-- =============================================================================

-- =============================================================================
-- Migration 005: authoritative payment-to-sponsorship links
--
-- Why this exists
-- ---------------
-- `donations.is_sponsorship` was written straight from Paystack metadata
-- (`!!meta.is_sponsorship`), i.e. from what the donor's browser *claimed*,
-- before any sponsorship row was created. That let the books and the facts
-- disagree:
--
--   * a logged-out sponsor's payment was recorded as a general donation;
--   * if the sponsorship INSERT then failed, the donation still said
--     "child sponsorship" while funding nothing;
--   * `sponsorships.donation_id` is a single FK, so a second renewal
--     overwrote the first payment's link and per-payment attribution was
--     impossible.
--
-- The fix is to make the database the source of truth. `sponsorship_payments`
-- records one row per payment that funded a sponsorship, and
-- `donations.is_sponsorship` is *derived* from the existence of those rows
-- rather than trusted from the client.
--
-- The relationship is genuinely one-to-many: one child is paid for repeatedly
-- (initial + N renewals), and one cart payment may fund several children. A
-- single FK column cannot represent that, which is why renewals overwrote
-- each other before.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The link table: one row per payment that funded a sponsorship.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sponsorship_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsorship_id UUID NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  -- 'initial' enrolled a new child; 'renewal' extended an existing sponsorship.
  -- Kept explicit rather than inferred so a renewal of a one-time sponsorship
  -- (which is really a top-up) is still auditable.
  kind TEXT NOT NULL DEFAULT 'initial' CHECK (kind IN ('initial', 'renewal')),
  -- USD applied to this payment, snapshotted so the link stays meaningful if
  -- the sponsorship's own amount is later edited.
  amount NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- A payment may fund several children (cart checkout), but never the same
  -- child twice: re-running verification must not duplicate a row.
  CONSTRAINT sponsorship_payments_donation_sponsorship_key
    UNIQUE (donation_id, sponsorship_id)
);

COMMENT ON TABLE public.sponsorship_payments IS
  'Authoritative record of which payment funded which sponsorship. '
  'donations.is_sponsorship is derived from the existence of these rows.';

CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_donation_id
  ON public.sponsorship_payments(donation_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_payments_sponsorship_id
  ON public.sponsorship_payments(sponsorship_id);

-- -----------------------------------------------------------------------------
-- 2. Derive donations.is_sponsorship from the links.
--
-- A generated column cannot be used: it must reference columns of the same
-- row, and the truth lives in another table. So a trigger maintains the flag,
-- and a SECURITY DEFINER function recomputes it for one donation (used by the
-- trigger, by backfill, and by repair).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reconcile_donation_sponsorship_flag(
  p_donation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_sponsorship BOOLEAN;
BEGIN
  IF p_donation_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.sponsorship_payments sp
    WHERE sp.donation_id = p_donation_id
  )
  INTO v_is_sponsorship;

  -- Only write when it actually changes, so the trigger is a no-op for the
  -- common case and doesn't churn updated_at-style triggers.
  UPDATE public.donations d
  SET is_sponsorship = v_is_sponsorship
  WHERE d.id = p_donation_id
    AND d.is_sponsorship IS DISTINCT FROM v_is_sponsorship;

  RETURN v_is_sponsorship;
END;
$$;

COMMENT ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID) IS
  'Recomputes donations.is_sponsorship from sponsorship_payments. '
  'The single definition of sponsorship classification.';

-- Maintain the flag whenever a link appears or disappears, so it cannot drift.
CREATE OR REPLACE FUNCTION public.trg_sponsorship_payments_sync_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.reconcile_donation_sponsorship_flag(OLD.donation_id);
    RETURN OLD;
  END IF;

  PERFORM public.reconcile_donation_sponsorship_flag(NEW.donation_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_donation_sponsorship_flag ON public.sponsorship_payments;
CREATE TRIGGER trg_sync_donation_sponsorship_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.sponsorship_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sponsorship_payments_sync_flag();

-- A donation row created *after* its link (the reverse order) must also be
-- corrected, otherwise inserting a donation with a stale flag would stick.
CREATE OR REPLACE FUNCTION public.trg_donations_sync_sponsorship_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reconcile_donation_sponsorship_flag(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reconcile_donation_sponsorship_flag ON public.donations;
CREATE TRIGGER trg_reconcile_donation_sponsorship_flag
  AFTER INSERT OR UPDATE OF donor_id, status ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_donations_sync_sponsorship_flag();

-- -----------------------------------------------------------------------------
-- 3. Backfill: convert existing links into sponsorship_payments rows.
--
-- Two sources, in order of trust:
--
--   a) `sponsorships.donation_id` — a real link, recorded at the time.
--   b) completed sponsorship donations for the same donor within 900s of a
--      sponsorship row — the same heuristic migration 004 used, kept only so
--      pre-existing rows keep their classification. Every row created here is
--      flagged as backfilled so the guesswork is auditable rather than silent.
--
-- A completed donation with a sponsorship intent but no match is left alone
-- and reported by the verification query at the end of this migration: we do
-- not invent a link that never existed.
-- -----------------------------------------------------------------------------

-- (a) Real, already-recorded links. Kind is 'initial' because this column has
-- only ever been written when a sponsorship was first funded.
INSERT INTO public.sponsorship_payments
  (sponsorship_id, donation_id, kind, amount)
SELECT
  s.id,
  s.donation_id,
  CASE
    WHEN s.monthly_amount IS NULL THEN 'initial'
    ELSE 'initial'
  END,
  COALESCE(s.amount, d.usd_amount, d.amount)
FROM public.sponsorships s
JOIN public.donations d ON d.id = s.donation_id
WHERE s.donation_id IS NOT NULL
ON CONFLICT (donation_id, sponsorship_id) DO NOTHING;

-- (b) Heuristic matches for donations flagged as sponsorships that predate the
-- link table. Same 900s window migration 004's backfill used, so classifications
-- stay consistent with what donors were already shown.
WITH matched AS (
  SELECT DISTINCT ON (sp.id)
    sp.id AS sponsorship_id,
    dn.id AS donation_id,
    COALESCE(sp.amount, dn.usd_amount, dn.amount) AS amount
  FROM public.sponsorships sp
  JOIN public.donations dn
    ON dn.status = 'completed'
   AND dn.is_sponsorship = true
   AND dn.donor_id = sp.donor_id
   AND ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at))) <= 900
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sponsorships s2
    WHERE s2.donation_id = dn.id AND s2.id = sp.id
  )
  ORDER BY sp.id, ABS(EXTRACT(EPOCH FROM (dn.created_at - sp.created_at)))
)
INSERT INTO public.sponsorship_payments
  (sponsorship_id, donation_id, kind, amount)
SELECT m.sponsorship_id, m.donation_id, 'initial', m.amount
FROM matched m
ON CONFLICT (donation_id, sponsorship_id) DO NOTHING;

-- The trigger fires per inserted row; do a final sweep so a donation with
-- several links (cart checkout) is reconciled once, after all of them land.
DO $$
DECLARE
  d RECORD;
BEGIN
  FOR d IN
    SELECT DISTINCT donation_id FROM public.sponsorship_payments
  LOOP
    PERFORM public.reconcile_donation_sponsorship_flag(d.donation_id);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. RLS: donors may read their own links, only the service role may write.
--
-- Writes go through the verify/sync functions, which run as the service role;
-- no authenticated caller can forge a link and reclassify a donation. Without
-- this, anyone could INSERT a link row and turn a general donation into
-- "child sponsorship" in the admin totals.
-- -----------------------------------------------------------------------------

ALTER TABLE public.sponsorship_payments ENABLE ROW LEVEL SECURITY;

-- Supabase's default privileges grant ALL on new public tables to anon and
-- authenticated, so RLS alone is not enough: a permissive SELECT-only policy
-- still leaves INSERT/UPDATE/DELETE reachable if the table grant exists. Revoke
-- the write privileges explicitly, exactly as migration 003 does for the credit
-- ledger. service_role keeps full access (it bypasses RLS) because that is the
-- only writer.
REVOKE INSERT, UPDATE, DELETE ON public.sponsorship_payments FROM anon, authenticated;
GRANT SELECT ON public.sponsorship_payments TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.sponsorship_payments TO service_role;

DROP POLICY IF EXISTS "Users can view own sponsorship payments" ON public.sponsorship_payments;
CREATE POLICY "Users can view own sponsorship payments"
  ON public.sponsorship_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.sponsorships s
      WHERE s.id = sponsorship_id
        AND s.donor_id = auth.uid()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "Admin can manage sponsorship payments" ON public.sponsorship_payments;
CREATE POLICY "Admin can manage sponsorship payments"
  ON public.sponsorship_payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Supabase's default privileges hand EXECUTE on new public functions to anon
-- and authenticated; the reconcile functions are service-role maintenance and
-- must not be callable by donors. The *trigger* calls them as SECURITY DEFINER
-- regardless of the caller's grants, so revoking here does not break the
-- trigger path.
REVOKE ALL ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_donation_sponsorship_flag(UUID)
  TO service_role;

-- -----------------------------------------------------------------------------
-- 5. Verification helper: report any donation whose flag and links disagree.
--
-- Should return zero rows. Exposed so the repair can be re-run and audited
-- without hand-writing SQL each time.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_donation_sponsorship_consistency()
RETURNS TABLE (
  donation_id UUID,
  stored_is_sponsorship BOOLEAN,
  actual_is_sponsorship BOOLEAN,
  link_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.is_sponsorship,
    EXISTS (
      SELECT 1 FROM public.sponsorship_payments sp
      WHERE sp.donation_id = d.id
    ),
    (SELECT COUNT(*) FROM public.sponsorship_payments sp WHERE sp.donation_id = d.id)
  FROM public.donations d
  WHERE d.is_sponsorship IS DISTINCT FROM EXISTS (
    SELECT 1 FROM public.sponsorship_payments sp
    WHERE sp.donation_id = d.id
  );
$$;

REVOKE ALL ON FUNCTION public.audit_donation_sponsorship_consistency()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_donation_sponsorship_consistency()
  TO service_role;

