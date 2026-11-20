import "./landing.css";
import "./site.css";
import { initCareerMonkeLanding } from "./runtime";

initCareerMonkeLanding();

// Reviews marquee: auto-scrolls the native scroller so swipe keeps working.
// The track holds the cards twice; jumping back by one set length is invisible.
function reviewsMarquee(track: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dup = track.querySelector<HTMLElement>(':scope > [aria-hidden="true"]');
  const first = track.firstElementChild as HTMLElement | null;
  if (!dup || !first) return;
  const SPEED = 40; // px per second
  let pos = track.scrollLeft, last = 0, holds = 0, resumeAt = 0;
  const hold = () => { holds++; };
  const release = (delay = 0) => { holds = Math.max(0, holds - 1); resumeAt = performance.now() + delay; };
  track.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hold(); });
  track.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") release(); });
  track.addEventListener("touchstart", hold, { passive: true });
  track.addEventListener("touchend", () => release(1500), { passive: true });
  track.addEventListener("touchcancel", () => release(1500), { passive: true });
  track.addEventListener("focusin", hold);
  track.addEventListener("focusout", () => release());
  const tick = (t: number) => {
    const dt = last ? Math.min(t - last, 50) : 0; // clamp so a background tab doesn't jump on return
    last = t;
    const loop = dup.offsetLeft - first.offsetLeft;
    if (holds || t < resumeAt || Math.abs(track.scrollLeft - pos) > 2) {
      pos = track.scrollLeft; // follow the user's swipe, wheel or keyboard scroll
    } else {
      pos += (SPEED * dt) / 1000;
      if (pos >= loop) pos -= loop;
      track.scrollLeft = pos;
    }
    if (loop > 0 && track.scrollLeft >= loop) { pos = track.scrollLeft - loop; track.scrollLeft = pos; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const rv = document.querySelector<HTMLElement>(".rv-track");
if (rv) reviewsMarquee(rv);

// Sticky View Jobs bar: hidden at first, slides up once the comparison section
// is reached, then stays.
const bar = document.querySelector<HTMLElement>(".sb");
const cmp = document.getElementById("vs")?.closest("section");
if (bar && cmp) {
  const check = () => {
    if (cmp.getBoundingClientRect().top < innerHeight * 0.75) {
      bar.classList.add("on");
      removeEventListener("scroll", check);
    }
  };
  addEventListener("scroll", check, { passive: true });
  check(); // page may load already scrolled (reload, anchor)
}
