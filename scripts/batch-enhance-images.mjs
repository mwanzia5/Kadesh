#!/usr/bin/env node
/**
 * batch-enhance-images.mjs
 *
 * Batch-enhances a folder of already-uploaded images: non-AI, using
 * sharp (libvips under the hood) for Lanczos3 resize/upscale,
 * auto-contrast normalization, and unsharp-mask style sharpening.
 *
 * Good for:
 *  - static assets already committed under public/images/... (Breadproject,
 *    Lumina School, borewell project, healthcare, etc.)
 *  - a one-off pass over images already sitting in a Supabase Storage
 *    bucket (download them locally first, run this, re-upload — see
 *    notes at the bottom of this file)
 *
 * Setup:
 *   npm install --save-dev sharp
 *
 * Usage:
 *   node batch-enhance-images.mjs <inputDir> <outputDir> [options]
 *
 * Options:
 *   --minWidth=1200   upscale any image narrower than this to this width
 *   --upscale=1.5     flat scale factor, used if --minWidth is not set
 *   --sharpen=1.0      sharpen strength (sigma passed to sharp().sharpen())
 *   --dryRun           list what would happen without writing files
 *
 * Example — bring every image in the gallery folder up to at least
 * 1200px wide, writing results into a sibling "enhanced" folder so you
 * can compare before overwriting the originals:
 *
 *   node batch-enhance-images.mjs \
 *     public/images/gallery \
 *     public/images/gallery-enhanced \
 *     --minWidth=1200 --sharpen=1.2
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function main() {
  const [, , inputDirArg, outputDirArg, ...flags] = process.argv;

  if (!inputDirArg || !outputDirArg) {
    console.error(
      'Usage: node batch-enhance-images.mjs <inputDir> <outputDir> ' +
        '[--minWidth=1200] [--upscale=1.5] [--sharpen=1.0] [--dryRun]'
    );
    process.exit(1);
  }

  const options = parseFlags(flags);
  await mkdir(outputDirArg, { recursive: true });
  await processDir(path.resolve(inputDirArg), path.resolve(outputDirArg), options);
  console.log('Done.');
}

function parseFlags(flags) {
  const opts = { upscale: null, sharpen: 1.0, minWidth: null, dryRun: false };
  for (const flag of flags) {
    if (flag === '--dryRun') {
      opts.dryRun = true;
      continue;
    }
    const [key, val] = flag.replace(/^--/, '').split('=');
    if (key === 'upscale') opts.upscale = parseFloat(val);
    if (key === 'sharpen') opts.sharpen = parseFloat(val);
    if (key === 'minWidth') opts.minWidth = parseInt(val, 10);
  }
  return opts;
}

async function processDir(inputDir, outputDir, options) {
  const entries = await readdir(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    const inputPath = path.join(inputDir, entry.name);
    const outputPath = path.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      await mkdir(outputPath, { recursive: true });
      await processDir(inputPath, outputPath, options);
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      await enhanceOne(inputPath, outputPath, options);
    }
  }
}

async function enhanceOne(inputPath, outputPath, options) {
  try {
    const probe = sharp(inputPath);
    const meta = await probe.metadata();

    let targetWidth = meta.width;
    if (options.minWidth && meta.width < options.minWidth) {
      targetWidth = options.minWidth;
    } else if (options.upscale) {
      targetWidth = Math.round(meta.width * options.upscale);
    }

    if (options.dryRun) {
      console.log(
        `[dry run] ${inputPath}: ${meta.width}x${meta.height} -> ` +
          `${targetWidth}x${Math.round((targetWidth / meta.width) * meta.height)}`
      );
      return;
    }

    let pipeline = sharp(inputPath);

    if (targetWidth !== meta.width) {
      pipeline = pipeline.resize({ width: targetWidth, kernel: sharp.kernel.lanczos3 });
    }

    pipeline = pipeline
      .normalize() // per-channel auto-contrast stretch, non-AI
      .sharpen({ sigma: options.sharpen }); // unsharp-mask style sharpening, non-AI

    await pipeline.toFile(outputPath);
    console.log(`enhanced: ${inputPath} -> ${outputPath}`);
  } catch (err) {
    console.error(`failed: ${inputPath} — ${err.message}`);
  }
}

main();

/**
 * Enhancing images already sitting in Supabase Storage:
 *
 * This script works on local files, so for a bucket like "gallery" or
 * "children", the pattern is: list objects, download each to a temp
 * folder, run this script against that folder, then re-upload (either
 * overwriting the original path or under a new key you then update in
 * the referencing table). A short companion script using
 * `supabase.storage.from(bucket).list()` / `.download()` / `.upload()`
 * can drive that loop — happy to write that once I can see
 * src/supabase/client.js and the bucket names in schema.sql.
 */