/* V2 Cinematic Intelligence: finite, viewport-aware, meaning-led motion.
 * Native scrolling remains in control; all content has a complete static state.
 */
(() => {
  "use strict";

  document.documentElement.classList.add("cinematic-ready");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const desktopJourney = matchMedia("(min-width: 860px)");
  const connection = navigator.connection;
  const constrained = () => reduce.matches || connection?.saveData;

  function livingHero() {
    const hero = document.querySelector("[data-cinematic-hero]");
    const layer = hero?.querySelector("[data-living-collection]");
    if (!hero || !layer || !("IntersectionObserver" in window)) return;
    let animation = null;
    let outsideSince = 0;
    let completed = false;

    const frames = [
      {"--living-line":"0","--living-node":".18","--living-core":".34","--living-sheen":"0",offset:0},
      {"--living-line":"0","--living-node":".44","--living-core":".4","--living-sheen":".08",offset:.12},
      {"--living-line":"1","--living-node":"1","--living-core":".68","--living-sheen":".32",offset:.58},
      {"--living-line":"1","--living-node":".62","--living-core":"1","--living-sheen":".78",offset:.82},
      {"--living-line":"0","--living-node":".22","--living-core":".52","--living-sheen":".24",offset:1},
    ];

    function start() {
      if (constrained() || document.hidden || animation?.playState === "running") return;
      if (completed) {
        if (!outsideSince || performance.now() - outsideSince < 1100) return;
        animation?.cancel();
        animation = null;
        completed = false;
      }
      if (!animation) {
        animation = layer.animate(frames, {
          duration: 4800,
          easing: "cubic-bezier(.22,.61,.36,1)",
          fill: "both",
        });
        animation.onfinish = () => {
          completed = true;
          hero.dataset.motionState = "complete";
        };
      } else {
        animation.play();
      }
      hero.dataset.motionState = "playing";
    }

    function pause() {
      if (animation?.playState === "running") animation.pause();
      if (!completed) hero.dataset.motionState = "paused";
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const visible = entry.isIntersecting && entry.intersectionRatio >= .42;
        if (visible) start();
        else {
          pause();
          outsideSince ||= performance.now();
          if (!entry.isIntersecting) outsideSince = performance.now();
        }
        if (visible) {
          const elapsed = outsideSince ? performance.now() - outsideSince : 0;
          if (completed && elapsed >= 1100) start();
          outsideSince = 0;
        }
      }
    }, {threshold:[0,.42,.72]});
    observer.observe(hero);
    document.addEventListener("visibilitychange", () => document.hidden ? pause() : start());
    reduce.addEventListener("change", () => {
      if (constrained()) {
        animation?.cancel();
        animation = null;
        layer.removeAttribute("style");
        hero.dataset.motionState = "static";
      } else start();
    });
  }

  function systemJourney() {
    const journey = document.querySelector("[data-system-journey]");
    const stage = journey?.querySelector(".system-journey-stage");
    const stageInner = stage?.querySelector(".system-journey-stage-inner");
    const steps = journey ? [...journey.querySelectorAll(":scope > .system-story")] : [];
    if (!journey || !stage || !stageInner || steps.length !== 4) return;

    const records = steps.map(step => {
      const scene = step.querySelector(":scope > .system-visual");
      const placeholder = document.createComment(`zallia-${step.dataset.journeyChapter}-scene`);
      if (!scene) throw new Error(`Missing visual for ${step.dataset.journeyChapter}`);
      scene.before(placeholder);
      return {step, scene, placeholder};
    });
    const markers = [...stage.querySelectorAll(".journey-progress span")];
    let active = -1;
    let scrollFrame = 0;

    function select(index) {
      if (index === active || index < 0 || index >= records.length) return;
      active = index;
      records.forEach((record, position) => {
        const current = position === index;
        record.step.classList.toggle("is-current", current);
        record.scene.classList.toggle("is-active", current);
        record.scene.setAttribute("aria-hidden", String(!current));
        record.scene.toggleAttribute("inert", !current);
        markers[position]?.classList.toggle("is-current", current);
      });
      document.dispatchEvent(new CustomEvent("zallia:journeychange", {
        detail: {index, chapter: records[index].step.dataset.journeyChapter,
                 scene: records[index].scene}
      }));
    }

    function nearest() {
      scrollFrame = 0;
      if (!journey.classList.contains("journey-enhanced")) return;
      const anchor = innerHeight * .48;
      let best = 0, distance = Infinity, activeDistance = Infinity;
      records.forEach((record, index) => {
        const rect = record.step.getBoundingClientRect();
        const candidate = Math.abs((rect.top + rect.bottom) / 2 - anchor);
        if (index === active) activeDistance = candidate;
        if (candidate < distance) { distance = candidate; best = index; }
      });
      // A chapter must clearly take over before switching; small scroll reversals
      // around the midpoint keep the current visual instead of flickering.
      if (active < 0 || best === active ||
          activeDistance - distance > Math.min(150, innerHeight * .16)) select(best);
    }

    function scheduleNearest() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(nearest);
    }

    function enable() {
      if (journey.classList.contains("journey-enhanced")) return;
      records.forEach(record => stageInner.append(record.scene));
      stage.removeAttribute("aria-hidden");
      journey.classList.add("journey-enhanced");
      addEventListener("scroll", scheduleNearest, {passive:true});
      nearest();
    }

    function disable() {
      removeEventListener("scroll", scheduleNearest);
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
      records.forEach(record => {
        record.placeholder.parentNode?.insertBefore(record.scene, record.placeholder.nextSibling);
        record.scene.classList.remove("is-active");
        record.scene.removeAttribute("aria-hidden");
        record.scene.removeAttribute("inert");
        record.step.classList.remove("is-current");
      });
      markers.forEach(marker => marker.classList.remove("is-current"));
      journey.classList.remove("journey-enhanced");
      stage.setAttribute("aria-hidden", "true");
      active = -1;
    }

    const configure = () => desktopJourney.matches ? enable() : disable();
    desktopJourney.addEventListener("change", configure);
    addEventListener("resize", () => {
      if (journey.classList.contains("journey-enhanced")) nearest();
    }, {passive:true});
    configure();
  }

  function finiteConnections() {
    if (!("IntersectionObserver" in window) ||
        typeof Element.prototype.animate !== "function") return;
    const roots = [...document.querySelectorAll("[data-connection-motion]")];
    const states = new Map();

    function animate(root, selector, frames, duration, delay = 0) {
      return [...root.querySelectorAll(selector)].map(node => node.animate(frames, {
        duration, delay, iterations:1, fill:"both",
        easing:"cubic-bezier(.22,.61,.36,1)"
      }));
    }

    function play(root) {
      const state = states.get(root);
      if (!state || state.running || constrained() || document.hidden) return;
      if (state.animations.length && !state.complete) {
        state.animations.forEach(animation => animation.play());
        state.running = true;
        root.dataset.motionState = "playing";
        return;
      }
      state.running = true;
      root.dataset.motionState = "playing";
      const animations = [];
      if (root.dataset.connectionMotion === "worlds") {
        [0,1,2].forEach((branch, index) => {
          animations.push(...animate(root, `.connection-current[data-branch="${branch}"]`, [
            {strokeDashoffset:.12,opacity:0},{strokeDashoffset:-.9,opacity:1},
            {strokeDashoffset:-1.02,opacity:0}
          ], 2600, 420 + index * 260));
          animations.push(...animate(root, `.connection-node[data-branch="${branch}"] .node-field`, [
            {opacity:.45,transform:"scale(.82)"},{opacity:1,transform:"scale(1.18)"},
            {opacity:.6,transform:"scale(1)"}
          ], 1700, 250 + index * 260));
        });
        animations.push(...animate(root, ".core-glow", [
          {opacity:.35,transform:"scale(.86)"},{opacity:1,transform:"scale(1.22)"},
          {opacity:.6,transform:"scale(1)"}
        ], 1800, 2100));
      } else {
        root.style.setProperty("--privacy-focus", ".5");
        root.style.setProperty("--privacy-route", "0");
        root.style.setProperty("--privacy-share", "0");
        animations.push(root.animate([
          {"--privacy-focus":".5","--privacy-route":"0","--privacy-share":"0"},
          {"--privacy-focus":"1","--privacy-route":"0","--privacy-share":"0",offset:.22},
          {"--privacy-focus":"1","--privacy-route":"1","--privacy-share":".18",offset:.58},
          {"--privacy-focus":".82","--privacy-route":".18","--privacy-share":"1"}
        ], {duration:4800,fill:"both",easing:"cubic-bezier(.22,.61,.36,1)"}));
      }
      state.animations = animations;
      Promise.allSettled(animations.map(item => item.finished)).then(() => {
        state.running = false;
        state.complete = true;
        root.dataset.motionState = "complete";
      });
    }

    function pause(root) {
      const state = states.get(root);
      state?.animations.forEach(animation => animation.pause());
      if (state?.running) root.dataset.motionState = "paused";
      if (state) state.running = false;
    }

    roots.forEach(root => states.set(root, {
      visible:false, complete:false, running:false, leftAt:0, animations:[]
    }));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const root = entry.target;
        const state = states.get(root);
        const visible = entry.isIntersecting && entry.intersectionRatio >= .34;
        if (visible) {
          if (state.complete && performance.now() - state.leftAt >= 1100) {
            state.animations.forEach(animation => animation.cancel());
            state.animations = [];
            state.complete = false;
          }
          state.visible = true;
          play(root);
        } else {
          state.visible = false;
          state.leftAt = performance.now();
          pause(root);
        }
      });
    }, {threshold:[0,.34,.68],rootMargin:"-72px 0px 0px"});
    roots.forEach(root => observer.observe(root));
    document.addEventListener("visibilitychange", () => {
      roots.forEach(root => document.hidden ? pause(root) :
        states.get(root).visible && play(root));
    });
  }


  /* Home, Section 3: the record of one piece, one facet at a time.
   * One finite pass (Provenance → Service → Condition & care → Whereabouts)
   * when the section is seen; it rests on Whereabouts. Paused when unseen or
   * the tab is hidden, resumed where it was; the pass replays only after the
   * visitor has moved away (over a second) and come back. A facet the visitor
   * chooses takes over for the rest of the visit. Reduced motion / Save-Data:
   * no auto-advance and instant switching. Without JS all four are shown. */
  function facetRecord() {
    const root = document.querySelector("[data-known-facets]");
    if (!root) return;
    const buttons = [...root.querySelectorAll(".known-facet")];
    const statements = [...root.querySelectorAll(".known-statement")];
    const live = root.querySelector(".known-statements");
    if (!buttons.length || buttons.length !== statements.length || !live) return;

    const DWELL = 6000;   // unhurried: time to read each line
    const RETURN_AFTER = 1100;
    let index = 0;
    let remaining = DWELL;   // time left on the current facet
    let since = 0;           // when the current dwell timer started
    let timer = 0;
    let visible = false;
    let complete = false;    // the pass has reached Whereabouts
    let chosen = false;      // the visitor took over
    let leftAt = 0;

    function show(next, {announce = false} = {}) {
      index = next;
      buttons.forEach((button, position) =>
        button.setAttribute("aria-pressed", String(position === next)));
      statements.forEach((statement, position) => {
        const current = position === next;
        statement.classList.toggle("is-current", current);
        statement.setAttribute("aria-hidden", String(!current));
      });
      // Announce only what the visitor asked for; an automatic pass is silent.
      live.setAttribute("aria-live", announce ? "polite" : "off");
    }

    function stop() {
      clearTimeout(timer);
      timer = 0;
    }

    function schedule() {
      stop();
      since = performance.now();
      timer = setTimeout(() => {
        timer = 0;
        remaining = DWELL;
        show(index + 1);
        if (index >= buttons.length - 1) {
          complete = true;
          root.dataset.motionState = "complete";
          live.setAttribute("aria-live", "polite");
        } else schedule();
      }, remaining);
      root.dataset.motionState = "playing";
    }

    function play() {
      if (chosen || complete || timer || !visible || document.hidden || constrained()) return;
      schedule();
    }

    function pause() {
      if (!timer) return;
      stop();
      remaining = Math.max(0, remaining - (performance.now() - since));
      root.dataset.motionState = "paused";
    }

    function restart() {
      stop();
      complete = false;
      remaining = DWELL;
      show(0);
    }

    function choose(position) {
      chosen = true;
      stop();
      root.dataset.motionState = "chosen";
      if (position !== index) show(position, {announce:true});
      else live.setAttribute("aria-live", "polite");
    }

    buttons.forEach((button, position) => {
      button.addEventListener("click", () => choose(position));
      button.addEventListener("focus", () => choose(position));
      button.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") choose(position);
      });
    });

    root.classList.add("facets-ready");
    show(0);
    if (constrained()) root.dataset.motionState = "static";
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        visible = entry.isIntersecting && entry.intersectionRatio >= .4;
        if (!visible) {
          leftAt = entry.isIntersecting ? (leftAt || performance.now()) : performance.now();
          pause();
          continue;
        }
        if (complete && !chosen && leftAt && performance.now() - leftAt >= RETURN_AFTER) restart();
        leftAt = 0;
        play();
      }
    }, {threshold:[0,.4,.7],rootMargin:"-72px 0px 0px"});
    observer.observe(root);
    document.addEventListener("visibilitychange", () => document.hidden ? pause() : play());
    reduce.addEventListener("change", () => {
      if (constrained()) { pause(); root.dataset.motionState = "static"; }
      else play();
    });
  }

  livingHero();
  systemJourney();
  finiteConnections();
  facetRecord();
})();
