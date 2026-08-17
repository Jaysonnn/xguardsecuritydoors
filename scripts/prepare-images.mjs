#!/usr/bin/env node
/**
 * Converts the raw photo library into web-ready JPEGs under src/images/doors/.
 *
 * Two stages are needed because most source photos are HEIC:
 *   1. sips (macOS built-in) decodes HEIC. sharp cannot, because its prebuilt
 *      binary ships an HEIF decoder limited to .avif for HEVC patent reasons.
 *   2. sharp resizes, re-encodes, and strips EXIF. Stripping matters beyond file
 *      size: iPhone photos taken at customer homes carry GPS coordinates.
 *
 * Output goes to src/images/ rather than public/ so the gallery can statically
 * import each file and get intrinsic dimensions plus a blur placeholder for free.
 *
 * Idempotent: already-converted files are skipped, so adding photos is a re-run.
 *
 * Usage: node scripts/prepare-images.mjs [--force]
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const SOURCE_ROOT =
  "/Users/jayson/Desktop/Xguard Security Doors & Roller Shutters";
const OUT_ROOT = path.resolve(process.cwd(), "src/images/doors");
const MANIFEST = path.resolve(process.cwd(), "src/config/doors.generated.ts");
const FORCE = process.argv.includes("--force");

// 1600px covers the largest rendering we do (lightbox at 90vw on a desktop
// screen). Next generates smaller variants on request, so a bigger source only
// costs repo size and build memory.
const LONG_EDGE = 1600;
const QUALITY = 80;

/** Folder name -> url slug + display copy. Folders not listed here are ignored. */
const CATEGORIES = [
  {
    dir: "Design Doors",
    slug: "design-doors",
    name: "Design Doors",
    blurb:
      "Decorative security doors that keep the look of your entrance while doing the job of a security screen.",
  },
  {
    dir: "Diamond Doors",
    slug: "diamond-doors",
    name: "Diamond Grille Doors",
    blurb:
      "The classic diamond grille. Hard wearing, well priced, and the most common choice across Melbourne's west.",
  },
  {
    dir: "Double Doors",
    slug: "double-doors",
    name: "Double Entry Doors",
    blurb:
      "Matched pairs made for wide entrances, measured so both leaves sit square and latch cleanly.",
  },
  {
    dir: "Perforated Mesh",
    slug: "perforated-mesh",
    name: "Perforated Mesh",
    blurb:
      "A fine perforated sheet that keeps your view out while making it hard to see in from the street.",
  },
  {
    dir: "Privacy Mesh Door",
    slug: "privacy-mesh-doors",
    name: "Privacy Mesh Doors",
    blurb:
      "Built for front doors that face the footpath, where being seen from outside is the main concern.",
  },
  {
    dir: "Roller Shutters",
    slug: "roller-shutters",
    name: "Roller Shutters",
    blurb:
      "Full window coverage for security, heat and light. Manual or motorised, colour matched to your home.",
  },
  {
    dir: "Sliding doors",
    slug: "sliding-doors",
    name: "Sliding Security Doors",
    blurb:
      "For patio and rear openings, running on rollers that are made to keep working after years of use.",
  },
  {
    dir: "Stainless steel doors",
    slug: "stainless-steel-doors",
    name: "Stainless Steel Doors",
    blurb:
      "Stainless mesh for the strongest option we fit, and the right pick closer to the bay.",
  },
  {
    dir: "Window Grills",
    slug: "window-grills",
    name: "Window Grilles",
    blurb:
      "Fixed grilles for windows, the entry point most people forget when they secure the front door.",
  },
];

const IMAGE_RE = /\.(heic|heif|jpe?g|png)$/i;
const HEIC_RE = /\.(heic|heif)$/i;

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_RE.test(e.name) && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

async function convert(sourcePath, outPath, tmpDir) {
  let decodable = sourcePath;

  if (HEIC_RE.test(sourcePath)) {
    // sips writes into a directory, keeping the basename with a new extension
    const jpegName = path.basename(sourcePath).replace(HEIC_RE, ".jpg");
    decodable = path.join(tmpDir, jpegName);
    await execFileAsync("sips", [
      "-s",
      "format",
      "jpeg",
      sourcePath,
      "--out",
      decodable,
    ]);
  }

  await sharp(decodable)
    .rotate() // apply EXIF orientation before we discard the metadata
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(outPath); // sharp drops EXIF unless withMetadata() is called

  if (decodable !== sourcePath) await rm(decodable, { force: true });
}

async function main() {
  if (!existsSync(SOURCE_ROOT)) {
    console.error(`Source library not found:\n  ${SOURCE_ROOT}`);
    process.exit(1);
  }

  await mkdir(OUT_ROOT, { recursive: true });
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "xguard-"));

  const manifest = [];
  let converted = 0;
  let skipped = 0;

  for (const category of CATEGORIES) {
    const sourceDir = path.join(SOURCE_ROOT, category.dir);
    if (!existsSync(sourceDir)) {
      console.warn(`  skip (no folder): ${category.dir}`);
      continue;
    }

    const files = await listImages(sourceDir);
    const outDir = path.join(OUT_ROOT, category.slug);
    await mkdir(outDir, { recursive: true });

    const photos = [];
    let index = 0;

    for (const file of files) {
      index += 1;
      const outName = `${category.slug}-${String(index).padStart(2, "0")}.jpg`;
      const outPath = path.join(outDir, outName);

      if (!FORCE && existsSync(outPath)) {
        skipped += 1;
      } else {
        try {
          await convert(path.join(sourceDir, file), outPath, tmpDir);
          converted += 1;
        } catch (err) {
          console.error(`  FAILED ${category.dir}/${file}: ${err.message}`);
          continue;
        }
      }

      const { size } = await stat(outPath);
      photos.push({ file: `${category.slug}/${outName}`, index, kb: Math.round(size / 1024) });
    }

    console.log(
      `${category.name.padEnd(24)} ${String(photos.length).padStart(3)} photos`,
    );
    manifest.push({ ...category, photos });
  }

  await rm(tmpDir, { recursive: true, force: true });
  await writeManifest(manifest);

  const totalKb = manifest
    .flatMap((c) => c.photos)
    .reduce((sum, p) => sum + p.kb, 0);
  console.log(
    `\nConverted ${converted}, skipped ${skipped}. Total output ${(totalKb / 1024).toFixed(1)} MB.`,
  );
}

/**
 * Emits static imports so each photo carries its intrinsic size and a generated
 * blur placeholder. Hand-maintaining those would be the main source of layout
 * shift in a gallery whose sources are a mix of portrait and landscape.
 */
async function writeManifest(categories) {
  const lines = [
    "// GENERATED BY scripts/prepare-images.mjs. Do not edit by hand.",
    "// Re-run `node scripts/prepare-images.mjs` after adding photos.",
    'import type { StaticImageData } from "next/image";',
    "",
  ];

  const varName = (slug, i) =>
    slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + String(i).padStart(2, "0");

  for (const category of categories) {
    for (const photo of category.photos) {
      lines.push(
        `import ${varName(category.slug, photo.index)} from "@/images/doors/${photo.file}";`,
      );
    }
  }

  lines.push(
    "",
    "export interface GeneratedPhoto {",
    "  src: StaticImageData;",
    "  id: string;",
    "}",
    "",
    "export const GENERATED_PHOTOS: Record<string, GeneratedPhoto[]> = {",
  );

  for (const category of categories) {
    lines.push(`  "${category.slug}": [`);
    for (const photo of category.photos) {
      lines.push(
        `    { src: ${varName(category.slug, photo.index)}, id: "${category.slug}-${photo.index}" },`,
      );
    }
    lines.push("  ],");
  }

  lines.push("};", "");
  await writeFile(MANIFEST, lines.join("\n"), "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
