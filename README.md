# NEXORA WhatsApp Bot v7.0.0

V7 melanjutkan V6 dengan serializer yang LID-aware, validasi owner/admin/premium yang lebih ketat, metadata grup, deteksi bot-admin, dan manual Instagram upload.

## Login WhatsApp

```env
AUTH_MODE=qr
```

atau:

```env
AUTH_MODE=pairing
PAIRING_PHONE=628xxxxxxxxxx
```

## Owner / LID

Jangan mengambil nomor telepon dari angka sebelum `@lid`. LID adalah identifier opaque. V7 membaca kandidat identitas dari:

- private chat: `remoteJidPn`, `remoteJidAlt`, `remoteJid`
- group: `participantPn`, `participantAlt`, `participant`
- fallback LID tetap dipertahankan

Owner divalidasi terhadap seluruh kandidat tersebut.

## Access mode

```text
/mode public
/mode self
/mode status
```

PUBLIC: owner + user, pesan dari bot sendiri diblokir.
SELF: owner + bot sendiri, user biasa diblokir.

## Premium

```text
/premium status
/premium add 628xxxxxxxxxx
/premium del 628xxxxxxxxxx
/premium list
```

Owner otomatis premium. Premium juga mendapat rate limit lebih tinggi. Plugin dapat menggunakan `premiumOnly: true` tanpa mengubah router.

## Identitas dan grup

```text
/whoami
/groupinfo
```

Serializer menyediakan role, owner/admin/premium flags, PN/LID, status bot admin, status group admin, group owner, addressing mode, participant list, group restrictions, community metadata, dan flag `isNot*`.

## Manual Instagram upload

Reply gambar/video lalu:

```text
/upload
```

Atau kirim media dengan caption command:

```text
/upload Caption Instagram
```

Upload hanya owner. `DRY_RUN=true` adalah default.

## AutoUpload

```text
/autoupload --ig on
/autoupload --ig off
/autoupload --ig now
/autoupload --ig schedule
/autoupload --ig slots
/autoupload --ig login
/autoupload --ig status
```

Instagram memakai private API adapter, bukan Facebook Graph API. Private API dapat berubah dan memiliki risiko kompatibilitas/limit dari Instagram.

## Baileys v6/v7 LID

Baileys membedakan PN dan LID. Jangan menganggap `remoteJid` selalu nomor telepon. V7 menggunakan alternate PN fields bila tersedia dan metadata grup juga mempertahankan `ownerPn`, participant `phoneNumber`, serta `lid`.

## Safety

Jangan commit `.env`, folder `auth/`, session Instagram, `data/`, atau `logs/`.
