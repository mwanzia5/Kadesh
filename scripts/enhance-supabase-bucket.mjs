#!/usr/bin/env node
/**
 * enhance-supabase-bucket.mjs
 *
 * Re-enhances images already sitting in a Supabase Storage bucket —
 * gallery photos, Sponsor-a-Child photos, etc. Downloads each object,
 * runs the same non-AI pipeline (Lanczos resize/upscale, auto-contrast,
 * unsharp sharpen) via sharp, then re-uploads to the SAME path with
 * upsert.
 *
 * Because the path doesn't change, every image_url / photo_url already
 * stored in your `gallery` / `children` tables keeps working exactly
 * as-is — no DB updates needed.
 *
 * Needs a service role key (not the anon key): these buckets' write
 * policies require is_admin(), and a Node script has no logged-in
 * Supabase session to satisfy that, so the service role key is used
 * to bypass RLS here. NEVER ship the service role key to the browser
 * or commit it to git.
 *
 * Setup:
 *   npm install --save-dev sharp @supabase/supabase-js
 *
 * Env vars required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Project Settings -> API -> service_role)
 *
 * Usage:
 *   node enhance-supabase-bucket.mjs <bucket> [prefix] [options]
 *
 * Options:
 *   --minWidth=1200   upscale anything narrower than this
 *   --sharpen=1.0      sharpen strength
 *   --dryRun           list what would happen, write nothing
 *
 * Examples:
 *   node enhance-supabase-bucket.mjs children "" --minWidth=1000 --sharpen=1.2
 *   node enhance-supabase-bucket.mjs images gallery --minWidth=1400 --dryRun
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function main() {
  const [, , bucket, prefixArg, ...rest] = process.argv;
  if (!bucket) {
    console.error(
      'Usage: node enhance-supabase-bucket.mjs <bucket> [prefix] ' +
        '[--minWidth=1200] [--sharpen=1.0] [--dryRun]'
    );
    process.exit(1);
  }

  const prefixIsFlag = prefixArg && prefixArg.startsWith('--');
  const prefix = prefixIsFlag ? '' : prefixArg || '';
  const flags = prefixIsFlag ? [prefixArg, ...rest] : rest;
  const options = parseFlags(flags);

  await walkAndEnhance(bucket, prefix, options);
  console.log('Done.');
}

function parseFlags(flags) {
  const opts = { minWidth: null, sharpen: 1.0, dryRun: false };
  for (const flag of flags) {
    if (flag === '--dryRun') {
      opts.dryRun = true;
      continue;
    }
    const [key, val] = flag.replace(/^--/, '').split('=');
    if (key === 'minWidth') opts.minWidth = parseInt(val, 10);
    if (key === 'sharpen') opts.sharpen = parseFloat(val);
  }
  return opts;
}

async function walkAndEnhance(bucket, prefix, options) {
  const { data: entries, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error(`Failed to list ${bucket}/${prefix}:`, error.message);
    return;
  }

  for (const entry of entries) {
    const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    // supabase-js returns folders as entries with id === null
    if (entry.id === null) {
      await walkAndEnhance(bucket, entryPath, options);
      continue;
    }

    const dotIndex = entry.name.lastIndexOf('.');
    const ext = dotIndex >= 0 ? entry.name.slice(dotIndex).toLowerCase() : '';
    if (!IMAGE_EXT.has(ext)) continue;

    await enhanceOne(bucket, entryPath, options);
  }
}

async function enhanceOne(bucket, objectPath, options) {
  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(objectPath);
    if (downloadError) throw downloadError;

    const inputBuffer = Buffer.from(await blob.arrayBuffer());
    const meta = await sharp(inputBuffer).metadata();

    let targetWidth = meta.width;
    if (options.minWidth && meta.width < options.minWidth) {
      targetWidth = options.minWidth;
    }

    if (options.dryRun) {
      console.log(
        `[dry run] ${bucket}/${objectPath}: ${meta.width}x${meta.height} -> ${targetWidth}px wide`
      );
      return;
    }

    let pipeline = sharp(inputBuffer);
    if (targetWidth !== meta.width) {
      pipeline = pipeline.resize({ width: targetWidth, kernel: sharp.kernel.lanczos3 });
    }

    const isPng = meta.format === 'png';
    const outputBuffer = await pipeline
      .normalize()
      .sharpen({ sigma: options.sharpen })
      .toFormat(isPng ? 'png' : 'jpeg', isPng ? {} : { quality: 88 })
      .toBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, outputBuffer, {
        upsert: true,
        contentType: isPng ? 'image/png' : 'image/jpeg',
      });
    if (uploadError) throw uploadError;

    console.log(`enhanced: ${bucket}/${objectPath}`);
  } catch (err) {
    console.error(`failed: ${bucket}/${objectPath} — ${err.message}`);
  }
}

main();