import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string().min(10).max(80),
      description: z.string().min(80).max(180),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Master Beauty Academy'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      keyword: z.string(),
      featured: z.boolean().default(false),
      faqs: z
        .array(z.object({ q: z.string(), a: z.string() }))
        .default([]),
      readingTime: z.string().optional(),
    }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      city: z.enum(['Belagavi', 'Hubballi']),
      rating: z.number().min(1).max(5).default(5),
      quote: z.string(),
      photo: image().optional(),
      year: z.string().optional(),
      videoUrl: z.string().url().optional(),
    }),
});

const faqs = defineCollection({
  type: 'data',
  schema: z.object({
    scope: z.enum(['home', 'course', 'belagavi', 'hubballi', 'general']),
    items: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
});

export const collections = { blog, testimonials, faqs };
