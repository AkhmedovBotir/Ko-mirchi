# Maxsulot CRUD API Docs

Base URL: `http://localhost:5000`

## Talab

- `GET` endpointlar: login qilingan foydalanuvchi (`admin` yoki `general`)
- `POST`, `PATCH`, `DELETE`: faqat `general` admin
- Header: `Authorization: Bearer JWT_TOKEN`

## Maxsulot modeli

- `name` (string, required) - maxsulot nomi
- `origin` (string, required) - qayerniki ekanligi

## CRUD Endpointlar

### 1) Maxsulot yaratish

- **Method:** `POST`
- **URL:** `/api/maxsulotlar`
- **Body:**

```json
{
  "name": "Olma",
  "origin": "Namangan"
}
```

### 2) Barcha maxsulotlarni olish

- **Method:** `GET`
- **URL:** `/api/maxsulotlar`

### 3) Bitta maxsulotni olish

- **Method:** `GET`
- **URL:** `/api/maxsulotlar/:id`

### 4) Maxsulotni yangilash

- **Method:** `PATCH`
- **URL:** `/api/maxsulotlar/:id`
- **Body (ixtiyoriy fieldlar):**

```json
{
  "name": "Anor",
  "origin": "Quva"
}
```

### 5) Maxsulotni o'chirish

- **Method:** `DELETE`
- **URL:** `/api/maxsulotlar/:id`

## Xatoliklar

- `400` - `name and origin are required`
- `401` - token noto'g'ri yoki yuborilmagan
- `403` - faqat `general` admin ruxsatga ega
- `404` - `Maxsulot not found`
