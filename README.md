# Portfolio — Mayank Gupta

Azure Integration Specialist & AI Engineer portfolio. Azure-leaning light theme,
scroll-driven storytelling, and three interactive WebGL scenes.

**Stack:** Vite · TypeScript · Three.js · GSAP (ScrollTrigger + SplitText) · Lenis ·
hand-written CSS. Deploys as a static site to Cloudflare Pages.

All copy, roles, dates, projects and certifications come from
`public/resume/Resume_Mayank_7Yrs_Azure_Integration.pdf`, which is also linked for
download from the header, hero and contact section.

## Structure (8 sections)

| Section | What it does |
|---|---|
| `#home` | **Night-desk scene** (hand-built animated SVG, styled after Mayank's own photo — mustache, no glasses, headphones, head bobs to the music) with the oversized name |
| `#about` | Real portrait, cut out and standing on an azure panel, + capability checklist and awards |
| `#reach` | **Interactive particle globe** — full sphere of tiles, continents brighter, sampled off a real world map. Drag to spin, particles scatter from the cursor, click for a glitter burst |
| `#journey` | Pinned scroll story — six career chapters (real employers/dates from the resume), each with its own tech-stack icon on a floating 3D glass card |
| `#work` | Six real case-study cards, 2 rows × 3, with 3D pointer-tilt hover |
| `#gallery` | **3D ring gallery** — project images orbiting a glowing core, driven by scroll |
| `#skills` | Toolbox cards (icon badges) + all 8 certifications, 2 rows × 3 |
| `#contact` | Short — email, LinkedIn, resume. No form (see *Contact*, below) |

A cursor companion (`src/modules/companion.ts`) follows the pointer across every
section: idles, waves on arrival, reacts on click. On touch it parks bottom-right
instead and reacts to scroll momentum. Hidden under `prefers-reduced-motion`.

## Status

### Done
- [x] Real content throughout — every role, date, project, skill and certification
      comes from the resume PDF, not invented
- [x] Azure-leaning colour theme (light blue), applied consistently including the
      hero scene, contact block and globe
- [x] Hero scene recoloured to match the site palette and Mayank's actual likeness
      (mustache, no glasses, hairstyle) instead of a generic warm stock scene
- [x] Portrait added and cut out from its studio backdrop (`profile-cutout.png`)
- [x] Phone number removed everywhere, including the JSON-LD structured data
- [x] Non-functional contact form removed (it only opened a `mailto:` link)
- [x] Work and Skills trimmed to 6 tiles each (2 clean rows) from 7
- [x] Full-stack/app-development experience added (Optimizely CMS, TypeScript, iOS)
- [x] Mobile: cursor companion no longer disappears — parks in the corner instead
- [x] SEO: JSON-LD `Person`/`WebSite`/`ProfilePage` with real credentials, employer
      and education; meta tags target Azure integration + agentic AI; `robots.txt`,
      `sitemap.xml`, `_headers` in place
- [x] Performance: Three.js code-split per scene, initial bundle ~147 KB (54 KB gz)
- [x] Console is clean — zero errors or warnings (GSAP scale-shorthand issue and
      the deprecated `THREE.Clock` were both fixed)
- [x] Accessibility: every animation respects `prefers-reduced-motion`; scroll
      reveals use IntersectionObserver so content can't get stuck invisible
- [x] `public/og-image.png` created (1200×630) — matches the site's palette and
      typography, includes the Azure architecture diagram from the hero
- [x] Domain confirmed final: `mayankcloud.com`. The hardcoded URLs in `index.html`,
      `public/robots.txt` and `public/sitemap.xml` are correct as-is.

### Left to do
- [ ] **Push to GitHub + connect Cloudflare Pages** — commands below; not yet done.
- [ ] **Work/gallery imagery is stock** (`public/images/az-*.jpg`, Unsplash) standing
      in for real project screenshots or diagrams.
- [ ] **GitHub link** — only LinkedIn is wired up in the header/footer; add a GitHub
      URL if you want one there.
- [ ] **Contact form** — deliberately absent for now (see *Contact*, below). Add one
      if/when you want real inbound submissions.

## The hero scene

`public/images/night-desk.svg` is a hand-built, hand-animated SVG (no external
assets) recreating a developer at a desk at night — warm lamp glow, an Azure-tinted
monitor glow, framed art on the wall, and a headphone LED that pulses. The character's
mustache, lack of glasses, and hairstyle are drawn to resemble Mayank's own photo
rather than a generic stock look. The head gently bobs to the music. It weighs ~8 KB.

The site's original hero used a supplied 14.7 MB video whose character and room were
visually identical to the animated figure in juanmora.co's footer — that file has been
deleted and nothing references it.

## Contact

The contact section is deliberately just links — email, LinkedIn and the resume PDF.
There is no form, because there is no backend to receive one, and a "Send message"
button that silently opens a mail client implies a submission that never actually
happens — worse than no button at all.

If you want a real form later:

1. **Cloudflare Pages Function** — add `functions/api/contact.ts`, send via Resend or
   SendGrid with the API key stored as a Pages secret, and POST to `/api/contact`.
2. **Form service** — Formspree, Web3Forms or similar; point a form's action at their
   endpoint. No server code needed.

## Swapping the portrait

`public/images/profile-cutout.png` is the studio portrait with its beige studio
backdrop removed, so it sits on the site's azure panel in the About section. The
original is kept at `public/images/profile.jpeg`.

To regenerate after replacing the source photo:

```bash
npm i -D playwright && npx playwright install chromium   # or use system Edge
npm run dev                     # the script reads the image through the dev server
node scripts/cutout-portrait.mjs
```

It removes the backdrop with an **edge flood-fill**, not a global colour key — only
background connected to the border is cut, so skin tones (which sit close to beige in
RGB) can't be keyed out by accident. If your new photo has the subject running off the
bottom of the frame, keep the reference sampling restricted to the top/side edges as it
is now, or the fill will treat the clothing as background.

## Swapping the cursor companion character

`public/models/character.glb` is a CC0 rigged model (`RobotExpressive`), tinted into
the site's azure palette at load time. To use your own:

1. Rig a character on [mixamo.com](https://www.mixamo.com) (free Adobe account), or use
   Blender/Sketchfab/Quaternius.
2. Export as **glTF Binary (.glb)**, "With Skin" for the mesh, and merge in any extra
   animation clips (Mixamo usually names every clip `mixamo.com` — rename them in
   Blender's Action Editor first, or they'll collide).
3. Replace `public/models/character.glb`.
4. In `src/modules/companion.ts`, update the clip names at the top (`IDLE`,
   `GREETING`, `REACTIONS`) to match your export.

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + build to dist/
npm run preview   # serve the production build
```

## Deploying to Cloudflare Pages

### Git integration (auto-deploys on push)
1. Push to GitHub (below).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings — Framework preset: **Vite**, Build command: `npm run build`,
   Output directory: `dist`.

### Or direct upload
```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=mayank-portfolio
```

### Connecting mayankcloud.com
- **Already on Cloudflare DNS:** Pages project → **Custom domains** → add
  `mayankcloud.com`. Records and SSL are provisioned automatically.
- **Registered elsewhere:** add the domain as a zone in Cloudflare, repoint the
  nameservers at your registrar (propagation up to ~24h), then add the custom domain.

Then update the hardcoded `https://mayankcloud.com` URLs in `index.html` (canonical,
`og:url`, `og:image`, JSON-LD) and in `public/robots.txt` / `public/sitemap.xml` if the
final domain differs.

## Pushing to GitHub

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```
(Create the empty repo on GitHub first.)

## SEO notes

- Title, description and copy target *Azure integration specialist* and
  *agentic AI/Microsoft Foundry*.
- JSON-LD `Person` + `WebSite` + `ProfilePage` in `<head>`, with real credentials,
  employer and education — keep in sync with any resume change.
- All content is **static HTML** (not client-rendered), so it's indexable by
  crawlers that don't run JavaScript, and by social-card scrapers.
- Three.js is code-split per scene (character, globe, ring), loaded only as each
  section approaches — initial bundle is ~147 KB (54 KB gzipped).
- `public/robots.txt`, `public/sitemap.xml`, and `public/_headers` (caching +
  security headers) are set up. Submit the sitemap in Google Search Console + Bing
  Webmaster Tools once live.
- Add real `sameAs` profile URLs (GitHub, etc.) to the JSON-LD if you add more.

## Accessibility / motion

Every animation respects `prefers-reduced-motion`. Scroll reveals use
IntersectionObserver (not scroll position), so content can't get stuck invisible if
the page jumps via keyboard, find-in-page, or hash navigation.
