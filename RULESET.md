# CH0WN3RS Web Ruleset

This file defines mandatory rules for future UI/feature changes.

## 1. Rendering and SEO

- All content and critical data must be server-side rendered (SSR) by default.
- Client hydration is optional and should only be used for interactive behavior that cannot be done server-side.
- Do not move SEO-relevant text/content into client-only rendering.
- Keep canonical URLs, title, description, Open Graph tags, and structured data accurate for each page.

## 2. Crawler Access

- Do not disable or restrict any public section for search crawlers.
- Do not add `noindex`, `nofollow`, or restrictive `robots.txt` rules for public pages unless explicitly requested.
- Keep `public/robots.txt` permissive for indexing and discovery.

## 3. Sitemap Maintenance

- Any route/path/URL structure change requires sitemap validation.
- After changing routes, run `npm run build` and verify sitemap output is updated.
- Keep sitemap URL in `public/robots.txt` aligned with the production domain.
- Ensure non-indexable technical routes (for example, private/internal API paths) are excluded intentionally.

## 4. URL and Domain Consistency

- Production site URL must stay configured in `astro.config.mjs` (`site` field).
- Canonical URL generation must resolve from `Astro.site`.
- If domain changes, update:
  - `astro.config.mjs`
  - `public/robots.txt`
  - Any hardcoded fallback URLs in layouts/metadata/schema

## 5. Allowed Libraries

Use existing libraries by default. Current approved runtime dependencies:

- `astro`
- `@astrojs/vercel`
- `@astrojs/sitemap`
- `@vercel/blob`
- `animejs`
- `@types/animejs`
- `@phosphor-icons/web`

Adding a new library requires:

- Clear technical need (cannot be solved cleanly with current stack).
- SEO/SSR compatibility (must not force critical content into CSR-only rendering).
- Low bundle/runtime impact.

## 6. Implementation Checklist (Required Before Merge)

- Build succeeds with `npm run build`.
- Canonical and metadata are still correct.
- `robots.txt` remains crawler-friendly.
- Sitemap files generate and include expected public routes.
- No public page loses SSR-rendered core content.
