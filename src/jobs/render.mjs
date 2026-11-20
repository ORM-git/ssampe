// Renders the sample job cards at build time (vite.config.mjs). Static copy of the CareerMonke job card
// (Carrier-hound src/app/jobs/page.tsx): desktop variant from 640px, compact mobile variant below.
const APPLY = "https://careermonke.com/jobs";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const i = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

// Same as CareerMonke inferJobLevel / getTagColorClass
function level(title) {
  const t = title.toLowerCase();
  if (t.includes("staff") || t.includes("principal") || t.includes("lead")) return "Staff / Lead";
  if (t.includes("senior") || t.includes("sr.")) return "Senior Level";
  if (t.includes("junior") || t.includes("entry") || t.includes("associate")) return "Entry Level";
  return "";
}
function tint(text) {
  let h = 0;
  for (let k = 0; k < text.length; k++) { h = (h << 5) - h + text.charCodeAt(k); h |= 0; }
  return "t" + (Math.abs(h) % 4);
}
function ring(score) {
  const r = 32.75, c = 2 * Math.PI * r;
  return `<span class="jc-ring"><svg viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="${r}" stroke="#1E293B" stroke-width="4.5" fill="none"/><circle cx="35" cy="35" r="${r}" stroke="#2DD4BF" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c - (score / 100) * c).toFixed(2)}"/></svg><b>${score}%</b></span>`;
}
const logo = (j, size) =>
  `<span class="jc-logo${size === 32 ? " sm" : ""}"><img src="${esc(j.logo)}" alt="${esc(j.company)} logo" width="${size}" height="${size}" decoding="async"></span>`;

function card(j) {
  const lvl = level(j.title);
  const t = esc(j.title), co = esc(j.company), cat = esc(j.category), loc = esc(j.location), sal = esc(j.salary), ago = esc(j.posted);
  return `
        <article class="jc">
          <div class="jc-d">
            <div class="jc-main">
              <div class="jc-top">
                ${logo(j, 72)}
                <div class="jc-head">
                  <div class="jc-row1"><div class="jc-pills"><span class="jc-pill b">${i("clock")}${ago}</span><span class="jc-pill b">Early applicant</span><span class="jc-pill s">Remote Eligible</span></div><span class="jc-menu">${i("ellipsis")}</span></div>
                  <h3 class="jc-title">${t}</h3>
                  <div class="jc-co"><span>${co}</span><span class="jc-cat ${tint(j.category)}">${cat}</span></div>
                </div>
              </div>
              <div class="jc-hr"></div>
              <div class="jc-grid">
                <span>${i("map-pin")}${loc}</span><span>${i("briefcase")}Full-time</span><span class="sal">${i("dollar-sign")}<b>${sal}</b></span>
                <span>${i("laptop")}Remote</span><span>${lvl ? i("trending-up") + lvl : ""}</span><span></span>
              </div>
              <div class="jc-hr"></div>
              <div class="jc-act"><span class="jc-ib">${i("ban")}</span><span class="jc-ib">${i("heart")}</span><a class="jc-apply" href="${APPLY}">Apply ${i("arrow-right")}</a></div>
            </div>
            <div class="jc-match">
              <div class="jc-mtop">${ring(j.match)}<p>Experience match</p></div>
              <ul class="jc-checks"><li><i>✓</i>Remote Eligible</li><li><i>✓</i>Direct Feed</li></ul>
            </div>
          </div>
          <div class="jc-m">
            <div class="jc-mrow">
              ${logo(j, 32)}
              <div class="jc-mco"><b>${co}</b><span>${cat} · Remote</span></div>
              <span class="jc-badge">${j.match}%</span><span class="jc-menu">${i("ellipsis")}</span>
            </div>
            <h3 class="jc-mtitle">${t}</h3>
            <div class="jc-hr"></div>
            <div class="jc-chips"><span>${i("map-pin")}${loc}</span><span>${i("briefcase")}Full-time</span><span>${i("laptop")}Remote</span><span>${i("dollar-sign")}${sal}</span></div>
            <div class="jc-mfoot"><span>${ago}</span><div class="jc-act"><span class="jc-ib">${i("ban")}</span><span class="jc-ib">${i("heart")}</span><a class="jc-apply sm" href="${APPLY}">Apply ${i("arrow-right")}</a></div></div>
          </div>
        </article>`;
}

export const renderJobCards = (jobs) => jobs.map(card).join("");
