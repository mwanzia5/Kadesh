import supabase from "@/supabase/client";
import { shouldConvertImage, convertImageToWebP } from "@/lib/imageConverter";
import { enhanceImageFile } from "@/lib/imageEnhancer";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function validateFileSize(file) {
  if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
    return `Image must be under 10MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
  }
  if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
    return `Video must be under 100MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
  }
  return null;
}

export async function uploadImage(file, bucket, path) {
  try {
    const sizeErr = validateFileSize(file);
    if (sizeErr) return { data: null, error: new Error(sizeErr) };

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Uploads an image, auto-enhancing it first (upscale-if-small, auto
 * contrast/color, unsharp sharpen — see src/lib/imageEnhancer.js).
 *
 * options.enhance defaults to true, so every existing call site that
 * already calls uploadAndConvert(file, bucket, path) picks this up
 * automatically with no changes needed. Pass { enhance: false } to
 * fall back to the old plain WebP conversion (e.g. if a caller
 * uploads something that's already been processed, like an
 * admin-cropped avatar you don't want re-sharpened).
 *
 * Any extra keys in options (minDimension, sharpenAmount, autoLevels,
 * quality, etc.) are forwarded straight to enhanceImageFile, so a
 * specific screen can tune it — e.g. a stronger minDimension for
 * Sponsor-a-Child photos that tend to come from older phones.
 */
export async function uploadAndConvert(file, bucket, path, options = {}) {
  const { enhance = true, ...enhanceOptions } = options;

  try {
    const sizeErr = validateFileSize(file);
    if (sizeErr) return { data: null, error: new Error(sizeErr), path };

    let uploadFile = file;

    if (enhance && file.type.startsWith("image/")) {
      const enhancedBlob = await enhanceImageFile(file, {
        minDimension: 1200,
        sharpenAmount: 0.6,
        autoLevels: true,
        outputType: "image/webp",
        quality: 0.85,
        ...enhanceOptions,
      });

      uploadFile = new File(
        [enhancedBlob],
        file.name.replace(/\.[^.]+$/, ".webp"),
        { type: "image/webp" }
      );

      const ext = path.split(".").pop();
      path = path.replace(new RegExp(`\\.${ext}$`), ".webp");
    } else if (shouldConvertImage(file)) {
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

export function extractPathFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/public/");
    return pathParts.length > 1 ? pathParts[1] : null;
  } catch {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  }
}