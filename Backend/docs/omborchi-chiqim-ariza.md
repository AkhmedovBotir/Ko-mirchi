# Omborchi Chiqim Arizalari API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`

## Mantiq

Omborchi chiqimni o'zi tahrirlay olmaydi va o'chira olmaydi.
Muammo bo'lsa, admin uchun **ariza** qoldiradi.

## Statuslar

| Kod | Ma'nosi |
|-----|---------|
| `pending` | Kutilmoqda |
| `reviewing` | Ko'rib chiqilmoqda |
| `accepted` | Qabul qilindi |
| `rejected` | Bekor qilindi (`rejectionReason` bilan) |

Bitta chiqim uchun faqat bitta faol ariza bo'lishi mumkin (`pending` yoki `reviewing`).

Admin arizani ko'rib chiqadi va status yangilaydi — batafsil: `admin-chiqim-ariza.md`.

Qabul qilinganda javobda qo'shimcha maydonlar: `actionTaken` (`updated` | `deleted`), `processedBy`, `processedAt`, `rejectionReason`.

## Endpointlar

### 1) Ariza yuborish

- **Method:** `POST`
- **URL:** `/api/omborchi-chiqim-arizalari`
- **Body:**

```json
{
  "chiqimId": "6637fc933be7fc44ddf8f888",
  "note": "Oluvchi noto'g'ri tanlangan, qayta ko'rib chiqilsin"
}
```

### 2) O'z arizalari ro'yxati

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqim-arizalari`
- **Query (ixtiyoriy):** `?status=pending`

### 3) Bitta ariza

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqim-arizalari/:id`

## Xatoliklar

- `400` — `chiqimId and note are required`
- `401` — token yo'q yoki noto'g'ri
- `404` — `Chiqim not found` yoki `Ariza not found`
- `409` — `This chiqim already has an active application`
