import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CallBar } from "@/components/layout/CallBar";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | ${site.serviceRegion}`,
    template: `%s | ${site.legalName}`,
  },
  description:
    "Custom made security doors, screens and roller shutters in Melbourne's west. Free measure and quote, professional installation. Call 0431 980 897.",
  keywords: [
    "security doors Melbourne",
    "security doors St Albans",
    "roller shutters Melbourne west",
    "security screens Brimbank",
    "diamond grille door",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: site.name,
    description: `Custom made security doors and roller shutters, supplied and installed across ${site.serviceRegion}.`,
    url: siteUrl,
    siteName: site.legalName,
    locale: "en_AU",
    type: "website",
  },
  formatDetection: { telephone: true },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
};

/**
 * LocalBusiness markup. This is the highest-leverage SEO item for a local trade,
 * and it is only safe to publish now that the ABN and trading name are verified
 * against the ABR.
 */
function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: site.name,
    legalName: site.legalName,
    telephone: site.phone,
    email: site.email,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    identifier: { "@type": "PropertyValue", name: "ABN", value: site.abn },
    address: {
      "@type": "PostalAddress",
      addressLocality: site.baseLocality,
      addressRegion: "VIC",
      postalCode: site.basePostcode,
      addressCountry: "AU",
    },
    areaServed: site.serviceAreas.map((name) => ({
      "@type": "City",
      name: `${name}, Victoria`,
    })),
    sameAs: [site.instagram],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Nonce is set by middleware. Browsers vary in whether they enforce script-src
  // on application/ld+json, so applying it is free insurance.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <CallBar />
        {/* React intentionally blanks `nonce` in client HTML, so this element
            always mismatches on hydration unless the warning is suppressed. The
            nonce still reaches the browser in the server-rendered markup, which
            is where CSP evaluates it. */}
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema()),
          }}
        />
      </body>
    </html>
  );
}
