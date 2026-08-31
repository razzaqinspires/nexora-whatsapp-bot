# NEXORA WhatsApp Bot v3.0.0

Bot WhatsApp modular berbasis ESM + `@whiskeysockets/baileys`, dengan plugin loader, serializer, scheduler konten NEXORA, AutoUpload Instagram private adapter, serta lapisan keamanan.

## 1. Install

```bash
npm install
cp .env.example .env
npm start
```

Node.js: **20+**.

## 2. Pilih metode membuat session WhatsApp

Di `.env`:

```env
AUTH_MODE=qr
```

Bot akan menampilkan QR di terminal saat session belum terdaftar. QR dirender dari event `connection.update`.

Atau:

```env
AUTH_MODE=pairing
PAIRING_PHONE=62812xxxxxxxx
```

Nomor harus format internasional berupa angka saja, tanpa `+`, spasi, atau tanda hubung. Bot akan menampilkan pairing code di terminal.

Baileys mendukung kedua alur ini; `requestPairingCode()` dipakai hanya ketika kredensial belum terdaftar. citeturn318606search0turn318606search2

**Jangan menjalankan dua proses bot menggunakan folder session yang sama.** Ada laporan masalah pada concurrent pairing state di Baileys rc14, sehingga pairing dibuat serial dan hanya satu socket memakai satu auth state. citeturn318606search6

## 3. Security

Disarankan isi:

```env
OWNER_JIDS=62812xxxx@s.whatsapp.net
ALLOW_GROUPS=true
ALLOW_PRIVATE=true
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX=8
COMMAND_COOLDOWN_MS=1200
BLOCKED_JIDS=
AUDIT_LOG=true
```

`/reload`, `/security`, dan kontrol AutoUpload hanya bisa dijalankan owner.

Jika `OWNER_JIDS` kosong, command owner-only **tidak boleh digunakan**. Ini sengaja dibuat fail-closed.

## 4. Command

```text
/menu
/menu help
/ping
/status
/security
/reload
/nexora <query>
/autoupload --ig on
/autoupload --ig off
/autoupload --ig now
/autoupload --ig slots
/autoupload --ig schedule
/autoupload --ig login
```

## 5. AutoUpload NEXORA

```text
/autoupload --ig on
```

Scheduler membuat konten berdasarkan slot:

```env
NEXORA_SLOTS=09:00,13:00,19:00
NEXORA_TIMEZONE=Asia/Jakarta
MAX_DAILY_POSTS=3
```

Alurnya:

**literasi → content JSON → slide 1:1 → caption → hashtags → publish**.

Setiap konten mempunyai `literacyId` unik untuk tracking.

`DRY_RUN=true` adalah default agar tidak langsung publish.

## 6. Instagram

V3 sengaja **tidak membutuhkan Facebook Graph API**. Adapter memakai `instagram-private-api`.

Konfigurasi:

```env
IG_USERNAME=
IG_PASSWORD=
IG_SESSION_FILE=./data/instagram-session.json
IG_AUTO_LOGIN=false
DRY_RUN=true
```

Password tidak disimpan di source/ZIP. Session Instagram disimpan di file yang masuk `.gitignore`.

Private API bersifat unofficial, sehingga dapat berubah mengikuti sisi Instagram.

## 7. Struktur

```text
nexora-whatsapp-bot-v3/
├── src.js
├── serializer.js
├── .env.example
├── plugins/
│   ├── menu.js
│   ├── status.js
│   ├── ping.js
│   ├── reload.js
│   ├── security.js
│   ├── nexora.js
│   └── autoupload.js
├── services/
│   ├── ai.js
│   ├── content.js
│   ├── instagram.js
│   ├── media.js
│   └── scheduler.js
├── lib/
│   ├── config.js
│   ├── parser.js
│   ├── plugin-loader.js
│   ├── security.js
│   └── state.js
├── data/
├── media/
├── logs/
└── session/
```

## 8. Catatan Baileys

V3 mempertahankan `@whiskeysockets/baileys@7.0.0-rc14`. Ada issue rc14 terbaru terkait reconnect/session behavior dan pairing state, jadi untuk production sebaiknya pin versi dan melakukan test sebelum upgrade. citeturn318606search5turn318606search6turn318606search8
