// Isi array ini dengan proyek ASLI milikmu. Selama kosong, halaman menampilkan kartu "dalam pengerjaan".
// Contoh properti: name, description, stack, image, demo, source.
// Biarkan array kosong sampai kamu siap menampilkan proyek.
const projects = [];

const projectList = document.querySelector("#project-list");

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

const safeURL = (value = "") => {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
};

const projectCard = (project, index) => {
  const stack = Array.isArray(project.stack) ? project.stack : [];
  const visual = project.image
    ? `<img src="${safeURL(project.image)}" alt="Tampilan ${escapeHTML(project.name)}" loading="lazy">`
    : `<div class="project-card__placeholder"><span class="project-card__code">&lt;/&gt;</span><span>PROJECT PREVIEW</span></div>`;

  const links = [
    project.demo ? `<a href="${safeURL(project.demo)}" target="_blank" rel="noreferrer">Live Demo <span>↗</span></a>` : "",
    project.source ? `<a href="${safeURL(project.source)}" target="_blank" rel="noreferrer">Source Code <span>↗</span></a>` : ""
  ].filter(Boolean).join("");

  return `
    <article class="project-card reveal">
      <div class="project-card__inner">
        <div class="project-card__visual">
          <span class="project-card__serial">PROJECT / ${String(index + 1).padStart(2, "0")}</span>
          ${visual}
          <span class="project-card__visual-mark" aria-hidden="true">↗</span>
        </div>
        <div class="project-card__body">
          <div class="project-card__meta"><span>FEATURED WORK</span><span>${String(index + 1).padStart(2, "0")}</span></div>
          <h3>${escapeHTML(project.name)}</h3>
          <p>${escapeHTML(project.description)}</p>
          <div class="project-card__stack">${stack.map(escapeHTML).map((item) => `<span>${item}</span>`).join("")}</div>
          <div class="project-card__links">${links || '<span class="project-card__coming">Tautan proyek segera ditambahkan</span>'}</div>
        </div>
      </div>
    </article>`;
};

if (projectList) {
  if (projects.length) {
    projectList.innerHTML = projects.map(projectCard).join("");
  } else {
    projectList.innerHTML = `
      <article class="project-card project-card--empty reveal">
        <div class="project-card__inner">
          <div class="project-card__visual project-card__visual--empty">
            <span class="project-card__serial">PROJECT / 01</span>
            <div class="empty-visual-art"><span>&lt;/&gt;</span><i></i><b></b></div>
            <span class="project-card__visual-mark" aria-hidden="true">+</span>
          </div>
          <div class="project-card__body">
            <div class="project-card__meta"><span>DALAM PENGERJAAN</span><span>01</span></div>
            <h3>Proyek pertama sedang disiapkan.</h3>
            <p>Saya sedang membangun proyek website yang akan ditampilkan di sini. Sambil menunggu, kamu bisa melihat kode dan eksperimen saya di GitHub.</p>
            <div class="project-card__stack"><span>HTML</span><span>CSS</span><span>JavaScript</span></div>
            <div class="project-card__links"><a href="https://github.com/TCFaaa" target="_blank" rel="noreferrer">Lihat GitHub <span>↗</span></a></div>
          </div>
        </div>
      </article>
      <article class="project-card project-card--empty project-card--empty-alt reveal">
        <div class="project-card__inner">
          <div class="project-card__visual project-card__visual--empty">
            <span class="project-card__serial">PROJECT / 02</span>
            <div class="empty-visual-art"><span>✳</span><i></i><b></b></div>
            <span class="project-card__visual-mark" aria-hidden="true">+</span>
          </div>
          <div class="project-card__body">
            <div class="project-card__meta"><span>SEGERA HADIR</span><span>02</span></div>
            <h3>Eksperimen berikutnya.</h3>
            <p>Proyek lain akan ditambahkan seiring proses belajar saya, lengkap dengan tautan demo dan kode sumber.</p>
            <div class="project-card__stack"><span>Landing Page</span><span>Web App</span></div>
            <div class="project-card__links"><span class="project-card__coming">Segera hadir</span></div>
          </div>
        </div>
      </article>`;
  }
}

// Efek tilt 3D untuk kartu ditangani di js/animations.js.
