import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crop, Maximize2, RotateCw, Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { label: "Small (480px)", width: 480, height: 0 },
  { label: "Medium (800px)", width: 800, height: 0 },
  { label: "Large (1200px)", width: 1200, height: 0 },
  { label: "Thumb (300px)", width: 300, height: 300 },
];

function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxSize = Math.max(image.width, image.height);
      const safeCrop = {
        x: Math.round((pixelCrop.x / maxSize) * maxSize),
        y: Math.round((pixelCrop.y / maxSize) * maxSize),
        width: Math.round((pixelCrop.width / maxSize) * maxSize),
        height: Math.round((pixelCrop.height / maxSize) * maxSize),
      };

      canvas.width = safeCrop.width;
      canvas.height = safeCrop.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        safeCrop.x,
        safeCrop.y,
        safeCrop.width,
        safeCrop.height,
        0,
        0,
        safeCrop.width,
        safeCrop.height
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        0.85
      );
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

function resizeImage(imageSrc, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");

      let width = targetWidth || image.width;
      let height = targetHeight || image.height;

      if (targetWidth && !targetHeight) {
        const ratio = targetWidth / image.width;
        height = Math.round(image.height * ratio);
      } else if (targetHeight && !targetWidth) {
        const ratio = targetHeight / image.height;
        width = Math.round(image.width * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        0.85
      );
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

export default function ImageCropper({ file, onComplete, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mode, setMode] = useState("crop");
  const [resizePreset, setResizePreset] = useState(0);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const onCropComplete = useCallback((croppedArea, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleDone = async () => {
    setProcessing(true);
    try {
      const resultFile = await processImage();
      onComplete(resultFile);
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const processImage = async () => {
    let blob;

    if (mode === "crop" && croppedAreaPixels) {
      blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    } else if (mode === "resize") {
      const preset = RESIZE_PRESETS[resizePreset];
      const w = customWidth ? parseInt(customWidth, 10) : preset.width;
      const h = customHeight ? parseInt(customHeight, 10) : preset.height;
      blob = await resizeImage(imageSrc, w, h);
    } else {
      const canvas = document.createElement("canvas");
      const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      image.close();
      blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    }

    const name = file.name.replace(/\.[^.]+$/, ".webp");
    return new File([blob], name, { type: "image/webp" });
  };

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-semibold text-deep-navy">
                {mode === "crop" ? "Crop Image" : "Resize Image"}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => setMode("crop")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors",
                mode === "crop"
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-gray-500 hover:text-deep-navy"
              )}
            >
              <Crop className="h-3.5 w-3.5" />
              Crop
            </button>
            <button
              onClick={() => setMode("resize")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors",
                mode === "resize"
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-gray-500 hover:text-deep-navy"
              )}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Resize
            </button>
          </div>

          {mode === "crop" && (
            <>
              <div className="relative h-[400px] bg-gray-900">
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

              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center gap-4">
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
                      className="w-24 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-vibrant-blue"
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

                <div className="flex items-center gap-1.5">
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
              </div>
            </>
          )}

          {mode === "resize" && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {RESIZE_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setResizePreset(i);
                      setCustomWidth("");
                      setCustomHeight("");
                    }}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-center transition-colors",
                      resizePreset === i && !customWidth
                        ? "border-vibrant-blue bg-vibrant-blue/5 text-vibrant-blue"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <p className="font-body text-xs font-medium">{preset.label}</p>
                    {preset.width && (
                      <p className="font-body text-[10px] text-gray-400">
                        {preset.width}{preset.height ? `×${preset.height}` : "px wide"}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <span className="font-body text-xs text-gray-500">Custom:</span>
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={customWidth}
                  onChange={(e) => {
                    setCustomWidth(e.target.value);
                    setResizePreset(-1);
                  }}
                  className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                />
                <span className="text-gray-400 text-xs">×</span>
                <input
                  type="number"
                  placeholder="Height (px)"
                  value={customHeight}
                  onChange={(e) => {
                    setCustomHeight(e.target.value);
                    setResizePreset(-1);
                  }}
                  className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg font-body text-xs focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                />
              </div>

              <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center h-[250px]">
                <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="font-body text-xs text-gray-500">
              Image will be converted to WebP format
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
                    Apply
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
