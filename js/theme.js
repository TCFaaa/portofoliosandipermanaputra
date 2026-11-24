(() => {
  const root = document.documentElement;
  const button = document.querySelector(".theme-toggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BAR_COLORS = { dark: "#09090f", light: "#f7f7fb" };

  const readSaved = () => {
    try { const v = localStorage.getItem("sandi-theme"); return v === "light" || v === "dark" ? v : null; }
    catch { return null; }
  };
  const save = (theme) => { try { localStorage.setItem("sandi-theme", theme); } catch {} };

  const apply = (theme) => {
    root.dataset.theme = theme;
    metaTheme?.setAttribute("content", BAR_COLORS[theme]);
    if (button) {
      button.querySelector(".theme-toggle__icon").textContent = theme === "dark" ? "☼" : "☾";
      button.setAttribute("aria-label", theme === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode");
    }
  };

  const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  apply(readSaved() || preferred);

  button?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const commit = () => { apply(next); save(next); };

    if (reduceMotion) return commit();
    // View Transitions: seluruh halaman di-crossfade sekaligus, jadi tidak ada elemen yang "loncat".
    if (typeof document.startViewTransition === "function") {
      // Animasi dekoratif dijeda selama transisi agar gambar lama & baru tidak bergeser (efek "ganda").
      const transition = document.startViewTransition(() => { root.classList.add("theme-vt"); commit(); });
      transition.finished.finally(() => root.classList.remove("theme-vt"));
      return;
    }
    // Fallback: transisi warna per elemen selama sebentar.
    root.classList.add("theme-switching");
    commit();
    window.setTimeout(() => root.classList.remove("theme-switching"), 450);
  });
})();
