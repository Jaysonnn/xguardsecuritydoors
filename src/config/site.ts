/**
 * Single source of truth for business details.
 * ABN and trading name verified against ABN Lookup on 17 Aug 2026.
 */
export const site = {
  name: "XGuard Security Doors & Roller Shutters",
  legalName: "XGuard Security Doors",
  /** Registered business name of Gia Tuyet Cao, sole trader. */
  registeredEntity: "Cao, Gia Tuyet",
  abn: "12 983 909 072",
  /** GST registered since 1 Jul 2025, so advertised prices must include GST. */
  gstRegistered: true,
  phone: "0431 980 897",
  phoneHref: "tel:+61431980897",
  smsHref:
    "sms:+61431980897?body=Hi%20XGuard%2C%20I%27d%20like%20a%20free%20quote%20for%20a%20security%20door.%20My%20suburb%20is%3A%20",
  instagram: "https://www.instagram.com/xguardsecuritydoors/",
  email: "xguard.doors@outlook.com.au",
  serviceRegion: "Melbourne's West",
  /** Registered business location. Maps ranking is weighted by distance from here. */
  baseLocality: "St Albans",
  basePostcode: "3021",
  /**
   * Ordered by distance from the 3021 base, because local search ranking is
   * distance-weighted and leading with far suburbs works against us.
   */
  serviceAreas: [
    "St Albans",
    "Kealba",
    "Albanvale",
    "Deer Park",
    "Cairnlea",
    "Delahey",
    "Sydenham",
    "Taylors Lakes",
    "Keilor Downs",
    "Sunshine",
    "Caroline Springs",
    "Hillside",
    "Melton",
    "Tarneit",
    "Truganina",
    "Werribee",
    "Point Cook",
  ],
  usp: [
    "Custom made to fit",
    "Roller shutters",
    "Professional installation",
    "Free measure and quote",
  ],
} as const;
