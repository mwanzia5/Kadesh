-- Child privacy
-- -------------
-- Signed-out visitors (the `anon` role) may only see a child's photo, plus
-- the id and availability the website needs to draw the card. Names, ages,
-- locations, schools, families and stories are readable only by signed-in
-- users (the `authenticated` role), which includes donors and admins.
--
-- The website already requests only these columns for signed-out visitors
-- (see PUBLIC_CHILD_COLUMNS in src/services/children.js). Run this in the
-- Supabase SQL editor AFTER the matching website update is live; running it
-- before would break the old site's child pages for signed-out visitors.
--
-- Safe to run more than once.

REVOKE SELECT ON public.children FROM anon;
GRANT SELECT (id, photo_url, sponsorship_status, created_at)
  ON public.children TO anon;

-- Signed-in users keep full read access (row access is still governed by the
-- existing "Public can view children" RLS policy).
GRANT SELECT ON public.children TO authenticated;

-- To undo:
--   GRANT SELECT ON public.children TO anon;
