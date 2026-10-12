/* One finite environmental-care sequence. It pauses outside the viewport,
 * resumes unfinished work, and replays only after a completed scene is left.
 */
(() => {
  "use strict";

  const scenes = [...document.querySelectorAll(
    '.system-page [data-motion="environment"]'
  )];
  if (!scenes.length || !("IntersectionObserver" in window) ||
      typeof Element.prototype.animate !== "function") return;

  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const constrained = () => preference.matches || connection?.saveData;
  const states = new Map();

  function objectPosition(value) {
    if (value === "left" || value === "top") return 0;
    if (value === "right" || value === "bottom") return 1;
    if (value === "center") return .5;
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number / 100 : .5;
  }

  function positionSensor(scene) {
    const photo = scene.querySelector(".system-photo");
    const sensor = scene.querySelector(".environment-sensor");
    if (!photo?.naturalWidth || !sensor) return;

    const width = photo.offsetWidth;
    const height = photo.offsetHeight;
    const scale = Math.max(
      width / photo.naturalWidth,
      height / photo.naturalHeight
    );
    const renderedWidth = photo.naturalWidth * scale;
    const renderedHeight = photo.naturalHeight * scale;
    const position = getComputedStyle(photo).objectPosition.split(/\s+/);
    const x = objectPosition(position[0]);
    const y = objectPosition(position[1] || "center");

    sensor.style.left = `${
      photo.offsetLeft + (width - renderedWidth) * x + renderedWidth * .9385
    }px`;
    sensor.style.top = `${
      photo.offsetTop + (height - renderedHeight) * y + renderedHeight * .0914
    }px`;
    sensor.style.width = `${renderedWidth * .012}px`;
    sensor.style.height = `${renderedHeight * .033}px`;
    sensor.style.visibility = "visible";
  }

  function clearTimer(state) {
    if (state.rearmTimer !== null) clearTimeout(state.rearmTimer);
    state.rearmTimer = null;
  }

  function cancelAnimations(state) {
    state.epoch += 1;
    state.animations.forEach(animation => animation.cancel());
    state.animations = [];
    state.running = false;
    state.paused = false;
  }

  function settle(state, mode = "complete") {
    cancelAnimations(state);
    state.complete = true;
    state.armed = false;
    state.scene.dataset.motionState = mode;
  }

  function animate(state, selector, frames, duration = 7800) {
    const node = state.scene.querySelector(selector);
    if (!node) return;
    state.animations.push(node.animate(frames.map(frame => ({
      ...frame, easing: "cubic-bezier(.22,.61,.36,1)"
    })), {
      duration,
      iterations: 1,
      fill: "both",
      easing: "linear"
    }));
  }

  function start(state) {
    if (!state.armed || state.running || state.paused || constrained() ||
        document.hidden || state.outside || !state.active) return;

    state.armed = false;
    state.complete = false;
    state.running = true;
    state.plays += 1;
    state.scene.dataset.playCount = String(state.plays);
    state.scene.dataset.motionState = "playing";
    positionSensor(state.scene);

    animate(state, ".sensor-light", [
      {opacity:.16, transform:"scale(.8)", offset:0},
      {opacity:.16, transform:"scale(.8)", offset:.06},
      {opacity:1, transform:"scale(1.12)",
       boxShadow:"0 0 8px #f1dfb4, 0 0 22px #f1dfb488", offset:.13},
      {opacity:1, transform:"scale(1.12)",
       boxShadow:"0 0 8px #f1dfb4, 0 0 22px #f1dfb488", offset:.515},
      {opacity:.28, transform:"scale(.9)",
       boxShadow:"0 0 5px #f1dfb477", offset:.60},
      {opacity:.28, transform:"scale(.9)",
       boxShadow:"0 0 5px #f1dfb477", offset:1}
    ]);
    animate(state, ".sensor-aura", [
      {opacity:0, transform:"rotate(-7deg) scale(.38)", offset:0},
      {opacity:0, transform:"rotate(-7deg) scale(.38)", offset:.055},
      {opacity:.95, transform:"rotate(-7deg) scale(.9)", offset:.13},
      {opacity:.95, transform:"rotate(-7deg) scale(.9)", offset:.515},
      {opacity:0, transform:"rotate(-7deg) scale(1.42)", offset:.60},
      {opacity:0, transform:"rotate(-7deg) scale(1.42)", offset:1}
    ]);
    animate(state, ".sensor-reflection", [
      {opacity:0, transform:"translateX(8px) rotate(-7deg) scale(.6)", offset:0},
      {opacity:0, transform:"translateX(8px) rotate(-7deg) scale(.6)", offset:.06},
      {opacity:1, transform:"translateX(-11px) rotate(-7deg) scale(1)", offset:.13},
      {opacity:1, transform:"translateX(-11px) rotate(-7deg) scale(1)", offset:.515},
      {opacity:0, transform:"translateX(-27px) rotate(-7deg) scale(1.18)", offset:.62},
      {opacity:0, transform:"translateX(-27px) rotate(-7deg) scale(1.18)", offset:1}
    ]);
    animate(state, ".system-care-note", [
      {opacity:.42, transform:"translateY(9px)", filter:"saturate(.65)", offset:0},
      {opacity:.42, transform:"translateY(9px)", filter:"saturate(.65)", offset:.50},
      {opacity:1, transform:"translateY(0)", filter:"none", offset:.60},
      {opacity:1, transform:"translateY(0)", filter:"none", offset:1}
    ]);
    animate(state, ".trend-change", [
      {strokeDashoffset:"1", opacity:.18, offset:0},
      {strokeDashoffset:"1", opacity:.18, offset:.55},
      {strokeDashoffset:"0", opacity:1, offset:.77},
      {strokeDashoffset:"0", opacity:1, offset:1}
    ]);
    animate(state, ".trend-point", [
      {opacity:0, transform:"scale(.2)", offset:0},
      {opacity:0, transform:"scale(.2)", offset:.75},
      {opacity:1, transform:"scale(1)", offset:.82},
      {opacity:1, transform:"scale(1)", offset:1}
    ]);
    animate(state, ".care-confirmed", [
      {opacity:0, transform:"translateY(5px)", offset:0},
      {opacity:0, transform:"translateY(5px)", offset:.80},
      {opacity:1, transform:"translateY(0)", offset:.9},
      {opacity:1, transform:"translateY(0)", offset:1}
    ]);

    const epoch = ++state.epoch;
    Promise.allSettled(state.animations.map(animation => animation.finished))
      .then(() => {
        if (state.epoch === epoch) settle(state);
      });
  }

  function resume(state) {
    if (!state.paused || constrained() || document.hidden ||
        state.outside || !state.active) return;
    state.animations.forEach(animation => animation.play());
    state.paused = false;
    state.running = true;
    state.scene.dataset.motionState = "playing";
  }

  function pause(state) {
    if (!state.running || state.complete) return;
    state.animations.forEach(animation => animation.pause());
    state.running = false;
    state.paused = true;
    state.scene.dataset.motionState = "paused";
  }

  function prepareReplay(state) {
    clearTimer(state);
    state.rearmTimer = setTimeout(() => {
      state.rearmTimer = null;
      if ((!state.outside && state.active) || !state.complete ||
          constrained() || document.hidden) return;
      cancelAnimations(state);
      state.complete = false;
      state.armed = true;
      state.scene.dataset.motionState = "ready";
    }, 700);
  }

  function enter(state) {
    clearTimer(state);
    positionSensor(state.scene);
    if (state.paused) resume(state);
    else if (state.armed) start(state);
  }

  for (const scene of scenes) {
    const state = {
      scene, armed: true, active: true, outside: true, visible: false,
      running: false, paused: false, complete: false, animations: [],
      plays: 0, epoch: 0, rearmTimer: null
    };
    states.set(scene, state);
    scene.dataset.motionState = constrained() ? "complete" : "ready";
    const photo = scene.querySelector(".system-photo");
    photo?.addEventListener("load", () => positionSensor(scene));
    new ResizeObserver(() => positionSensor(scene)).observe(scene);
    positionSensor(scene);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = states.get(entry.target);
      state.outside = !entry.isIntersecting || entry.intersectionRatio === 0;
      state.visible = !state.outside && entry.intersectionRatio >= .48;
      const enhanced = Boolean(state.scene.closest(".journey-enhanced"));
      state.active = !enhanced || state.scene.classList.contains("is-active");

      if (state.outside || !state.active) {
        if (state.running) pause(state);
        if (state.complete) prepareReplay(state);
      } else if (state.visible || state.paused) {
        enter(state);
      }
    }
  }, {threshold:[0,.48], rootMargin:"-72px 0px 0px"});
  scenes.forEach(scene => observer.observe(scene));

  document.addEventListener("zallia:journeychange", event => {
    for (const state of states.values()) {
      const enhanced = Boolean(state.scene.closest(".journey-enhanced"));
      if (!enhanced) continue;
      state.active = event.detail?.scene === state.scene;
      if (state.active) {
        state.outside = false;
        state.visible = true;
        requestAnimationFrame(() => enter(state));
      } else {
        if (state.running) pause(state);
        if (state.complete) prepareReplay(state);
      }
    }
  });

  function preferences() {
    for (const state of states.values()) {
      clearTimer(state);
      if (constrained()) settle(state);
      else if (state.complete && state.plays === 0) {
        state.complete = false;
        state.armed = true;
        state.scene.dataset.motionState = "ready";
        if (!state.outside && state.active) enter(state);
      }
    }
  }

  preference.addEventListener("change", preferences);
  connection?.addEventListener?.("change", preferences);
  document.addEventListener("visibilitychange", () => {
    for (const state of states.values()) {
      if (document.hidden) pause(state);
      else if (!state.outside && state.active) enter(state);
    }
  });
  addEventListener("resize", () => scenes.forEach(positionSensor), {passive:true});
  addEventListener("pagehide", () => {
    observer.disconnect();
    states.forEach(state => {
      clearTimer(state);
      cancelAnimations(state);
    });
  });
})();
