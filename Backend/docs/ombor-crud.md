# Ombor CRUD API Docs

Base URL: `http://localhost:5000`

## Talab

Ushbu endpointlar uchun login qilingan bo'lishi kerak.

- Header: `Authorization: Bearer JWT_TOKEN`

## Ombor modeli

- `name` (string, required, unique) - ombor nomi

## Endpointlar

### 1) Ombor yaratish

- **Method:** `POST`
- **URL:** `/api/omborlar`
- **Headers:** `Authorization: Bearer JWT_TOKEN`
- **Body:**

```json
{
  "name": "Asosiy ombor"
}
```

- **Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "6637fc933be7fc44ddf8f43a",
    "name": "Asosiy ombor",
    "createdAt": "2026-05-05T14:00:00.000Z",
    "updatedAt": "2026-05-05T14:00:00.000Z"
  }
}
```

### 2) Barcha omborlarni olish

- **Method:** `GET`
- **URL:** `/api/omborlar`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

### 3) Bitta omborni olish

- **Method:** `GET`
- **URL:** `/api/omborlar/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

### 4) Omborni yangilash

- **Method:** `PATCH`
- **URL:** `/api/omborlar/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`
- **Body:**

```json
{
  "name": "Yangi ombor nomi"
}
```

### 5) Omborni o'chirish

- **Method:** `DELETE`
- **URL:** `/api/omborlar/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

## Xatoliklar

- `400` - `name is required`
- `401` - token noto'g'ri yoki yuborilmagan
- `404` - `Ombor not found`
- `409` - `Ombor name already exists`
