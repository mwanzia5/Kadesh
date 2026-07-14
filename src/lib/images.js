import { SUPABASE_IMAGE_URL } from "@/constants";

export function getSupabaseImage(path, width = 800, quality = 80) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_IMAGE_URL}/${path}?width=${width}&quality=${quality}`;
}

export function getImagePlaceholder(path) {
  if (!path) return null;
  return `${path}?width=20&quality=10`;
}
