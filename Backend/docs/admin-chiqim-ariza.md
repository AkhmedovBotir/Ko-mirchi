# Admin Chiqim Arizalari API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `admin` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/login`

## Statuslar (omborchi ham ko'radi)

| Kod | Ma'nosi |
|-----|---------|
| `pending` | Kutilmoqda |
| `reviewing` | Ko'rib chiqilmoqda |
| `accepted` | Qabul qilindi |
| `rejected` | Bekor qilindi |

Qabul qilinganda `actionTaken`: `updated` yoki `deleted`.

## Endpointlar

| Method | URL | Vazifa |
|--------|-----|--------|
| GET | `/api/admin-chiqim-arizalari` | Barcha arizalar |
| GET | `/api/admin-chiqim-arizalari/:id` | Bitta ariza |
| PATCH | `/api/admin-chiqim-arizalari/:id` | Status va amal |

### Filterlar (GET)

- `?status=pending`
- `?omborchiId=...`
- `?page=1&limit=20`

## PATCH — status yangilash

### Ko'rib chiqilmoqda

```json
{
  "status": "reviewing"
}
```

### Qabul qilish — tahrirlash

```json
{
  "status": "accepted",
  "action": "update",
  "data": {
    "product": "6637fc933be7fc44ddf8f43a",
    "truckNumber": "01 B 777 XX",
    "omborId": "6637fc933be7fc44ddf8f999",
    "recipientOmborId": "6637fc933be7fc44ddf8f43b",
    "grossWeight": 9800,
    "tareWeight": 3200,
    "notes": ""
  }
}
```

### Qabul qilish — o'chirish

```json
{
  "status": "accepted",
  "action": "delete"
}
```

### Rad etish

```json
{
  "status": "rejected",
  "rejectionReason": "Chiqim allaqachon qabul qilingan"
}
```

## Cheklovlar

- Faqat `pending` holatdagi chiqim tahrirlanadi yoki o'chiriladi
- Qabul qilingan transfer chiqimini o'chirish mumkin emas

## Xatoliklar

- `400` — noto'g'ri body yoki validation
- `401` — token yo'q
- `404` — ariza yoki chiqim topilmadi
- `409` — ariza allaqachon yakunlangan
