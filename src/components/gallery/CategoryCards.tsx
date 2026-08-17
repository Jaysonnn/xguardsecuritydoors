import Image from "next/image";
import Link from "next/link";
import { DOOR_CATEGORIES, coverFor, photosFor } from "@/config/doors";
import styles from "./gallery.module.css";

/**
 * Server component. Only the lightbox needs client JavaScript, so the images
 * themselves stay in the server payload.
 */
export function CategoryCards({ limit }: { limit?: number }) {
  const categories = limit ? DOOR_CATEGORIES.slice(0, limit) : DOOR_CATEGORIES;

  return (
    <ul className={styles.categoryGrid}>
      {categories.map((category) => {
        const cover = coverFor(category);
        const count = photosFor(category).length;

        return (
          <li key={category.slug}>
            <Link href={`/gallery/${category.slug}`} className={styles.card}>
              <div className={styles.cardImage}>
                {cover && (
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 92vw"
                    style={{
                      objectFit: "cover",
                      objectPosition: category.focal ?? "50% 50%",
                    }}
                  />
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{category.name}</span>
                <span className={styles.cardBlurb}>{category.blurb}</span>
                <span className={styles.cardCount}>
                  {count} {count === 1 ? "photo" : "photos"}
                </span>
                <span className={styles.cardBest}>{category.bestFor}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
