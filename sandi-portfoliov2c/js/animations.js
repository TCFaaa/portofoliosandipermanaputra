// PHASE 4 — Motion (animasi masuk & hover tombol), progress bar, dengan fallback tanpa library.
// Efek 3D card ada di js/cards3d.js.
(() => {
  const root = document.documentElement;
  root.dataset.motion = "ready";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Scroll progress + header ----------
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  const header = document.querySelector(".site-header");
  let ticking = false;
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { window.requestAnimationFrame(updateScroll); ticking = true; }
  }, { passive: true });
  updateScroll();

  const revealItems = [...document.querySelectorAll(".reveal")];
  const showAll = () => revealItems.forEach((item) => item.classList.add("is-visible"));

  // ---------- Fallback tanpa Motion (IntersectionObserver + CSS) ----------
  const revealWithObserver = () => {
    if (!("IntersectionObserver" in window)) return showAll();
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => observer.observe(item));
  };

  // ---------- Versi Motion ----------
  const initMotion = () => {
    const { animate, inView, stagger } = window.Motion;
    const ease = [0.2, 0.75, 0.25, 1];
    const spring = { type: "spring", stiffness: 420, damping: 26 };
    root.classList.add("motion-on");

    // 1) Animasi pembuka hero: teks naik berurutan, foto masuk dari kanan.
    const heroContent = document.querySelector(".hero__content");
    const heroVisual = document.querySelector(".hero__visual");
    if (heroContent) {
      const kids = [...heroContent.children];
      kids.forEach((kid) => { kid.style.opacity = "0"; });
      heroContent.classList.add("is-visible");
      animate(kids, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease, delay: stagger(0.09, { startDelay: 0.1 }) });
    }
    if (heroVisual) {
      heroVisual.style.opacity = "0";
      heroVisual.classList.add("is-visible");
      animate(heroVisual, { opacity: [0, 1], x: [48, 0], scale: [0.96, 1] }, { duration: 1, ease, delay: 0.3 });
    }

    // 2) Animasi masuk saat di-scroll. Kartu bersaudara muncul berurutan (stagger).
    const items = revealItems.filter((el) => el !== heroContent && el !== heroVisual);
    const shown = new WeakSet();
    inView(items, (info) => {
      const el = info instanceof Element ? info : info.target;
      if (!el || shown.has(el)) return;
      shown.add(el);
      const group = [...(el.parentElement?.children || [])].filter((c) => c.classList.contains("reveal"));
      const delay = Math.min(Math.max(group.indexOf(el), 0), 3) * 0.08;
      const controls = animate(el, { opacity: [0, 1], y: [32, 0] }, { duration: 0.85, ease, delay });
      Promise.resolve(controls.finished || controls).then(() => {
        el.style.removeProperty("transform"); // serahkan transform ke CSS (efek 3D card di cards3d.css)
        el.classList.add("is-visible");
      });
    }, { margin: "0px 0px -8% 0px" });

    if (!finePointer) return;

    // 3) Hover berbasis pegas (spring) untuk tombol, kartu kecil, dan kontak.
    // Card (tech-item, about-stat, contact-method, dst.) kini ditangani js/cards3d.js.
    const hoverTargets = [
      [".button", { y: -3, scale: 1.03 }]
    ];
    hoverTargets.forEach(([selector, to]) => {
      const rest = Object.fromEntries(Object.keys(to).map((key) => [key, key === "scale" ? 1 : 0]));
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") animate(el, to, spring); });
        el.addEventListener("pointerleave", () => animate(el, rest, spring));
      });
    });
    document.querySelectorAll(".button").forEach((button) => {
      button.addEventListener("pointerdown", () => animate(button, { scale: 0.96 }, { type: "spring", stiffness: 600, damping: 30 }));
      button.addEventListener("pointerup", () => animate(button, { scale: button.matches(":hover") ? 1.03 : 1 }, spring));
    });
  };

  // ---------- Pilih jalur ----------
  if (reduceMotion) { showAll(); return; }
  const motionReady = window.Motion && typeof window.Motion.animate === "function" && typeof window.Motion.inView === "function";
  if (motionReady) {
    try { initMotion(); return; }
    catch (error) {
      console.warn("Motion gagal diinisialisasi, memakai fallback.", error);
      root.classList.remove("motion-on");
      document.querySelectorAll(".hero__content > *, .hero__visual").forEach((el) => { el.style.opacity = ""; });
    }
  }
  revealWithObserver();
})();
