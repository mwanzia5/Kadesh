const ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");

export function isImageKitConfigured() {
  return Boolean(ENDPOINT);
}

export function imageKitUrlEndpoint() {
  return ENDPOINT;
}

const int = (n) => {
  const v = Math.round(Number(n) || 0);
  return Math.max(1, v);
};

// Builds the colon-separated transform chain. Each AI/async operation (e.g.
// background removal) must live in its own stage, so we emit one stage per
// step and join with ":".
function buildTransformStages({ crop = null, rotation = 0, width = null, height = null, removeBg = false }) {
  const steps = [];

  if (removeBg) steps.push(["e-removedotbg"]);

  if (crop) {
    const { x, y, width: cw, height: ch } = crop;
    steps.push([`cm-extract,x-${int(x)},y-${int(y)},w-${int(cw)},h-${int(ch)}`]);
  }

  const resize = [];
  if (width) resize.push(`w-${Math.max(1, Math.round(Number(width) || 0))}`);
  if (height) resize.push(`h-${Math.max(1, Math.round(Number(height) || 0))}`);
  if (resize.length) {
    if (width && height) resize.push("c-maintain_ratio", "fo-auto");
    steps.push(resize);
  }

  const rot = (((Number(rotation) || 0) % 360) + 360) % 360;
  if (rot) steps.push([`rt-${rot}`]);

  steps.push([`f-${removeBg ? "png" : "webp"}`]);

  return steps.map((s) => s.join(",")).join(":");
}

// Renders an editable source URL through ImageKit using a "Web proxy" origin
// (see https://imagekit.io/docs/integration/web-proxy). The full source URL —
// e.g. https://<project>.supabase.co/storage/v1/object/public/images/x.webp —
// is appended after the URL endpoint, and ImageKit fetches it on the fly and
// applies the transformation chain. No base-URL origin config is needed (and a
// "Web Folder" origin won't work: Supabase's project root isn't a 200 URL).
export function buildImageKitTransformUrl(sourceUrl, opts = {}) {
  if (!ENDPOINT || !sourceUrl) return sourceUrl;
  return `${ENDPOINT}/tr:${buildTransformStages(opts)}/${sourceUrl}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// AI transforms (e-removedotbg) answer with an HTML "preparing" page until
// they finish, so we poll until a real image comes back.
export async function fetchImageKitImage(url, { maxAttempts = 15, intervalMs = 3000 } = {}) {
  let retries = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const resp = await fetch(url);
    if (!resp.ok) {
      retries += 1;
      const isRateLimited = resp.status === 429;
      if (attempt === maxAttempts) {
        throw new Error(
          resp.status === 404
            ? "ImageKit could not reach the source image."
            : `ImageKit returned HTTP ${resp.status}.`,
        );
      }
      await sleep(isRateLimited ? intervalMs + 2000 : intervalMs);
      continue;
    }

    const isIntermediate = Boolean(resp.headers.get("is-intermediate-response"));
    const blob = await resp.blob();
    if (!isIntermediate && blob.type.startsWith("image/") && blob.size > 0) {
      return blob;
    }
    retries += 1;
    if (attempt === maxAttempts) {
      throw new Error("ImageKit is still preparing the image — try again in a minute.");
    }
    await sleep(intervalMs);
  }
  throw new Error("ImageKit did not return a processed image.");
}

export async function produceEditedImageFile(sourceUrl, fileName, opts = {}) {
  const blob = await fetchImageKitImage(buildImageKitTransformUrl(sourceUrl, opts));
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const base = (fileName || "image").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.${ext}`, { type: blob.type || "image/webp" });
}