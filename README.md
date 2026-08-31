# NEXORA WhatsApp Bot v2.0.0

WhatsApp bot berbasis ESM dengan plugin loader, `serializer.js`, scheduler slot, AI content engine, image generator 1080x1080, state JSON, dan adapter Instagram opsional.

## Command

- `/menu`, `/menu help`
- `/status`
- `/ping`
- `/reload`
- `/nexora <query>`
- `/autoupload --ig on`
- `/autoupload --ig off`
- `/autoupload --ig now`
- `/autoupload --ig schedule`
- `/autoupload --ig slots`
- `/autoupload --ig login`

## Slot otomatis

Default: `09:00,13:00,19:00` timezone `Asia/Jakarta`.
Saat AutoUpload IG ON, scheduler membuat satu paket konten NEXORA per slot: topic → literasi → carousel 5 slide → gambar JPG → publish adapter.

## Instagram tanpa Facebook Graph API

v2 menyediakan adapter `instagram-private-api` 1.46.1 sehingga tidak membutuhkan Facebook access token. Library ini adalah private/unofficial client; dokumentasinya menunjukkan login username/password dan `publish.photo()` serta dukungan `publish.album()` untuk carousel. Karena private API dapat berubah atau terkena pembatasan Instagram, gunakan dengan akun yang memang kamu kelola dan siapkan kemungkinan login ulang/2FA. citeturn629641search0turn793246view0

## Kredensial

Jangan masukkan password Instagram ke source atau Git. Isi di `.env`:

```env
IG_USERNAME=xarvionex
IG_PASSWORD=
IG_AUTO_LOGIN=false
IG_SESSION_FILE=data/instagram-session.json
```

`.env`, session Instagram, auth WhatsApp, dan state runtime sudah masuk `.gitignore`.

## Dry run

Default `DRY_RUN=true`, jadi bot menghasilkan semua konten dan gambar tetapi tidak melakukan publish.

Untuk mengaktifkan publish setelah konfigurasi dan pengujian:

```env
DRY_RUN=false
```

## AI

Tanpa API key, bot menggunakan local fallback generator agar tetap berjalan. Untuk AI provider yang kompatibel dengan OpenAI Chat Completions:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=...
AI_MODEL=gpt-4o-mini
```

## Install

```bash
npm install
npm start
```

Node.js >= 20.
