import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ch0wn3rs.ninja/',
  base: '/',
  output: 'server',
  adapter: vercel({
    edgeMiddleware: true,
  }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});
