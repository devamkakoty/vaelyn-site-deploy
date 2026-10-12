/* Option C: property acknowledgements followed by Collection Current.
 * Four compositor animations, paused offscreen; no image redraw or alteration.
 */
(() => {
  const architecture = document.querySelector(".hero-architecture");
  const art = document.querySelector(".hero-art");
  if (!architecture || !art || !Element.prototype.animate || !window.IntersectionObserver) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  if (navigator.connection?.saveData) return;
  const layer = document.createElement("div");
  layer.className = "interface-lights";
  layer.setAttribute("aria-hidden", "true");
  const positions = [[1149,497],[1227,488],[1309,479],[1227,783]];
  const animations = positions.map(([x,y], index) => {
    const light = document.createElement("span");
    light.className = `interface-light${index === 3 ? " interface-light--current" : ""}`;
    light.style.left = `${x / 1536 * 100}%`;
    light.style.top = `${y / 1152 * 100}%`;
    layer.append(light);
    const start = index === 3 ? 3.7 : .7 + index * .9;
    const end = index === 3 ? 5.3 : 6.5;
    const animation = light.animate([
      {opacity:0,offset:0},
      {opacity:0,offset:start/8},
      {opacity:index === 3 ? .9 : .8,offset:(start+.65)/8},
      {opacity:index === 3 ? .9 : .8,offset:end/8},
      {opacity:0,offset:(index === 3 ? 6.2 : 7.6)/8},
      {opacity:0,offset:1}
    ], {duration:8000,iterations:Infinity,easing:"ease-in-out"});
    animation.pause();
    return animation;
  });
  architecture.append(layer);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "interface-motion-toggle";
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", "pause");
  button.append(icon);
  art.append(button);
  let visible = false, manualPause = false;
  function sync() {
    const disabled = manualPause || reduce.matches;
    animations.forEach(animation => {
      if (visible && !disabled && !document.hidden) animation.play();
      else animation.pause();
    });
    button.hidden = reduce.matches;
    button.style.display = reduce.matches ? "none" : "";
    button.setAttribute("aria-label", manualPause ? "Play interface animation" : "Pause interface animation");
    button.title = button.getAttribute("aria-label");
  }
  button.addEventListener("click", () => {
    manualPause = !manualPause;
    button.replaceChildren();
    const next = document.createElement("i");
    next.setAttribute("data-lucide", manualPause ? "play" : "pause");
    button.append(next);
    window.lucide?.createIcons();
    sync();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
    sync();
  }, {threshold:[0,.15]}).observe(art);
  document.addEventListener("visibilitychange", sync);
  reduce.addEventListener("change", sync);
  window.lucide?.createIcons();
  sync();
})();
