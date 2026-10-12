"use strict";

if (window.lucide) window.lucide.createIcons();

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", event => {
  if (!event.target.closest(".site-header")) closeMenu();
});
window.matchMedia("(min-width: 801px)").addEventListener("change", closeMenu);

let dialogTrigger = null;
document.querySelectorAll("[data-dialog]").forEach(trigger => {
  trigger.addEventListener("click", () => {
    dialogTrigger = trigger;
    closeMenu();
    document.getElementById(trigger.dataset.dialog).showModal();
  });
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog &&
        (event.clientX < bounds.left || event.clientX > bounds.right ||
         event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => {
    // A mobile-menu trigger has become hidden: return focus to its visible toggle.
    if (dialogTrigger?.getClientRects().length) dialogTrigger.focus();
    else menuToggle.focus();
  });
});

const interfaceTablist = document.querySelector(".interface-tabs");
if (interfaceTablist) {
  const compactInterfaces = window.matchMedia("(max-width: 800px)");
  const setOrientation = () => {
    interfaceTablist.setAttribute(
      "aria-orientation", compactInterfaces.matches ? "horizontal" : "vertical"
    );
  };
  setOrientation();
  compactInterfaces.addEventListener("change", setOrientation);
}
document.querySelectorAll("[data-interface]").forEach(tab => {
  tab.addEventListener("click", () => {
    activateTab(tab);
    document.querySelectorAll(".interface-panel").forEach(panel => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
  });
});

const evidence = {
  movement: [
    "Moved to travel preparation.",
    "Identity, location and timing agree. The collection record updates.",
    "Release approval stays with the authorised person.",
  ],
  gap: [
    "Missed read. Not proof of loss.",
    "One missed signal does not establish a move or a loss.",
    "Show the last confirmed location and time; flag the uncertainty and ask for a check when needed.",
  ],
  return: [
    "Care complete. Return still pending.",
    "Care is complete, according to the specialist.",
    "Confirm receipt and required checks before marking the piece ready.",
  ],
};
document.querySelectorAll("[data-evidence]").forEach(tab => {
  tab.addEventListener("click", () => {
    activateTab(tab);
    const values = evidence[tab.dataset.evidence];
    ["evidence-heading", "evidence-body", "evidence-limit"].forEach((id, i) => {
      document.getElementById(id).textContent = values[i];
    });
    document.getElementById("evidence-detail").setAttribute("aria-labelledby", tab.id);
  });
});

const curation = {
  travel: {
    heading: "For your days on board.",
    body: "Ivory tailoring, your oxblood handbag and a touch of gold.",
    context: "Considered for your Friday departure.",
    pieces: ["jacket", "bag", "earrings"],
    refined: {
      body: "Ivory tailoring, your oxblood handbag and the dress watch.",
      context: "A quieter accent. Still entirely yours.",
      pieces: ["jacket", "bag", "watch"],
    },
    offer: "With the watch instead",
    restore: "Return to the earrings",
  },
  evening: {
    heading: "A different mood for the evening.",
    body: "Burgundy silk, your oxblood handbag and gold earrings.",
    context: "Rich colour. Familiar favourites, worn together.",
    pieces: ["silk", "bag", "earrings"],
    refined: {
      body: "Ivory tailoring, the same handbag and gold earrings.",
      context: "A lighter palette, from your own collection.",
      pieces: ["jacket", "bag", "earrings"],
    },
    offer: "Try a lighter palette",
    restore: "Return to burgundy",
  },
  rediscover: {
    heading: "A favourite, seen differently.",
    body: "Your dress watch, paired with ivory tailoring and the oxblood handbag.",
    context: "A new combination. Nothing new to buy.",
    pieces: ["watch", "jacket", "bag"],
    refined: {
      body: "The same watch and handbag, with burgundy silk.",
      context: "The pieces you know, in a different light.",
      pieces: ["watch", "silk", "bag"],
    },
    offer: "Bring in some colour",
    restore: "Return to ivory",
  },
};
const selectionDataElement = document.getElementById("selection-data");
const selectionData = selectionDataElement ? JSON.parse(selectionDataElement.textContent) : null;
let activeCuration = "travel";
let refinedCuration = false;

function renderCuration() {
  const base = curation[activeCuration];
  const choice = refinedCuration ? base.refined : base;
  document.getElementById("curation-heading").textContent = base.heading;
  document.getElementById("curation-body").textContent = choice.body;
  document.getElementById("curation-context").textContent = choice.context;
  document.querySelectorAll("#curation-detail .selection-piece").forEach((figure, index) => {
    const piece = choice.pieces[index];
    const asset = selectionData[piece];
    const image = figure.querySelector("img");
    figure.dataset.piece = piece;
    image.srcset = asset.srcset;
    image.src = asset.src;
    image.alt = asset.label;
    image.width = asset.dimensions[0];
    image.height = asset.dimensions[1];
    figure.querySelector("figcaption").textContent = asset.label;
  });
  const refine = document.querySelector("[data-refine]");
  refine.setAttribute("aria-pressed", String(refinedCuration));
  refine.querySelector("span").textContent = refinedCuration ? base.restore : base.offer;
}

document.querySelectorAll("[data-curation]").forEach(tab => {
  tab.addEventListener("click", () => {
    activateTab(tab);
    activeCuration = tab.dataset.curation;
    refinedCuration = false;
    renderCuration();
    document.getElementById("curation-detail").setAttribute("aria-labelledby", tab.id);
  });
});
document.querySelector("[data-refine]")?.addEventListener("click", () => {
  refinedCuration = !refinedCuration;
  renderCuration();
});

function activateTab(tab) {
  tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]').forEach(item => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
}
document.querySelectorAll('[role="tablist"]').forEach(tablist => {
  tablist.addEventListener("keydown", event => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    const vertical = tablist.getAttribute("aria-orientation") === "vertical";
    let next;
    if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) next = (index + 1) % tabs.length;
    if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  });
});
