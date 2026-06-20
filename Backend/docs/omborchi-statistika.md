# Omborchi Statistika API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/omborchi/login`

## Umumiy

Har bir endpoint ro'yxat qaytaradi. Har bir yozuvda `type` maydoni bor:

- `kirim` — to'g'ridan-to'g'ri kirim
- `chiqim` — boshqa omborga yuborilgan chiqim
- `qabul` — boshqa omborchidan kelgan transfer (manzil omboringizga)

Faqat o'z ma'lumotlaringiz ko'rinadi. `omborId` filteri faqat sizga biriktirilgan omborlardan bo'lishi kerak.

## Endpointlar

| # | Method | URL | Ma'nosi |
|---|--------|-----|---------|
| 1 | GET | `/api/omborchi-statistika/all` | Barcha amallar |
| 2 | GET | `/api/omborchi-statistika/kirimlar` | Kirimlar |
| 3 | GET | `/api/omborchi-statistika/chiqimlar` | Chiqimlar |
| 4 | GET | `/api/omborchi-statistika/qabul-qilganlar` | Qabul qilingan transferlar |

## Filterlar (barcha endpointlar uchun)

| Parametr | Turi | Izoh |
|----------|------|------|
| `omborId` | ObjectId | Ombor bo'yicha (faqat biriktirilgan omborlar). Kirim/chiqimda manba ombor, qabulda manzil ombor |
| `recipientOmborId` | ObjectId | Chiqim manzil ombori |
| `senderOmborchiId` | ObjectId | Qabul uchun yuboruvchi omborchi |
| `productId` | ObjectId | Maxsulot bo'yicha |
| `status` | string | `pending`, `accepted`, `rejected` (chiqim/qabul) |
| `truckNumber` | string | Mashina raqami (qisman qidiruv) |
| `from` | ISO date | Boshlanish sanasi |
| `to` | ISO date | Tugash sanasi |
| `minNetWeight` | number | Minimal sof og'irlik (kg). `0` yuborilsa yoki `min=max=0` bo'lsa — filter qo'llanmaydi |
| `maxNetWeight` | number | Maksimal sof og'irlik (kg) |
| `minGrossWeight` | number | Minimal umumiy og'irlik (kg). `0` yuborilsa yoki `min=max=0` bo'lsa — filter qo'llanmaydi |
| `maxGrossWeight` | number | Maksimal umumiy og'irlik (kg) |
| `types` | string | Faqat `/all` uchun: `kirim,chiqim,qabul` |
| `sortBy` | string | `createdAt`, `updatedAt`, `netWeight`, `grossWeight`, `tareWeight` |
| `sortOrder` | string | `asc` yoki `desc` (default: `desc`) |
| `page` | number | Sahifa (default: `1`) |
| `limit` | number | Har sahifada (default: `20`, max: `100`) |
| `includeSummary` | boolean | Umumiy yig'indi (default: `true`) |

## Misol so'rovlar

### Oxirgi 7 kun, ma'lum ombor bo'yicha

```
GET /api/omborchi-statistika/all?from=2026-06-12&to=2026-06-19&omborId=6637fc933be7fc44ddf8f999
```

### Faqat chiqimlar — pending holatda

```
GET /api/omborchi-statistika/chiqimlar?status=pending&omborId=6637fc933be7fc44ddf8f999
```

### Qabul qilganlar — og'irlik oralig'i bilan

```
GET /api/omborchi-statistika/qabul-qilganlar?minNetWeight=5000&maxNetWeight=15000&sortBy=netWeight&sortOrder=desc
```

### Maxsulot va sana bo'yicha kirimlar

```
GET /api/omborchi-statistika/kirimlar?productId=6637fc933be7fc44ddf8f43a&from=2026-06-01&to=2026-06-30
```

## Javob formati

```json
{
  "success": true,
  "filters": {
    "types": ["kirim", "chiqim", "qabul"],
    "omborId": "6637fc933be7fc44ddf8f999",
    "from": "2026-06-12T00:00:00.000Z",
    "to": "2026-06-19T23:59:59.000Z",
    "status": null
  },
  "summary": {
    "totalCount": 15,
    "totalNetWeightKg": 125000,
    "totalGrossWeightKg": 180000,
    "totalNetWeightTon": 125,
    "byType": {
      "kirim": { "count": 8, "netWeightKg": 65000 },
      "chiqim": { "count": 5, "netWeightKg": 40000 },
      "qabul": { "count": 2, "netWeightKg": 20000 }
    }
  },
  "count": 15,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  },
  "data": [
    {
      "type": "chiqim",
      "id": "6637fc933be7fc44ddf8f888",
      "createdAt": "2026-06-19T10:00:00.000Z",
      "product": { "_id": "...", "name": "Ko'mir", "origin": "Namangan" },
      "ombor": { "_id": "...", "name": "Shimoliy ombor" },
      "truckNumber": "01 A 123 BC",
      "grossWeight": 12500,
      "tareWeight": 4300,
      "netWeight": 8200,
      "weightUnit": "kg",
      "recipientOmbor": { "_id": "...", "name": "Markaziy ombor" },
      "status": "pending",
      "notes": ""
    }
  ]
}
```

`qabul` turida qo'shimcha `sender` maydoni — yuboruvchi omborchi.

## Xatoliklar

- `400` — noto'g'ri filter (`from must be a valid ISO date`, `omborId is not assigned to you`, va hokazo)
- `401` — token yo'q yoki noto'g'ri
