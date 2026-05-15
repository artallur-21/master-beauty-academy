import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@lib/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog');
  return rss({
    title: `${SITE.name} — Beautician Career & Beauty Industry Insights`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((p) => ({
        title: p.data.title,
        pubDate: p.data.pubDate,
        description: p.data.description,
        link: `/blog/${p.slug}`,
        author: p.data.author,
        categories: p.data.tags,
      })),
    customData: '<language>en-IN</language>',
  });
}
