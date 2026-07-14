import supabase from "@/supabase/client";

export async function uploadImage(file, bucket, path) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteImage(bucket, path) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data?.publicUrl ?? null;
}
