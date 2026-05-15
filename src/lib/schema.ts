import { SITE, LOCATIONS, MODULES } from './site';

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'EducationalOrganization'],
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/images/logo.png`,
    image: `${SITE.url}/images/og-default.jpg`,
    foundingDate: SITE.founded,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phonePrimary,
    sameAs: Object.values(SITE.socials),
    areaServed: LOCATIONS.map((l) => ({ '@type': 'City', name: l.city })),
    address: LOCATIONS.map((l) => ({
      '@type': 'PostalAddress',
      streetAddress: 'addressLine2' in l && l.addressLine2 ? `${l.addressLine}, ${l.addressLine2}` : l.addressLine,
      addressLocality: l.city,
      addressRegion: l.region,
      postalCode: l.postalCode,
      addressCountry: 'IN',
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE.rating.value,
      reviewCount: SITE.rating.count,
      bestRating: SITE.rating.best,
    },
  };
}

export function websiteSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en-IN',
  };
}

export function localBusinessSchema(locationSlug: 'belagavi' | 'hubballi'): Json {
  const loc = LOCATIONS.find((l) => l.slug === locationSlug)!;
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': `${SITE.url}/beautician-course-${loc.slug}#localbusiness`,
    name: `${SITE.name} — ${loc.city}`,
    image: `${SITE.url}/images/centre-${loc.slug}.jpg`,
    url: `${SITE.url}/beautician-course-${loc.slug}`,
    telephone: loc.phone,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'addressLine2' in loc && loc.addressLine2 ? `${loc.addressLine}, ${loc.addressLine2}` : loc.addressLine,
      addressLocality: loc.city,
      addressRegion: loc.region,
      postalCode: loc.postalCode,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: loc.latitude, longitude: loc.longitude },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    areaServed: { '@type': 'City', name: loc.city },
    parentOrganization: { '@id': `${SITE.url}/#organization` },
  };
}

export function courseSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${SITE.url}/beautician-course#course`,
    name: 'Professional Beautician Course',
    description:
      'Complete professional beautician training covering skin analysis, facials, threading, waxing, bleaching, de-tan, body therapies, manicure, pedicure, hygiene and salon management. Includes live-client practice and certification.',
    url: `${SITE.url}/beautician-course`,
    provider: { '@id': `${SITE.url}/#organization` },
    educationalCredentialAwarded: 'Professional Beautician Certificate',
    inLanguage: ['en', 'kn', 'hi'],
    teaches: MODULES.map((m) => m.title),
    hasCourseInstance: LOCATIONS.map((l) => ({
      '@type': 'CourseInstance',
      courseMode: 'Onsite',
      location: {
        '@type': 'Place',
        name: `${SITE.name} ${l.city}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'addressLine2' in l && l.addressLine2 ? `${l.addressLine}, ${l.addressLine2}` : l.addressLine,
          addressLocality: l.city,
          addressRegion: l.region,
          postalCode: l.postalCode,
          addressCountry: 'IN',
        },
      },
      courseWorkload: 'PT3M',
    })),
    offers: {
      '@type': 'Offer',
      category: 'Vocational Training',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${SITE.url}/contact`,
    },
  };
}

export function faqSchema(faqs: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${SITE.url}${c.url}`,
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  slug: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    image: opts.image.startsWith('http') ? opts.image : `${SITE.url}${opts.image}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { '@type': 'Person', name: opts.author ?? 'Master Makeup Studio & Academy' },
    publisher: { '@id': `${SITE.url}/#organization` },
    mainEntityOfPage: `${SITE.url}/blog/${opts.slug}`,
  };
}

export function reviewSchema(reviews: { author: string; rating: number; text: string; date?: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE.rating.value,
      reviewCount: SITE.rating.count,
      bestRating: SITE.rating.best,
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      ...(r.date && { datePublished: r.date }),
    })),
  };
}
