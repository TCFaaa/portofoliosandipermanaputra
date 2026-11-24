# Sandi Permana Putra — Portfolio

Starter website portofolio menggunakan HTML, CSS, dan JavaScript murni.

## Menjalankan secara lokal
1. Ekstrak folder proyek.
2. Buka folder `sandi-portfolio` di Visual Studio Code.
3. Jalankan `index.html` menggunakan ekstensi Live Server.
4. Website akan terbuka di browser.

## Struktur
- `index.html`: struktur halaman.
- `css/`: styling dan responsive layout.
- `js/`: interaksi dan data proyek (`animations.js` = Motion, `smooth-scroll.js` = Lenis, `scene3d.js` = Three.js, `cards3d.js` = efek 3D card).
- `assets/images/profile.jpg`: foto profil.
- `assets/documents/cv-sandi.pdf`: CV.

## Mengisi proyek
Edit array `projects` di `js/projects.js`. Isi dengan proyek yang benar-benar pernah dibuat.

## Catatan sebelum publikasi
- Verifikasi kembali email, nomor telepon, dan tautan sosial.
- Tambahkan URL GitHub yang benar.
- Uji link CV, responsive layout, dan aksesibilitas.
- Contact saat ini memakai `mailto`; belum ada backend/form submission.
- Scene 3D memakai **Three.js** (`three@0.160.0`, CDN jsDelivr) di `js/scene3d.js`; animasi GSAP lanjutan bisa ditambahkan pada fase berikutnya.
- Animasi memakai **Motion** (`motion@11.18.2`) dan smooth scroll memakai **Lenis** (`lenis@1.1.20`), keduanya dari CDN jsDelivr. Jika CDN tidak bisa dimuat, situs otomatis memakai animasi CSS/JS biasa.


## Profil GitHub
- Username: `TCFaaa`
- URL: https://github.com/TCFaaa

Daftar proyek sengaja dibiarkan kosong agar pemilik dapat mengisinya sendiri di `js/projects.js`.
Selama array kosong, situs menampilkan dua kartu "dalam pengerjaan" yang mengarah ke GitHub.

## Meta & ikon
- Favicon, apple-touch-icon, dan gambar pratinjau `og-image.png` ada di `assets/images/`.
- URL di tag `canonical` dan `og:*` memakai `https://sandipermanaputra.my.id/`. Ubah jika domainnya berbeda.

## Efek 3D card ("Depth Slab")
`js/cards3d.js` + `css/cards3d.css`, tanpa library tambahan. Berlaku untuk semua card (profil, About, Skills, Proyek, Pengalaman, Pendidikan, Kontak).
- Hover / tap: isi card terpisah menjadi lapisan kedalaman, kilau permukaan, cahaya tepi mengikuti kursor, lempeng kaca dan bayangan berwarna di belakang.
- Klik / tap: card menekan ke dalam, riak cahaya muncul dari titik sentuh, card di sekitarnya ikut melengkung (gelombang tekanan).
- Untuk menambah card baru, tambahkan selector-nya di array `CARDS` pada `js/cards3d.js`.
