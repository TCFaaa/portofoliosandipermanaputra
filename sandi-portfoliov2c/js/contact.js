// Kontak saat ini menggunakan mailto agar tidak berpura-pura mengirim ke server.
// Integrasikan layanan form/backend ketika endpoint sudah tersedia.
document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.setAttribute("aria-label", "Kirim email ke Sandi Permana Putra");
});
