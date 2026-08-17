import Link from "next/link";
import { site } from "@/config/site";
import { DOOR_CATEGORIES } from "@/config/doors";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="shell">
        <div className={styles.columns}>
          <div>
            <p className={styles.brand}>{site.name}</p>
            <p>
              Custom made security doors, screens and roller shutters, supplied and
              installed across {site.serviceRegion}.
            </p>
            <p className={styles.legal}>
              ABN {site.abn}
              <br />
              {site.baseLocality} VIC {site.basePostcode}
            </p>
          </div>

          <div>
            <p className={styles.heading}>Our doors</p>
            <ul className={styles.list}>
              {DOOR_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link href={`/gallery/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.heading}>Get in touch</p>
            <ul className={styles.list}>
              <li>
                <a href={site.phoneHref}>{site.phone}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <Link href="/#book">Book a free measure</Link>
              </li>
            </ul>
          </div>
        </div>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} {site.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
