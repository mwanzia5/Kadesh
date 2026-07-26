/**
 * imageEnhancer.js
 *
 * Zero-dependency, non-AI image enhancement + upscaling.
 * Runs entirely in the browser via the Canvas 2D API — no external
 * API calls, no model weights, no per-image cost.
 *
 * Techniques used (classical image processing, not machine learning):
 *  - Stepped/progressive resize (never more than 2x per draw) to avoid
 *    the mushy look of a single large browser-native resize
 *  - Unsharp masking (blur-and-subtract) to recover perceived sharpness
 *    after upscaling or on soft/blurry source photos
 *  - Per-channel auto-levels (percentile clipping + linear stretch) to
 *    fix flat, washed-out, or color-cast images
 *
 * Usage:
 *   import { enhanceImageFile } from './imageEnhancer.js';
 *
 *   const enhancedBlob = await enhanceImageFile(file, {
 *     minDimension: 1200,   // upscale small images so shortest side hits 1200px
 *     sharpenAmount: 0.6,
 *     autoLevels: true,
 *   });
 *   // enhancedBlob is a Blob you can upload the same way you upload `file` today
 */

const DEFAULTS = {
  // Upscaling
  minDimension: null, // if set, upscale so the shorter side reaches this many px
  scale: 1, // explicit scale factor, used only if minDimension is not set
  maxDimension: 2400, // hard cap so we never blow up memory or output size

  // Sharpening (unsharp mask)
  sharpen: true,
  sharpenAmount: 0.6, // roughly 0 - 1.5, how strong the effect is
  sharpenRadius: 1, // blur radius used to build the mask

  // Auto color / contrast
  autoLevels: true,
  clipPercent: 0.5, // % of pixels allowed to clip at each end, per channel

  // Output
  outputType: 'image/webp',
  quality: 0.85,
};

export async function enhanceImageFile(file, userOptions = {}) {
  const options = { ...DEFAULTS, ...userOptions };
  const img = await loadImage(file);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const { width: targetW, height: targetH } = computeTargetSize(srcW, srcH, options);

  const canvas = stepResize(img, srcW, srcH, targetW, targetH);
  const ctx = canvas.getContext('2d');
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (options.autoLevels) {
    imageData = autoLevels(imageData, options.clipPercent);
  }
  if (options.sharpen) {
    imageData = unsharpMask(imageData, options.sharpenAmount, options.sharpenRadius);
  }

  ctx.putImageData(imageData, 0, 0);

  return canvasToBlob(canvas, options.outputType, options.quality);
}

// --- sizing -----------------------------------------------------------

function computeTargetSize(srcW, srcH, options) {
  let scale = options.scale || 1;

  if (options.minDimension) {
    const shorter = Math.min(srcW, srcH);
    scale = shorter < options.minDimension ? options.minDimension / shorter : 1;
  }

  let targetW = Math.round(srcW * scale);
  let targetH = Math.round(srcH * scale);

  const longer = Math.max(targetW, targetH);
  if (longer > options.maxDimension) {
    const shrink = options.maxDimension / longer;
    targetW = Math.round(targetW * shrink);
    targetH = Math.round(targetH * shrink);
  }

  return { width: targetW, height: targetH };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Progressive resize: never move more than 2x (or down to 0.5x) in a
// single drawImage call. Reduces the soft/mushy artifacts you get from
// asking the browser to upscale several times over in one step.
function stepResize(img, srcW, srcH, targetW, targetH) {
  let curW = srcW;
  let curH = srcH;
  let curSource = img;
  const isUpscale = targetW * targetH >= srcW * srcH;

  // Guard against a no-op resize.
  if (targetW === srcW && targetH === srcH) {
    const canvas = document.createElement('canvas');
    canvas.width = srcW;
    canvas.height = srcH;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas;
  }

  while (true) {
    const wRatio = targetW / curW;
    const stepRatio = isUpscale ? Math.min(2, wRatio) : Math.max(0.5, wRatio);

    const nextW = Math.max(1, Math.round(curW * stepRatio));
    const nextH = Math.max(1, Math.round(curH * stepRatio));

    const canvas = document.createElement('canvas');
    canvas.width = nextW;
    canvas.height = nextH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(curSource, 0, 0, nextW, nextH);

    curW = nextW;
    curH = nextH;
    curSource = canvas;

    const reachedTarget = isUpscale ? curW >= targetW : curW <= targetW;
    if (reachedTarget) {
      if (curW !== targetW || curH !== targetH) {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetW;
        finalCanvas.height = targetH;
        const fctx = finalCanvas.getContext('2d');
        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';
        fctx.drawImage(curSource, 0, 0, targetW, targetH);
        return finalCanvas;
      }
      return curSource;
    }
  }
}

// --- auto color / contrast ---------------------------------------------

// Per-channel histogram stretch: clip a small percentile of outliers at
// each end, then linearly remap the remaining range to 0-255.
function autoLevels(imageData, clipPercent) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const clipCount = Math.floor(totalPixels * (clipPercent / 100));

  for (let channel = 0; channel < 3; channel++) {
    const histogram = new Array(256).fill(0);
    for (let i = channel; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    let low = 0;
    let count = 0;
    for (; low < 255; low++) {
      count += histogram[low];
      if (count > clipCount) break;
    }

    let high = 255;
    count = 0;
    for (; high > 0; high--) {
      count += histogram[high];
      if (count > clipCount) break;
    }

    if (high <= low) continue; // flat channel, nothing useful to stretch

    const range = high - low;
    for (let i = channel; i < data.length; i += 4) {
      const v = ((data[i] - low) / range) * 255;
      data[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return imageData;
}

// --- sharpening ----------------------------------------------------------

// Unsharp mask: blurred = boxBlur(original); result = original + amount * (original - blurred)
function unsharpMask(imageData, amount, radius) {
  const { width, height, data } = imageData;
  const original = new Uint8ClampedArray(data);
  const blurred = boxBlurApproxGaussian(data, width, height, radius);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const o = original[i + c];
      const b = blurred[i + c];
      const v = o + amount * (o - b);
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    // alpha channel is left untouched
  }
  return imageData;
}

// Three box-blur passes approximate a Gaussian blur — a standard,
// cheap substitute that avoids a real Gaussian kernel convolution.
function boxBlurApproxGaussian(data, width, height, radius) {
  let result = data;
  const passes = 3;
  for (let p = 0; p < passes; p++) {
    result = boxBlurHorizontal(result, width, height, radius);
    result = boxBlurVertical(result, width, height, radius);
  }
  return result;
}

function boxBlurHorizontal(data, width, height, radius) {
  const out = new Uint8ClampedArray(data.length);
  const windowSize = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          const xi = clampIndex(x + k, width);
          sum += data[rowOffset + xi * 4 + c];
        }
        out[rowOffset + x * 4 + c] = sum / windowSize;
      }
      out[rowOffset + x * 4 + 3] = data[rowOffset + x * 4 + 3];
    }
  }
  return out;
}

function boxBlurVertical(data, width, height, radius) {
  const out = new Uint8ClampedArray(data.length);
  const windowSize = radius * 2 + 1;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          const yi = clampIndex(y + k, height);
          sum += data[(yi * width + x) * 4 + c];
        }
        out[(y * width + x) * 4 + c] = sum / windowSize;
      }
      out[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }
  return out;
}

function clampIndex(i, max) {
  if (i < 0) return 0;
  if (i >= max) return max - 1;
  return i;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}