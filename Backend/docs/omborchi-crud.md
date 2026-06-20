# Omborchi CRUD API Docs

Base URL: `http://localhost:5000`

## Talab

Quyidagi endpointlar faqat `general` admin uchun ochiq.

- Header: `Authorization: Bearer JWT_TOKEN`

## Omborchi modeli

- `firstName` (string, required)
- `lastName` (string, required)
- `phone` (string, required)
- `username` (string, required, unique)
- `password` (string, required, min 6, hash bo'lib saqlanadi)
- `ombors` (ObjectId[], ixtiyoriy) — bir nechta `Ombor`ga bog'lanadi

## CRUD Endpointlar

### 1) Omborchi yaratish

- **Method:** `POST`
- **URL:** `/api/omborchilar`
- **Body:**

```json
{
  "firstName": "Jasur",
  "lastName": "Toshpo'latov",
  "phone": "+998901234567",
  "username": "jasur01",
  "password": "123456"
}
```

### 2) Barcha omborchilarni olish

- **Method:** `GET`
- **URL:** `/api/omborchilar`

### 3) Bitta omborchini olish

- **Method:** `GET`
- **URL:** `/api/omborchilar/:id`

### 4) Omborchini yangilash

- **Method:** `PATCH`
- **URL:** `/api/omborchilar/:id`
- **Body (ixtiyoriy fieldlar):**

```json
{
  "firstName": "Jasur",
  "lastName": "Karimov",
  "phone": "+998909999999",
  "username": "jasur02",
  "password": "654321"
}
```

### 5) Omborchini o'chirish

- **Method:** `DELETE`
- **URL:** `/api/omborchilar/:id`

## Alohida PATCH endpointlar (omborga biriktirish/ajratish)

### 6) Omborga biriktirish

Bitta omborchiga bir nechta ombor biriktirish mumkin.

- **Method:** `PATCH`
- **URL:** `/api/omborchilar/:id/attach-ombor`
- **Body:**

```json
{
  "omborId": "6637fc933be7fc44ddf8f43a"
}
```

Agar ombor allaqachon biriktirilgan bo'lsa `409` qaytariladi.

### 7) Ombordan olib tashlash

- **Method:** `PATCH`
- **URL:** `/api/omborchilar/:id/detach-ombor`
- **Body:**

```json
{
  "omborId": "6637fc933be7fc44ddf8f43a"
}
```

## Xatoliklar

- `400` - majburiy maydon yuborilmagan
- `401` - token noto'g'ri yoki yuborilmagan
- `403` - faqat `general` ruxsatga ega
- `404` - `Omborchi not found` yoki `Ombor not found`
- `409` - `Username already exists` yoki `Ombor already attached to this omborchi`
