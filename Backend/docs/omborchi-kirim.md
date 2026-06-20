# Omborchi Kirim API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- `JWT_TOKEN` ni `/api/auth/omborchi/login` orqali oling

## Kirim logikasi

Omborchi mashinani avval yuk bilan tortadi (`grossWeight`), keyin yuk tushirilgandan keyin bo'sh holatda tortadi (`tareWeight`).

Mahsulot sof og'irligi avtomatik hisoblanadi:

- `netWeight = grossWeight - tareWeight`

Kirim yaratishda **qaysi ombor** ekanligi `omborId` orqali belgilanadi (faqat omborchiga biriktirilgan omborlardan).

Kirimni tahrirlash va o'chirish omborchi uchun yo'q. Muammo bo'lsa `/api/omborchi-kirim-arizalari` orqali admin uchun ariza qoldiriladi (batafsil: `omborchi-kirim-ariza.md`).

## Model maydonlari

- `omborId` (ObjectId, required) — qaysi omborga kirim qilinayotgani (faqat biriktirilgan omborlardan)
- `product` (ObjectId, required) - maxsulot ID
- `truckNumber` (string, required) - mashina raqami (format erkin)
- `grossWeight` (number, required) - yuk bilan og'irlik
- `tareWeight` (number, required) - bo'sh mashina og'irligi
- `netWeight` (number, auto-calculated) - sof mahsulot og'irligi
- `weightUnit` (string, auto) - doim `kg` saqlanadi

## Endpointlar

### 1) Omborlar ro'yxati (tanlash uchun)

- **Method:** `GET`
- **URL:** `/api/omborchi-kirimlar/ombors`

### 2) Maxsulotlar ro'yxati (tanlash uchun)

- **Method:** `GET`
- **URL:** `/api/omborchi-kirimlar/products`

### 3) Omborchi kirim yaratish

- **Method:** `POST`
- **URL:** `/api/omborchi-kirimlar`
- **Body:**

```json
{
  "omborId": "6637fc933be7fc44ddf8f999",
  "product": "6637fc933be7fc44ddf8f43a",
  "truckNumber": "01 A 123 BC",
  "grossWeight": 12500,
  "tareWeight": 4300
}
```

- **Success Response (misol):**

```json
{
  "success": true,
  "data": {
    "_id": "6637fc933be7fc44ddf8f888",
    "omborchi": {
      "_id": "6637fc933be7fc44ddf8f111",
      "firstName": "Jasur",
      "lastName": "Toshpo'latov",
      "username": "jasur01"
    },
    "ombor": {
      "_id": "6637fc933be7fc44ddf8f999",
      "name": "Markaziy ombor"
    },
    "product": {
      "_id": "6637fc933be7fc44ddf8f43a",
      "name": "Olma",
      "origin": "Namangan"
    },
    "truckNumber": "01 A 123 BC",
    "grossWeight": 12500,
    "tareWeight": 4300,
    "netWeight": 8200,
    "weightUnit": "kg",
    "createdAt": "2026-05-07T12:00:00.000Z",
    "updatedAt": "2026-05-07T12:00:00.000Z"
  }
}
```

### 3) O'z kirimlari ro'yxati

- **Method:** `GET`
- **URL:** `/api/omborchi-kirimlar/my`

## Xatoliklar

- `400` - `product, truckNumber, grossWeight, tareWeight, omborId are required`
- `400` - `grossWeight and tareWeight must be valid numbers`
- `400` - `grossWeight and tareWeight must be greater than or equal to 0`
- `400` - `grossWeight must be greater than tareWeight`
- `401` - token noto'g'ri yoki yuborilmagan
- `404` - `Maxsulot not found`
