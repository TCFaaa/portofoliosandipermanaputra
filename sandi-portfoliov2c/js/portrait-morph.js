// Foto profil: dua foto (profile.jpg + profile-alt.jpg) bertukar lewat dissolve yang menyebar dari beberapa titik.
//  • Otomatis: loop 9 detik (diam → dissolve ke foto 2 → diam → dissolve kembali).
//  • Kursor / sentuhan: loop otomatis surut, lalu HANYA area di sekitar kursor yang berubah ke foto 2
//    (ada "ekor" kedua yang menyusul agar tepinya terasa organik). Kursor pergi → area menutup, loop lanjut.
// Tampilan diatur lewat CSS mask di style.css; skrip ini hanya mengisi variabel --morph, --hv, --cx, --cy, --tx, --ty, --hr.
(() => {
  const alt = document.querySelector(".portrait--alt");
  const frame = alt?.closest(".portrait-frame");
  if (!alt || !frame) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const PERIOD = 9000;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a), 0, 1));
  // 0–.30 diam, .30–.48 naik, .48–.74 tahan, .74–.92 turun, sisanya diam
  const cycle = (p) => (p < 0.74 ? seg(p, 0.3, 0.48) : 1 - seg(p, 0.74, 0.92));

  const st = { morph: 0, hv: 0, hvT: 0, x: 0, y: 0, tx: 0, ty: 0, tgx: 0, tgy: 0, t0: 0, hover: false, visible: true, raf: 0, timer: 0 };
  const holder = alt.closest(".portrait-morph") || alt;
  const put = (k, v) => holder.style.setProperty(k, v);
  let rect = null;

  const place = (event) => {
    rect = alt.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    if (!st.hover) { st.x = st.tx = x; st.y = st.ty = y; } // mulai tepat di titik masuk
    st.tgx = x; st.tgy = y;
    put("--hr", `${(rect.width * 0.34).toFixed(0)}px`);
  };
  const enter = (event) => { st.hover = true; place(event); st.hvT = 1; wake(); };
  const leave = () => {
    st.hover = false; st.hvT = 0;
    st.t0 = performance.now() - PERIOD * 0.22; // lanjutkan loop tak lama setelah area menutup
    wake();
  };

  frame.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") enter(event); });
  frame.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" && st.hover) place(event); });
  frame.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") leave(); });
  // Layar sentuh: ketuk = area terbuka di titik ketukan, menutup sendiri setelah ±1,4 dtk.
  frame.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    clearTimeout(st.timer);
    enter(event);
    st.timer = setTimeout(leave, 1400);
  });

  const frameFn = (now) => {
    st.raf = 0;
    if (!st.visible) return;
    // loop otomatis (surut ke 0 saat hover)
    st.morph = st.hover ? st.morph * 0.88 : cycle(((now - st.t0) % PERIOD) / PERIOD);
    st.hv += (st.hvT - st.hv) * 0.14;
    st.x += (st.tgx - st.x) * 0.22; st.y += (st.tgy - st.y) * 0.22;   // blob utama mengikuti kursor
    st.tx += (st.x - st.tx) * 0.1;  st.ty += (st.y - st.ty) * 0.1;     // ekor menyusul lebih lambat
    if (st.morph < 0.001) st.morph = 0;
    if (Math.abs(st.hv - st.hvT) < 0.03) st.hv = st.hvT; // snap: tidak menyisakan titik kecil
    put("--morph", st.morph.toFixed(3));
    put("--hv", st.hv.toFixed(3));
    // Saat tidak ada hover, pusat area dipindah ke luar frame (gradien radius nol tetap menggambar 1 piksel di pusatnya).
    const idle = st.hv === 0 && st.hvT === 0;
    put("--cx", idle ? "-9999px" : `${st.x.toFixed(1)}px`); put("--cy", idle ? "-9999px" : `${st.y.toFixed(1)}px`);
    put("--tx", idle ? "-9999px" : `${st.tx.toFixed(1)}px`); put("--ty", idle ? "-9999px" : `${st.ty.toFixed(1)}px`);
    st.raf = requestAnimationFrame(frameFn);
  };
  const wake = () => { if (!st.raf && st.visible) st.raf = requestAnimationFrame(frameFn); };

  const start = () => {
    st.t0 = performance.now();
    alt.classList.add("is-ready");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        st.visible = entry.isIntersecting;
        if (st.visible) { st.t0 = performance.now() - ((performance.now() - st.t0) % PERIOD); wake(); }
      }, { threshold: 0.1 }).observe(alt);
    }
    wake();
  };
  if (alt.complete && alt.naturalWidth) start();
  else alt.addEventListener("load", start, { once: true });
})();
