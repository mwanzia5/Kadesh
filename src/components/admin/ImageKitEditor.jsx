import { useState, useCallback, useEffect, useMemo } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RotateCw, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildImageKitTransformUrl,
  produceEditedImageFile,
  isImageKitConfigured,
} from "@/lib/imagekit";

const ASPECT_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

const RESIZE_PRESETS = [
  { label: "Original", width: null, height: null },
  { label: "480px", width: 480, height: null },
  { label: "800px", width: 800, height: null },
  { label: "1200px", width: 1200, height: null },
  { label: "Thumb 300", width: 300, height: 300 },
];

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
    if (typeof image.decode === "function") {
      image.decode().then(finish).catch(() => {
        image.onload = finish;
        image.onerror = fail;
      });
    } else {
      image.onload = finish;
      image.onerror = fail;
    }
  });
}

export default function ImageKitEditor({ sourceUrl, fileName, onComplete, onCancel }) {
  const [naturalSize, setNaturalSize] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [resizePreset, setResizePreset] = useState(0);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [removeBg, setRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const onCropComplete = useCallback((_croppedArea, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (!sourceUrl) return;
    let cancelled = false;
    loadImage(sourceUrl)
      .then((img) => {
        if (!cancelled) {
          setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
      })
      .catch((err) => setProcessError(err?.message || "Failed to load the source image."));
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

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

  const target = useMemo(() => {
    const preset = RESIZE_PRESETS[resizePreset] || { width: null, height: null };
    const parsedWidth = parseInt(customWidth, 10);
    const parsedHeight = parseInt(customHeight, 10);
    const width = parsedWidth > 0 ? parsedWidth : preset.width;
    const height = parsedHeight > 0 ? parsedHeight : preset.height;
    return {
      width: width ? Math.max(1, Math.round(width)) : null,
      height: height ? Math.max(1, Math.round(height)) : null,
    };
  }, [resizePreset, customWidth, customHeight]);

  const opts = useMemo(
    () => ({
      crop: isCropUsable
        ? {
            x: croppedAreaPixels.x,
            y: croppedAreaPixels.y,
            width: croppedAreaPixels.width,
            height: croppedAreaPixels.height,
          }
        : null,
      rotation,
      width: target.width,
      height: target.height,
      removeBg,
    }),
    [isCropUsable, croppedAreaPixels, rotation, target.width, target.height, removeBg]
  );

  const previewSrc = useMemo(() => buildImageKitTransformUrl(sourceUrl, opts), [sourceUrl, opts]);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewSrc]);

  const outputWidth = rotation === 90 || rotation === 270 ? cropHeight : cropWidth;
  const outputHeight = rotation === 90 || rotation === 270 ? cropWidth : cropHeight;

  const handleDone = async () => {
    setProcessing(true);
    setProcessError(null);
    try {
      const file = await produceEditedImageFile(sourceUrl, fileName, opts);
      onComplete(file);
    } catch (err) {
      console.error("ImageKit processing failed:", err);
      setProcessError(err?.message || "Something went wrong while processing this image.");
    } finally {
      setProcessing(false);
    }
  };

  const selectPreset = (index) => {
    setResizePreset(index);
    setCustomWidth("");
    setCustomHeight("");
  };

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
                Edit Image
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isImageKitConfigured() && (
            <div className="mx-4 sm:mx-6 mt-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-body text-xs">
              ImageKit isn&apos;t configured (missing VITE_IMAGEKIT_URL_ENDPOINT). Edits will
              be applied to the original image without server-side processing.
            </div>
          )}

          <div className="min-h-0 overflow-y-auto">
            <div className="relative h-[42vh] min-h-[220px] sm:h-[360px] bg-gray-900">
              <Cropper
                image={sourceUrl}
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

                <button
                  onClick={() => setRemoveBg((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors font-body text-xs",
                    removeBg
                      ? "bg-fuchsia-100 text-fuchsia-700 font-semibold"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Remove background
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

              <div>
                <span className="font-body text-xs text-gray-500 mr-1">Size:</span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {RESIZE_PRESETS.map((preset, index) => (
                    <button
                      key={preset.label}
                      onClick={() => selectPreset(index)}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-body text-xs font-medium transition-colors",
                        resizePreset === index && !customWidth && !customHeight
                          ? "bg-vibrant-blue text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-body text-xs text-gray-500">Custom W:</span>
                  <input
                    type="number"
                    min={1}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="Auto"
                    className="w-20 px-2 py-1 rounded-md border border-gray-200 font-body text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-vibrant-blue"
                  />
                  <span className="font-body text-xs text-gray-500">H:</span>
                  <input
                    type="number"
                    min={1}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="Auto"
                    className="w-20 px-2 py-1 rounded-md border border-gray-200 font-body text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-vibrant-blue"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-body text-xs text-gray-500 shrink-0">Preview</span>
                <div className="flex-1 h-28 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                  {previewSrc && !previewFailed && (
                    <img
                      src={previewSrc}
                      alt="Edit preview"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setPreviewFailed(true)}
                    />
                  )}
                  {previewFailed && (
                    <p className="font-body text-xs text-gray-400 px-3 text-center">
                      Preview unavailable{removeBg ? " (background removal can take a few seconds)" : ""} — Save will still apply the edits.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {processError && (
            <div className="mx-4 sm:mx-6 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 font-body text-xs">
              {processError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <p className="font-body text-xs text-gray-500">
              {naturalSize && outputWidth && outputHeight
                ? `Output: ${outputWidth} × ${outputHeight} px · ${removeBg ? "PNG" : "WebP"}`
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