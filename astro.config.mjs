import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://ch0wn3rs.netlify.app',
  base: '/',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
});