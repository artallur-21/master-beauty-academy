import { SITE } from './site';

export interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  keywords?: string[];
}

export function buildSeo(props: SeoProps) {
  const canonical = `${SITE.url}${props.path === '/' ? '' : props.path}`;
  const ogImage = props.image
    ? props.image.startsWith('http')
      ? props.image
      : `${SITE.url}${props.image}`
    : `${SITE.url}${SITE.ogImage}`;

  const fullTitle =
    props.title.length > 0 && !props.title.includes(SITE.name)
      ? `${props.title} | ${SITE.name}`
      : props.title;

  return {
    title: fullTitle,
    description: props.description.slice(0, 160),
    canonical,
    ogImage,
    type: props.type ?? 'website',
    noindex: props.noindex ?? false,
    keywords: props.keywords?.join(', ') ?? '',
  };
}
