import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  site: 'https://ch0wn3rs.netlify.app',
  base: '/',
  output: 'server',
  adapter: vercel({
    edgeMiddleware: true,
  }),
});