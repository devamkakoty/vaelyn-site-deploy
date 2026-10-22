/* Request a private preview.
 * With an endpoint set on the form (data-endpoint, e.g. a Web3Forms access
 * key: "web3forms:<key>"), the request is sent quietly and a thank-you shown.
 * Until then, it opens the visitor's email with every detail already written,
 * addressed to data-to, so no request is lost either way. */
(() => {
  "use strict";
  const form = document.querySelector(".preview-form");
  if (!form) return;
  const dialog = form.closest("dialog");
  const panel = dialog.querySelector("[data-preview-request]");
  const thanks = dialog.querySelector(".preview-thanks");
  const error = form.querySelector(".preview-error");
  const button = form.querySelector('button[type="submit"]');
  const field = (n) => form.elements[n];

  function invalid() {
    let first = null;
    for (const n of ["name", "email"]) {
      const el = field(n);
      const ok = el.checkValidity() && el.value.trim() !== "";
      el.setAttribute("aria-invalid", String(!ok));
      if (!ok && !first) first = el;
    }
    return first;
  }
  form.addEventListener("input", (e) => { if (e.target.getAttribute("aria-invalid") === "true") e.target.setAttribute("aria-invalid", "false"); error.textContent = ""; });

  function done() {
    panel.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  }
  dialog.addEventListener("close", () => {
    if (!thanks.hidden) {
      form.reset(); panel.hidden = false; thanks.hidden = true;
      thanks.querySelector("h2").textContent = "Thank you.";
      thanks.querySelector("p:not(.eyebrow)").textContent = "We will be in touch personally to arrange your preview.";
    }
    error.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (field("botcheck").checked) return;
    const bad = invalid();
    if (bad) { error.textContent = "Please add your name and email."; bad.focus(); return; }
    const data = {
      name: field("name").value.trim(),
      email: field("email").value.trim(),
      message: field("message").value.trim(),
      page: location.pathname.split("/").pop() || "index.html",
    };
    const endpoint = form.dataset.endpoint || "";
    if (endpoint.startsWith("web3forms:")) {
      button.disabled = true;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: endpoint.slice(10),
            subject: `ZALLIA private preview request: ${data.name}`,
            from_name: "vaelyn.co",
            replyto: data.email,
            ...data,
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.success === false) throw new Error("send failed");
        done();
      } catch {
        error.innerHTML = 'This could not be sent just now. Please write to <a href="mailto:' + form.dataset.to + '">' + form.dataset.to + "</a>.";
      } finally {
        button.disabled = false;
      }
      return;
    }
    const body = [
      "Hello Kimberley and Dev,", "",
      "I would like to request a private preview of ZALLIA.", "",
      `Name: ${data.name}`, `Email: ${data.email}`,
      data.message ? `\n${data.message}` : "",
    ].join("\n");
    location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent("ZALLIA private preview request")}&body=${encodeURIComponent(body)}`;
    thanks.querySelector("h2").textContent = "Almost there.";
    thanks.querySelector("p:not(.eyebrow)").textContent = "Your email has opened with your request written out. Once it is sent, we will be in touch personally.";
    done();
  });
})();
