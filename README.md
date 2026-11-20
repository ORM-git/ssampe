# CareerMonke marketing site

Standalone static site (Vite, plain HTML/CSS/TS). Header, footer, colors, logo, copy, demo, globe,
comparison table and FAQ are copied from the CareerMonke app (`ORM-git/Carrier-hound`, read-only).
App links point to https://careermonke.com.

## Run

    npm install
    npm run dev      # local dev
    npm run build    # outputs dist/

## Placeholders to replace before launch

Search `index.html` for `[`:
- Reviews: `[Reviewer name N]`, `[PLACEHOLDER REVIEW N ...]`, avatar initials `R1`..`R6`
- Founder: `[Founder name]`, `[Photo]` (swap the `.fd-ph` div for an `<img>`), `[PLACEHOLDER FOUNDER BIO ...]`, the three `[00K+]` / `[Label N]` stats
- "Find jobs" cards and the logo slider use sample companies, marked as sample on the page.

## Deploy on Netlify

1. Netlify → Add new site → Import an existing project → GitHub → pick `ORM-git/ssampe`.
2. Branch `main`. Build command and publish dir come from `netlify.toml`
   (`npm run build`, `dist`, Node 22); leave the fields as detected.
3. Deploy site. Optionally add your domain under Domain management.
