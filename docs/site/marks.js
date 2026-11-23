// Copyright 2026 Leo Cheng
// SPDX-License-Identifier: Apache-2.0
const STEP = 1000 / 60;
function loadMatter() {
    if (window.Matter)
        return Promise.resolve(window.Matter);
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL("../vendor/matter.min.js", import.meta.url).href;
        script.onload = () => {
            if (window.Matter)
                resolve(window.Matter);
            else
                reject(new Error("matter-js loaded without Matter"));
        };
        script.onerror = () => reject(new Error("matter-js did not load"));
        document.head.append(script);
    });
}
function start(row, M) {
    const tabs = Array.from(row.querySelectorAll("[data-mode]"));
    if (!tabs.length)
        return;
    const canvas = document.createElement("canvas");
    canvas.className = "marker";
    canvas.setAttribute("aria-hidden", "true");
    row.append(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    const engine = M.Engine.create({ enableSleeping: false });
    engine.gravity.x = 0;
    engine.gravity.y = 0;
    const body = M.Bodies.circle(0, 0, 1, {
        frictionAir: 0,
        restitution: 0,
        render: { visible: false },
    });
    M.Composite.add(engine.world, body);
    const marker = {
        body,
        target: 0,
        canvas,
        ctx,
        dpr: 1,
        raf: 0,
        accumulator: 0,
        last: 0,
    };
    const activeTab = () => tabs.find((tab) => tab.getAttribute("aria-pressed") === "true") ?? tabs[0] ?? null;
    const measure = () => {
        const box = row.getBoundingClientRect();
        const active = activeTab();
        if (!active)
            return;
        const rect = active.getBoundingClientRect();
        marker.target = rect.left - box.left + rect.width / 2;
        marker.dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(box.width * marker.dpr);
        canvas.height = Math.round(4 * marker.dpr);
        canvas.style.width = `${box.width}px`;
        canvas.style.height = "4px";
    };
    const draw = () => {
        const { ctx: c, dpr } = marker;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        const width = 24;
        const height = 2;
        c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff5a36";
        c.beginPath();
        c.roundRect(marker.body.position.x - width / 2, 1, width, height, 1);
        c.fill();
    };
    const step = (now) => {
        marker.raf = 0;
        if (!marker.last)
            marker.last = now;
        const elapsed = Math.min(now - marker.last, 60);
        marker.last = now;
        marker.accumulator = Math.min(marker.accumulator + elapsed, STEP * 3);
        while (marker.accumulator >= STEP) {
            const dx = marker.target - marker.body.position.x;
            // A spring, not a tween: k gives it the overshoot, c takes it away.
            const stiffness = 0.0016;
            const damping = 0.022;
            M.Body.applyForce(marker.body, marker.body.position, {
                x: dx * stiffness - marker.body.velocity.x * damping,
                y: 0,
            });
            M.Engine.update(engine, STEP);
            marker.accumulator -= STEP;
        }
        draw();
        const settled = Math.abs(marker.target - marker.body.position.x) < 0.15 &&
            Math.abs(marker.body.velocity.x) < 0.02;
        if (!settled) {
            marker.raf = requestAnimationFrame(step);
        }
        else {
            marker.last = 0;
        }
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const kick = () => {
        if (reduced) {
            aim(true);
            return;
        }
        if (marker.raf)
            return;
        marker.last = 0;
        marker.raf = requestAnimationFrame(step);
    };
    const aim = (instant) => {
        measure();
        if (instant) {
            M.Body.setPosition(marker.body, { x: marker.target, y: 0 });
            M.Body.setVelocity(marker.body, { x: 0, y: 0 });
            draw();
            return;
        }
        kick();
    };
    aim(true);
    for (const tab of tabs)
        tab.addEventListener("click", () => kick());
    new MutationObserver(() => kick()).observe(row, {
        attributes: true,
        subtree: true,
        attributeFilter: ["aria-pressed"],
    });
    new ResizeObserver(() => aim(true)).observe(row);
    window.addEventListener("resize", () => aim(true));
    new MutationObserver(() => aim(true)).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
    });
}
async function mount() {
    const row = document.querySelector("[data-spring-tabs]");
    if (!row)
        return;
    try {
        start(row, await loadMatter());
    }
    catch {
        row.dataset.spring = "unavailable";
    }
}
void mount();
export {};
