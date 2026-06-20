# Admin Dashboard API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `admin` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/login`

## Endpoint

- **Method:** `GET`
- **URL:** `/api/admin-dashboard`

Omborchi dashboarddan kuchliroq — butun tizim bo'yicha ko'rsatkichlar, filterlar, arizalar va TOP ro'yxatlar.

## Filterlar (ixtiyoriy)

| Parametr | Izoh |
|----------|------|
| `omborId` | Faqat shu ombor bo'yicha |
| `omborchiId` | Faqat shu omborchi bo'yicha |
| `productId` | Faqat shu maxsulot bo'yicha |

Misol:
```
GET /api/admin-dashboard?omborId=6637fc933be7fc44ddf8f999
```

## Javob tuzilmasi

### 1) `overview` — umumiy sonlar

- `omborchilar` — jami omborchilar
- `omborlar` — jami omborlar
- `maxsulotlar` — jami maxsulotlar
- `omborchilarWithOmbor` — omborga biriktirilgan omborchilar

### 2) `stock` — qoldiq (butun tizim)

| Maydon | Ma'nosi |
|--------|---------|
| `stock.overall` | Umumiy qoldiq (`kg`, `ton`) |
| `stock.byOmbor` | Ombor bo'yicha |
| `stock.byProduct` | Maxsulot bo'yicha |
| `stock.byOmborchi` | Omborchi bo'yicha |

### 3) `totals` — operatsiyalar

| Maydon | Ma'nosi |
|--------|---------|
| `totals.kirim` | Barcha kirimlar |
| `totals.directKirim` | To'g'ridan-to'g'ri kirimlar (transfer emas) |
| `totals.chiqim` | Chiqimlar (`rejected` dan tashqari) |
| `totals.transferlar.pending` | Kutilayotgan transferlar |
| `totals.transferlar.accepted` | Qabul qilingan transferlar |
| `totals.transferlar.rejected` | Rad etilgan transferlar |

### 4) `arizalar` — omborchi arizalari

```json
{
  "kirim": { "pending": 2, "reviewing": 1, "accepted": 5, "rejected": 1 },
  "chiqim": { "pending": 0, "reviewing": 1, "accepted": 3, "rejected": 0 },
  "attention": {
    "total": 4,
    "pending": 2,
    "reviewing": 2
  }
}
```

`attention` — admin ko'rib chiqishi kerak bo'lgan faol arizalar.

### 5) `top` — eng ko'p qoldiq

- `top.omborlar` — TOP 10 ombor
- `top.omborchilar` — TOP 10 omborchi

### 6) `chart` — grafik (kun / hafta / oy / yil)

Har bir nuqtada `kirim`, `chiqim`, `qabul` (`kg`, `ton`, `count`):

| Kalit | Davr |
|-------|------|
| `kun` | Oxirgi 30 kun |
| `hafta` | Oxirgi 12 hafta |
| `oy` | Oxirgi 12 oy |
| `yil` | Oxirgi 5 yil |

## Omborchi dashboarddan farqi

| Imkoniyat | Omborchi | Admin |
|-----------|----------|-------|
| Faqat o'z ma'lumotlari | ✅ | ❌ (butun tizim) |
| Omborchi bo'yicha qoldiq | ❌ | ✅ |
| Arizalar statistikasi | ❌ | ✅ |
| Transfer holatlari | qisman | to'liq |
| Filter (ombor/omborchi/maxsulot) | ❌ | ✅ |
| TOP ombor/omborchi | ❌ | ✅ |
| Tizim overview | ❌ | ✅ |

## Xatoliklar

- `400` — noto'g'ri filter
- `401` — token yo'q yoki noto'g'ri
