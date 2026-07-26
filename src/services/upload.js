import supabase from "@/supabase/client";
import { shouldConvertImage, convertImageToWebP } from "@/lib/imageConverter";

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

export async function uploadAndConvert(file, bucket, path) {
  try {
    let uploadFile = file;

    if (shouldConvertImage(file)) {
      uploadFile = await convertImageToWebP(file);
      const ext = path.split(".").pop();
      path = path.replace(new RegExp(`\\.${ext}$`), ".webp");
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, uploadFile, {
        upsert: true,
        contentType: uploadFile.type,
      });

    return { data, error, path };
  } catch (err) {
    return { data: null, error: err, path };
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
