/* The site's icons: a 14-icon subset of Lucide v0.468.0 (ISC licence,
 * https://lucide.dev), with the same createIcons() behaviour the pages used
 * from the full 358 KB library: each element carrying data-lucide="name" is
 * replaced by its SVG, keeping the element's own attributes and classes. */
(() => {
  "use strict";
  const ICONS = {"arrow-right":"<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>","arrow-up-right":"<path d=\"M7 7h10v10\"/><path d=\"M7 17 17 7\"/>","bell":"<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"/><path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"/>","check":"<path d=\"M20 6 9 17l-5-5\"/>","check-circle-2":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>","circle-check":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>","lock-keyhole":"<circle cx=\"12\" cy=\"16\" r=\"1\"/><rect x=\"3\" y=\"10\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M7 10V7a5 5 0 0 1 10 0v3\"/>","menu":"<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\"/><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\"/><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\"/>","pause":"<rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\"/><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\"/>","play":"<polygon points=\"6 3 20 12 6 21 6 3\"/>","volume-x":"<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\"/><line x1=\"22\" x2=\"16\" y1=\"9\" y2=\"15\"/><line x1=\"16\" x2=\"22\" y1=\"9\" y2=\"15\"/>","volume-2":"<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\"/><path d=\"M16 9a5 5 0 0 1 0 6\"/><path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\"/>","x":"<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>","rotate-ccw":"<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5\"/>"};
  const NS = "http://www.w3.org/2000/svg";
  const BASE = { xmlns: NS, width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" };
  function createIcons() {
    document.querySelectorAll("[data-lucide]:not(svg)").forEach((el) => {
      const name = el.getAttribute("data-lucide");
      const body = ICONS[name];
      if (!body) return;
      const svg = document.createElementNS(NS, "svg");
      const own = {};
      for (const a of el.attributes) own[a.name] = a.value;
      const attrs = { ...BASE, "data-lucide": name, ...own };
      const classes = ["lucide", `lucide-${name}`, ...(own.class || "").split(" ")].map((c) => c.trim()).filter(Boolean);
      attrs.class = [...new Set(classes)].join(" ");
      for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, String(v));
      svg.innerHTML = body;
      el.parentNode?.replaceChild(svg, el);
    });
  }
  window.lucide = { createIcons };
})();
