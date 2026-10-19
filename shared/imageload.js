/* Images arrive before they are needed.
 *  - Each lazy image starts loading about two screens before it scrolls into
 *    view. (Safari's own lazy loading waits until an image is almost on screen,
 *    which on a phone network shows as a pause.)
 *  - Once the page has finished loading and is idle, the remaining images are
 *    fetched quietly, two at a time, in page order, so nothing is waited for
 *    while reading. Skipped under Save-Data or on a 2G connection.
 * Nothing changes what is shown or when; only when the bytes arrive. */
(() => {
  "use strict";
  const lazy = [...document.querySelectorAll('img[loading="lazy"]')];
  if (!lazy.length) return;
  const start = (img) => { if (img.loading === "lazy") img.loading = "eager"; };

  if ("IntersectionObserver" in window) {
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { start(e.target); watch.unobserve(e.target); } });
    }, { rootMargin: "1600px 0px" });
    lazy.forEach((img) => watch.observe(img));
  }

  const conn = navigator.connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || "")) return;
  const warm = () => {
    let i = 0;
    const next = () => {
      lazy.slice(i, i + 2).forEach(start);
      i += 2;
      if (i < lazy.length) setTimeout(next, 300);
    };
    next();
  };
  const idle = (cb) => ("requestIdleCallback" in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500));
  if (document.readyState === "complete") idle(warm);
  else addEventListener("load", () => idle(warm), { once: true });
})();
