// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0

// The furniture of these pages does not offer a context menu.
//
// Right-clicking a casting, a tab strip or a diagram used to raise a menu of
// things that cannot be done to them — "save image as", "copy image", "inspect"
// — and a long press on a phone raised the same. None of it is a way to work
// with the page; it only made the furniture look like content.
//
// Text is left alone, and so are links and fields: a reader may still copy a
// paragraph, a signature or a table cell, open a link in a new tab, and use the
// menu in an input. Only the parts that answer nothing are quiet.
//
// The list below is the same furniture the stylesheets take selection away
// from, less the footer: the licence and the note beside it are prose, and a
// reader may want to copy them. The two lists are kept in step by hand, because
// one is CSS and one is a decision about events.

(() => {
  "use strict";

  const FURNITURE = [
    "header",
    "nav",
    "button",
    "canvas",
    "svg",
    "label",
    ".figures",
    ".modes",
    ".pick",
    ".dropzone",
    ".panel",
    ".grid",
    ".tile",
    ".hud",
    ".tray__stage",
    ".tray__note",
    ".case-index",
    ".stick",
    ".rule-figure",
    ".pkg-kind",
    ".mark",
    ".field__label",
  ].join(",");

  // Things a menu is genuinely for: a link, a field, a block of code.
  const KEEPS_MENU = "a, input, textarea, select, pre, code, figcaption, caption";

  const onFurniture = (target) => {
    if (!(target instanceof Element)) return false;
    if (target.closest(KEEPS_MENU)) return false;
    return Boolean(target.closest(FURNITURE));
  };

  addEventListener(
    "contextmenu",
    (event) => {
      if (onFurniture(event.target)) event.preventDefault();
    },
    { passive: false },
  );

  // A press on a specimen must not start a native drag of the canvas either,
  // which would lift a ghost of it and swallow the pointer.
  addEventListener(
    "dragstart",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLCanvasElement || target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
})();
