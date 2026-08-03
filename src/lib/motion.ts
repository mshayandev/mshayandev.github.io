import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";

/** Single source of truth for "should anything move at all". */
export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis: Lenis | null = null;
let ready = false;

/**
 * Registers plugins once and wires Lenis into GSAP's ticker so ScrollTrigger
 * and smooth scrolling share a single rAF. Safe to call from every island.
 */
export function initMotion() {
  if (ready) return { gsap, ScrollTrigger, Flip, lenis };
  ready = true;

  gsap.registerPlugin(ScrollTrigger, Flip);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  if (reducedMotion()) return { gsap, ScrollTrigger, Flip, lenis };

  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    lerp: 0.1,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Lenis takes over scrolling, so native anchor jumps need re-routing.
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as
      | HTMLAnchorElement
      | null;
    if (!link) return;
    const href = link.getAttribute("href") ?? "";
    const hash = href.startsWith("#")
      ? href
      : href.startsWith("/#")
        ? href.slice(1)
        : null;
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    lenis?.scrollTo(target as HTMLElement, { offset: -88, duration: 1.2 });
    history.replaceState(null, "", hash);
  });

  return { gsap, ScrollTrigger, Flip, lenis };
}

/**
 * Intro-loader handshake. The hero waits for this so its reveal starts as the
 * curtain lifts — but never blocks if there is no loader on the page.
 */
declare global {
  interface Window {
    __siteReady?: boolean;
  }
}

export function markSiteReady() {
  if (window.__siteReady) return;
  window.__siteReady = true;
  window.dispatchEvent(new Event("site:ready"));
}

export function onSiteReady(callback: () => void) {
  if (window.__siteReady || !document.getElementById("loader")) {
    callback();
    return;
  }
  window.addEventListener("site:ready", callback, { once: true });
}

/** Splits an element's text into per-word / per-char spans for stagger reveals. */
export function splitText(el: HTMLElement) {
  const source = el.textContent ?? "";
  el.textContent = "";
  el.setAttribute("aria-label", source);

  const chars: HTMLElement[] = [];
  for (const word of source.split(/(\s+)/)) {
    if (!word) continue;
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const wrap = document.createElement("span");
    wrap.className = "split-word";
    wrap.setAttribute("aria-hidden", "true");
    for (const ch of word) {
      const span = document.createElement("span");
      span.className = "split-char";
      span.textContent = ch;
      wrap.appendChild(span);
      chars.push(span);
    }
    el.appendChild(wrap);
  }
  return chars;
}
