/* Homepage motion: four quiet moments. Native scrolling stays in control,
 * every element has a complete static state, and reduced motion gets none.
 *  1. The film arrives: --arrive (0..1) widens the film band as it enters.
 *  2. Across every residence and yacht: a point of light travels the route
 *     with the scroll; each property's entry writes in as the light arrives.
 *  3. Signature light: one hairline of warm light traces the top edge of an
 *     evergreen panel the first time it enters view.
 *  4. Gentle arrivals: text rises and fades in; photographs settle.
 */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t); // smoothstep: gentle in, gentle out

  const film = document.querySelector("#film");
  const places = document.querySelector("[data-places]");
  const route = places?.querySelector(".places-route");
  const line = places?.querySelector(".places-line");
  const stops = places ? [...places.querySelectorAll(".place")] : [];

  // Place the route line through the node centres (it differs by layout).
  function measureRoute() {
    if (!places || !line || !stops.length) return;
    const map = places.querySelector(".places-map").getBoundingClientRect();
    const first = stops[0].querySelector(".place-node").getBoundingClientRect();
    const last = stops[stops.length - 1].querySelector(".place-node").getBoundingClientRect();
    const vertical = Math.abs(last.top - first.top) > Math.abs(last.left - first.left);
    if (vertical) {
      line.style.setProperty("--line-top", `${first.top + first.height / 2 - map.top}px`);
      line.style.setProperty("--line-h", `${last.top - first.top}px`);
      line.style.removeProperty("--line-y");
    } else {
      line.style.setProperty("--line-y", `${first.top + first.height / 2 - map.top}px`);
    }
  }


  // 03 The intelligence: four homes, one loop. Wide or tall source by layout;
  // plays only while in view; under reduced motion the poster stays.
  const intel = document.querySelector("[data-intel] video");
  if (intel) {
    const tall = matchMedia("(max-width: 700px)");
    const pick = () => {
      const base = tall.matches ? intel.dataset.tall : intel.dataset.wide;
      intel.poster = base + "-poster.webp";
      if (reduce) return;
      const src = intel.canPlayType('video/webm; codecs="vp9"') ? base + ".webm" : base + ".mp4";
      if (!intel.src.endsWith(src)) { intel.src = src; intel.load(); }
    };
    pick(); tall.addEventListener("change", pick);
    // The note follows the loop: in each home the owner asks, then ZALLIA answers from the collection.
    const note = document.querySelector("[data-intel] .intel-note");
    const beats = [[0, 0], [4.55, 1], [10.02, 2], [15.98, 3], [22.44, 0]];
    if (note && !reduce) intel.addEventListener("timeupdate", () => {
      let b = 0;
      for (const [t, i] of beats) if (intel.currentTime >= t) b = i;
      if (note.dataset.beat !== String(b)) note.dataset.beat = b;
    });
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { intel.preload = "auto"; intel.play().catch(() => {}); } else intel.pause();
      }), {threshold: 0.35}).observe(intel);
    }
  }
  if (reduce) {
    places?.classList.add("places-static");
    measureRoute();
    addEventListener("resize", measureRoute);
    return;
  }

  root.classList.add("motion-ready");
  places?.classList.add("places-live");

  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    if (film) {
      const r = film.getBoundingClientRect();
      const p = clamp((vh * 0.98 - r.top) / (vh * 0.78));
      film.style.setProperty("--arrive", ease(p).toFixed(4));
    }
    if (places && route) {
      const r = places.getBoundingClientRect();
      // starts as the section's top passes 72% of the viewport, completes by its middle at 60%
      const start = vh * 0.72, end = vh * 0.6 - r.height / 2;
      const p = clamp((start - r.top) / (start - end));
      const v = p.toFixed(4);
      route.style.setProperty("--route", v);
      line?.style.setProperty("--route", v);
      stops.forEach((s, i) => s.classList.toggle("is-reached", p >= (i / (stops.length - 1)) - 0.02));
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", request, {passive: true});
  addEventListener("resize", () => { measureRoute(); request(); });
  measureRoute(); frame();
  document.fonts?.ready.then(() => { measureRoute(); request(); });

  if (!("IntersectionObserver" in window)) return;

  // Signature light, once per panel.
  const panels = document.querySelectorAll(".known-piece, .places-map, .owner-readiness .story-copy");
  const lightObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelector(".edge-light")?.classList.add("is-lit");
      lightObserver.unobserve(e.target);
    });
  }, {threshold: 0.35});
  panels.forEach(panel => {
    const glint = document.createElement("span");
    glint.className = "edge-light";
    glint.setAttribute("aria-hidden", "true");
    panel.append(glint);
    lightObserver.observe(panel);
  });

  // Gentle arrivals (below the hero only).
  const groups = [".known-head", ".places-copy", ".intel-title", ".intel-copy", ".owner-readiness .story-copy", ".closing-invite"];
  groups.forEach(sel => document.querySelectorAll(sel).forEach(g =>
    [...g.children].filter(c => !c.classList.contains("edge-light")).forEach((c, i) => { c.classList.add("arrive"); c.style.setProperty("--i", i); })));
  document.querySelectorAll(".readiness-photo").forEach(img => img.classList.add("settle"));
  const arriveObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      arriveObserver.unobserve(e.target);
    });
  }, {threshold: 0.2, rootMargin: "0px 0px -6% 0px"});
  document.querySelectorAll(".intel-note").forEach(n => n.classList.add("arrive-group"));
  document.querySelectorAll(".arrive, .settle, .intel-note").forEach(el => arriveObserver.observe(el));
})();
