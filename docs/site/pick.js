"use strict";
// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0
function optionsOf(pick) {
    return pick.options;
}
function selectedOf(pick) {
    return pick.options.find((option) => option.getAttribute("aria-selected") === "true") ?? null;
}
function close(pick, returnFocus) {
    pick.list.hidden = true;
    pick.button.setAttribute("aria-expanded", "false");
    if (returnFocus)
        pick.button.focus();
}
function choose(pick, option, notify) {
    for (const other of pick.options) {
        other.setAttribute("aria-selected", other === option ? "true" : "false");
    }
    const value = option.dataset.value ?? "";
    pick.input.value = value;
    // Anything else the option carries (a codepoint, say) is handed on, so a
    // page that read `select.dataset` before reads the same thing now.
    for (const { name, value: data } of Array.from(option.attributes)) {
        if (!name.startsWith("data-") || name === "data-value")
            continue;
        pick.input.setAttribute(name, data);
    }
    if (pick.label)
        pick.label.textContent = (option.textContent ?? "").trim();
    if (notify)
        pick.input.dispatchEvent(new Event("change", { bubbles: true }));
}
function open(pick) {
    pick.list.hidden = false;
    pick.button.setAttribute("aria-expanded", "true");
    const current = selectedOf(pick) ?? pick.options[0];
    current?.focus();
}
function move(pick, step) {
    const options = optionsOf(pick);
    const active = document.activeElement;
    const index = Math.max(0, options.indexOf(active ?? options[0] ?? pick.button));
    const next = (index + step + options.length) % options.length;
    options[next]?.focus();
}
function initOne(pick) {
    const { button, list } = pick;
    pick.label ??= button.querySelector("[data-pick-label]");
    button.addEventListener("click", () => {
        if (list.hidden)
            open(pick);
        else
            close(pick, false);
    });
    button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open(pick);
        }
    });
    for (const option of pick.options) {
        option.addEventListener("click", () => {
            choose(pick, option, true);
            close(pick, true);
        });
    }
    list.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                move(pick, 1);
                break;
            case "ArrowUp":
                event.preventDefault();
                move(pick, -1);
                break;
            case "Home":
                event.preventDefault();
                optionsOf(pick)[0]?.focus();
                break;
            case "End": {
                event.preventDefault();
                const options = optionsOf(pick);
                options[options.length - 1]?.focus();
                break;
            }
            case "Enter":
            case " ": {
                event.preventDefault();
                const active = document.activeElement;
                if (active && pick.options.includes(active)) {
                    choose(pick, active, true);
                    close(pick, true);
                }
                break;
            }
            case "Escape":
                event.preventDefault();
                close(pick, true);
                break;
            case "Tab":
                close(pick, false);
                break;
        }
    });
    // A click anywhere else, or the pointer leaving the page, puts the menu away.
    document.addEventListener("pointerdown", (event) => {
        if (list.hidden)
            return;
        if (!pick.root.contains(event.target))
            close(pick, false);
    });
    window.addEventListener("blur", () => {
        if (!list.hidden)
            close(pick, false);
    });
    const initial = selectedOf(pick) ?? pick.options[0];
    if (initial)
        choose(pick, initial, false);
}
function initPicks(root = document) {
    for (const element of Array.from(root.querySelectorAll("[data-pick]"))) {
        const button = element.querySelector(".pick__button");
        const list = element.querySelector(".pick__list");
        const input = element.querySelector("input[type=hidden]");
        const options = Array.from(element.querySelectorAll('[role="option"]'));
        if (!button || !list || !input || options.length === 0)
            continue;
        initOne({
            root: element,
            button,
            list,
            input,
            label: button.querySelector("[data-pick-label]"),
            options,
        });
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initPicks(), { once: true });
}
else {
    initPicks();
}
