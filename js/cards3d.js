// PHASE 5 — "Depth Slab": efek 3D untuk semua card.
//  • Hover (mouse) / tap (layar sentuh): card berubah jadi lempeng kaca. Isinya "meledak" jadi beberapa lapisan
//    kedalaman (ikon paling depan, teks di belakangnya) dan bergeser berlawanan arah kursor (parallax).
//  • Cahaya tepi (prismatik) berjalan mengelilingi border mengikuti arah kursor, plus kilau lembut di permukaan.
//  • Dua lempeng kaca tipis muncul di belakang card, ditambah bayangan berwarna yang bergeser berlawanan arah tilt.
//  • Klik / tap: gelombang tekanan. Card yang ditekan masuk ke dalam, riak cahaya menyebar dari titik sentuh,
//    dan card lain di sekitarnya ikut "melengkung" menjauhi titik tekan dengan jeda sesuai jarak.
// Tanpa library: semuanya digerakkan oleh satu loop spring kecil + CSS variables.
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  // Layar sentuh (HP/tablet): mode ringan. Tanpa lapisan kedalaman, lempeng, dan gelombang antar-card.
  const TOUCH = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // [selector, sudut tilt maksimum (derajat), pengali kedalaman]
  const CARDS = [
    [".portrait-frame", 8, 0.85],
    [".about-card--main", 3.5, 0.7],
    [".about-stat", 9, 1],
    [".skills-panel", 3, 0.7],
    [".tech-item", 12, 1],
    [".soft-skill", 7, 0.9],
    [".project-card", 8, 1],
    [".timeline-item__content", 5, 0.9],
    [".education-item", 10, 1],
    [".contact-card", 3, 0.7],
    [".contact-method", 9, 1]
  ];
  const CARD_SEL = CARDS.map((c) => c[0]).join(",");

  // [selector isi, kedalaman px]. Urutan penting: yang cocok lebih dulu menang.
  const LAYERS = [
    [".tech-item__logo, .soft-skill__icon, .about-stat__symbol, .education-item__icon, .contact-method__icon, .about-card__icon, .project-card__visual", 54],
    [".portrait-morph", 30],
    ["h2, h3", 36],
    ["strong", 30],
    [".about-card__label, .eyebrow, .skills-panel__index, .timeline-item__type, .education-item__year, .project-card__meta, .portrait-frame__topline, .portrait-tag", 26],
    ["p, small, ul, .education-item__location", 14],
    [".timeline-tags, .project-card__stack, .project-card__links, .button, .text-link, .contact-method > b", 44]
  ];

  const KEYS = ["rx", "ry", "px", "py", "lift", "pz", "glow"];
  const VARS = ["--rx", "--ry", "--px", "--py", "--lift", "--pz", "--glow", "--mx", "--my", "--ang"];
  const cards = [];

  const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; n.setAttribute("aria-hidden", "true"); return n; };

  const prepare = (node, tilt, depthScale) => {
    if (node.classList.contains("c3d")) return;
    const cs = getComputedStyle(node);
    if (cs.position === "static") node.style.position = "relative";
    const bare = cs.borderTopWidth === "0px" && cs.backgroundImage === "none" && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    node.classList.add("c3d");
    if (bare) node.classList.add("c3d--bare");
    VARS.forEach((v) => node.style.setProperty(v, v === "--mx" || v === "--my" ? "50" : "0"));

    // Elemen tambahan ditaruh di akhir agar selector :nth-child di CSS lama tidak bergeser.
    node.append(el("span", "c3d-shadow"), el("span", "c3d-plate c3d-plate--1"), el("span", "c3d-plate c3d-plate--2"));
    if (node.matches(".about-card--main, .contact-card")) {
      const clip = el("span", "c3d-clip");
      const orb = node.querySelector(":scope > .contact-card__orb");
      if (orb) clip.append(orb);
      node.append(clip);
    }
    const fx = el("span", "c3d-fx");
    const glare = el("span", "c3d-glare");
    fx.append(glare, el("span", "c3d-edge"));
    node.append(fx);

    // Tentukan lapisan kedalaman isi card (hanya milik card ini, bukan card bersarang di dalamnya).
    const taken = new Set();
    LAYERS.forEach(([selector, depth]) => {
      node.querySelectorAll(selector).forEach((layer) => {
        if (taken.has(layer) || layer.closest(".c3d-fx, .c3d-plate, .c3d-shadow, .c3d-clip")) return;
        if (layer.closest(CARD_SEL) !== node) return;
        taken.add(layer);
        layer.dataset.d = "";
        layer.style.setProperty("--d", String(Math.round(depth * depthScale)));
        if (getComputedStyle(layer).display === "inline") layer.style.display = "inline-block";
        for (let p = layer.parentElement; p && p !== node; p = p.parentElement) p.dataset.c3dPass = "";
      });
    });

    const s = {};
    KEYS.forEach((k) => { s[k] = { x: 0, v: 0, t: 0 }; });
    const card = { el: node, glare, tilt, s, hover: false, hold: false, timer: 0, ang: 0, angT: 0 };
    cards.push(card);
    bind(card);
  };

  // ---------- Loop spring ----------
  const active = new Set();
  let raf = 0;
  let last = 0;
  const STIFF = 170, DAMP = 16;
  const wrap = (a) => ((a + 540) % 360) - 180;

  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.033) || 0.016;
    last = now;
    active.forEach((card) => {
      let moving = false;
      KEYS.forEach((k) => {
        const p = card.s[k];
        p.v += ((p.t - p.x) * STIFF - p.v * DAMP) * dt;
        p.x += p.v * dt;
        if (Math.abs(p.t - p.x) > 0.002 || Math.abs(p.v) > 0.02) moving = true;
      });
      const turn = wrap(card.angT - card.ang);
      card.ang += turn * 0.22;
      if (Math.abs(turn) > 0.3) moving = true;
      const st = card.s, style = card.el.style;
      style.setProperty("--rx", st.rx.x.toFixed(3));
      style.setProperty("--ry", st.ry.x.toFixed(3));
      style.setProperty("--px", st.px.x.toFixed(3));
      style.setProperty("--py", st.py.x.toFixed(3));
      // Spring bisa overshoot ke nilai negatif; lapisan isi lalu masuk ke BELAKANG latar card dan terlihat hilang.
      style.setProperty("--lift", Math.max(0, st.lift.x).toFixed(3));
      style.setProperty("--pz", st.pz.x.toFixed(2));
      style.setProperty("--glow", clamp(st.glow.x, 0, 1.4).toFixed(3));
      style.setProperty("--ang", card.ang.toFixed(1));
      if (!moving) {
        // Diam: berhenti menggerakkan variable. Kelas aktif baru dilepas setelah kursor pergi / tap selesai.
        active.delete(card);
        if (!card.hover && !card.hold) card.el.classList.remove("is-live", "is-tilting");
      }
    });
    raf = active.size ? requestAnimationFrame(tick) : 0;
  };
  const wake = (card) => {
    card.el.classList.add("is-live");
    active.add(card);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  };

  // ---------- Interaksi ----------
  const aim = (card, event) => {
    const r = card.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = clamp((event.clientX - r.left) / r.width, 0, 1);
    const ny = clamp((event.clientY - r.top) / r.height, 0, 1);
    const st = card.s;
    st.ry.t = (nx - 0.5) * 2 * card.tilt;
    st.rx.t = (0.5 - ny) * 2 * card.tilt;
    st.px.t = (nx - 0.5) * 2;
    st.py.t = (ny - 0.5) * 2;
    card.el.style.setProperty("--mx", (nx * 100).toFixed(1));
    card.el.style.setProperty("--my", (ny * 100).toFixed(1));
    // Busur cahaya tepi berpusat pada arah kursor (conic-gradient dimulai dari jam 12, searah jarum jam).
    card.angT = (Math.atan2(ny - 0.5, nx - 0.5) * 180) / Math.PI + 90 - 65;
  };
  const rest = (card) => {
    KEYS.forEach((k) => { card.s[k].t = 0; });
    wake(card);
  };
  const raise = (card) => { card.s.lift.t = 1; card.s.glow.t = 1; card.el.classList.add("is-tilting"); wake(card); };

  const ripple = (card, event) => {
    const r = card.el.getBoundingClientRect();
    const dot = el("i", "c3d-ripple");
    const size = Math.hypot(r.width, r.height) * 2;
    dot.style.setProperty("--size", `${size}px`);
    dot.style.left = `${event.clientX - r.left}px`;
    dot.style.top = `${event.clientY - r.top}px`;
    card.glare.parentElement.append(dot);
    dot.addEventListener("animationend", () => dot.remove());
    setTimeout(() => dot.remove(), 1400);
  };

  // Gelombang tekanan: card lain di sekitar melengkung menjauhi titik tekan, dengan jeda sesuai jarak.
  const wave = (source, event) => {
    if (TOUCH) return; // terlalu berat untuk HP: puluhan card sekaligus jadi layer 3D
    const range = clamp(window.innerWidth * 0.9, 420, 1000);
    const hits = [];
    cards.forEach((c) => {
      if (c === source || c.el.contains(source.el)) return;
      const r = c.el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > window.innerHeight + 80 || !r.width) return;
      const dx = r.left + r.width / 2 - event.clientX;
      const dy = r.top + r.height / 2 - event.clientY;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.pow(clamp(1 - d / range, 0, 1), 1.2);
      if (k < 0.05) return;
      hits.push({ c, dx, dy, d, k });
    });
    hits.sort((a, b) => b.k - a.k).slice(0, 6).forEach(({ c, dx, dy, d, k }) => {
      setTimeout(() => {
        c.s.rx.v += (dy / d) * 85 * k;
        c.s.ry.v += -(dx / d) * 85 * k;
        c.s.pz.v += -250 * k;
        c.s.lift.v += 2.4 * k;
        c.s.glow.v += 2.6 * k;
        wake(c);
      }, d * 0.5);
    });
  };

  function bind(card) {
    const node = card.el;

    node.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      card.hover = true;
      raise(card);
    });
    node.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !card.hover) return;
      aim(card, event);
      wake(card);
    });
    node.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      card.hover = false;
      rest(card);
    });

    node.addEventListener("pointerdown", (event) => {
      if (event.target.closest(CARD_SEL) !== node) return; // hanya card paling dalam yang jadi pusat gelombang
      if (event.pointerType === "mouse" && event.button !== 0) return;
      aim(card, event);
      const st = card.s;
      st.pz.t = -14;
      st.pz.v += -320;
      st.lift.v += 5;
      st.glow.v += 6;
      ripple(card, event);
      wave(card, event);
      if (event.pointerType !== "mouse") {
        // Layar sentuh tidak punya hover: tahan efek sebentar setelah tap.
        card.hold = true;
        raise(card);
        clearTimeout(card.timer);
        card.timer = setTimeout(() => { card.hold = false; rest(card); }, 1500);
      }
      wake(card);
    });
    const release = () => {
      if (card.s.pz.t === 0) return;
      card.s.pz.t = 0;
      card.s.pz.v += 260; // memantul keluar saat dilepas
      wake(card);
    };
    node.addEventListener("pointerup", release);
    node.addEventListener("pointercancel", release);
    node.addEventListener("pointerleave", release);

    // Pengguna keyboard mendapat efek lapisan yang sama saat card (atau tautan di dalamnya) fokus.
    node.addEventListener("focusin", (event) => {
      if (!event.target.matches?.(":focus-visible")) return;
      card.hold = true;
      raise(card);
    });
    node.addEventListener("focusout", () => {
      card.hold = false;
      if (!card.hover) rest(card);
    });
  }

  CARDS.forEach(([selector, tilt, depthScale]) => {
    document.querySelectorAll(selector).forEach((node) => prepare(node, tilt, depthScale));
  });
  if (cards.length) root.classList.add("c3d-on");
  if (cards.length && TOUCH) root.classList.add("c3d-touch");
})();
