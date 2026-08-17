import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCards } from "@/components/gallery/CategoryCards";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Security Door Gallery",
  description:
    "Real security doors, screens and roller shutters made and installed by XGuard across Melbourne's west. Browse diamond grille, design, privacy mesh, stainless steel, sliding and double doors.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryIndexPage() {
  return (
    <main>
      <section>
        <div className="shell">
          <h1 className="section-title">Our work</h1>
          <p className="section-sub">
            Every photo here is a door or shutter we made and installed in{" "}
            {site.serviceRegion}. Pick the style you are after, or send us a photo
            of your doorway and we will tell you what fits.
          </p>
          <CategoryCards />
          <p style={{ marginTop: "2.5rem" }}>
            <Link className="btn btn-primary" href="/#book">
              Book a free measure and quote
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
