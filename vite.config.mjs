import { defineConfig } from "vite";
import fs from "node:fs";
import { jobs } from "./src/jobs/jobs.mjs";
import { renderJobCards } from "./src/jobs/render.mjs";

const MARK = "<!-- job-cards -->";

// Renders the sample job cards into index.html (dev and build), so the page stays static.
// Fails the build on a missing logo file or placeholder instead of shipping a 404 or an empty block.
const jobCards = {
  name: "job-cards",
  transformIndexHtml(html) {
    for (const j of jobs) {
      if (!fs.existsSync(new URL(`./public${j.logo}`, import.meta.url))) throw new Error(`Logo missing for ${j.company}: public${j.logo}`);
    }
    if (!html.includes(MARK)) throw new Error(`index.html has no ${MARK} placeholder`);
    return html.replace(MARK, renderJobCards(jobs));
  },
};

export default defineConfig({ plugins: [jobCards] });
