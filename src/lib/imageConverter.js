const CONVERTIBLE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const CONVERTIBLE_VIDEO_TYPES = ["video/mp4"];

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      type,
      quality
    );
  });
}

function canvasToFile(canvas, originalName, quality = 0.82) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        const name = originalName.replace(/\.[^.]+$/, ".webp");
        const file = new File([blob], name, { type: "image/webp" });
        resolve(file);
      },
      "image/webp",
      quality
    );
  });
}

export async function convertImageToWebP(file, quality = 0.82) {
  if (!CONVERTIBLE_IMAGE_TYPES.includes(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const webpFile = await canvasToFile(canvas, file.name, quality);
    return webpFile;
  } catch {
    return file;
  }
}

export async function convertVideoToWebM(file) {
  if (!CONVERTIBLE_VIDEO_TYPES.includes(file.type)) return file;
  return file;
}

export function shouldConvertImage(file) {
  return CONVERTIBLE_IMAGE_TYPES.includes(file?.type);
}

export function shouldConvertVideo(file) {
  return CONVERTIBLE_VIDEO_TYPES.includes(file?.type);
}

export function getConvertedDimensions(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

export function createResizedFile(file, maxWidth, maxHeight, quality = 0.85) {
  return new Promise(async (resolve, reject) => {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;

      if (width <= maxWidth && height <= maxHeight) {
        bitmap.close();
        resolve(file);
        return;
      }

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await canvasToBlob(canvas, "image/webp", quality);
      const name = file.name.replace(/\.[^.]+$/, ".webp");
      const newFile = new File([blob], name, { type: "image/webp" });
      resolve(newFile);
    } catch (err) {
      reject(err);
    }
  });
}
