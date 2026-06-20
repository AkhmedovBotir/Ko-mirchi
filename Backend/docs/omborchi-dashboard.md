# Omborchi Dashboard API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/omborchi/login`

## Endpoint

- **Method:** `GET`
- **URL:** `/api/omborchi-dashboard`

Bitta so'rovda dashboard uchun barcha ko'rsatkichlar qaytadi.

## Javob tuzilmasi

### 1) `stock` — joriy qoldiq

| Maydon | Ma'nosi |
|--------|---------|
| `stock.overall` | Umumiy qoldiq (`kg`, `ton`) |
| `stock.byOmbor` | Har bir biriktirilgan ombor bo'yicha qoldiq |
| `stock.byProduct` | Maxsulot bo'yicha qoldiq (faqat qoldig'i > 0) |

Qoldiq formulasi: `kirim − chiqim` (chiqimda `rejected` hisobga olinmaydi).

### 2) `totals` — umumiy operatsiyalar

| Maydon | Ma'nosi |
|--------|---------|
| `totals.kirim` | Barcha kirimlar yig'indisi (`kg`, `ton`, `count`) |
| `totals.chiqim` | Barcha chiqimlar yig'indisi (`kg`, `ton`, `count`) |
| `totals.kelganlar.pending` | Sizning omboringizga kelayotgan — kutilmoqda |
| `totals.kelganlar.accepted` | Sizning omboringizga kelayotgan — qabul qilingan |

### 3) `chart` — grafik uchun vaqt qatorlari

Har bir davr uchun `kirim`, `chiqim`, `qabul` alohida (`kg`, `ton`, `count`):

| Kalit | Davr | Nuqtalar soni |
|-------|------|---------------|
| `kun` | Kunlik | Oxirgi 30 kun |
| `hafta` | Haftalik | Oxirgi 12 hafta |
| `oy` | Oylik | Oxirgi 12 oy |
| `yil` | Yillik | Oxirgi 5 yil |

`qabul` — sizning omboringizga qabul qilingan transferlar.

## Javob misoli (qisqartirilgan)

```json
{
  "success": true,
  "data": {
    "stock": {
      "overall": { "kg": 45200, "ton": 45.2 },
      "byOmbor": [
        {
          "ombor": { "_id": "...", "name": "Markaziy ombor" },
          "kg": 25000,
          "ton": 25
        }
      ],
      "byProduct": [
        {
          "product": { "_id": "...", "name": "Ko'mir", "origin": "Sharq" },
          "kg": 45200,
          "ton": 45.2
        }
      ]
    },
    "totals": {
      "kirim": { "kg": 120000, "ton": 120, "count": 45 },
      "chiqim": { "kg": 74800, "ton": 74.8, "count": 28 },
      "kelganlar": {
        "pending": { "kg": 8200, "ton": 8.2, "count": 2 },
        "accepted": { "kg": 15000, "ton": 15, "count": 4 }
      }
    },
    "chart": {
      "kun": [
        {
          "label": "2026-06-19",
          "kirim": { "kg": 5000, "ton": 5, "count": 2 },
          "chiqim": { "kg": 3200, "ton": 3.2, "count": 1 },
          "qabul": { "kg": 0, "ton": 0, "count": 0 }
        }
      ],
      "hafta": [],
      "oy": [],
      "yil": []
    }
  }
}
```

## Xatoliklar

- `401` — token yo'q yoki noto'g'ri
