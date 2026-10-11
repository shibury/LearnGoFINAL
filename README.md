# LearnGo

Platform belajar bahasa pemrograman dengan gamifikasi. Lessons interaktif, kuis
sertifikasi, AI tutor, dan komunitas real-time.

Dibangun dengan Next.js App Router, React, Supabase, dan Tailwind CSS.

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknnologi)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Pengaturan Supabase](#pengaturan-supabase)
- [Menerapkan Migration](#menerapkan-migration)
- [Struktur Proyek](#struktur-proyek)
- [Model Gamifikasi](#model-gamifikasi)
- [Skema Database](#skema-database)
- [API Routes](#api-routes)
- [Menjalankan Lint dan Build](#menjalankan-lint-dan-build)

---

## Fitur

**Lesson interaktif.** Empat jalur belajar, yaitu Python, JavaScript, C++, dan
Data Structures and Algorithms. Setiap jalur punya delapan bab dan sepuluh
lesson. Progres lesson tersimpan di database sehingga lesson yang selesai di satu
perangkat tetap terbaca di perangkat lain.

**Kuis sertifikasi.** Sepuluh soal pilihan ganda tentang algoritma dan struktur
data. Setiap jawaban benar bernilai sepuluh XP. Skor sepuluh dari sepuluh membuka
badge Fundamental Passed.

**AI tutor.** IBM Bob melalui Langflow, dengan dua mode. Mode Socratic hanya
bertanya dan tidak pernah memberi jawaban langsung. Mode Guided memberi petunjuk
bertingkat. Kunci API tetap di sisi server.

**Ringkasan dokumen.** Unggah PDF, lalu dapatkan ringkasan terstruktur. API key
pembuat ringkasan tidak pernah sampai ke browser.

**Komunitas.** Obrolan real-time yang bisa dibaca semua user login dan ditulis
hanya dengan akun sendiri. Ditambah leaderboard, ruang belajar, mentor, skill
industri, dan perusahaan partner.

**Quest dan achievement berbasis aktivitas.** Quest harian diselesaikan server
dari aktivitas yang tercatat, bukan dari klik pada kartu. Achievement diberikan
server ketika syaratnya benar-benar terpenuhi.

---

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 3, daisyUI, lucide-react |
| Database | Supabase Postgres |
| Auth | Supabase Auth, Google OAuth |
| Real-time | Supabase Realtime |
| AI | Langflow, IBM Bob |
| PDF | pdf-parse |

---

## Menjalankan Proyek

Prasyarat:

- Node.js 20 atau lebih baru
- Akun Supabase
- Akun Langflow dengan satu flow sudah dibuat

Langkah:

```bash
npm install
copy .env.example .env
```

Isi `.env` sesuai bagian [Variabel Lingkungan](#variabel-lingkungan), lalu
jalankan:

```bash
npm run dev
```

Aplikasi tersedia di `http://localhost:3000`.

Untuk build produksi:

```bash
npm run build
npm start
```

---

## Variabel Lingkungan

Semua variabel diletakkan di file `.env` pada root proyek. File ini tidak boleh
dimasukkan ke version control.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Publishable key, aman untuk browser |
| `SUPABASE_SECRET_KEY` | Tidak | Dicadangkan untuk operasi admin di masa depan. Belum dipakai kode saat ini |
| `LANGFLOW_URL` | Ya | Base URL server Langflow tanpa garis miring di akhir |
| `LANGFLOW_FLOW_ID` | Ya | ID flow yang dipakai aplikasi |
| `LANGFLOW_API_KEY` | Ya | API key endpoint Langflow |
| `LANGFLOW_INPUT_TYPE` | Tidak | Default `chat` |
| `LANGFLOW_OUTPUT_TYPE` | Tidak | Default `chat` |
| `NEXT_PUBLIC_SITE_URL` | Ya | URL publik aplikasi untuk callback Google OAuth |

Seluruh pembacaan database memakai publishable key dan operand RLS. Tidak ada
operation yang melewati RLS, sehingga secret key tidak diperlukan. Variabelnya
tetap dicadangkan di `.env.example` untuk kebutuhan admin di masa depan.

Aturan yang wajib dijaga:

- Hanya variabel berawalan `NEXT_PUBLIC_` yang sampai ke bundle browser.
- `SUPABASE_SECRET_KEY` tidak boleh diberi awalan `NEXT_PUBLIC_`.
- `SUPABASE_SECRET_KEY` tidak boleh diimpor di berkas bertanda `use client`.
- `LANGFLOW_API_KEY` hanya dibaca oleh route handler di sisi server melalui
  `lib/langflow.js`.

---

## Pengaturan Supabase

**Google OAuth.**

1. Buka Authentication, lalu Providers, lalu aktifkan Google.
2. Isi Client ID dan Client Secret dari Google Cloud Console.
3. Tambahkan Site URL, yaitu `NEXT_PUBLIC_SITE_URL`.
4. Tambahkan Redirect URL untuk callback:
   `http://localhost:3000/auth/callback`

**Realtime.**

Publication `supabase_realtime` sudah disiapkan oleh migration. Daftar tabelnya:

- `community_chats`
- `user_progress`
- `user_quests`
- `user_achievements`
- `daily_activity`

Publication tidak perlu disetel manual jika semua migration sudah diterapkan.

---

## Menerapkan Migration

Ada enam migration dan harus dijalankan berurutan karena saling bergantung.

| Urutan | Berkas | Isi |
| --- | --- | --- |
| 1 | `0001_init.sql` | Tabel `users` dan `community_chats`, trigger signup, RLS, RPC leaderboard |
| 2 | `0002_quiz_certification.sql` | Kolom sertifikasi, pembatasan kolom `users`, RPC `award_quiz_xp` |
| 3 | `0003_community_chat_realtime.sql` | RPC baca chat, Realtime untuk tabel chat |
| 4 | `0004_realtime_gamification_and_catalog.sql` | Tabel progress dan katalog, RPC gameplay, Realtime, seed data |
| 5 | `0005_achievements.sql` | Tabel achievement dan activity, RPC evaluasi quest, achievement, dan notification |
| 6 | `0006_chat_account_profiles.sql` | Nama dan avatar akun untuk riwayat serta pesan realtime di Community Chat |

Cara menjalankan:

1. Buka SQL Editor pada dashboard Supabase.
2. Tempel seluruh isi satu berkas, lalu jalankan.
3. Pastikan tidak ada error, lalu lanjutkan ke berkas berikutnya.

Berkas yang aman dijalankan ulang adalah `0005_achievements.sql`. Berkas itu
men-drop fungsi yang definisinya berubah sebelum membuatnya lagi, constraint `check_kind`
pada tabel `achievements` ditulis ulang eksplisit, dan seluruh policy memakai
`drop policy if exists`. Jalankan ulang berkas ini kalau SQL sebelumnya gagal di
tengah jalan.

`0002` dan `0004` tidak aman dijalankan ulang setelah `0005` sudah diterapkan.
Kedua berkas itu mendefinisikan `award_quiz_xp` dan `award_gameplay_xp` dengan
kolom return yang lebih sedikit, sedangkan `0005` menambah kolom achievements ke
keduanya. PostgreSQL menolak dengan `cannot change return type of existing
function`. Urutan yang benar tetap 0001 sampai 0005 sekali, lalu 0005 sendiri
sebagai perbaikan. Sekadar informasi, `0001` sampai `0003` aman dijalankan ulang
kembali karena fungsi yang mereka buat tidak diubah oleh berkas berikutnya.

Pemeriksaan setelah semua migration diterapkan:

```sql
-- Semua fungsi harus menghasilkan satu baris
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
order by proname;

-- Tabel yang harus ada
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- Publication Realtime
select tablename from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
```

Fungsi yang diharapkan ada: `award_gameplay_xp`, `award_quiz_xp`,
`get_chat_authors`, `get_chat_messages`, `get_leaderboard`, `get_quiz_history`,
`get_recent_activity`, `get_user_badges`, `handle_new_user`,
`mark_notifications_read`, `record_summary`, `reset_user_progress`,
`save_level_progress`, `set_updated_at`, `sync_achievements`, dan
`sync_daily_quests`.

---

## Struktur Proyek

```
app/
  api/
    quiz/        Menyimpan skor kuis dan memberikan XP
    summarize/   Meringkas PDF
    tutor/       Menghubungkan ke Langflow
  auth/callback/ Callback Google OAuth
  community/    Halaman komunitas
  game/         Halaman permainan
  learn/        Peta jalan dan daftar materi
  other/        Profil dan pengaturan
  quests/       Quest, leaderboard, achievement
  quiz/         Kuis sertifikasi
  tutor/        AI tutor

components/
  AppShell.jsx      Kerangka aplikasi dan onboarding
  AuthModals.jsx    Login dan signup
  Header.jsx        Header, notifikasi, dropdown profil, mascot
  LearnGoLogo.jsx   Sumber tunggal aset brand
  Navigation.jsx    Sidebar dan navigasi mobile

context/
  AuthContext.jsx   Session, profil, display name
  GameContext.jsx   XP, level, nyawa, gems, progress, quest
  UIContext.jsx     Navigasi, toast, modal
  Providers.jsx     Penyusun provider

data/
  curriculum.js     Empat jalur, delapan bab, sepuluh lesson per jalur
  quiz.js           Sepuluh soal kuis

lib/
  langflow.js       Klien Langflow sisi server
  offTopic.js       Penjaga topik untuk AI tutor
  summary.js        Prompt dan parser ringkasan
  supabase/         Klien browser dan server
  useCatalog.js     Tabel katalog, achievement, kalender aktivitas
  useCommunityChat.js  Histori chat dan subscription Realtime
  useLeaderboard.js RPC leaderboard

screens/            Seluruh layar aplikasi

public/
  images/         Logo, mascot, dan wordmark LearnGo dalam format SVG
  learngo/        Berkas desain asli dari desainer

supabase/migrations/  Skema, RLS, RPC, dan seed data
```

### Aset brand

Aset di `public/images` adalah sumber gambar brand. Jangan menggambarnya ulang
di dalam komponen.

| Berkas | Dipakai di |
| --- | --- |
| `learngo-go-mark.png` | Simbol Go pada wordmark di sidebar dan modal autentikasi |
| `logo-learngo.svg` | `LearnGoIcon`, avatar header, favicon, dan ikon PWA |
| `text-learngo.svg` | `LearnGoLogoFull` untuk layar onboarding |
| `mascot-laerngo.svg` | `FoxMascot` di Header, Lesson, Other, Quests, Quiz, dan AuthModals |

Path aset dan rasio viewBox-nya diekspor sebagai `BRAND_ASSETS` dan
`BRAND_RATIO` dari `components/LearnGoLogo.jsx`. Komponen lain mengimpor dari
sana, bukan menulis path sendiri, supaya penggantian aset cukup di satu tempat.

SVG dan PNG dirender dengan `<img>` biasa, bukan `next/image`. Aset brand lokal
ini tidak membutuhkan optimasi gambar. PNG simbol Go memakai rasio intrinsiknya
agar ukurannya proporsional di sidebar dan modal autentikasi. Aturan lint
`no-img-element` dimatikan untuk komponen yang memakai aset tersebut, lewat
`eslint.config.mjs`.

Aset ini diekspor sebagai satu gambar per konsep, sehingga mascot hanya punya
satu ekspresi. Kalau ekspresi per status dibutuhkan lagi, ekspor berkas terpisah
dari desain, satu per ekspresi.

---

## Model Gamifikasi

### XP dan level

`users.xp` adalah total kumulatif, bukan sisa XP di level berjalan.
`users.xp_to_next` adalah ambang total untuk naik ke level berikutnya.

Contoh dengan level 5 dan ambang 600:

- Total 450 XP berarti level 5, 75 persen menuju level 6.
- Total 600 XP memicu level 6, dan ambang berikutnya menjadi 780.
- Sisa XP adalah `xp_to_next - xp`.

Perhitungan ambang terjadi di server di dalam RPC `award_gameplay_xp` dan
`award_quiz_xp`, dengan pengulangan naik level bila satu aksi menembus beberapa
ambang sekaligus.

Kolom `users` tidak bisa ditulis langsung oleh client. Hak `update` dicabut di
level tabel lalu diberikan kembali hanya untuk kolom `name`, `username`,
`avatar_url`, `socratic_mode`, dan `active_lang`. Semua angka gamifikasi hanya
bisa berubah lewat RPC.

`award_gameplay_xp` tetap menerima nilai XP dari client karena dipanggil dari
beberapa tempat, tapi nilainya di-clamp 500 per pemanggilan. Tanpa clamp,
`award_gameplay_xp(xp_gain => 999999)` akan menaikkan level berkali-kali dalam
satu request.

### Quest harian

Quest tidak diselesaikan dengan menekan tombol. Fungsi `sync_daily_quests`
menilai tiap quest dari data yang sudah tercatat:

| Quest | Syarat |
| --- | --- |
| `finish_lesson` | Minimal satu lesson selesai |
| `perfect_quiz` | Skor kuis 10 dari 10 |
| `chat_community` | Minimal satu pesan di chat komunitas |
| `study_streak` | Belajar tiga hari berturut-turut |
| `all_languages` | Progress di dua jalur berbeda |

XP dibayar hanya saat baris quest benar-benar baru dibuat, jadi quest yang
sudah dibayar tidak dibayar lagi pada kunjungan berikutnya. Fungsi ini dipanggil
setelah lesson selesai, setelah kuis disimpan, setelah pesan chat terkirim, dan
setiap kali halaman Quests dibuka.

### Reset progres

Tombol Reset Progress memanggil RPC `reset_user_progress`. Fungsi itu menghapus
`user_progress`, `user_quests`, `user_achievements`, `daily_activity`, dan
`quiz_attempts`, lalu mengembalikan `users` ke kondisi akun yang baru daftar.

Versi sebelumnya menghapus dua tabel pertama dari client lalu memanggil
`award_gameplay_xp` dengan delta nol. Itu tidak berhasil: fungsi tersebut menambah
XP, sehingga delta nol menulis ulang angka yang sama, dan achievement, riwayat
kuis, serta kalender aktivitas tetap menampilkan data lama.

### Achievement

Definisi achievement berada di tabel `achievements`, sedangkan achievement yang
sudah tercapai tercatat di `user_achievements`. Fungsi `sync_achievements`
mengecek syarat dan hanya mengembalikan achievement yang baru terbuka, sehingga
notifikasi tidak pernah muncul dua kali.

| Slug | Syarat |
| --- | --- |
| `streak_master` | Streak 7 hari |
| `quick_learner` | Tiga quest harian selesai |
| `logic_pro` | Skor kuis 10 dari 10 |
| `bookworm` | Sepuluh dokumen diringkas |
| `top_rank` | Masuk lima besar leaderboard |
| `algorithm_ace` | Jalur DSA selesai |

### Kalender aktivitas

Tiap hari dengan XP yang benar-benar diperoleh tercatat di `daily_activity`.
Kalender pada halaman Quests membaca tabel ini, sehingga tidak lagi menampilkan
pola tujuh hari yang selalu sama.

### Dokumen yang diringkas

Route `/api/summarize` mencatat dokumen ke tabel `summaries` lewat RPC
`record_summary`. Client tidak punya hak insert langsung ke tabel itu, jadi
`filename` dan `page_count` selalu berasal dari pembacaan PDF di server. Record
dipakai achievement `bookworm` sebagai sumber satu-satunya. Kegagalan mencatat
tidak membatalkan ringkasan, hanya membuat satu achievement belum terbuka.

---

## Skema Database

**Tabel profil dan aktivitas**

| Tabel | Isi |
| --- | --- |
| `users` | Satu baris per akun, dibuat otomatis oleh trigger signup |
| `user_progress` | Indeks lesson yang selesai per jalur |
| `user_quests` | Quest harian yang selesai, dengan kunci yang mengandung tanggal |
| `daily_activity` | XP yang diperoleh per hari |
| `quiz_attempts` | Riwayat skor kuis |
| `summaries` | Dokumen yang sudah diringkas |

**Tabel katalog**

| Tabel | Isi |
| --- | --- |
| `quests` | Definisi quest harian |
| `achievements` | Definisi achievement |
| `user_achievements` | Achievement yang sudah dicapai |
| `notifications` | Notifikasi broadcast dan pribadi |
| `study_rooms` | Ruang belajar |
| `mentors` | Mentor yang tersedia |
| `industry_skills` | Persentase permintaan skill |
| `partners` | Perusahaan partner |
| `community_chats` | Pesan chat |

**Kebijakan RLS yang perlu diketahui**

- `users` hanya bisa dibaca baris sendiri.
- `community_chats` bisa dibaca semua user login, ditulis hanya baris sendiri.
- Tabel katalog dibaca semua user login dan tidak ditulis client.
- `notifications` hanya menampilkan baris broadcast dan baris milik sendiri.
  Client hanya mendapat hak select. Menandai terbaca memakai RPC
  `mark_notifications_read`, yang menambah id user ke `read_by` tanpa menimpa
  id milik user lain. Memberi hak update langsung di tabel akan membuat setiap
  user bisa menghapus penanda user lain pada notifikasi yang sama.
- `summaries` hanya milik sendiri dan hanya bisa ditambah lewat RPC.
- `user_progress`, `user_quests`, `user_achievements`, dan `daily_activity`
  hanya milik sendiri.

---

## API Routes

Semua route memverifikasi session Supabase di sisi server dan mengembalikan 401
bila belum login.

| Route | Fungsi | Catatan |
| --- | --- | --- |
| `POST /api/quiz` | Menyimpan skor dan memberikan XP | Client mengirim index pilihan per soal. Skor dihitung ulang di server. |
| `POST /api/tutor` | Menghubungkan ke Langflow | Penjaga topik dijalankan sebelum permintaan. Kunci API tidak pernah sampai ke browser. |
| `POST /api/summarize` | Meringkas PDF | Ukuran unggahan dibatasi di server. Dokumen dicatat lewat RPC `record_summary`. |

Route kuis mengembalikan `achievements` berisi achievement yang baru terbuka,
sehingga layar dapat menampilkan notifikasi tanpa menebak badge mana yang baru
didapai.

Skor kuis tidak lagi memakai angka yang dikirim client. Client mengirim pilihan yang
diklik untuk setiap soal, dan route menghitungnya terhadap kunci di
`data/quiz.js`. Kunci itu sendiri masih ikut ter-bundle karena UI perlu
menandai jawaban benar dan salah, jadi ini menutup jalur `award_quiz_xp(10)`
bukan membuat kuis mustahil dikecahkan.

---

## Menjalankan Lint dan Build

```bash
npm run lint
npm run build
```

Keduanya harus dijalankan sebelum commit. Lint memakai ESLint 9 dengan
konfigurasi Next.js dan tidak menerima warning, termasuk peringatan
`react-hooks/exhaustive-deps`.