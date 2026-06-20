# Admin Statistika API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `admin` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/login`

## Endpointlar

| # | Method | URL | Ma'nosi |
|---|--------|-----|---------|
| 1 | GET | `/api/admin-statistika/all` | Barcha amallar |
| 2 | GET | `/api/admin-statistika/kirimlar` | Kirimlar |
| 3 | GET | `/api/admin-statistika/chiqimlar` | Chiqimlar |
| 4 | GET | `/api/admin-statistika/qabul-qilganlar` | Qabul qilingan transferlar |

## Filterlar (barcha endpointlar uchun)

| Parametr | Turi | Izoh |
|----------|------|------|
| `omborchiId` | ObjectId | Kirim egasi yoki chiqim yuboruvchisi |
| `senderOmborchiId` | ObjectId | Chiqim yuboruvchisi (chiqim/qabul) |
| `recipientOmborId` | ObjectId | Chiqim manzil ombori |
| `omborId` | ObjectId | Kirim/chiqimda manba ombor; qabul endpointida manzil ombor |
| `productId` | ObjectId | Maxsulot bo'yicha |
| `status` | string | `pending`, `accepted`, `rejected` |
| `truckNumber` | string | Mashina raqami (qisman qidiruv) |
| `from` | ISO date | Boshlanish sanasi |
| `to` | ISO date | Tugash sanasi |
| `minNetWeight` | number | Minimal sof og'irlik (kg). `min=max=0` bo'lsa filter qo'llanmaydi |
| `maxNetWeight` | number | Maksimal sof og'irlik (kg) |
| `minGrossWeight` | number | Minimal umumiy og'irlik (kg). `min=max=0` bo'lsa filter qo'llanmaydi |
| `maxGrossWeight` | number | Maksimal umumiy og'irlik (kg) |
| `types` | string | Faqat `/all` uchun: `kirim,chiqim,qabul` |
| `sortBy` | string | `createdAt`, `updatedAt`, `netWeight`, `grossWeight`, `tareWeight` |
| `sortOrder` | string | `asc` yoki `desc` (default: `desc`) |
| `page` | number | Sahifa (default: `1`) |
| `limit` | number | Har sahifada (default: `20`, max: `100`) |
| `includeSummary` | boolean | Umumiy yig'indi (default: `true`) |

## Misol so'rovlar

### Barcha amallar — oxirgi 7 kun, faqat kirim va chiqim

```
GET /api/admin-statistika/all?from=2026-06-12&to=2026-06-19&types=kirim,chiqim&page=1&limit=20
```

### Muayyan omborchi chiqimlari — pending holatda

```
GET /api/admin-statistika/chiqimlar?senderOmborchiId=6637fc933be7fc44ddf8f111&status=pending
```

### Qabul qilingan transferlar — og'irlik oralig'i bilan

```
GET /api/admin-statistika/qabul-qilganlar?minNetWeight=5000&maxNetWeight=15000&sortBy=netWeight&sortOrder=desc
```

### Mashina raqami bo'yicha qidiruv

```
GET /api/admin-statistika/all?truckNumber=01%20A%20123
```

## Javob formati

```json
{
  "success": true,
  "filters": {
    "types": ["kirim", "chiqim", "qabul"],
    "status": null,
    "from": "2026-06-12T00:00:00.000Z",
    "to": "2026-06-19T23:59:59.000Z"
  },
  "summary": {
    "totalCount": 48,
    "totalNetWeightKg": 125400,
    "totalGrossWeightKg": 180200,
    "totalNetWeightTon": 125.4,
    "byType": {
      "kirim": { "count": 20, "netWeightKg": 65000 },
      "chiqim": { "count": 18, "netWeightKg": 40400 },
      "qabul": { "count": 10, "netWeightKg": 20000 }
    }
  },
  "count": 20,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3
  },
  "data": [
    {
      "type": "chiqim",
      "id": "6637fc933be7fc44ddf8f888",
      "createdAt": "2026-06-19T10:00:00.000Z",
      "omborchi": { "_id": "...", "firstName": "Jasur", "lastName": "Aliyev" },
      "recipientOmbor": { "_id": "...", "name": "Markaziy ombor" },
      "product": { "_id": "...", "name": "Ko'mir", "origin": "Namangan" },
      "truckNumber": "01 A 123 BC",
      "grossWeight": 12500,
      "tareWeight": 4300,
      "netWeight": 8200,
      "weightUnit": "kg",
      "status": "accepted",
      "notes": ""
    }
  ]
}
```

## Eslatmalar

- `/all` — kirim, chiqim va qabul barchasi ko'rinadi (default)
- `/kirimlar`, `/chiqimlar`, `/qabul-qilganlar` — faqat o'sha turdagi yozuvlar, `summary` ham shu tur bo'yicha
- `/qabul-qilganlar` default holatda faqat `status=accepted` yozuvlarni qaytaradi
- `omborchiId` + `/qabul-qilganlar` berilsa, omborchi biriktirilgan omborlar **manzil** sifatida qidiriladi
- Frontend `minNetWeight=0&maxNetWeight=0` yuborsa, filter e'tiborsiz qoldiriladi (bo'sh ro'yxat qaytmasligi uchun)

## Xatoliklar

- `400` — noto'g'ri filter parametrlari
- `401` — token yo'q yoki noto'g'ri

## Excel export

Statistikani Excel faylga yuklab olish uchun 3 qadamli jarayon.

### 1) So'rov yuborish

- **Method:** `POST`
- **URL:** `/api/admin-statistika/export`
- **Body:**

```json
{
  "scope": "all",
  "filters": {
    "from": "2026-06-01",
    "to": "2026-06-19",
    "status": "accepted"
  }
}
```

`scope`: `all` | `kirimlar` | `chiqimlar` | `qabul-qilganlar`

Filterlar statistika endpointlari bilan bir xil. Query string orqali ham yuborish mumkin.

**Javob (202):**

```json
{
  "success": true,
  "message": "Export so'rovi qabul qilindi",
  "data": {
    "jobId": "...",
    "status": "pending",
    "scope": "all",
    "statusUrl": "/api/admin-statistika/export/...",
    "downloadUrl": "/api/admin-statistika/export/.../download"
  }
}
```

### 2) Holatni tekshirish (kutish)

- **Method:** `GET`
- **URL:** `/api/admin-statistika/export/:jobId`

`status`: `pending` → `processing` → `completed` | `failed`

`ready: true` bo'lganda yuklab olish mumkin.

### 3) Yuklab olish

- **Method:** `GET`
- **URL:** `/api/admin-statistika/export/:jobId/download`

Tayyor bo'lmaganda `409`, xato bo'lsa `422` qaytariladi.

Fayl 24 soat saqlanadi, keyin avtomatik o'chiriladi.

Excel fayl tuzilishi:
- Yuqori qism: sarlavha (`OMBOR STATISTIKASI`)
- Filterlar bloki: hisobot turi, export sanasi, sana oralig'i, omborchi, ombor, maxsulot va boshqa filterlar
- Jadval: ma'lumotlar ustunlari
- Pastki qism: jami yozuvlar soni va jami sof og'irlik
