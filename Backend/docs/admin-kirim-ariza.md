# Admin Kirim Arizalari API Docs

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
| GET | `/api/admin-kirim-arizalari` | Barcha arizalar |
| GET | `/api/admin-kirim-arizalari/:id` | Bitta ariza |
| PATCH | `/api/admin-kirim-arizalari/:id` | Status va amal |

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
    "truckNumber": "01 A 123 BC",
    "omborId": "6637fc933be7fc44ddf8f999",
    "grossWeight": 12500,
    "tareWeight": 4300
  }
}
```

`data` maydonlari ixtiyoriy — faqat o'zgartiriladiganlar yuboriladi.

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
  "rejectionReason": "Ma'lumotlar noto'g'ri, qayta kiriting"
}
```

## Cheklovlar

- Transfer kirim (`sourceChiqim` bor) tahrirlanmaydi va o'chirilmaydi
- Faqat `pending` yoki `reviewing` holatdagi ariza qayta ishlanadi

## Xatoliklar

- `400` — noto'g'ri body yoki validation
- `401` — token yo'q
- `404` — ariza yoki kirim topilmadi
- `409` — ariza allaqachon yakunlangan
