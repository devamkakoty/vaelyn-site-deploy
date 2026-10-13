/* Section 2 — the film. Same rules as cinematic.js: finite, viewport-aware,
 * paused when unseen, and still under reduced motion or Save-Data.
 *  - Plays from the start the first time at least half of it is in view.
 *  - Pauses when it leaves view or the tab is hidden; resumes if unfinished.
 *  - Once finished it rests on its closing frame, and plays again only after
 *    the visitor has moved away from it (over a second) and come back.
 *  - Reduced motion / Save-Data: the poster stays, with a labelled play control.
 *  - Muted by default; sound only when the visitor asks for it.
 */
(() => {
  "use strict";

  const band = document.querySelector("[data-film]");
  const video = band?.querySelector("video");
  const toggle = band?.querySelector("[data-film-toggle]");
  const sound = band?.querySelector("[data-film-sound]");
  if (!band || !video || !toggle || !sound) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const constrained = () => reduce.matches || Boolean(navigator.connection?.saveData);
  const RETURN_AFTER = 1100;
  // The film's last second fades its closing line to plain evergreen. On the
  // page it rests on the line instead: stop just before the fade, easing any
  // sound out over the final moment.
  const HOLD_AT = 26.9;
  const SOUND_EASE = 0.9;

  let visible = false;
  let started = false;     // the film has begun at least once this cycle
  let finished = false;    // it reached its closing frame
  let leftAt = 0;          // when it was last entirely out of view
  let held = false;        // the visitor paused it, or motion is constrained
  let invited = false;     // the visitor pressed play themselves

  video.muted = true;
  video.loop = false;
  if (constrained()) video.preload = "none";

  function icon(button, name) {
    const glyph = document.createElement("i");
    glyph.setAttribute("data-lucide", name);
    glyph.setAttribute("aria-hidden", "true");
    button.querySelector("[data-icon]").replaceChildren(glyph);
    window.lucide?.createIcons();
  }

  function render() {
    let state = "ready";
    if (finished) state = "ended";
    else if (!video.paused) state = "playing";
    else if (started) state = "paused";
    if (band.dataset.filmState !== state) {
      band.dataset.filmState = state;
      const spec = {
        ready: ["play", "Play film"],
        playing: ["pause", "Pause film"],
        paused: ["play", "Play film"],
        ended: ["rotate-ccw", "Watch the film again"],
      }[state];
      icon(toggle, spec[0]);
      toggle.setAttribute("aria-label", spec[1]);
      toggle.title = spec[1];
    }
  }

  function renderSound() {
    const on = !video.muted;
    icon(sound, on ? "volume-2" : "volume-x");
    sound.setAttribute("aria-pressed", String(on));
    sound.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
    sound.title = sound.getAttribute("aria-label");
  }

  function holdOnClosingLine() {
    if (finished) return;
    video.pause();
    try { video.currentTime = HOLD_AT; } catch { /* already there */ }
    finished = true;
    render();
  }

  function watchForClosingLine() {
    const check = t => {
      if (!video.muted) video.volume = Math.max(0, Math.min(1, (HOLD_AT - t) / SOUND_EASE));
      if (t >= HOLD_AT) { holdOnClosingLine(); return true; }
      return false;
    };
    if ("requestVideoFrameCallback" in video) {
      const step = (now, meta) => { if (!check(meta.mediaTime) && !video.paused) video.requestVideoFrameCallback(step); };
      video.requestVideoFrameCallback(step);
    }
  }
  video.addEventListener("timeupdate", () => {
    if (!finished && video.currentTime >= HOLD_AT) holdOnClosingLine();
  });

  function restart() {
    finished = false;
    started = false;
    video.volume = 1;
    try { video.currentTime = 0; } catch { /* metadata not loaded yet */ }
  }

  function play() {
    if (!visible || document.hidden || held) return;
    if (constrained() && !invited) return;
    if (finished) return;
    if (!started) {
      started = true;
      if (video.currentTime > 0) {
        try { video.currentTime = 0; } catch { /* not seekable yet */ }
      }
    }
    if (video.preload !== "auto") video.preload = "auto";
    const attempt = video.play();
    attempt?.catch(() => {
      // Autoplay declined (e.g. a low-power mode): leave the poster and the
      // labelled play control, exactly as for reduced motion.
      if (video.currentTime < .05) started = false;
      render();
    });
  }

  function pause() {
    if (!video.paused) video.pause();
  }

  video.addEventListener("play", () => { render(); watchForClosingLine(); });
  video.addEventListener("pause", render);
  video.addEventListener("ended", () => {
    finished = true;
    render();
  });

  toggle.addEventListener("click", () => {
    if (!video.paused) {
      held = true;
      pause();
      return;
    }
    held = false;
    invited = true;
    if (finished) restart();
    play();
  });

  sound.addEventListener("click", () => {
    video.muted = !video.muted;
    renderSound();
  });

  if ("IntersectionObserver" in window) {
    const header = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue("--header-height")) || 80;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        visible = entry.isIntersecting && entry.intersectionRatio >= .5;
        // As in cinematic.js: "left" means under the visibility threshold; the
        // clock restarts if it goes fully out of view.
        if (!visible) leftAt = entry.isIntersecting ? (leftAt || performance.now()) : performance.now();
        if (visible) {
          if (finished && leftAt && performance.now() - leftAt >= RETURN_AFTER) {
            // A fresh visit: a pause from the previous viewing no longer applies,
            // and under reduced motion the poster returns rather than a replay.
            restart();
            held = false;
            invited = false;
            if (constrained()) video.load();
          }
          leftAt = 0;
          play();
        } else {
          pause();
        }
      }
    }, {threshold:[0, .5, .75], rootMargin:`-${Math.round(header)}px 0px 0px`});
    observer.observe(video);

    // Warm the buffer shortly before the film arrives, so it starts cleanly.
    const approach = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !constrained()) {
        video.preload = "auto";
        approach.disconnect();
      }
    }, {rootMargin:"400px 0px"});
    approach.observe(video);
  }

  document.addEventListener("visibilitychange", () => document.hidden ? pause() : play());

  reduce.addEventListener("change", () => {
    if (constrained() && !invited) {
      pause();
      if (started && !finished) {
        // Return to the still poster rather than holding a mid-film frame.
        started = false;
        video.load();
      }
    } else {
      play();
    }
    render();
  });

  render();
  renderSound();
})();
