# CareerMonke marketing site

Standalone static site (Vite, plain HTML/CSS/TS). Header, footer, colors, logo, copy, demo, globe,
comparison table and FAQ are copied from the CareerMonke app (`ORM-git/Carrier-hound`, read-only).
App links point to https://careermonke.com.

## Run

    npm install
    npm run dev      # local dev
    npm run build    # outputs dist/

## Placeholders to replace before launch

Search `index.html` for `PLACEHOLDER`:
- Reviews (marquee and the wall after the FAQ): `[Reviewer name N]`, `[PLACEHOLDER REVIEW N ...]`, initials `R1`..`R6`
- Founder stats: the three `[00K+]` / `[PLACEHOLDER stat label N]` items (CareerMonke has no founder stats to copy)
- Job cards (Microsoft, Spotify, after the hero) and the logo slider companies are sample listings; the cards are no longer labelled as samples on the page.

## Deploy on Netlify

1. Netlify → Add new site → Import an existing project → GitHub → pick `ORM-git/ssampe`.
2. Branch `main`. Build command and publish dir come from `netlify.toml`
   (`npm run build`, `dist`, Node 22); leave the fields as detected.
3. Deploy site. Optionally add your domain under Domain management.
