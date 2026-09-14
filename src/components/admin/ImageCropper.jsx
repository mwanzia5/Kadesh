import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCw, Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

const MAX_SOURCE_DIMENSION = 4096;

// Below this fraction of the image's natural dimension, a "crop" rectangle
// is treated as noise rather than an intentional selection.
const MIN_CROP_FRACTION = 0.02;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        return reject(new Error("Image loaded with no dimensions"));
      }
      resolve(image);
    };
    const fail = () => reject(new Error("Failed to load image"));

    image.src = src;

    // decode() only resolves once the bitmap is fully decoded and safe to
    // draw to a canvas. onload alone just means dimensions are known —
    // drawImage() on an <img> that fired onload but hasn't finished
    // decoding can paint a partial bitmap on some browsers/GPU paths,
    // which is what produced split/gapped-looking preview images in this
    // pipeline (it chains several short-lived blob: URLs back to back).
    if (typeof image.decode === "function") {
      image.decode().then(finish).catch(() => {
        // Some older engines don't reliably support decode() for every
        // source (e.g. certain SVG or animated WebP cases) — fall back to
        // load events rather than failing outright.
        image.onload = finish;
        image.onerror = fail;
      });
    } else {
      image.onload = finish;
      image.onerror = fail;
    }
  });
}

/**
 * Converts a data-URL string to a Blob (works when canvas.toBlob returns null).
 */
function dataURLToBlob(dataURL) {
  const [header, data] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bin = atob(data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Encodes a canvas to a blob. Tries toBlob (preferred), then a toDataURL
 * fallback. If both fail, the real browser error is logged (instead of
 * being swallowed) so future failures are diagnosable.
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    if (!canvas.width || !canvas.height) {
      return reject(new Error("Canvas has no dimensions"));
    }
    canvas.toBlob(
      (blob) => {
        if (blob) return resolve(blob);
        try {
          resolve(dataURLToBlob(canvas.toDataURL("image/png", quality)));
        } catch (err) {
          console.error("canvasToBlob fallback failed:", err?.name, err?.message, {
            width: canvas.width,
            height: canvas.height,
            mimeType,
          });
          reject(new Error(`Canvas toBlob failed: ${err?.name || "unknown"}`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Draws `source` onto a new canvas, scaled down so neither dimension
 * exceeds `maxSide`. Returns the original source untouched if it's already
 * within bounds. Used to keep every canvas operation below browser memory
 * limits regardless of how large the original upload was.
 */
function clampToMaxSide(source, maxSide = MAX_SOURCE_DIMENSION) {
  const w = source.naturalWidth ?? source.width;
  const h = source.naturalHeight ?? source.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale === 1) {
    return { canvasOrImage: source, scale: 1, width: w, height: h };
  }
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(source, 0, 0, width, height);
  return { canvasOrImage: canvas, scale, width, height };
}

/**
 * Crops the source image to `pixelCrop` (natural-image pixel coordinates
 * reported by react-easy-crop) and applies the requested rotation.
 *
 * Rotation is handled in two steps: first the (size-clamped) source image
 * is rotated onto a canvas sized to fit its rotated bounding box, then the
 * requested crop rectangle — which react-easy-crop already reports relative
 * to that rotated bounding box — is drawn out plainly. This avoids manually
 * re-deriving rotation offsets (which was a source of both incorrect crops
 * and canvas-encode failures on large images).
 */
function cropToBlob(imageSrc, pixelCrop, rotation = 0) {
  return loadImage(imageSrc).then(
    (image) =>
      new Promise((resolve, reject) => {
        try {
          if (!image.width || !image.height) {
            return reject(new Error("Source image has no dimensions"));
          }

          const { canvasOrImage: source, scale } = clampToMaxSide(image);

          const width = Math.max(1, Math.round(pixelCrop.width * scale));
          const height = Math.max(1, Math.round(pixelCrop.height * scale));
          const angle = ((rotation % 360) + 360) % 360;

          const outCanvas = document.createElement("canvas");
          outCanvas.width = width;
          outCanvas.height = height;
          const outCtx = outCanvas.getContext("2d");

          if (angle === 0) {
            outCtx.drawImage(
              source,
              Math.round(pixelCrop.x * scale),
              Math.round(pixelCrop.y * scale),
              width,
              height,
              0,
              0,
              width,
              height
            );
          } else {
            const srcW = source.width ?? source.naturalWidth;
            const srcH = source.height ?? source.naturalHeight;
            const rad = (angle * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));
            const rotatedW = Math.round(srcW * cos + srcH * sin);
            const rotatedH = Math.round(srcW * sin + srcH * cos);

            const rotCanvas = document.createElement("canvas");
            rotCanvas.width = rotatedW;
            rotCanvas.height = rotatedH;
            const rotCtx = rotCanvas.getContext("2d");
            rotCtx.translate(rotatedW / 2, rotatedH / 2);
            rotCtx.rotate(rad);
            rotCtx.drawImage(source, -srcW / 2, -srcH / 2);

            // pixelCrop from react-easy-crop is already relative to the
            // rotated bounding box, so this is a plain crop.
            outCtx.drawImage(
              rotCanvas,
              Math.round(pixelCrop.x * scale),
              Math.round(pixelCrop.y * scale),
              width,
              height,
              0,
              0,
              width,
              height
            );
          }

          canvasToBlob(outCanvas, "image/webp", 0.85).then(resolve).catch(reject);
        } catch (err) {
          reject(err);
        }
      })
  );
}

/**
 * Builds the preview thumbnail shown in the modal in a single pass: one
 * `loadImage` of the source, then plain canvas-to-canvas `drawImage` calls
 * for rotation and crop, and exactly one final `canvasToBlob` encode at the
 * end.
 *
 * This exists separately from cropToBlob (used for the actual saved output)
 * because chaining re-encodings for a preview meant re-compressing to lossy
 * WebP multiple times, each requiring a fresh blob -> object URL -> Image
 * decode round trip, which produced corrupted-looking previews (bands of
 * missing content) on every image. A single consolidated pass removes that
 * opportunity entirely, since nothing is encoded/decoded except at the very
 * start and the very end.
 */
function buildPreviewBlob(imageSrc, pixelCrop, rotation, maxSide) {
  return loadImage(imageSrc).then((image) => {
    const { canvasOrImage: source, scale } = clampToMaxSide(image);
    const srcW = source.width ?? source.naturalWidth;
    const srcH = source.height ?? source.naturalHeight;

    // Rotation, onto a canvas sized to fit the rotated bounding box.
    const angle = ((rotation % 360) + 360) % 360;
    let rotated = source;
    let rotW = srcW;
    let rotH = srcH;
    if (angle !== 0) {
      const rad = (angle * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      rotW = Math.round(srcW * cos + srcH * sin);
      rotH = Math.round(srcW * sin + srcH * cos);
      const rotCanvas = document.createElement("canvas");
      rotCanvas.width = rotW;
      rotCanvas.height = rotH;
      const rotCtx = rotCanvas.getContext("2d");
      rotCtx.translate(rotW / 2, rotH / 2);
      rotCtx.rotate(rad);
      rotCtx.drawImage(source, -srcW / 2, -srcH / 2);
      rotated = rotCanvas;
    }

    // Crop (pixelCrop is already relative to the rotated bounding box, same
    // as in cropToBlob), or use the full rotated image if no crop is set.
    let cropW = rotW;
    let cropH = rotH;
    let cropped = rotated;
    if (pixelCrop) {
      cropW = Math.max(1, Math.round(pixelCrop.width * scale));
      cropH = Math.max(1, Math.round(pixelCrop.height * scale));
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      cropCanvas
        .getContext("2d")
        .drawImage(
          rotated,
          Math.round(pixelCrop.x * scale),
          Math.round(pixelCrop.y * scale),
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );
      cropped = cropCanvas;
    }

    // Final downscale to the preview's max side, drawn directly from the
    // cropped canvas — this is the only remaining draw, and the canvas below
    // is the only thing ever encoded to a blob.
    const previewRatio = Math.min(1, maxSide / Math.max(cropW, cropH));
    const previewW = Math.max(1, Math.round(cropW * previewRatio));
    const previewH = Math.max(1, Math.round(cropH * previewRatio));

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = previewW;
    previewCanvas.height = previewH;
    previewCanvas.getContext("2d").drawImage(cropped, 0, 0, previewW, previewH);

    return canvasToBlob(previewCanvas, "image/webp", 0.9);
  });
}

export default function ImageCropper({ file, onComplete, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const previewUrlRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const blob = await buildPreviewBlob(
          imageSrc,
          croppedAreaPixels,
          rotation,
          500
        );
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewSrc(url);
      } catch (err) {
        // Preview is best-effort; the saved output is generated independently.
        console.warn("Preview generation failed:", err?.message);
      }
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageSrc, croppedAreaPixels, rotation]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;
    loadImage(imageSrc)
      .then((img) => {
        if (!cancelled) {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const processImage = async () => {
    const blob = await cropToBlob(imageSrc, croppedAreaPixels, rotation);

    const mime = blob.type || "image/webp";
    const ext = mime === "image/png" ? "png" : "webp";
    const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
    return new File([blob], name, { type: mime });
  };

  const handleDone = async () => {
    setProcessing(true);
    setProcessError(null);
    try {
      const resultFile = await processImage();
      onComplete(resultFile);
    } catch (err) {
      console.error("Processing failed:", err);
      setProcessError(err?.message || "Something went wrong while processing this image.");
      // Don't call onComplete(null) here — that silently closes the dialog
      // and looks like nothing happened. Keep the cropper open with the
      // error visible so the user knows the save didn't go through.
    } finally {
      setProcessing(false);
    }
  };

  // Guard against a stale, near-zero croppedAreaPixels rectangle. Cropper
  // reports intermediate rectangles continuously while the user drags; if
  // the dialog is abandoned mid-drag on a sliver-thin selection, that value
  // never gets replaced and would drive a 1px-wide crop. Below
  // MIN_CROP_FRACTION of the natural dimension, we treat the crop as not
  // meaningfully set and fall back to the full image.
  const isCropUsable =
    croppedAreaPixels &&
    naturalSize &&
    croppedAreaPixels.width >= naturalSize.width * MIN_CROP_FRACTION &&
    croppedAreaPixels.height >= naturalSize.height * MIN_CROP_FRACTION;

  const cropWidth = isCropUsable
    ? Math.max(1, Math.round(croppedAreaPixels.width))
    : naturalSize?.width || 0;
  const cropHeight = isCropUsable
    ? Math.max(1, Math.round(croppedAreaPixels.height))
    : naturalSize?.height || 0;

  if (!imageSrc) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-vibrant-blue border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-body text-sm text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[96vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-semibold text-deep-navy">
                Crop Image
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto">
            <>
                <div className="relative h-[48vh] min-h-[240px] sm:h-[400px] bg-gray-900">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={true}
                  />
                </div>

                <div className="px-4 sm:px-6 py-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-500" />
                      </button>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-24 sm:w-32 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-vibrant-blue"
                      />
                      <button
                        onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                      <span className="font-body text-xs text-gray-500 w-10">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>

                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors font-body text-xs text-gray-500"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Rotate
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-body text-xs text-gray-500 mr-1">Ratio:</span>
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setAspect(r.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-body text-xs font-medium transition-colors",
                          aspect === r.value
                            ? "bg-vibrant-blue text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-gray-500 shrink-0">
                      Preview
                    </span>
                    <div className="flex-1 h-28 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                      {previewSrc && (
                        <img
                          src={previewSrc}
                          alt="Crop preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
            </>
          </div>

          {processError && (
            <div className="mx-4 sm:mx-6 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 font-body text-xs">
              {processError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <p className="font-body text-xs text-gray-500">
              {naturalSize && cropWidth && cropHeight
                ? `Output: ${cropWidth} × ${cropHeight} px · WebP`
                : "Image will be converted to WebP format"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg font-body text-sm text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}