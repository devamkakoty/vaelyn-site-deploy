/* A real physical shot and an exact, time-directed interface composition.
 * One finite play per genuine visit. Resume unfinished viewing; replay completed
 * viewing only after leaving. Media is local, muted and loaded only nearby.
 * No hidden loop, replay demand, typing delay, sensor telemetry or user tracking.
 */
(() => {
  "use strict";
  const scene = document.querySelector(".awareness-cinema");
  if (!scene) return;
  const video = scene.querySelector("video");
  const control = scene.querySelector(".film-control");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const journeyManaged = Boolean(scene.closest("[data-system-journey]"));
  const journeyActive = () => !journeyManaged || scene.classList.contains("is-active");
  const blocked = () => reduce.matches || connection?.saveData;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
  let used = false, visible = false, outside = true, manualPause = false;
  let complete = false, failed = false, armed = true, pending = false, plays = 0;
  let startTimer = 0, rearmTimer = 0, frame = 0, frameIsVideo = false, epoch = 0;
  let proximity, observer, headerObserver, headerHeight = -1;

  function seek(node, time) {
    const reveal = ease((time - 3.25) / 1.85);
    const opening = 1 - ease((time - 2.4) / .7);
    const closing = ease((time - 3.45) / .8);
    const signal = Math.sin(Math.PI * clamp((time - 5.2) / 1.5)) * .45;
    node.style.setProperty("--reveal", reveal.toFixed(4));
    node.style.setProperty("--opening", opening.toFixed(4));
    node.style.setProperty("--closing", closing.toFixed(4));
    node.style.setProperty("--signal", signal.toFixed(4));
    node.style.setProperty("--progress", clamp(time / 8.4).toFixed(4));
  }
  // Used by the deterministic offline film renderer. No network or product API.
  window.ZalliaAwareness = Object.freeze({seek});

  function cancelFrame() {
    if (frame) {
      if (frameIsVideo) video.cancelVideoFrameCallback(frame);
      else cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  function schedule() {
    // Keep the composition in sync until wholly outside the usable viewport.
    if (video.paused || video.ended || document.hidden || outside || blocked() || !journeyActive()) return;
    if ("requestVideoFrameCallback" in video) {
      frameIsVideo = true;
      frame = video.requestVideoFrameCallback((_, metadata) => {
        frame = 0; seek(scene, metadata.mediaTime); schedule();
      });
    } else {
      frameIsVideo = false;
      frame = requestAnimationFrame(() => {
        frame = 0; seek(scene, video.currentTime); schedule();
      });
    }
  }
  function clearEntry() {
    clearTimeout(startTimer); startTimer = 0;
  }
  function clearRearm() {
    clearTimeout(rearmTimer); rearmTimer = 0;
  }
  function showControl(paused) {
    control.hidden = false;
    control.setAttribute("aria-label", paused ? "Resume collection film" : "Pause collection film");
    control.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
  }
  function pause() {
    epoch++; pending = false; clearEntry(); cancelFrame(); video.pause();
    if (used && !complete && !failed && !blocked()) {
      seek(scene, video.currentTime);
      scene.dataset.filmState = "paused";
      showControl(true);
    }
  }
  function settle() {
    pause(); clearRearm(); armed = false;
    if (used) complete = true;
    control.hidden = true; seek(scene, 8.4);
    scene.dataset.filmState = "static";
  }
  function load() {
    if (blocked() || failed || video.getAttribute("src")) return;
    video.src = innerWidth <= 600 ? video.dataset.mobile : video.dataset.desktop;
    video.load();
  }
  async function play() {
    if (pending || !visible || outside || blocked() || failed || document.hidden || manualPause || !journeyActive()) return;
    const newRun = !used || (complete && armed);
    if (complete && !newRun) return;
    if (newRun) {
      used = true; complete = false; armed = false;
      scene.dataset.playCount = String(++plays);
      video.currentTime = 0;
      seek(scene, 0);
    }
    pending = true;
    const run = ++epoch;
    load();
    try {
      await video.play();
      if (run !== epoch) return;
      pending = false;
      if (outside || blocked() || document.hidden || manualPause) { pause(); return; }
      scene.dataset.filmState = "playing"; seek(scene, video.currentTime);
      showControl(false); schedule();
    } catch (_) {
      if (run === epoch) { failed = true; pending = false; settle(); }
    } // Poster/result remain intact if autoplay is unavailable.
  }
  video.addEventListener("ended", () => {
    complete = true; armed = false; manualPause = false; pending = false;
    cancelFrame(); seek(scene, 8.4); control.hidden = true;
    scene.dataset.filmState = "complete";
  });
  video.addEventListener("error", () => { failed = true; settle(); });
  control.addEventListener("click", () => {
    if (blocked() || failed || !visible || document.hidden) return;
    if (video.paused) {
      manualPause = false; play();
    } else {
      manualPause = true; pause();
    }
  });
  function enter() {
    clearEntry();
    if (visible && !outside && journeyActive() && !blocked() && !failed && !document.hidden &&
        !manualPause && !pending && (!used || !complete || armed) && video.paused) {
      startTimer = setTimeout(() => { startTimer = 0; play(); }, 250);
    }
  }
  function observeViewport() {
    const height = Math.round(document.querySelector(".site-header")?.getBoundingClientRect().height || 0);
    if (observer && height === headerHeight) return;
    headerHeight = height;
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        outside = !entry.isIntersecting || entry.intersectionRatio === 0;
        visible = !outside && entry.intersectionRatio >= .5;
        if (outside) {
          pause();
          if (complete && !armed && !rearmTimer && !manualPause && !failed &&
              !blocked() && !document.hidden) {
            rearmTimer = setTimeout(() => {
              rearmTimer = 0;
              if (outside && !document.hidden && !manualPause) armed = true;
            }, 1200);
          }
        } else {
          clearRearm();
          enter();
        }
      }
    }, {rootMargin: `-${height}px 0px 0px 0px`, threshold: [0, .5]});
    observer.observe(scene);
  }
  if ("IntersectionObserver" in window) {
    proximity = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) load();
    }, {rootMargin: "240px"});
    proximity.observe(scene);
    observeViewport();
    const header = document.querySelector(".site-header");
    if (header && "ResizeObserver" in window) {
      headerObserver = new ResizeObserver(observeViewport);
      headerObserver.observe(header);
    }
  }
  function preferences() {
    if (blocked()) {
      settle(); video.removeAttribute("src"); video.load();
    } else {
      enter();
    }
  }

  document.addEventListener("zallia:journeychange", event => {
    if (!journeyManaged) return;
    const active = event.detail?.scene === scene;
    if (active) {
      outside = false; visible = true; clearRearm(); enter();
    } else {
      outside = true; visible = false; pause();
      if (complete && !manualPause && !failed && !blocked()) {
        clearRearm();
        rearmTimer = setTimeout(() => {
          rearmTimer = 0;
          if (!journeyActive() && !document.hidden) armed = true;
        }, 1200);
      }
    }
  });
  reduce.addEventListener("change", preferences);
  connection?.addEventListener?.("change", preferences);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { pause(); clearRearm(); }
    else if (!complete) enter();
  });
  addEventListener("pagehide", () => {
    pause(); clearRearm(); observer?.disconnect(); proximity?.disconnect(); headerObserver?.disconnect();
  });
  addEventListener("pageshow", e => {
    if (e.persisted) {
      observer?.observe(scene); proximity?.observe(scene);
      const header = document.querySelector(".site-header");
      if (header) headerObserver?.observe(header);
    }
  });
})();
