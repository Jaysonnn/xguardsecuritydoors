import type { StaticImageData } from "next/image";
import { GENERATED_PHOTOS } from "./doors.generated";

/**
 * Product catalogue. Photos come from doors.generated.ts, which the image script
 * rewrites, so adding pictures means dropping files in the source library and
 * re-running `node scripts/prepare-images.mjs`. Everything a human writes lives
 * here and survives that regeneration.
 */
export interface DoorCategory {
  slug: string;
  name: string;
  /** Shown on the category card and as the page's meta description opener. */
  blurb: string;
  /** Points buyers at what actually differs between products. */
  bestFor: string;
  /**
   * GST-inclusive starting price, supplied and installed. Left null until the
   * owner confirms a number, because an advertised price that cannot be honoured
   * is a consumer-law problem, and because a wrong anchor costs more than none.
   */
  fromPrice: number | null;
  /**
   * object-position for tiles whose subject sits away from centre. Portrait door
   * photos often put the lock low, and a centre crop cuts it off.
   */
  focal?: string;
}

export const DOOR_CATEGORIES: readonly DoorCategory[] = [
  {
    slug: "diamond-doors",
    name: "Diamond Grille Doors",
    blurb:
      "The classic diamond grille, hard wearing and well priced. The most common choice across Melbourne's west.",
    bestFor: "Best for front and back doors on a budget.",
    fromPrice: null,
  },
  {
    slug: "design-doors",
    name: "Design Doors",
    blurb:
      "Decorative security doors that keep the look of your entrance while doing the job of a security screen.",
    bestFor: "Best for period homes and street-facing entries.",
    fromPrice: null,
  },
  {
    slug: "privacy-mesh-doors",
    name: "Privacy Mesh Doors",
    blurb:
      "Built for front doors that face the footpath, where being seen from outside is the main concern.",
    bestFor: "Best for homes close to the street.",
    fromPrice: null,
  },
  {
    slug: "perforated-mesh",
    name: "Perforated Mesh",
    blurb:
      "A fine perforated sheet that keeps your view out while making it hard to see in from the street.",
    bestFor: "Best when you want airflow without an open view in.",
    fromPrice: null,
  },
  {
    slug: "stainless-steel-doors",
    name: "Stainless Steel Doors",
    blurb:
      "Stainless mesh, the strongest option we fit, and the right pick for homes closer to the bay.",
    bestFor: "Best for maximum strength and coastal areas.",
    fromPrice: null,
  },
  {
    slug: "sliding-doors",
    name: "Sliding Security Doors",
    blurb:
      "For patio and rear openings, running on rollers made to keep working after years of use.",
    bestFor: "Best for patio and alfresco openings.",
    fromPrice: null,
  },
  {
    slug: "double-doors",
    name: "Double Entry Doors",
    blurb:
      "Matched pairs made for wide entrances, measured so both leaves sit square and latch cleanly.",
    bestFor: "Best for wide double entryways.",
    fromPrice: null,
  },
  {
    slug: "roller-shutters",
    name: "Roller Shutters",
    blurb:
      "Full window coverage for security, heat and light. Manual or motorised, colour matched to your home.",
    bestFor: "Best for bedrooms, heat control and total blockout.",
    fromPrice: null,
  },
  {
    slug: "window-grills",
    name: "Window Grilles",
    blurb:
      "Fixed grilles for windows, the entry point most people forget once the front door is sorted.",
    bestFor: "Best for ground-floor and rear windows.",
    fromPrice: null,
  },
] as const;

export interface GalleryPhoto {
  src: StaticImageData;
  id: string;
  alt: string;
}

/** Photos for a category, with alt text generated from the category name. */
export function photosFor(category: DoorCategory): GalleryPhoto[] {
  const photos = GENERATED_PHOTOS[category.slug] ?? [];
  return photos.map((photo, i) => ({
    ...photo,
    alt: `${category.name} supplied and installed by XGuard in Melbourne's west, example ${i + 1}`,
  }));
}

export function categoryBySlug(slug: string): DoorCategory | undefined {
  return DOOR_CATEGORIES.find((c) => c.slug === slug);
}

/** First photo of a category, used as its cover tile. */
export function coverFor(category: DoorCategory): GalleryPhoto | undefined {
  return photosFor(category)[0];
}
