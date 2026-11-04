/* Email, the way each visitor writes it. A plain mailto link does nothing on a
 * laptop with no mail app set up, so every email link offers a short choice:
 * Gmail, Outlook, the visitor's own email app, or copying the address.
 * Also used by the private preview form until its delivery key is set. */
(() => {
  "use strict";
  const enc = encodeURIComponent;
  function links({to, subject = "", body = ""}) {
    return [
      ["Gmail", `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`, true],
      ["Outlook", `https://outlook.office.com/mail/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`, true],
      ["Email app", `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`, false],
    ];
  }
  function buildChoices(container, message, onDone) {
    container.replaceChildren();
    for (const [label, href, external] of links(message)) {
      const a = document.createElement("a");
      a.className = "mail-choice";
      a.href = href;
      a.textContent = label;
      if (external) { a.target = "_blank"; a.rel = "noopener"; }
      a.addEventListener("click", () => onDone?.());
      container.append(a);
    }
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "mail-choice";
    copy.textContent = "Copy address";
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(message.to); copy.textContent = "Copied"; }
      catch { copy.textContent = message.to; }
    });
    container.append(copy);
  }
  window.zalliaMail = {links, buildChoices};

  // A small chooser beside any plain email link on the page.
  let pop = null;
  function close() { pop?.remove(); pop = null; document.removeEventListener("click", outside, true); document.removeEventListener("keydown", esc); }
  function outside(e) { if (pop && !pop.contains(e.target)) close(); }
  function esc(e) { if (e.key === "Escape") close(); }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="mailto:"]:not(.mail-choice)');
    if (!a) return;
    e.preventDefault();
    if (pop) { close(); return; }
    const url = new URL(a.href);
    const message = {to: decodeURIComponent(url.pathname), subject: url.searchParams.get("subject") || "", body: url.searchParams.get("body") || ""};
    pop = document.createElement("div");
    pop.className = "mail-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", `Write to ${message.to}`);
    const list = document.createElement("div");
    list.className = "mail-choices";
    buildChoices(list, message, close);
    pop.append(list);
    document.body.append(pop);
    const r = a.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
    const top = r.top - h - 10 > 12 ? r.top - h - 10 : r.bottom + 10;
    pop.style.left = `${left + scrollX}px`;
    pop.style.top = `${top + scrollY}px`;
    pop.querySelector(".mail-choice")?.focus();
    setTimeout(() => { document.addEventListener("click", outside, true); document.addEventListener("keydown", esc); });
  });
})();
