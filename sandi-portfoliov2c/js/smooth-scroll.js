// PHASE 4 — Smooth scroll dengan Lenis.
// Dimuat dari CDN (lihat index.html). Jika CDN gagal / pengguna memilih reduced motion,
// situs otomatis kembali ke scroll bawaan browser (CSS scroll-behavior: smooth).
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof window.Lenis !== "function") return;

  const lenis = new window.Lenis({
    lerp: 0.09,          // makin kecil = makin "licin" / lambat berhenti
    smoothWheel: true,   // touch tetap memakai scroll native agar terasa natural di HP
    wheelMultiplier: 1
  });
  window.lenis = lenis;

  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);

  // Link anchor (#about, #projects, dst.) diarahkan lewat Lenis agar tetap mulus.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    const target = hash === "#home" ? 0 : document.querySelector(hash);
    if (target === null) return;
    event.preventDefault();
    const header = document.querySelector(".site-header");
    const offset = target === 0 ? 0 : -((header?.offsetHeight || 76) + 8);
    lenis.scrollTo(target, { offset, duration: 1.2 });
    history.pushState(null, "", hash);
  });
})();
