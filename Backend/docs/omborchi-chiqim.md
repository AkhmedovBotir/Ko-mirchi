# Omborchi Chiqim API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/omborchi/login`

## Kirimdan farqi

- Alohida model va kollektsiya (`OmborchiChiqim`)
- Har bir chiqimda **manzil ombor** tanlanadi: `recipientOmborId` (majburiy, ObjectId)
- Manba ombor: `omborId` — qaysi ombordan chiqim qilinayotgani
- Manba va manzil ombori bir xil bo'lishi mumkin emas
- Ixtiyoriy eslatma: `notes`
- Yuborilgandan keyin manzil omboriga biriktirilgan omborchilar `/api/omborchi-kelayotgan-kirimlar` orqali qabul yoki bekor qiladi
- Chiqimni tahrirlash va o'chirish omborchi uchun yo'q. Muammo bo'lsa `/api/omborchi-chiqim-arizalari` orqali admin uchun ariza qoldiriladi (batafsil: `omborchi-chiqim-ariza.md`)

Og'irlik hisobi kirim bilan bir xil mantiqda: mashina yuk bilan (`grossWeight`), keyin bo'sh (`tareWeight`), netto:

- `netWeight = grossWeight - tareWeight`
- `weightUnit` har doim `kg`

## Chiqim yaratish tartibi

1. Manba ombor tanlash — `GET /api/omborchi-chiqimlar/ombors`
2. Tanlangan ombordagi maxsulotlar — `GET /api/omborchi-chiqimlar/ombors/:omborId/products` (faqat qoldig'i bor maxsulotlar)
3. Manzil ombor tanlash — `GET /api/omborchi-chiqimlar/recipient-ombors?sourceOmborId=...`
4. Chiqim yaratish — `POST /api/omborchi-chiqimlar`

## Model maydonlari

- `product` (ObjectId, required)
- `truckNumber` (string, required)
- `recipientOmborId` (ObjectId, required) — manzil ombor
- `omborId` (ObjectId, required) — manba ombor (faqat biriktirilgan omborlardan)
- `status` — `pending` | `accepted` | `rejected` (default: `pending`)
- `linkedKirim` — qabul qilinganda yaratilgan kirim (faqat `accepted` holatda)
- `grossWeight`, `tareWeight`, `netWeight` (number)
- `weightUnit` — doim `kg`
- `notes` (string, ixtiyoriy)

## Endpointlar

### 1) Manba omborlar ro'yxati

Birinchi qadam: qaysi ombordan chiqim qilinishini tanlash.

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqimlar/ombors`

### 2) Ombordagi maxsulotlar

Ikkinchi qadam: tanlangan ombor ichidagi maxsulotlar (faqat qoldig'i > 0 bo'lganlari).

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqimlar/ombors/:omborId/products`

**Javob misoli:**

```json
{
  "success": true,
  "data": [
    {
      "product": {
        "_id": "6637fc933be7fc44ddf8f43a",
        "name": "Ko'mir",
        "origin": "Sharq"
      },
      "balance": {
        "kg": 12500,
        "ton": 12.5
      }
    }
  ]
}
```

### 3) Manzil omborlar ro'yxati

Uchinchi qadam: chiqim yuboriladigan omborlar. `sourceOmborId` berilsa, manba ombor ro'yxatdan chiqariladi.

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqimlar/recipient-ombors`
- **Query (ixtiyoriy):** `?sourceOmborId=6637fc933be7fc44ddf8f999`

### 4) Chiqim yaratish

- **Method:** `POST`
- **URL:** `/api/omborchi-chiqimlar`
- **Body:**

```json
{
  "product": "6637fc933be7fc44ddf8f43a",
  "truckNumber": "01 B 777 XX",
  "recipientOmborId": "6637fc933be7fc44ddf8f43b",
  "omborId": "6637fc933be7fc44ddf8f999",
  "grossWeight": 9800,
  "tareWeight": 3200,
  "notes": "Shtab chiqishi"
}
```

### 5) O'z chiqimlari ro'yxati

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqimlar`

### 6) Bitta chiqim

- **Method:** `GET`
- **URL:** `/api/omborchi-chiqimlar/:id`

## Xatoliklar

- `400` — majburiy maydonlar, og'irlik tekshiruvlari (`grossWeight must be greater than tareWeight`), `Cannot send to the same ombor`, `This product is not available in the selected ombor`, `Insufficient stock in ombor`
- `401` — token yo'q yoki noto'g'ri
- `404` — `Maxsulot not found`, `Recipient ombor not found`, `Chiqim not found` (boshqa omborchining yozuviga `:id` berilsa ham topilmaydi)
