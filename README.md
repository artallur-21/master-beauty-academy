# Master Beauty Academy — masterbeautyacademy.com

A production-ready, AI-first static website for **Master Beauty Academy** — India's premier Professional Beautician training institute in **Belagavi** and **Hubballi**.

Built end-to-end from the Website Strategy Blueprint with a focus on:

- **Speed** — static HTML + near-zero JS, ~30 KB initial
- **SEO** — semantic HTML, schema everywhere, sitemaps, RSS
- **GEO/AEO** — entity-rich content, FAQPage schema, AI-crawler-friendly robots
- **Conversion** — multi-surface CTAs, WhatsApp-first lead capture
- **Polish** — editorial typography, refined motion, luxury palette

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Astro 6 (static output) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 (CSS-first theme via `@theme`) |
| Content | Astro Content Collections + MDX |
| Schema | JSON-LD utilities in `src/lib/schema.ts` |
| Hosting | Self-hosted VPS · NGINX · Brotli + Gzip |

## Project structure

```
src/
├── components/        # Astro components (Hero, FAQ, EnquiryForm, ...)
├── content/
│   ├── blog/          # MDX articles
│   ├── faqs/          # JSON FAQ banks (home/course/belagavi/hubballi)
│   └── testimonials/  # JSON student testimonials
├── layouts/           # BaseLayout, BlogLayout
├── lib/               # site.ts, seo.ts, schema.ts
├── pages/             # Routes (each *.astro = one URL)
│   ├── index.astro                          /
│   ├── about.astro                          /about
│   ├── beautician-course/index.astro        /beautician-course
│   ├── beautician-course/curriculum.astro   /beautician-course/curriculum
│   ├── beautician-course-belagavi.astro     /beautician-course-belagavi
│   ├── beautician-course-hubballi.astro     /beautician-course-hubballi
│   ├── gallery.astro                        /gallery
│   ├── testimonials.astro                   /testimonials
│   ├── contact.astro                        /contact
│   ├── blog/index.astro                     /blog
│   ├── blog/[...slug].astro                 /blog/{slug}
│   ├── rss.xml.ts                           /rss.xml
│   └── 404.astro                            /404
└── styles/global.css  # Tailwind 4 theme + components layer
```

## Setup

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs ./dist
npm run preview
```

## SEO checklist applied per page

- Title 55–60 chars, primary keyword near the start
- Meta description 150–160 chars
- One H1, structured H2/H3 hierarchy
- Canonical, OpenGraph, Twitter, theme-color
- 3+ internal links
- Breadcrumbs (visible + `BreadcrumbList` schema)
- WCAG-friendly contrast, semantic landmarks, skip-to-content

## Schema coverage

| Schema | Pages |
| --- | --- |
| `Organization` + `EducationalOrganization` | Global (via SEO.astro) |
| `WebSite` | Global |
| `LocalBusiness` | Home, Contact, Belagavi, Hubballi |
| `Course` | Home, Course, Curriculum |
| `FAQPage` | Home, Course, Belagavi, Hubballi, Blog (where applicable) |
| `BreadcrumbList` | All inner pages |
| `Review` + `AggregateRating` | Home, Testimonials |
| `Article` | All blog posts |

## GEO / AEO

- AI bots explicitly allowed in `robots.txt` (GPTBot, PerplexityBot, Google-Extended, ClaudeBot, anthropic-ai, etc.)
- Concise 40–60 word FAQ answers (extraction-ready)
- Entity-dense About + Curriculum pages
- NAP-consistent across schema, footer, location pages

## Performance philosophy

- **Static-first** — every page is pre-rendered HTML
- **Zero React** — Astro Islands only where strictly needed (mobile menu, enquiry form, FAQ accordion via native `<details>`)
- **System fonts as fallback** + 2 self-hostable Google fonts (`Fraunces`, `Inter`) preconnected
- **`<img loading="lazy">`** by default
- **No animation libraries** — all motion is CSS
- **Critical CSS inlined** via Astro's `inlineStylesheets: 'auto'`

## Adding content

```bash
# New blog post
touch src/content/blog/my-new-post.mdx
# Add frontmatter (see existing posts as template)

npm run build
```

The post is automatically added to `/blog`, the sitemap, and RSS.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full VPS + NGINX guide, including Brotli, HSTS, CSP, immutable caching, and Let's Encrypt setup.

## Brand

- Primary: `#7a1641` (brand-700)
- Accent: `#d4b46a` (gold-400)
- Typography: Fraunces (display) + Inter (body)

---

© Master Beauty Academy · Belagavi & Hubballi · Karnataka, India
