import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbox } from "@/components/gallery/Lightbox";
import {
  DOOR_CATEGORIES,
  categoryBySlug,
  photosFor,
} from "@/config/doors";
import { site } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** All ten categories prerender, which is the point of the typed manifest. */
export function generateStaticParams() {
  return DOOR_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} in Melbourne's West`,
    description: `${category.blurb} Custom made and professionally installed by XGuard across ${site.serviceRegion}. Free measure and quote.`,
    alternates: { canonical: `/gallery/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const photos = photosFor(category);

  return (
    <main>
      <section>
        <div className="shell">
          <p style={{ marginBottom: "0.75rem" }}>
            <Link href="/gallery" style={{ color: "var(--steel-dim)" }}>
              Back to all doors
            </Link>
          </p>

          <h1 className="section-title">{category.name}</h1>
          <p className="section-sub">
            {category.blurb} {category.bestFor}
          </p>

          {category.fromPrice !== null && (
            <p style={{ marginBottom: "2rem", fontWeight: 700, fontSize: "1.15rem" }}>
              From ${category.fromPrice} installed, including GST.
            </p>
          )}

          {photos.length > 0 ? (
            <Lightbox photos={photos} />
          ) : (
            <p className="section-sub">
              Photos of this work are coming soon. Call {site.phone} and we will
              send you recent examples.
            </p>
          )}

          <div style={{ marginTop: "2.5rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/#book">
              Get a free quote for this
            </Link>
            <a className="btn btn-ghost" href={site.smsHref}>
              Text us a photo of your door
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
