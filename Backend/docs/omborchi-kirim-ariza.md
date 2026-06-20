# Omborchi Kirim Arizalari API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`

## Mantiq

Omborchi kirimni o'zi tahrirlay olmaydi va o'chira olmaydi.
Muammo bo'lsa, admin uchun **ariza** qoldiradi.

## Statuslar

| Kod | Ma'nosi |
|-----|---------|
| `pending` | Kutilmoqda |
| `reviewing` | Ko'rib chiqilmoqda |
| `accepted` | Qabul qilindi |
| `rejected` | Bekor qilindi (`rejectionReason` bilan) |

Bitta kirim uchun faqat bitta faol ariza bo'lishi mumkin (`pending` yoki `reviewing`).

Admin arizani ko'rib chiqadi va status yangilaydi — batafsil: `admin-kirim-ariza.md`.

Qabul qilinganda javobda qo'shimcha maydonlar: `actionTaken` (`updated` | `deleted`), `processedBy`, `processedAt`, `rejectionReason`.

## Endpointlar

### 1) Ariza yuborish

- **Method:** `POST`
- **URL:** `/api/omborchi-kirim-arizalari`
- **Body:**

```json
{
  "kirimId": "6637fc933be7fc44ddf8f888",
  "note": "Og'irlik noto'g'ri kiritilgan, qayta ko'rib chiqilsin"
}
```

### 2) O'z arizalari ro'yxati

- **Method:** `GET`
- **URL:** `/api/omborchi-kirim-arizalari`
- **Query (ixtiyoriy):** `?status=pending`

### 3) Bitta ariza

- **Method:** `GET`
- **URL:** `/api/omborchi-kirim-arizalari/:id`

## Xatoliklar

- `400` — `kirimId and note are required`
- `401` — token yo'q yoki noto'g'ri
- `404` — `Kirim not found` yoki `Ariza not found`
- `409` — `This kirim already has an active application`
