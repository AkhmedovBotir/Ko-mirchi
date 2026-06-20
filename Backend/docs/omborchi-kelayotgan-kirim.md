# Omborchi Kelayotgan Kirimlar API Docs



Base URL: `http://localhost:5000`



## Talab



- Faqat login qilgan `omborchi` uchun ochiq

- Header: `Authorization: Bearer JWT_TOKEN`

- Token: `/api/auth/omborchi/login`



## Mantiq



Boshqa omborchi sizga biriktirilgan omborga chiqim yuborganida, u sizning **kelayotgan kirimlar** ro'yxatingizda paydo bo'ladi.



- `pending` — kutilmoqda (qabul yoki bekor qilish mumkin)

- `accepted` — qabul qilingan (avtomatik `OmborchiKirim` yaratiladi)

- `rejected` — bekor qilingan



Faqat `pending` holatdagi kirimni qabul yoki bekor qilish mumkin.



Qabul qilishda kirim avtomatik chiqimda ko'rsatilgan **manzil ombor**ga (`recipientOmbor`) yoziladi. Qo'shimcha `omborId` yuborish shart emas.



## Endpointlar



### 1) Kelayotgan kirimlar ro'yxati



- **Method:** `GET`

- **URL:** `/api/omborchi-kelayotgan-kirimlar`

- **Query (ixtiyoriy):** `?status=pending` | `accepted` | `rejected`



### 2) Bitta kelayotgan kirim



- **Method:** `GET`

- **URL:** `/api/omborchi-kelayotgan-kirimlar/:id`



### 3) Qabul qilish



- **Method:** `POST`

- **URL:** `/api/omborchi-kelayotgan-kirimlar/:id/qabul`

- **Body:** bo'sh yoki `{}`



### 4) Bekor qilish



- **Method:** `POST`

- **URL:** `/api/omborchi-kelayotgan-kirimlar/:id/bekor`



## Javob maydonlari (asosiy)



Har bir yozuv `OmborchiChiqim` obyekti:



- `omborchi` — yuboruvchi omborchi

- `ombor` — manba ombor

- `recipientOmbor` — manzil ombor

- `product`, `truckNumber`, `grossWeight`, `tareWeight`, `netWeight`

- `status` — `pending` | `accepted` | `rejected`

- `linkedKirim` — qabul qilinganda yaratilgan kirim (accepted bo'lganda)



## Xatoliklar



- `400` — noto'g'ri `status` query parametri, manzil ombor sizga biriktirilmagan

- `401` — token yo'q yoki noto'g'ri

- `404` — `Kelayotgan kirim not found` yoki `already processed`

