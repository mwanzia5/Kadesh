-- =============================================================
-- Kadesh Hope Mission — Supabase SQL Migrations
-- =============================================================
-- Run this ENTIRE file in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- =============================================================

-- 1. Add category + author columns to news table
-- ----------------------------------------------------
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT;

-- 2. Create admin check helper function
--    Replaces all "auth.role() = 'authenticated'" checks
--    with a proper admin_users table lookup.
--    NOTE: search_path is set to '' for security, so the table
--    reference must be schema-qualified (public.admin_users),
--    otherwise Postgres cannot resolve it at CREATE FUNCTION time.
-- ----------------------------------------------------
-- SECURITY: Admin access is limited to the two allowlisted emails below.
-- Even if a row exists in admin_users, the user's auth email must match
-- the allowlist for is_admin() to return true. This is the authoritative
-- server-side gate that backs every RLS policy.
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

-- Purge any existing admin_users rows whose email is not allowlisted, so
-- no other account retains admin access (re-runnable, no-op if clean).
DELETE FROM public.admin_users au
USING auth.users u
WHERE au.id = u.id
  AND LOWER(u.email) NOT IN ('masooshem@gmail.com', 'kadeshhope.africa@gmail.com');

-- 3. Drop old + current policies so this file is truly re-runnable
--    (ignore "policy does not exist" errors — IF EXISTS handles that)
-- ----------------------------------------------------

-- Old permissive policies from the very first schema version
DROP POLICY IF EXISTS "Authenticated can manage projects" ON projects;
DROP POLICY IF EXISTS "Authenticated can manage gallery" ON gallery;
DROP POLICY IF EXISTS "Authenticated can manage videos" ON videos;
DROP POLICY IF EXISTS "Authenticated can manage partners" ON partners;
DROP POLICY IF EXISTS "Authenticated can manage testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated can manage news" ON news;
DROP POLICY IF EXISTS "Authenticated can manage contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Authenticated can manage settings" ON settings;
DROP POLICY IF EXISTS "Authenticated can manage page content" ON page_content;
DROP POLICY IF EXISTS "Authenticated can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated can manage donations" ON donations;
DROP POLICY IF EXISTS "Authenticated can manage children" ON children;
DROP POLICY IF EXISTS "Authenticated can manage donor profiles" ON donor_profiles;
DROP POLICY IF EXISTS "Authenticated can manage sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete images" ON storage.objects;

-- Current policies (dropped here too, so section 4 can safely recreate
-- them every time this file is run, whether they came from the schema
-- file or from a previous run of this migration)
DROP POLICY IF EXISTS "Admin can manage projects" ON projects;
DROP POLICY IF EXISTS "Admin can manage gallery" ON gallery;
DROP POLICY IF EXISTS "Admin can manage videos" ON videos;
DROP POLICY IF EXISTS "Admin can manage partners" ON partners;
DROP POLICY IF EXISTS "Admin can manage testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin can manage news" ON news;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admin can manage contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admin can manage settings" ON settings;
DROP POLICY IF EXISTS "Admin can manage page content" ON page_content;
DROP POLICY IF EXISTS "Admin can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin can manage donations" ON donations;
DROP POLICY IF EXISTS "Public can insert donations" ON donations;
DROP POLICY IF EXISTS "Public can view own donations" ON donations;
DROP POLICY IF EXISTS "Admin can manage children" ON children;
DROP POLICY IF EXISTS "Users can view own donor profile" ON donor_profiles;
DROP POLICY IF EXISTS "Users can insert own donor profile" ON donor_profiles;
DROP POLICY IF EXISTS "Users can update own donor profile" ON donor_profiles;
DROP POLICY IF EXISTS "Admin can manage donor profiles" ON donor_profiles;
DROP POLICY IF EXISTS "Users can view own sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Users can insert own sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Users can update own sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admin can manage sponsorships" ON sponsorships;
DROP POLICY IF EXISTS "Admin can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete" ON storage.objects;

-- 4. Re-create all policies using is_admin()
-- ----------------------------------------------------

-- Projects
CREATE POLICY "Admin can manage projects"
  ON projects FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Gallery
CREATE POLICY "Admin can manage gallery"
  ON gallery FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Videos
CREATE POLICY "Admin can manage videos"
  ON videos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Partners
CREATE POLICY "Admin can manage partners"
  ON partners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Testimonials
CREATE POLICY "Admin can manage testimonials"
  ON testimonials FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- News
CREATE POLICY "Admin can manage news"
  ON news FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Contact messages (public can still insert)
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can manage contact messages"
  ON contact_messages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Settings
CREATE POLICY "Admin can manage settings"
  ON settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Page content
CREATE POLICY "Admin can manage page content"
  ON page_content FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin users
CREATE POLICY "Admin can manage admin users"
  ON admin_users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Donations
CREATE POLICY "Admin can manage donations"
  ON donations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public can insert donations"
  ON donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view own donations"
  ON donations FOR SELECT
  USING (
    donor_id = auth.uid()
    OR LOWER(donor_email) = LOWER(auth.email())
    OR is_admin()
  );

-- One-time backfill: link donations recorded before donor_id was populated
-- to their accounts via donor_profiles (matched case-insensitively on email).
-- Safe to re-run — it only touches rows where donor_id is still NULL.
UPDATE donations d
SET donor_id = p.id
FROM donor_profiles p
WHERE d.donor_id IS NULL
  AND LOWER(d.donor_email) = LOWER(p.email);

-- Children
CREATE POLICY "Admin can manage children"
  ON children FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Donor profiles (admins can view/manage all; users can manage own)
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

-- Sponsorships
CREATE POLICY "Users can view own sponsorships"
  ON sponsorships FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can insert own sponsorships"
  ON sponsorships FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Users can update own sponsorships"
  ON sponsorships FOR UPDATE
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admin can manage sponsorships"
  ON sponsorships FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Storage policies
CREATE POLICY "Admin can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

CREATE POLICY "Admin can update"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

CREATE POLICY "Admin can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('images', 'thumbnails', 'videos', 'sponsorship', 'children', 'news') AND is_admin());

-- 5. Create news storage bucket (if user hasn't already)
-- ----------------------------------------------------
-- NOTE: Buckets can only be created via Supabase dashboard or API.
-- Go to: Storage → New Bucket → Name: "news" → Public: ON
-- Then run this:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('news', 'news', true)
-- ON CONFLICT (id) DO NOTHING;

-- 6. Make yourself an admin
-- ----------------------------------------------------
-- Replace 'YOUR-USER-UUID' with the UUID from:
--   Supabase → Authentication → Users → click your user → copy UUID
--
-- INSERT INTO admin_users (id) VALUES ('YOUR-USER-UUID')
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- VERIFY EVERYTHING WORKED
-- =============================================================
-- Run these queries to confirm:

-- Check is_admin function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'is_admin';

-- Check policies are recreated:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE 'Admin%'
-- ORDER BY tablename;

https://trzmdofcpoqhtvwsjsqq.supabase.co/functions/v1/paystack-webhook