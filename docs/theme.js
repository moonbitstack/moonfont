/* The theme control. The choice itself is made before the first paint by the
   script in the head; this file only keeps the control, the stored choice and
   the two aria attributes in step with it. */

(() => {
  "use strict";

  const KEY = "moonfont-theme";
  // Session storage, not local: a manual choice holds for the visit and the
  // next one starts from the system preference again.
  const store = window.sessionStorage;
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");

  const storedChoice = () => {
    try {
      const value = store.getItem(KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (e) {
      return null;
    }
  };

  const apply = (theme) => {
    root.dataset.theme = theme;
    if (!toggle) {
      return;
    }
    const dark = theme === "dark";
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      dark ? "Use the daylight proof" : "Use the dark case"
    );
  };

  apply(root.dataset.theme === "dark" ? "dark" : "light");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        store.setItem(KEY, next);
      } catch (e) {
        /* A file:// page may refuse storage; the choice still holds for this page. */
      }
      apply(next);
    });
  }

  const followOs = (event) => {
    if (storedChoice() === null) {
      apply(event.matches ? "dark" : "light");
    }
  };

  if (typeof scheme.addEventListener === "function") {
    scheme.addEventListener("change", followOs);
  } else if (typeof scheme.addListener === "function") {
    scheme.addListener(followOs);
  }

  // The scrollbar's thumb is drawn once the page has moved, so the first screen
  // is unmarked and the reader sees it appear when they start reading.
  const markTop = () => root.classList.toggle("at-top", scrollY === 0);
  addEventListener("scroll", markTop, { passive: true });
  markTop();
})();
